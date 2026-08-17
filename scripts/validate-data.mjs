import { readDataset, validateDataset } from './data-lib.mjs';

const dataset = await readDataset();
const errors = validateDataset(dataset, new Date(`${dataset.reviewedAt}T12:00:00Z`));
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${dataset.facilities.length} facilities in dataset ${dataset.datasetVersion}.`);
}
