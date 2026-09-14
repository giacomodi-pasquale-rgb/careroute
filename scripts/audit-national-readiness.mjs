import { readFile, writeFile } from 'node:fs/promises';

const hospitals=JSON.parse(await readFile('data/review/us-hospitals.json','utf8'));
const centers=JSON.parse(await readFile('data/review/us-health-centers.json','utf8'));
const domains=['identity','location','contact','population','services','hours','access'];
const counts=Object.fromEntries(domains.map(domain=>[domain,{resolved:0,missing:0}]));
const jurisdictions={};

function audit(record,kind){
  const resolved={
    identity:Boolean(record.identity?.name),
    location:Boolean(record.location?.city&&record.location?.state&&(record.location?.address1||record.location?.county)),
    contact:Boolean(kind==='hospital'?record.phone:record.contact?.phone),
    population:false,
    services:kind==='hospital'&&record.identity?.emergencyServicesReported===true,
    hours:false,
    access:false
  };
  const state=record.location.state;
  jurisdictions[state]??={total:0,fullyReady:0,domains:Object.fromEntries(domains.map(domain=>[domain,0]))};
  jurisdictions[state].total+=1;
  for(const domain of domains){
    counts[domain][resolved[domain]?'resolved':'missing']+=1;
    if(resolved[domain])jurisdictions[state].domains[domain]+=1;
  }
  return resolved;
}

for(const record of hospitals.candidates)audit(record,'hospital');
for(const record of centers.candidates)audit(record,'health-center');

const total=hospitals.candidates.length+centers.candidates.length;
const output={
  auditedAt:'2026-09-14',
  standardVersion:'nearsignal-decision-ready-v1',
  totalRecords:total,
  totalDomainChecks:total*domains.length,
  candidateSources:{cmsHospitals:hospitals.candidates.length,hrsaHealthCenters:centers.candidates.length},
  domains:counts,
  automaticallyDecisionReady:0,
  explanation:'Federal identity records can resolve identity, recorded location, and usually a contact number. They do not independently establish location-level adult or pediatric eligibility, exact services, current daily hours, or patient-specific access and cost terms.',
  jurisdictions:Object.fromEntries(Object.entries(jurisdictions).sort(([a],[b])=>a.localeCompare(b)))
};

await writeFile('data/review/national-readiness-audit.json',JSON.stringify(output,null,2));
await writeFile('data/review/national-readiness-audit.js',`window.NEARSIGNAL_READINESS_AUDIT=${JSON.stringify(output)};\n`);
console.log(`Audited ${total.toLocaleString()} records across ${domains.length} release domains (${output.totalDomainChecks.toLocaleString()} checks).`);
