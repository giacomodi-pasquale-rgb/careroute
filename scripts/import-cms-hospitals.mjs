import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseCsv } from './csv.mjs';

const [inputPath, outputPath = 'work/cms-hospital-candidates.json', stateFilter] = process.argv.slice(2);
if (!inputPath) {
  console.error('Usage: npm run import:cms -- <HOSPITAL_GENERAL_INFORMATION.csv> [output.json] [state]');
  process.exit(2);
}

const rows = parseCsv(await readFile(inputPath, 'utf8'));
const candidates = rows
  .filter((row) => !stateFilter || value(row, 'State') === stateFilter.toUpperCase())
  .filter((row) => value(row, 'Emergency Services') === 'Yes')
  .map(toCandidate);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({
  source: {
    publisher: 'Centers for Medicare & Medicaid Services',
    dataset: 'Hospital General Information',
    identifier: 'xubh-q36u',
    url: 'https://data.cms.gov/provider-data/dataset/xubh-q36u'
  },
  generatedAt: new Date().toISOString(),
  warning: 'Review candidates only. CMS emergency-service status does not establish pediatric capability. No candidate may be published before authoritative pediatric verification.',
  candidates
}, null, 2)}\n`);
console.log(`Created ${candidates.length} pending review candidates in ${outputPath}.`);

function toCandidate(row) {
  const facilityId = value(row, 'Facility ID');
  return {
    candidateId: `cms-${facilityId}`,
    cmsCertificationNumber: facilityId,
    status: 'pending-pediatric-verification',
    identity: {
      name: value(row, 'Facility Name'),
      hospitalType: value(row, 'Hospital Type'),
      ownership: value(row, 'Hospital Ownership'),
      emergencyServicesReported: true
    },
    location: {
      address1: value(row, 'Address'),
      city: value(row, 'City/Town', 'City'),
      state: value(row, 'State'),
      postalCode: value(row, 'ZIP Code'),
      county: value(row, 'County/Parish', 'County Name')
    },
    phone: digits(value(row, 'Telephone Number', 'Phone Number')),
    cmsOverallHospitalRating: nullable(value(row, 'Hospital overall rating')),
    pediatricCapability: null,
    pediatricEvidence: [],
    publishable: false
  };
}

function value(row, ...keys) {
  for (const key of keys) if (row[key] !== undefined) return row[key].trim();
  return '';
}
function digits(input) { return input.replace(/\D/g, ''); }
function nullable(input) { return input && input !== 'Not Available' ? input : null; }
