import { SyncService } from '../src/services/sync-service.js';
import assert from 'assert';

// Polyfill crypto for node env
if (!globalThis.crypto) {
    globalThis.crypto = await import('node:crypto').then(m => m.webcrypto);
}

// Mock VaultService
const mockVaultService = {
    getVault: () => [],
    save: () => Promise.resolve(),
    sanitizeVault: (v) => v,
    cryptoKey: 'mock-key' // Simulate unlocked
};

const service = new SyncService(mockVaultService);

console.log('Running CSV Sync Tests...');

// Helper to create vault items
function createVaultItem(id, site, username, password, grouping) {
    return {
        id,
        site,
        username,
        password,
        notes: '',
        updatedAt: new Date().toISOString(),
        grouping
    };
}

// Test 1: mergeCSV - Add new item from CSV
{
    const localVault = [];
    const importedItems = [
        { type: 'password', site: 'google.com', username: 'user1', password: 'pw1', grouping: '' }
    ];

    const { merged, added, updated } = service.mergeCSV(localVault, importedItems);

    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].site, 'google.com');
    assert.strictEqual(added, 1);
    assert.strictEqual(updated, 0);
    console.log('Test 1 Passed: Add new item from CSV');
}

// Test 2: mergeCSV - Update existing item from CSV
{
    const item = createVaultItem('1', 'google.com', 'user1', 'old_pw', '');
    const localVault = [item];
    const importedItems = [
        { type: 'password', site: 'google.com', username: 'user1', password: 'new_pw', grouping: '' } // Same site+user
    ];

    const { merged, added, updated } = service.mergeCSV(localVault, importedItems);

    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].password, 'new_pw');
    assert.strictEqual(added, 0);
    assert.strictEqual(updated, 1);
    console.log('Test 2 Passed: Update existing item from CSV');
}

// Test 3: mergeCSV - Handle "Deleted" grouping (Soft Delete)
{
    const item = createVaultItem('1', 'google.com', 'user1', 'pw1', '');
    const localVault = [item];
    const importedItems = [
        { type: 'password', site: 'google.com', username: 'user1', password: '', grouping: 'Deleted' }
    ];

    const { merged, added, updated } = service.mergeCSV(localVault, importedItems);

    assert.strictEqual(merged.length, 1);
    assert.ok(merged[0].deletedAt, 'Item should be marked deleted');
    assert.strictEqual(updated, 1);
    console.log('Test 3 Passed: Soft Delete via CSV');
}

// Test 4: mergeCSV - Ignore already deleted items if CSV is also Deleted
{
    const item = createVaultItem('1', 'google.com', 'user1', 'pw1', '');
    item.deletedAt = new Date().toISOString(); // Already deleted locally
    const localVault = [item];
    const importedItems = [
        { type: 'password', site: 'google.com', username: 'user1', password: '', grouping: 'Deleted' }
    ];

    const { merged, added, updated } = service.mergeCSV(localVault, importedItems);

    assert.strictEqual(merged.length, 1);
    assert.ok(merged[0].deletedAt);
    assert.strictEqual(updated, 0, 'Should not update if already deleted');
    console.log('Test 4 Passed: Ignore redundant delete');
}

// Test 5: mergeCSV - Resurrection (CSV has active item, Local is deleted)
{
    const item = createVaultItem('1', 'google.com', 'user1', 'pw1', '');
    item.deletedAt = new Date().toISOString();
    const localVault = [item];
    // CSV has it active (no grouping=Deleted) and different password (change detected)
    // Note: The logic in SyncService requires a CHANGE to resurrect to avoid resurrection by stale CSV.
    const importedItems = [
        { type: 'password', site: 'google.com', username: 'user1', password: 'new_pw', grouping: '' }
    ];

    const { merged, added, updated } = service.mergeCSV(localVault, importedItems);

    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].deletedAt, undefined, 'Item should be resurrected');
    assert.strictEqual(merged[0].password, 'new_pw');
    assert.strictEqual(updated, 1);
    console.log('Test 5 Passed: Resurrection via CSV change');
}

// Test 6: generateCSVContent - Export Deleted Items as Tombstones
{
    const item = createVaultItem('1', 'google.com', 'user1', 'pw1', '');
    item.deletedAt = new Date().toISOString();
    const vault = [item];

    const csvContent = service.generateCSVContent(vault);
    // Should contain "Deleted" in grouping column
    // headers: url,username,password,extra,name,grouping,fav
    // Expected: google.com,user1,,,google.com,Deleted,0

    assert.match(csvContent, /google\.com,user1,,,google\.com,Deleted,0/);
    console.log('Test 6 Passed: Export Deleted Tombstones');
}

// Test 7: generateCSVContent - Export Secure Notes
{
    const item = {
        id: '2',
        type: 'note',
        site: 'My Secret',
        notes: 'Secret content',
        updatedAt: new Date().toISOString()
    };
    const vault = [item];

    const csvContent = service.generateCSVContent(vault);
    // Expected: http://sn,My Secret,,,My Secret,Secure Notes,0
    // Note: extra column gets notes.
    // headers: url,username,password,extra,name,grouping,fav
    // url=http://sn, username=My Secret, password=, extra=Secret content

    assert.match(csvContent, /http:\/\/sn,My Secret,,Secret content,My Secret,Secure Notes,0/);
    console.log('Test 7 Passed: Export Secure Notes');
}

console.log('All CSV Sync Tests Passed! 🚀');
