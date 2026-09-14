import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAccess, evaluateAccessFacility, primaryAccessGap } from '../access-xray.js';

const base={id:'a',state:'NJ',patientGroups:['adult','pediatric'],pediatricSpecific:true,age:{verifiedLimits:true,minMonths:0,maxMonths:216},type:'urgent-care',capabilities:['illness']};
const inputs={selectedState:'NJ',patientGroup:'pediatric',ageMonths:60,emergency:false,need:'illness'};

test('x-ray applies gates in a stable, explainable order',()=>{
  assert.equal(evaluateAccessFacility({...base,state:'NY'},inputs),'state');
  assert.equal(evaluateAccessFacility({...base,patientGroups:['adult']},inputs),'population');
  assert.equal(evaluateAccessFacility({...base,capabilities:['injury']},inputs),'capability');
});

test('x-ray accounts for every verified facility exactly once',()=>{
  const analysis=analyzeAccess([base,{...base,id:'b',state:'NY'},{...base,id:'c',capabilities:['injury']}],inputs);
  const excluded=Object.values(analysis.counts).reduce((a,b)=>a+b,0);
  assert.equal(analysis.total,analysis.eligible.length+excluded);
  assert.equal(primaryAccessGap(analysis).reason,'capability');
});
