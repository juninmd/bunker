import assert from 'node:assert/strict';
import { randomFillSync } from 'node:crypto';
import test from 'node:test';
import { clampLength, generatePassword, MAX_LENGTH, MIN_LENGTH } from './password-generator.ts';

const random = () => randomFillSync(new Uint32Array(1))[0];
const all = { uppercase: true, lowercase: true, numbers: true, symbols: true };

test('clampLength bounds empty, negative and huge input', () => {
  assert.equal(clampLength(''), 16);
  assert.equal(clampLength('abc'), 16);
  assert.equal(clampLength('-5'), MIN_LENGTH);
  assert.equal(clampLength('0'), MIN_LENGTH);
  assert.equal(clampLength('99999999'), MAX_LENGTH);
  assert.equal(clampLength('24'), 24);
});

test('every enabled set is present, even at the minimum length', () => {
  for (let i = 0; i < 500; i++) {
    const p = generatePassword(MIN_LENGTH, all, random);
    assert.equal(p.length, MIN_LENGTH);
    assert.match(p, /[A-Z]/);
    assert.match(p, /[a-z]/);
    assert.match(p, /[0-9]/);
    assert.match(p, /[^A-Za-z0-9]/);
  }
});

test('only enabled sets are used; none enabled gives empty', () => {
  const p = generatePassword(64, { uppercase: false, lowercase: false, numbers: true, symbols: false }, random);
  assert.match(p, /^[0-9]{64}$/);
  assert.equal(generatePassword(16, { uppercase: false, lowercase: false, numbers: false, symbols: false }, random), '');
});

test('rejection sampling discards values in the biased tail', () => {
  const seq = [0xffffffff, 0xfffffffe, 3];
  let i = 0;
  const p = generatePassword(4, { uppercase: false, lowercase: false, numbers: true, symbols: false }, () => seq[i++ % seq.length]);
  assert.equal(p.length, 4);
  assert.ok(i > 4, 'random source was consulted again after rejected values');
});
