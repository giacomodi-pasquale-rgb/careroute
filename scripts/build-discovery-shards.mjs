import { mkdir, readFile, writeFile } from 'node:fs/promises';

const hospitals=JSON.parse(await readFile('data/review/us-hospitals.json','utf8')).candidates;
const centers=JSON.parse(await readFile('data/review/us-health-centers.json','utf8')).candidates;
const states=new Map();
const add=(state,record)=>{if(!states.has(state))states.set(state,[]);states.get(state).push(record);};

for(const item of hospitals){
  add(item.location.state,{id:item.candidateId,kind:'hospital',name:item.identity.name,address:item.location.address1,city:item.location.city,state:item.location.state,zip:item.location.postalCode,phone:item.phone,matchedVerified:item.reconciliation?.status==='matched-verified'});
}
for(const item of centers){
  add(item.location.state,{id:item.candidateId,kind:'health-center',name:item.identity.name,address:item.location.address1,city:item.location.city,state:item.location.state,zip:item.location.postalCode,phone:item.contact.phone,website:item.contact.website,lat:item.location.latitude,lon:item.location.longitude,hours:item.operations.reportedHoursPerWeek,program:item.identity.healthCenterType});
}

await mkdir('data/discovery',{recursive:true});
const manifest={generatedAt:new Date().toISOString(),total:0,states:{}};
for(const [state,records] of [...states].sort(([a],[b])=>a.localeCompare(b))){
  records.sort((a,b)=>a.city.localeCompare(b.city)||a.name.localeCompare(b.name));
  const payload={state,total:records.length,hospitals:records.filter(r=>r.kind==='hospital').length,healthCenters:records.filter(r=>r.kind==='health-center').length,records};
  await writeFile(`data/discovery/${state}.json`,JSON.stringify(payload));
  manifest.states[state]={total:payload.total,hospitals:payload.hospitals,healthCenters:payload.healthCenters};
  manifest.total+=payload.total;
}
await writeFile('data/discovery/manifest.json',JSON.stringify(manifest));
console.log(`Created ${states.size} state and territory shards containing ${manifest.total} official records.`);
