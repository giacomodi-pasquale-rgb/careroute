import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../scripts/csv.mjs';

test('CMS CSV parser preserves commas and leading-zero identifiers', () => {
  const csv = 'Facility ID,Facility Name,Address,City/Town,State,ZIP Code,County/Parish,Telephone Number,Hospital Type,Hospital Ownership,Emergency Services,Hospital overall rating\n010001,"CHILDREN, COMMUNITY HOSPITAL",1 MAIN ST,TOWN,AL,01234,COUNTY,(555) 111-2222,Acute Care Hospitals,Voluntary,Yes,4\n';
  const [row] = parseCsv(csv);
  assert.equal(row['Facility ID'], '010001');
  assert.equal(row['Facility Name'], 'CHILDREN, COMMUNITY HOSPITAL');
  assert.equal(row['ZIP Code'], '01234');
  assert.equal(row['Emergency Services'], 'Yes');
});
