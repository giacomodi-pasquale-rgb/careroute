import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandoffCode, buildDemoConfirmation, nextAlternative } from '../verified-arrival.js';

test('handoff code is readable and deterministic', () => {
  assert.equal(createHandoffCode(new Uint8Array([0,1,2,3,4,5])), 'NS-ABCDEF');
});

test('demo confirmation is explicitly non-live', () => {
  const result = buildDemoConfirmation({id:'a',name:'Example ED'}, {patientGroup:'adult',need:'illness'});
  assert.equal(result.mode, 'accepted');
  assert.match(result.notice, /Demonstration only/);
  assert.match(result.notice, /no information was transmitted/);
});

test('rerouting skips the selected facility', () => {
  assert.equal(nextAlternative([{id:'a'},{id:'b'}], 'a').id, 'b');
  assert.equal(nextAlternative([{id:'a'}], 'a'), null);
});
