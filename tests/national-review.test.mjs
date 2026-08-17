import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const queue = JSON.parse(await readFile(new URL('../data/review/us-hospitals.json', import.meta.url)));

test('national queue reconciles every candidate exactly once', () => {
  assert.equal(queue.candidates.length, queue.summary.total);
  assert.equal(new Set(queue.candidates.map((item) => item.cmsCertificationNumber)).size, queue.summary.total);
  assert.equal(queue.summary.matchedVerified + queue.summary.pendingReview, queue.summary.total);
});

test('national seed never publishes unreviewed CMS candidates as patient results', () => {
  assert.equal(queue.summary.publishable, 0);
  assert.ok(queue.candidates.every((item) => item.publishable === false));
  assert.ok(queue.candidates.every((item) => item.pediatricCapability === null));
});

test('coverage summary accounts for every jurisdiction record', () => {
  assert.equal(queue.summary.states.reduce((sum, item) => sum + item.total, 0), queue.summary.total);
  assert.ok(queue.summary.jurisdictions >= 51);
});
