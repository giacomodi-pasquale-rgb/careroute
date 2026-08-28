import test from 'node:test';
import assert from 'node:assert/strict';
import { missingTranslationKeys } from '../i18n.js';

test('every supported language covers every patient-facing translation key', () => {
  const missing = missingTranslationKeys();
  assert.deepEqual(missing, { en: [], es: [], pt: [], ht: [] });
});
