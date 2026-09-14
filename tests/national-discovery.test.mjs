import test from 'node:test';
import assert from 'node:assert/strict';
import { rankDiscoveryRecords } from '../national-discovery.js';
import { readFile } from 'node:fs/promises';

test('national discovery never repeats a matched verified hospital',()=>{
  const records=[{id:'a',kind:'hospital',matchedVerified:true,city:'A',name:'A'},{id:'b',kind:'hospital',matchedVerified:false,city:'B',name:'B'}];
  assert.deepEqual(rankDiscoveryRecords(records).map(item=>item.id),['b']);
});

test('emergency discovery returns only official hospital records',()=>{
  const records=[{id:'a',kind:'health-center',city:'A',name:'A'},{id:'b',kind:'hospital',city:'B',name:'B'}];
  assert.deepEqual(rankDiscoveryRecords(records,{emergency:true}).map(item=>item.id),['b']);
});

test('same ZIP is prioritized before approximate straight-line distance',()=>{
  const records=[{id:'far-zip',kind:'health-center',zip:'10002',lat:40,lon:-74,city:'A',name:'A'},{id:'same-zip',kind:'hospital',zip:'10001',city:'B',name:'B'}];
  assert.equal(rankDiscoveryRecords(records,{zip:'10001',origin:{lat:40,lon:-74}})[0].id,'same-zip');
});

test('state shards account for the complete official national foundation',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../data/discovery/manifest.json',import.meta.url)));
  assert.equal(manifest.total,22292);
  assert.equal(Object.keys(manifest.states).length,59);
  assert.equal(Object.values(manifest.states).reduce((sum,state)=>sum+state.hospitals,0),4495);
  assert.equal(Object.values(manifest.states).reduce((sum,state)=>sum+state.healthCenters,0),17797);
});
