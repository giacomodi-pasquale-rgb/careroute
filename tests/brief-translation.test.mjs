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

test('fully translates the Spanish brief reported in check-in testing', () => {
  const concern = translateBriefTextToEnglish('me duele la cabeza y la espalda y tengo frio', 'es');
  const onset = translateBriefTextToEnglish("esta mañana cuando me levante'", 'es');
  const history = translateBriefTextToEnglish('en este momento ningún medicamento o enfermedad. no tengo ningún problema de alergias.', 'es');
  assert.equal(concern.text, 'I have a headache and back pain, and I feel cold');
  assert.equal(onset.text, 'this morning when I woke up');
  assert.equal(history.text, 'I am not currently taking any medications and I have no medical conditions. I have no known allergies.');
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
