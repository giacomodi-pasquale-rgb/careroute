import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { readDataset } from './data-lib.mjs';

const [candidatePath, jsonOutput = 'data/review/nj-hospitals.json', jsOutput = 'data/review/nj-hospitals.js'] = process.argv.slice(2);
if (!candidatePath) {
  console.error('Usage: node scripts/reconcile-candidates.mjs <candidate.json> [output.json] [output.js]');
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
    reconciliation: existing ? { status: 'matched-verified', facilityId: existing.id, method: verifiedByCcn.has(candidate.cmsCertificationNumber) ? 'cms-ccn' : 'address' } : { status: 'unmatched', facilityId: null, method: null },
    reviewPriority: existing ? 0 : candidate.location.county === 'ESSEX' ? 1 : 2
  };
}).sort((a, b) => a.reviewPriority - b.reviewPriority || a.identity.name.localeCompare(b.identity.name));

const summary = {
  total: candidates.length,
  matchedVerified: candidates.filter((item) => item.reconciliation.status === 'matched-verified').length,
  pendingEssex: candidates.filter((item) => item.reviewPriority === 1).length,
  pendingOtherNewJersey: candidates.filter((item) => item.reviewPriority === 2).length,
  publishable: 0
};
const output = {
  datasetVersion: canonical.datasetVersion,
  generatedAt: new Date().toISOString(),
  source: reviewQueue.source,
  warning: reviewQueue.warning,
  summary,
  candidates
};

await mkdir(dirname(jsonOutput), { recursive: true });
await writeFile(jsonOutput, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(jsOutput, `// Generated review queue. Do not edit by hand.\nwindow.CARE_ROUTE_REVIEW_QUEUE = ${JSON.stringify(output, null, 2)};\n`);
console.log(`Reconciled ${summary.total} candidates: ${summary.matchedVerified} existing, ${summary.pendingEssex} Essex pending, ${summary.pendingOtherNewJersey} other NJ pending.`);

function addressKey(location) {
  return `${normalize(location.address1)}|${normalize(location.city)}|${normalize(location.state)}|${normalize(location.postalCode).slice(0, 5)}`;
}
function normalize(value) { return String(value || '').toUpperCase().replace(/\b(STREET|ST)\b/g, 'ST').replace(/\b(AVENUE|AVE)\b/g, 'AVE').replace(/[^A-Z0-9]/g, ''); }
