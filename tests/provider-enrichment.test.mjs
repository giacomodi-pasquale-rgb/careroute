import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const batch=JSON.parse(await readFile(new URL('../data/review/provider-enrichment.json',import.meta.url)));
const required=['identity','location','contact','population','services','hours','access','routing'];
test('provider enrichment is claim-level and release gated',()=>{
  assert.equal(batch.providerSystem,'CommonSpirit Health');
  assert.equal(batch.records.length,25);
  assert.equal(batch.summary.reviewed,batch.records.length);
  for(const record of batch.records){
    assert.match(record.sourceUrl,/^https:\/\//);
    for(const domain of required){assert.ok(record.domains[domain]);assert.ok(record.domains[domain].evidence.length>20);}
    const complete=required.every(domain=>record.domains[domain].status==='resolved');
    assert.equal(record.status==='release-eligible',complete);
  }
});
test('unresolved provider claims are held instead of inferred',()=>{
  const redding=batch.records.find(record=>record.cmsCertificationNumber==='050280');
  assert.equal(redding.domains.population.status,'unresolved');
  assert.equal(redding.status,'held');
  assert.ok(batch.summary.releaseEligible>=1);
  assert.equal(batch.summary.claimsChecked,200);
});
