import test from 'node:test';
import assert from 'node:assert/strict';
import { accessEvidence, createArrivalCode, outcomeCount, saveOutcome } from '../access-insight.js';

const facility = { age:{verifiedLimits:true}, hours:{kind:'weekly'}, capabilities:['illness'], access:{uninsuredWelcome:true,slidingFee:true,noOneTurnedAway:false,flatFee:null,charityCare:false,languages:['Spanish']} };
const inputs = { patientGroup:'pediatric', accessNeeds:new Set(['uninsured','low-cost','language']) };

test('access evidence separates resolved signals from remaining verification', () => {
  const result = accessEvidence(facility, inputs, {minutes:12}, true);
  assert.equal(result.level, 'strong');
  assert.ok(result.resolved.includes('affordability'));
  assert.ok(!result.verify.includes('insurance'));
});

test('arrival codes are readable and deterministic with supplied randomness', () => {
  assert.match(createArrivalCode(new Uint8Array([0,1,2,3,4,5])), /^NS-[A-Z2-9]{6}$/);
});

test('outcome follow-ups remain bounded in device storage', () => {
  const data = new Map();
  const storage = { getItem:key=>data.get(key) || null, setItem:(key,value)=>data.set(key,value) };
  saveOutcome(storage,{result:'yes'});
  assert.equal(outcomeCount(storage),1);
});
