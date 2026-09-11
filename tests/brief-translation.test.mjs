import test from 'node:test';
import assert from 'node:assert/strict';
import { translateBriefTextToEnglish } from '../brief-translation.js';

test('creates an English draft for common Spanish symptom language', () => {
  const result = translateBriefTextToEnglish('Mi hijo tiene fiebre y tos desde ayer', 'es');
  assert.match(result.text, /my son/i);
  assert.match(result.text, /fever/i);
  assert.match(result.text, /cough/i);
  assert.match(result.text, /since yesterday/i);
});

test('creates English drafts for Portuguese and Haitian Creole terms', () => {
  assert.match(translateBriefTextToEnglish('dor no peito desde ontem', 'pt').text, /chest pain since yesterday/i);
  assert.match(translateBriefTextToEnglish('difikilte pou respire depi yè', 'ht').text, /difficulty breathing since yesterday/i);
});

test('preserves unknown words for patient and interpreter review', () => {
  const result = translateBriefTextToEnglish('palabras completamente desconocidas', 'es');
  assert.equal(result.text, 'palabras completamente desconocidas');
  assert.equal(result.translated, false);
});
