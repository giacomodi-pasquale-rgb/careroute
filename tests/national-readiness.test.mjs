import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('national readiness audit accounts for every record and domain',async()=>{
  const audit=JSON.parse(await readFile(new URL('../data/review/national-readiness-audit.json',import.meta.url)));
  assert.equal(audit.totalRecords,22292);
  assert.equal(audit.totalDomainChecks,156044);
  assert.equal(audit.candidateSources.cmsHospitals,4495);
  assert.equal(audit.candidateSources.hrsaHealthCenters,17797);
  for(const result of Object.values(audit.domains))assert.equal(result.resolved+result.missing,audit.totalRecords);
  assert.equal(audit.automaticallyDecisionReady,0);
});
