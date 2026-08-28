import test from 'node:test';
import assert from 'node:assert/strict';
import { readDataset, validateDataset } from '../scripts/data-lib.mjs';

test('canonical pilot dataset passes every safety invariant', async () => {
  const dataset = await readDataset();
  assert.deepEqual(validateDataset(dataset, new Date(`${dataset.reviewedAt}T12:00:00Z`)), []);
});

test('no record contains invented operational or comparative data', async () => {
  const { facilities } = await readDataset();
  for (const facility of facilities) {
    assert.equal(facility.live.waitMinutes, null);
    assert.equal(facility.live.acceptingPatients, null);
    assert.equal(facility.insurance.status, 'verify');
    assert.deepEqual(facility.insurance.plans, []);
    assert.equal(facility.quality.displayScore, null);
  }
});

test('emergency records have a verified population and 24-hour availability', async () => {
  const { facilities } = await readDataset();
  const emergency = facilities.filter((facility) => facility.identity.type === 'emergency');
  assert.ok(emergency.length > 0);
  for (const facility of emergency) {
    assert.ok(facility.identity.pediatricSpecific || facility.identity.patientGroups?.includes('adult'));
    assert.equal(facility.hours.kind, 'always');
  }
});

test('unknown age limits remain unknown through the web adapter', async () => {
  const { facilities } = await readDataset();
  const summit = facilities.find((facility) => facility.id === 'summit-urgent-care-livingston');
  assert.equal(summit.pediatricAge.limitsVerified, false);
  assert.equal(summit.pediatricAge.minimumMonths, null);
  assert.equal(summit.pediatricAge.maximumMonths, null);
});

test('community health centers expose verified access terms without invented prices', async () => {
  const { facilities } = await readDataset();
  const centers = facilities.filter((facility) => facility.identity.type === 'community-health-center');
  assert.equal(centers.length, 2);
  for (const facility of centers) {
    assert.equal(facility.access.uninsuredWelcome, true);
    assert.equal(facility.access.slidingFee, true);
    assert.equal(facility.access.noOneTurnedAway, true);
    assert.equal(facility.access.flatFee, null);
    assert.match(facility.access.sourceUrl, /^https:\/\/www\.nj\.gov\//);
  }
});
