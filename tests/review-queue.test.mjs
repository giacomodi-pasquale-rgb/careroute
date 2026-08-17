import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const queue = JSON.parse(await readFile(new URL('../data/review/nj-hospitals.json', import.meta.url), 'utf8'));

test('NJ queue reconciles every CMS emergency hospital exactly once', () => {
  assert.equal(queue.candidates.length, 57);
  assert.equal(queue.summary.total, 57);
  assert.equal(queue.summary.matchedVerified + queue.summary.pendingEssex + queue.summary.pendingOtherNewJersey, 57);
});

test('the three existing pediatric emergency records match by CMS identifier', () => {
  const matches = queue.candidates.filter((item) => item.reconciliation.status === 'matched-verified');
  assert.equal(matches.length, 3);
  assert.deepEqual(new Set(matches.map((item) => item.reconciliation.facilityId)), new Set([
    'cooperman-barnabas-peds-ed',
    'newark-beth-israel-peds-ed',
    'university-hospital-peds-ed'
  ]));
  assert.ok(matches.every((item) => item.reconciliation.method === 'cms-ccn'));
});

test('no imported CMS candidate becomes publishable', () => {
  assert.equal(queue.summary.publishable, 0);
  for (const candidate of queue.candidates) {
    assert.equal(candidate.publishable, false);
    assert.equal(candidate.pediatricCapability, null);
  }
});

test('Essex pending candidates are isolated as the first review batch', () => {
  const essex = queue.candidates.filter((item) => item.reviewPriority === 1);
  assert.equal(essex.length, 5);
  assert.ok(essex.every((item) => item.location.county === 'ESSEX' && item.reconciliation.status === 'unmatched'));
});
