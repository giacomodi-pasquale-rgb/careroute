import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = (path) => readFile(new URL(path, import.meta.url), 'utf8').then(JSON.parse);

test('national evidence network totals reconcile to their official source queues', async () => {
  const [network, hospitals, healthCenters, canonical] = await Promise.all([
    readJson('../data/review/evidence-network.json'),
    readJson('../data/review/us-hospitals.json'),
    readJson('../data/review/us-health-centers.json'),
    readJson('../data/v1/facilities.json')
  ]);
  assert.equal(network.tiers.officiallyIndexed.hospitalCandidates, hospitals.summary.total);
  assert.equal(network.tiers.officiallyIndexed.affordableHealthCenterCandidates, healthCenters.summary.total);
  assert.equal(network.tiers.officiallyIndexed.total, hospitals.summary.total + healthCenters.summary.total);
  assert.equal(network.tiers.decisionReady.total, canonical.facilities.length);
});

test('national candidate imports cannot silently become patient recommendations', async () => {
  const [network, healthCenters] = await Promise.all([
    readJson('../data/review/evidence-network.json'),
    readJson('../data/review/us-health-centers.json')
  ]);
  assert.equal(network.tiers.officiallyIndexed.patientVisible, false);
  assert.equal(network.tiers.evidenceEnriched.patientVisible, false);
  assert.equal(network.tiers.decisionReady.patientVisible, true);
  assert.ok(healthCenters.candidates.length > 10000);
  assert.ok(healthCenters.candidates.every((candidate) => candidate.publishable === false));
  assert.equal(new Set(healthCenters.candidates.map((candidate) => candidate.candidateId)).size, healthCenters.candidates.length);
});
