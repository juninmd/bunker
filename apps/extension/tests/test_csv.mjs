import { generateCSV, parseCSV } from '../src/utils/csv-utils.js';
import assert from 'assert';

console.log('Running CSV Utils Tests...');

// Test 1: Basic Generation
{
  const data = [
    { name: 'Alice', age: '30' },
    { name: 'Bob', age: '25' }
  ];
  const headers = ['name', 'age'];
  const expected = 'name,age\nAlice,30\nBob,25';
  const result = generateCSV(data, headers);
  assert.strictEqual(result, expected, 'Basic generation failed');
  console.log('Test 1 Passed: Basic Generation');
}

// Test 2: Quotes and Commas
{
  const data = [
    { text: 'Hello, World' },
    { text: 'He said "Hi"' }
  ];
  const headers = ['text'];
  // Expect: "Hello, World" (quoted because comma)
  // Expect: "He said ""Hi""" (quoted because quote, double quote escape)
  const expected = 'text\n"Hello, World"\n"He said ""Hi"""';
  const result = generateCSV(data, headers);
  assert.strictEqual(result, expected, 'Quotes/Commas generation failed');
  console.log('Test 2 Passed: Quotes and Commas Generation');
}

// Test 3: Newlines
{
    const data = [{ note: 'Line 1\nLine 2' }];
    const headers = ['note'];
    const expected = 'note\n"Line 1\nLine 2"';
    const result = generateCSV(data, headers);
    assert.strictEqual(result, expected, 'Newline generation failed');
    console.log('Test 3 Passed: Newlines Generation');
}

// Test 4: Parse Basic
{
    const csv = 'name,age\nAlice,30\nBob,25';
    const result = parseCSV(csv);
    assert.deepStrictEqual(result, [
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' }
    ], 'Basic parse failed');
    console.log('Test 4 Passed: Basic Parse');
}

// Test 5: Parse Complex
{
    const csv = 'text,note\n"Hello, World","Line 1\nLine 2"\n"He said ""Hi""",Normal';
    const result = parseCSV(csv);
    assert.deepStrictEqual(result, [
        { text: 'Hello, World', note: 'Line 1\nLine 2' },
        { text: 'He said "Hi"', note: 'Normal' }
    ], 'Complex parse failed');
    console.log('Test 5 Passed: Complex Parse');
}

// Test 6: Empty fields
{
    const csv = 'a,b,c\n1,,3\n,2,';
    const result = parseCSV(csv);
    assert.deepStrictEqual(result, [
        { a: '1', b: '', c: '3' },
        { a: '', b: '2', c: '' }
    ], 'Empty fields parse failed');
    console.log('Test 6 Passed: Empty Fields Parse');
}

// Test 7: Secure Note Simulation (Sync Service Integration Test)
{
    // Simulate the data structure SyncService generates for a note
    const data = [{
        url: 'http://sn',
        username: 'My Secure Note',
        password: '',
        extra: 'This is a secret note.\nIt has multiple lines.',
        name: 'My Secure Note',
        grouping: 'Secure Notes',
        fav: '0'
    }];
    const headers = ['url', 'username', 'password', 'extra', 'name', 'grouping', 'fav'];

    // Generate
    const csv = generateCSV(data, headers);
    // Expected: extra field quoted due to newline
    const expected = 'url,username,password,extra,name,grouping,fav\nhttp://sn,My Secure Note,,"This is a secret note.\nIt has multiple lines.",My Secure Note,Secure Notes,0';
    assert.strictEqual(csv, expected, 'Secure Note generation failed');

    // Parse back
    const parsed = parseCSV(csv);
    assert.strictEqual(parsed[0].url, 'http://sn');
    assert.strictEqual(parsed[0].extra, 'This is a secret note.\nIt has multiple lines.');

    console.log('Test 7 Passed: Secure Note Simulation');
}

console.log('All CSV tests passed!');
