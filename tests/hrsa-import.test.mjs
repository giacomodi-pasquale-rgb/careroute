import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../scripts/csv.mjs';
import { importHrsaRows, summarizeHrsa } from '../scripts/import-hrsa-health-centers.mjs';

const csv = `Health Center Type,Health Center Number,BPHC Assigned Number,Site Name,Site Address,Site City,Site State Abbreviation,Site Postal Code,Site Telephone Number,Site Web Address,Operating Hours per Week,Health Center Service Delivery Site Location Setting Description,Site Status Description,Health Center Location Type Description,Health Center Type Description,Health Center Operational Schedule Description,Health Center Operating Calendar,Health Center Name,Geocoding Artifact Address Primary X Coordinate,Geocoding Artifact Address Primary Y Coordinate,Complete County Name,Data Warehouse Record Create Date
Federally Qualified Health Center (FQHC),H80CS00001,BPS-001,Community Clinic,1 Main St,Newark,NJ,07102,973-555-1212,clinic.example,40,All Other Clinic Types,Active,Permanent,Service Delivery Site,Full-Time,Year-Round,Example Health,-74.1724,40.7357,Essex County,08/30/2026
Federally Qualified Health Center (FQHC),H80CS00002,BPS-002,Admin Office,2 Main St,Newark,NJ,07102,973-555-1213,,40,Administrative,Active,Permanent,Administrative Site,Full-Time,Year-Round,Example Health,-74.17,40.73,Essex County,08/30/2026
`;

test('HRSA importer retains only active, geocoded service-delivery sites', () => {
  const candidates = importHrsaRows(parseCsv(csv));
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].candidateId, 'hrsa-bps-001');
  assert.equal(candidates[0].publishable, false);
  assert.equal(candidates[0].evidenceTier, 'officially-identified');
  assert.equal(candidates[0].location.state, 'NJ');
  assert.equal(candidates[0].contact.website, 'https://clinic.example/');
});

test('HRSA summary never labels imported candidates as publishable', () => {
  const summary = summarizeHrsa(importHrsaRows(parseCsv(csv)));
  assert.equal(summary.total, 1);
  assert.equal(summary.publishable, 0);
  assert.equal(summary.jurisdictions, 1);
});
