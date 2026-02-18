import { GoogleDriveService } from './google-drive.js';
import { generateCSV, parseCSV } from '../utils/csv-utils.js';
import { decryptPayload, encryptPayload } from '../utils/crypto.js';

export class SyncService {
  constructor(vaultService) {
    this.vaultService = vaultService;
    this.driveService = new GoogleDriveService();
    this.VAULT_FILE = 'vault.enc';
    this.CSV_FILE = 'passwords.csv';
    this.VAULT_SCHEMA_VERSION = 1;
  }

  async sync() {
    if (!this.vaultService.masterPassword || !this.vaultService.salt) {
      throw new Error('Vault locked');
    }

    await this.driveService.authorize();

    // 1. Get Remote Vault
    const vaultFile = await this.driveService.findFile(this.VAULT_FILE);
    let remoteVault = [];

    if (vaultFile) {
      const content = await this.driveService.getFileContent(vaultFile.id);
      try {
        const data = await decryptPayload(content, this.vaultService.masterPassword, this.vaultService.salt);
        remoteVault = this.vaultService.sanitizeVault(data);
      } catch (e) {
        throw new Error('Failed to decrypt remote vault. Check password.');
      }
    }

    // 2. Merge
    const localVault = this.vaultService.getVault();
    const { vault: mergedVault, stats } = this.mergeVaults(localVault, remoteVault);

    // 3. Update Local
    await this.vaultService.save(mergedVault);

    // 4. Update Remote Vault
    const payload = {
      schemaVersion: this.VAULT_SCHEMA_VERSION,
      credentials: mergedVault
    };
    const encrypted = await encryptPayload(payload, this.vaultService.masterPassword, this.vaultService.salt);

    if (vaultFile) {
      await this.driveService.updateFile(vaultFile.id, encrypted, 'text/plain');
    } else {
      await this.driveService.createFile(this.VAULT_FILE, encrypted, 'text/plain');
    }

    // 5. Update CSV (Export)
    const csvContent = this.generateCSVContent(mergedVault);
    const csvFile = await this.driveService.findFile(this.CSV_FILE);

    if (csvFile) {
      await this.driveService.updateFile(csvFile.id, csvContent, 'text/csv');
    } else {
      await this.driveService.createFile(this.CSV_FILE, csvContent, 'text/csv');
    }

    return { vault: mergedVault, stats };
  }

  async importCSV() {
      if (!this.vaultService.masterPassword) throw new Error('Locked');
      await this.driveService.authorize();

      const csvFile = await this.driveService.findFile(this.CSV_FILE);
      if (!csvFile) throw new Error('CSV file not found in Drive');

      const content = await this.driveService.getFileContent(csvFile.id);
      const parsed = parseCSV(content);

      const imported = parsed.map(row => {
          return {
              id: crypto.randomUUID(),
              site: row.site || row.url || row.name || '',
              username: row.username || '',
              password: row.password || '',
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
          };
      }).filter(i => i.site && i.username && i.password);

      const localVault = this.vaultService.getVault();
      // Clone to avoid mutating cachedVault directly before save
      // We need deep clone or at least clone objects we might modify
      const merged = localVault.map(item => ({ ...item }));
      let addedCount = 0;
      let updatedCount = 0;

      imported.forEach(newItem => {
          const existing = merged.find(i => i.site === newItem.site && i.username === newItem.username);
          if (existing) {
              if (existing.password !== newItem.password) {
                  existing.password = newItem.password;
                  existing.updatedAt = new Date().toISOString();
                  updatedCount++;
              }
          } else {
              merged.push(newItem);
              addedCount++;
          }
      });

      await this.vaultService.save(merged);
      return { added: addedCount, updated: updatedCount, total: merged.length };
  }

  mergeVaults(local, remote) {
    const map = new Map();
    let added = 0;
    let updated = 0;

    local.forEach((item) => map.set(item.id, item));

    remote.forEach((remoteItem) => {
      const localItem = map.get(remoteItem.id);
      if (!localItem) {
        map.set(remoteItem.id, remoteItem);
        added++;
      } else {
        const localDate = new Date(localItem.updatedAt || 0).getTime();
        const remoteDate = new Date(remoteItem.updatedAt || 0).getTime();
        if (remoteDate > localDate) {
          map.set(remoteItem.id, remoteItem);
          updated++;
        }
      }
    });

    return { vault: Array.from(map.values()), stats: { added, updated } };
  }

  generateCSVContent(vault) {
      // LastPass CSV format: url,username,password,extra,name,grouping,fav
      const headers = ['url', 'username', 'password', 'extra', 'name', 'grouping', 'fav'];

      const data = vault.map(item => ({
          url: item.site,
          username: item.username,
          password: item.password,
          extra: '',
          name: item.site,
          grouping: '',
          fav: '0'
      }));

      return generateCSV(data, headers);
  }
}
