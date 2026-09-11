const dictionaries = {
  es: [
    ['dificultad para respirar', 'difficulty breathing'], ['dolor de pecho', 'chest pain'], ['dolor de cabeza', 'headache'],
    ['dolor de estómago', 'stomach pain'], ['no puede respirar', 'cannot breathe'], ['desde ayer', 'since yesterday'],
    ['desde esta mañana', 'since this morning'], ['tiene fiebre', 'has a fever'], ['tengo fiebre', 'I have a fever'],
    ['fiebre', 'fever'], ['tos', 'cough'], ['vómitos', 'vomiting'], ['vomitando', 'vomiting'], ['diarrea', 'diarrhea'],
    ['mareo', 'dizziness'], ['dolor', 'pain'], ['herida', 'wound'], ['sangrado', 'bleeding'], ['alergia', 'allergy'],
    ['alérgico', 'allergic'], ['medicamentos', 'medications'], ['asma', 'asthma'], ['ayer', 'yesterday'], ['hoy', 'today'],
    ['niño', 'child'], ['niña', 'child'], ['mi hijo', 'my son'], ['mi hija', 'my daughter'], ['desde', 'since']
  ],
  pt: [
    ['dificuldade para respirar', 'difficulty breathing'], ['dor no peito', 'chest pain'], ['dor de cabeça', 'headache'],
    ['dor de estômago', 'stomach pain'], ['não consegue respirar', 'cannot breathe'], ['desde ontem', 'since yesterday'],
    ['desde esta manhã', 'since this morning'], ['está com febre', 'has a fever'], ['estou com febre', 'I have a fever'],
    ['febre', 'fever'], ['tosse', 'cough'], ['vômitos', 'vomiting'], ['vomitando', 'vomiting'], ['diarreia', 'diarrhea'],
    ['tontura', 'dizziness'], ['dor', 'pain'], ['ferida', 'wound'], ['sangramento', 'bleeding'], ['alergia', 'allergy'],
    ['alérgico', 'allergic'], ['medicamentos', 'medications'], ['asma', 'asthma'], ['ontem', 'yesterday'], ['hoje', 'today'],
    ['criança', 'child'], ['meu filho', 'my son'], ['minha filha', 'my daughter'], ['desde', 'since']
  ],
  ht: [
    ['difikilte pou respire', 'difficulty breathing'], ['doulè nan pwatrin', 'chest pain'], ['doulè nan tèt', 'headache'],
    ['doulè nan vant', 'stomach pain'], ['li pa ka respire', 'cannot breathe'], ['depi yè', 'since yesterday'],
    ['depi maten an', 'since this morning'], ['li gen lafyèv', 'has a fever'], ['mwen gen lafyèv', 'I have a fever'],
    ['lafyèv', 'fever'], ['tous', 'cough'], ['vomisman', 'vomiting'], ['ap vomi', 'vomiting'], ['dyare', 'diarrhea'],
    ['tèt vire', 'dizziness'], ['doulè', 'pain'], ['blesi', 'wound'], ['senyen', 'bleeding'], ['alèji', 'allergy'],
    ['medikaman', 'medications'], ['opresyon', 'asthma'], ['yè', 'yesterday'], ['jodi a', 'today'], ['timoun', 'child'],
    ['pitit gason mwen', 'my son'], ['pitit fi mwen', 'my daughter'], ['depi', 'since']
  ]
};

function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export function translateBriefTextToEnglish(text, language) {
  const original = String(text || '').trim();
  if (!original || language === 'en') return { text: original, translated: language === 'en', partial: false };
  let translated = original;
  let replacements = 0;
  for (const [source, target] of dictionaries[language] || []) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(source)}(?![\\p{L}\\p{N}])`, 'giu');
    translated = translated.replace(pattern, () => { replacements += 1; return target; });
  }
  return { text: translated, translated: replacements > 0, partial: replacements > 0 && translated !== original };
}
