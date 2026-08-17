import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { readDataset } from './data-lib.mjs';

const [candidatePath, jsonOutput = 'data/review/us-hospitals.json', jsOutput = 'data/review/us-hospitals.js'] = process.argv.slice(2);
if (!candidatePath) {
  console.error('Usage: node scripts/reconcile-national.mjs <candidate.json> [output.json] [output.js]');
  process.exit(2);
}

const reviewQueue = JSON.parse(await readFile(candidatePath, 'utf8'));
const canonical = await readDataset();
const verifiedByCcn = new Map(canonical.facilities.filter((item) => item.externalIds?.cmsCcn).map((item) => [item.externalIds.cmsCcn, item]));
const verifiedByAddress = new Map(canonical.facilities.map((item) => [addressKey(item.location), item]));
const candidates = reviewQueue.candidates.map((candidate) => {
  const existing = verifiedByCcn.get(candidate.cmsCertificationNumber) || verifiedByAddress.get(addressKey(candidate.location));
  return {
    ...candidate,
    reconciliation: existing ? { status: 'matched-verified', facilityId: existing.id, method: verifiedByCcn.has(candidate.cmsCertificationNumber) ? 'cms-ccn' : 'address' } : { status: 'unmatched', facilityId: null, method: null }
  };
}).sort((a, b) => a.location.state.localeCompare(b.location.state) || a.identity.name.localeCompare(b.identity.name));

const states = [...new Set(candidates.map((item) => item.location.state))].sort().map((state) => {
  const records = candidates.filter((item) => item.location.state === state);
  return { state, total: records.length, matchedVerified: records.filter((item) => item.reconciliation.status === 'matched-verified').length, pendingReview: records.filter((item) => item.reconciliation.status === 'unmatched').length };
});
const summary = {
  total: candidates.length,
  jurisdictions: states.length,
  matchedVerified: candidates.filter((item) => item.reconciliation.status === 'matched-verified').length,
  pendingReview: candidates.filter((item) => item.reconciliation.status === 'unmatched').length,
  publishable: 0,
  states
};
const output = { datasetVersion: canonical.datasetVersion, generatedAt: new Date().toISOString(), source: reviewQueue.source, warning: reviewQueue.warning, summary, candidates };
await mkdir(dirname(jsonOutput), { recursive: true });
await writeFile(jsonOutput, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(jsOutput, `// Generated national review queue. Do not edit by hand.\nwindow.CARE_ROUTE_REVIEW_QUEUE = ${JSON.stringify(output)};\n`);
console.log(`Reconciled ${summary.total} emergency-service hospitals across ${summary.jurisdictions} jurisdictions: ${summary.matchedVerified} verified and ${summary.pendingReview} pending service review.`);

function addressKey(location) { return `${normalize(location.address1)}|${normalize(location.city)}|${normalize(location.state)}|${normalize(location.postalCode).slice(0, 5)}`; }
function normalize(value) { return String(value || '').toUpperCase().replace(/\b(STREET|ST)\b/g, 'ST').replace(/\b(AVENUE|AVE)\b/g, 'AVE').replace(/[^A-Z0-9]/g, ''); }
