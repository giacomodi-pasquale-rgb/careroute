import { readFile, writeFile } from 'node:fs/promises';
const path='data/review/provider-enrichment.json';
const batch=JSON.parse(await readFile(path,'utf8'));
const hospitals=JSON.parse(await readFile('data/review/us-hospitals.json','utf8'));
const required=['identity','location','contact','population','services','hours','access','routing'];
const byCcn=new Map(hospitals.candidates.map(record=>[record.cmsCertificationNumber,record]));
let resolved=0;
for(const record of batch.records){
  if(!byCcn.has(record.cmsCertificationNumber))throw new Error(`No CMS record for ${record.cmsCertificationNumber}`);
  if(!record.sourceUrl.startsWith('https://'))throw new Error(`Non-HTTPS evidence for ${record.name}`);
  for(const domain of required){
    if(!record.domains[domain]?.status||!record.domains[domain]?.evidence)throw new Error(`${record.name}: incomplete ${domain} review`);
    if(record.domains[domain].status==='resolved')resolved+=1;
  }
  const eligible=required.every(domain=>record.domains[domain].status==='resolved');
  if((record.status==='release-eligible')!==eligible)throw new Error(`${record.name}: release status conflicts with evidence`);
}
batch.summary={reviewed:batch.records.length,evidenceEnriched:batch.records.length,releaseEligible:batch.records.filter(record=>record.status==='release-eligible').length,held:batch.records.filter(record=>record.status==='held').length,claimsResolved:resolved,claimsChecked:batch.records.length*required.length};
await writeFile(path,`${JSON.stringify(batch,null,2)}\n`);
await writeFile('data/review/provider-enrichment.js',`window.NEARSIGNAL_PROVIDER_ENRICHMENT=${JSON.stringify(batch)};\n`);
console.log(`Validated ${batch.summary.reviewed} records and ${batch.summary.claimsChecked} evidence checks.`);
