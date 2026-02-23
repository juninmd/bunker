import { SyncService } from '../src/services/sync-service.js';
import assert from 'assert';

// Mock VaultService (not used by mergeCSV but needed for constructor)
const mockVaultService = {};
const service = new SyncService(mockVaultService);

console.log('Running CSV Sync Logic Tests...');

function createVaultItem(id, site, username, password, deleted = false) {
    return {
        id,
        site,
        username,
        password,
        notes: '',
        type: 'password',
        updatedAt: new Date().toISOString(),
        deletedAt: deleted ? new Date().toISOString() : undefined
    };
}

function createCSVItem(site, username, password, grouping = '') {
    return {
        type: 'password',
        site,
        username,
        password,
        notes: '',
        grouping
    };
}

// Test 1: New Item
{
    const local = [];
    const imported = [createCSVItem('example.com', 'user', 'pass')];
    const { merged, added } = service.mergeCSV(local, imported);
    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].site, 'example.com');
    assert.strictEqual(added, 1);
    console.log('Test 1 Passed: New Item');
}

// Test 2: Update Item
{
    const local = [createVaultItem('1', 'example.com', 'user', 'oldpass')];
    const imported = [createCSVItem('example.com', 'user', 'newpass')];
    const { merged, updated } = service.mergeCSV(local, imported);
    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].password, 'newpass');
    assert.strictEqual(updated, 1);
    console.log('Test 2 Passed: Update Item');
}

// Test 3: Deletion via CSV
{
    const local = [createVaultItem('1', 'example.com', 'user', 'pass')];
    const imported = [createCSVItem('example.com', 'user', '', 'Deleted')];
    const { merged, updated } = service.mergeCSV(local, imported);
    assert.strictEqual(merged.length, 1);
    assert.ok(merged[0].deletedAt, 'Should have deletedAt');
    assert.strictEqual(updated, 1);
    console.log('Test 3 Passed: Deletion via CSV');
}

// Test 4: Idempotent Deletion
{
    const local = [createVaultItem('1', 'example.com', 'user', 'pass', true)];
    const imported = [createCSVItem('example.com', 'user', '', 'Deleted')];
    const { merged, updated } = service.mergeCSV(local, imported);
    assert.strictEqual(merged.length, 1);
    assert.ok(merged[0].deletedAt);
    assert.strictEqual(updated, 0, 'Should not count as update if already deleted');
    console.log('Test 4 Passed: Idempotent Deletion');
}

// Test 5: Zombie Check (Same content) -> Ignore
{
    const local = [createVaultItem('1', 'example.com', 'user', 'pass', true)];
    // CSV has same content (pass is 'pass'), not marked Deleted
    // This simulates an old CSV row that matches the deleted item's data
    const imported = [createCSVItem('example.com', 'user', 'pass')];
    const { merged, updated } = service.mergeCSV(local, imported);
    assert.strictEqual(merged.length, 1);
    assert.ok(merged[0].deletedAt, 'Should remain deleted');
    assert.strictEqual(updated, 0);
    console.log('Test 5 Passed: Zombie Check (Same content)');
}

// Test 6: Resurrection (Different content) -> Restore
{
    const local = [createVaultItem('1', 'example.com', 'user', 'oldpass', true)];
    // CSV has different content (newpass)
    const imported = [createCSVItem('example.com', 'user', 'newpass')];
    const { merged, updated } = service.mergeCSV(local, imported);
    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].deletedAt, undefined, 'Should be resurrected');
    assert.strictEqual(merged[0].password, 'newpass');
    assert.strictEqual(updated, 1);
    console.log('Test 6 Passed: Resurrection (Different content)');
}

console.log('All CSV Sync Tests Passed!');
