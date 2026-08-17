import { writeFile } from 'node:fs/promises';
import { readDataset, toWebFacility, validateDataset } from './data-lib.mjs';

const dataset = await readDataset();
const errors = validateDataset(dataset, new Date(`${dataset.reviewedAt}T12:00:00Z`));
if (errors.length) throw new Error(`Dataset invalid:\n${errors.join('\n')}`);
const output = `// Generated from data/v1/facilities.json. Do not edit by hand.\nwindow.CARE_ROUTE_DATASET = ${JSON.stringify({ datasetVersion: dataset.datasetVersion, reviewedAt: dataset.reviewedAt }, null, 2)};\nwindow.CARE_ROUTE_FACILITIES = ${JSON.stringify(dataset.facilities.map(toWebFacility), null, 2)};\n`;
await writeFile(new URL('../data/facilities.js', import.meta.url), output);
console.log(`Built browser data for ${dataset.facilities.length} facilities.`);
