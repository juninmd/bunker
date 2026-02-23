import { SyncService } from '../src/services/sync-service.js';
import assert from 'assert';

// Mock VaultService
const mockVaultService = {
    getVault: () => [],
    save: () => Promise.resolve(),
    sanitizeVault: (v) => v
};

// Instantiate SyncService (might fail if GoogleDriveService imports chrome stuff globally, but it doesn't seem to)
// To be safe, we might need to mock global chrome if GoogleDriveService uses it at top level.
// Checking GoogleDriveService again... it imports nothing. It uses chrome.identity inside methods.
// So we are safe.

const service = new SyncService(mockVaultService);

console.log('Running Sync Logic Tests...');

function createItem(id, updatedOffset = 0, deleted = false) {
    const time = new Date(Date.now() + updatedOffset * 1000).toISOString();
    return {
        id,
        site: 'example.com',
        username: 'user',
        password: 'pw',
        updatedAt: time,
        deletedAt: deleted ? time : undefined
    };
}

// Test 1: Remote New Item -> Add to Local
{
    const local = [];
    const remote = [createItem('1')];
    const { vault, stats } = service.mergeVaults(local, remote);
    assert.strictEqual(vault.length, 1);
    assert.strictEqual(vault[0].id, '1');
    assert.strictEqual(stats.added, 1);
    console.log('Test 1 Passed: Remote Add');
}

// Test 2: Remote Update -> Update Local
{
    const item1 = createItem('1', 0);
    const item1Updated = createItem('1', 10); // newer
    const local = [item1];
    const remote = [item1Updated];
    const { vault, stats } = service.mergeVaults(local, remote);
    assert.strictEqual(vault.length, 1);
    assert.strictEqual(vault[0].updatedAt, item1Updated.updatedAt);
    assert.strictEqual(stats.updated, 1);
    console.log('Test 2 Passed: Remote Update');
}

// Test 3: Local Update -> Keep Local (Ignore Remote Old)
{
    const item1 = createItem('1', 10); // newer
    const item1Old = createItem('1', 0);
    const local = [item1];
    const remote = [item1Old];
    const { vault, stats } = service.mergeVaults(local, remote);
    assert.strictEqual(vault.length, 1);
    assert.strictEqual(vault[0].updatedAt, item1.updatedAt);
    assert.strictEqual(stats.updated, 0);
    console.log('Test 3 Passed: Local Update (Remote Ignore)');
}

// Test 4: Remote Soft Delete -> Mark Local Deleted
{
    const item1 = createItem('1', 0);
    const item1Deleted = createItem('1', 10, true); // deleted later
    const local = [item1];
    const remote = [item1Deleted];
    const { vault, stats } = service.mergeVaults(local, remote);
    assert.strictEqual(vault.length, 1);
    assert.ok(vault[0].deletedAt);
    assert.strictEqual(stats.updated, 1);
    console.log('Test 4 Passed: Remote Soft Delete');
}

// Test 5: Local Soft Delete -> Keep Local Deleted
{
    const item1Deleted = createItem('1', 10, true);
    const item1 = createItem('1', 0);
    const local = [item1Deleted];
    const remote = [item1]; // Remote thinks it's alive but old
    const { vault, stats } = service.mergeVaults(local, remote);
    assert.strictEqual(vault.length, 1);
    assert.ok(vault[0].deletedAt);
    // Remote is older, so local wins. No update triggered from remote perspective.
    console.log('Test 5 Passed: Local Soft Delete');
}

// Test 6: Resurrection (Remote Update after Local Delete)
{
    const item1Deleted = createItem('1', 0, true);
    const item1Resurrected = createItem('1', 10, false); // newer and alive
    const local = [item1Deleted];
    const remote = [item1Resurrected];
    const { vault, stats } = service.mergeVaults(local, remote);
    assert.strictEqual(vault.length, 1);
    assert.strictEqual(vault[0].deletedAt, undefined);
    assert.strictEqual(stats.updated, 1);
    console.log('Test 6 Passed: Resurrection');
}

console.log('All Sync Logic Tests Passed!');
