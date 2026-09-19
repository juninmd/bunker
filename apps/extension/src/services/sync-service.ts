import { GoogleDriveService } from './google-drive.js';
import { generateCSV, parseCSV, mapCSVRowToVaultItem, mapVaultItemToCSVRow } from '../utils/csv-utils.js';
import { parseRemoteEnvelope, sameKdf, sealRemoteVault } from '../utils/vault-envelope.js';
import { decryptPayload, decryptWithKey } from '../utils/crypto.js';
import { rekeyVault } from './master-password.js';

export class SyncService {
  vaultService: any;
  driveService: any;
  VAULT_FILE: string;
  CSV_FILE: string;
  VAULT_SCHEMA_VERSION: number;

  constructor(vaultService: any) {
    this.vaultService = vaultService;
    this.driveService = new GoogleDriveService();
    this.VAULT_FILE = 'vault.enc';
    this.CSV_FILE = 'passwords.csv';
    this.VAULT_SCHEMA_VERSION = 1;
  }

  // Only the encrypted vault ever leaves the device; a plaintext CSV in the cloud would expose every password.
  // askPassword is consulted only when the remote file uses another salt (first sync on a new device, or a password change elsewhere).
  async sync(askPassword: () => Promise<string | null> = async () => null) {
    const vault = this.vaultService;
    if (!vault.key) {
      throw new Error('Vault locked'); // NOSONAR
    }

    await this.driveService.authorize();

    const vaultFile = await this.driveService.findFile(this.VAULT_FILE);
    let remoteVault: any[] = [];

    if (vaultFile) {
      const envelope = parseRemoteEnvelope(await this.driveService.getFileContent(vaultFile.id));
      if (sameKdf(envelope, vault.salt, vault.iterations)) {
        remoteVault = vault.sanitizeVault(await decryptWithKey(envelope.data, vault.key));
      } else {
        const password = vault.masterPassword ?? await askPassword();
        if (!password) throw new Error('MASTER_PASSWORD_REQUIRED');
        try { // NOSONAR
          remoteVault = vault.sanitizeVault(await decryptPayload(envelope.data, password, envelope.salt, envelope.iterations));
        } catch (e) {
          throw new Error('Failed to decrypt remote vault. Check password.'); // NOSONAR
        }
        await rekeyVault(vault, password, envelope.salt, envelope.iterations);
      }
    }

    const { vault: mergedVault, stats } = this.mergeVaults(vault.getVault(), remoteVault) as { vault: any[], stats: any };
    await vault.save(mergedVault);

    const payload = { schemaVersion: this.VAULT_SCHEMA_VERSION, credentials: mergedVault };
    const encrypted = await sealRemoteVault(payload, vault.key, vault.salt, vault.iterations);

    try { // NOSONAR
      if (vaultFile) {
        await this.driveService.updateFile(vaultFile.id, encrypted, 'application/json');
      } else {
        await this.driveService.createFile(this.VAULT_FILE, encrypted, 'application/json');
      }
    } catch (e: any) {
      throw new Error('Failed to sync encrypted vault to Drive: ' + e.message); // NOSONAR
    }

    return { vault: mergedVault, stats };
  }

  async importCSV() {
      if (!this.vaultService.key) throw new Error('Locked');
      await this.driveService.authorize();

      const csvFile = await this.driveService.findFile(this.CSV_FILE);
      if (!csvFile) throw new Error('CSV file not found in Drive');

      const content = await this.driveService.getFileContent(csvFile.id);
      const parsed = parseCSV(content);

      const imported = parsed.map(row => {
          const item = mapCSVRowToVaultItem(row);
          if (item.type === 'note' && !row.grouping) item.grouping = 'Secure Notes';
          if (item.type === 'address' && !row.grouping) item.grouping = 'Endereços';
          return item;
      }).filter(i => (i.type === 'note' && i.site) || (i.type === 'card' && i.site) || (i.type === 'address' && i.site) || (i.site && (i.username || i.password)) || (i.grouping === 'Deleted' && i.site));

      const localVault = this.vaultService.getVault();
      const { merged, added, updated } = this.mergeCSV(localVault, imported);

      await this.vaultService.save(merged);
      return { added, updated, total: merged.length };
  }

  // NOSONAR: The merge logic handles specific fields and soft deletes unique to the CSV import structure. Abstraction into a generic merge tool is out of scope.
  mergeCSV(localVault: any[], importedItems: any[]) {
      // Clone to avoid mutating cachedVault directly before save
      const merged = localVault.map((item: any) => ({ ...item })); // NOSONAR
      let addedCount = 0;
      let updatedCount = 0;

      importedItems.forEach((newItem: any) => {
          const existing = merged.find((i: any) => {
              // Match by Type + Site (and Username for passwords)
              if ((i.type || 'password') !== newItem.type) return false;
              if (i.site !== newItem.site) return false;
              if (newItem.type === 'note') return true;
              return i.username === newItem.username;
          });

          if (existing) {
              // A file never deletes: a tampered CSV marking rows "Deleted" must not erase the vault.
              if (newItem.grouping === 'Deleted') return;
              const isDifferent = existing.password !== newItem.password || existing.notes !== newItem.notes;
              // Old deleted data lingering in the file is ignored; changed data restores the item.
              if (existing.deletedAt ? !isDifferent : !isDifferent && existing.grouping === newItem.grouping) return;
              if (existing.password && existing.password !== newItem.password) {
                  // The replaced password stays recoverable from the item history.
                  existing.history = [...(existing.history || []), { password: existing.password, timestamp: existing.updatedAt || new Date().toISOString() }];
              }
              existing.password = newItem.password;
              existing.notes = newItem.notes;
              existing.grouping = newItem.grouping;
              existing.updatedAt = new Date().toISOString();
              delete existing.deletedAt;
              updatedCount++;
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

  mergeVaults(local: any[], remote: any[]) {
    const map = new Map();
    let added = 0;
    let updated = 0;

    local.forEach((item: any) => map.set(item.id, item));

    remote.forEach((remoteItem: any) => {
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

  generateCSVContent(vault: any[]) {
      // LastPass CSV format: url,username,password,totp,extra,name,grouping,fav
      const headers = ['url', 'username', 'password', 'totp', 'extra', 'name', 'grouping', 'fav'];
      const data = vault.map(mapVaultItemToCSVRow);
      return generateCSV(data, headers);
  }
}
