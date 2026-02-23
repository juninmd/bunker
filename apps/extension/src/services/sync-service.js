import { GoogleDriveService } from './google-drive.js';
import { generateCSV, parseCSV } from '../utils/csv-utils.js';
import { decryptWithKey, encryptWithKey } from '../utils/crypto.js';

export class SyncService {
  constructor(vaultService) {
    this.vaultService = vaultService;
    this.driveService = new GoogleDriveService();
    this.VAULT_FILE = 'vault.enc';
    this.CSV_FILE = 'passwords.csv';
    this.VAULT_SCHEMA_VERSION = 1;
  }

  async sync() {
    if (!this.vaultService.cryptoKey) {
      throw new Error('Vault locked');
    }

    await this.driveService.authorize();

    // 0. Check CSV for updates (Sync In)
    try {
      const csvFile = await this.driveService.findFile(this.CSV_FILE);
      const lastCsvSync = await this.vaultService.getStorage('bunkerpass.last_csv_sync');

      if (csvFile && csvFile.modifiedTime) {
        const remoteTime = new Date(csvFile.modifiedTime).getTime();
        const localTime = lastCsvSync ? new Date(lastCsvSync).getTime() : 0;
        // Add 2 second buffer to avoid self-update triggering import
        if (remoteTime > localTime + 2000) {
          console.log('Remote CSV is newer, importing...');
          await this.importCSV();
        }
      }
    } catch (e) {
      console.warn('Failed to check CSV updates', e);
    }

    // 1. Get Remote Vault
    const vaultFile = await this.driveService.findFile(this.VAULT_FILE);
    let remoteVault = [];

    if (vaultFile) {
      const content = await this.driveService.getFileContent(vaultFile.id);
      try {
        const data = await decryptWithKey(content, this.vaultService.cryptoKey);
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
    const encrypted = await encryptWithKey(payload, this.vaultService.cryptoKey);

    try {
      if (vaultFile) {
        await this.driveService.updateFile(vaultFile.id, encrypted, 'text/plain');
      } else {
        await this.driveService.createFile(this.VAULT_FILE, encrypted, 'text/plain');
      }
    } catch (e) {
      throw new Error('Failed to sync encrypted vault to Drive: ' + e.message);
    }

    // 5. Update CSV (Export)
    try {
      const csvContent = this.generateCSVContent(mergedVault);
      const csvFile = await this.driveService.findFile(this.CSV_FILE);
      let updatedFile;

      if (csvFile) {
        updatedFile = await this.driveService.updateFile(csvFile.id, csvContent, 'text/csv');
      } else {
        updatedFile = await this.driveService.createFile(this.CSV_FILE, csvContent, 'text/csv');
      }

      if (updatedFile && updatedFile.modifiedTime) {
        await this.vaultService.setStorage('bunkerpass.last_csv_sync', updatedFile.modifiedTime);
      }
    } catch (e) {
      console.error('Failed to update CSV backup:', e);
      stats.csvError = e.message;
    }

    return { vault: mergedVault, stats };
  }

  async importCSV() {
      if (!this.vaultService.cryptoKey) throw new Error('Locked');
      await this.driveService.authorize();

      const csvFile = await this.driveService.findFile(this.CSV_FILE);
      if (!csvFile) throw new Error('CSV file not found in Drive');

      const content = await this.driveService.getFileContent(csvFile.id);
      const parsed = parseCSV(content);

      const imported = parsed.map(row => {
          const url = row.url || row.site || row.name || '';
          if (url === 'http://sn') {
              // Secure Note
              return {
                  id: crypto.randomUUID(),
                  type: 'note',
                  site: row.username || row.name || 'Sem Título', // Title is often in username or name for notes
                  username: '',
                  password: '',
                  notes: row.extra || row.notes || row.password || '',
                  updatedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  grouping: row.grouping
              };
          } else {
              // Standard Password
              return {
                  id: crypto.randomUUID(),
                  type: 'password',
                  site: url,
                  username: row.username || '',
                  password: row.password || '',
                  notes: row.extra || row.notes || '',
                  updatedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  grouping: row.grouping
              };
          }
      }).filter(i => (i.type === 'note' && i.site) || (i.site && i.username && i.password) || (i.grouping === 'Deleted' && i.site));

      const localVault = this.vaultService.getVault();
      const { merged, added, updated } = this.mergeCSV(localVault, imported);

      await this.vaultService.save(merged);
      return { added, updated, total: merged.length };
  }

  mergeCSV(localVault, importedItems) {
      // Clone to avoid mutating cachedVault directly before save
      const merged = localVault.map(item => ({ ...item }));
      let addedCount = 0;
      let updatedCount = 0;

      importedItems.forEach(newItem => {
          const existing = merged.find(i => {
              // Match by Type + Site (and Username for passwords)
              if ((i.type || 'password') !== newItem.type) return false;
              if (i.site !== newItem.site) return false;
              if (newItem.type === 'note') return true;
              return i.username === newItem.username;
          });

          if (existing) {
              // Check if it's a deletion via CSV
              if (newItem.grouping === 'Deleted') {
                  if (!existing.deletedAt) {
                      existing.deletedAt = new Date().toISOString();
                      existing.updatedAt = new Date().toISOString();
                      updatedCount++; // counted as update (state change)
                  }
                  return; // Done
              }

              // Check if it matches the existing data
              const isDifferent = existing.password !== newItem.password || existing.notes !== newItem.notes;

              if (existing.deletedAt) {
                  // Zombie check: Only resurrect if data changed (implies manual restore in CSV)
                  // And if the CSV row itself is NOT marked as Deleted (handled above)
                  if (isDifferent) {
                      existing.password = newItem.password;
                      existing.notes = newItem.notes;
                      existing.updatedAt = new Date().toISOString();
                      delete existing.deletedAt; // Resurrect
                      updatedCount++;
                  }
                  // Else: It's just the old deleted data lingering in CSV -> Ignore
              } else if (isDifferent) {
                  existing.password = newItem.password;
                  existing.notes = newItem.notes;
                  existing.updatedAt = new Date().toISOString();
                  updatedCount++;
              }
          } else {
              // Only add if not marked as deleted in CSV
              if (newItem.grouping !== 'Deleted') {
                  merged.push(newItem);
                  addedCount++;
              }
          }
      });
      return { merged, added: addedCount, updated: updatedCount };
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

      const data = vault.map(item => {
          if (item.deletedAt) {
              return {
                  url: item.site,
                  username: item.username || item.site, // Keep identifier
                  password: '', // Clear sensitive
                  extra: '', // Clear sensitive
                  name: item.site,
                  grouping: 'Deleted', // Mark as deleted
                  fav: '0'
              };
          }

          if (item.type === 'note') {
              return {
                  url: 'http://sn',
                  username: item.site, // Title goes to username col in LP export usually
                  password: '',
                  extra: item.notes || '',
                  name: item.site,
                  grouping: 'Secure Notes',
                  fav: '0'
              };
          }
          return {
              url: item.site,
              username: item.username,
              password: item.password,
              extra: item.notes || '',
              name: item.site,
              grouping: '',
              fav: '0'
          };
      });

      return generateCSV(data, headers);
  }
}
