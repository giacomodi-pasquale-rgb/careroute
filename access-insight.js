export function accessEvidence(facility, inputs, route, open) {
  const resolved = ['appropriateSetting', 'verifiedCapability'];
  const verify = [];
  if (facility.age.verifiedLimits || inputs.patientGroup === 'adult') resolved.push('ageFit'); else verify.push('ageLimit');
  if (open === true || facility.hours.kind === 'always') resolved.push('openStatus'); else verify.push('hours');
  if (route) resolved.push('travel'); else verify.push('travel');
  if (inputs.accessNeeds.has('uninsured')) {
    if (facility.access.uninsuredWelcome) resolved.push('uninsuredAccess'); else verify.push('insurance');
  } else verify.push('insurance');
  if (inputs.accessNeeds.has('low-cost')) {
    if (facility.access.slidingFee || facility.access.noOneTurnedAway || facility.access.flatFee || facility.access.charityCare) resolved.push('affordability'); else verify.push('cost');
  }
  if (inputs.accessNeeds.has('language')) {
    if (facility.access.languages.length) resolved.push('languageSupport'); else verify.push('languageSupport');
  }
  const knownRatio = resolved.length / Math.max(1, resolved.length + verify.length);
  return { level: knownRatio >= .75 ? 'strong' : knownRatio >= .5 ? 'moderate' : 'limited', resolved, verify };
}

export function createArrivalCode(randomValues) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = randomValues || crypto.getRandomValues(new Uint8Array(6));
  return `NS-${[...values].map((value) => alphabet[value % alphabet.length]).join('')}`;
}

export function saveOutcome(storage, outcome) {
  const key = 'nearsignal-outcomes-v1';
  let existing = [];
  try { existing = JSON.parse(storage.getItem(key) || '[]'); } catch { existing = []; }
  const records = [...existing, outcome].slice(-50);
  storage.setItem(key, JSON.stringify(records));
  return records.length;
}

export function outcomeCount(storage) {
  try { return JSON.parse(storage.getItem('nearsignal-outcomes-v1') || '[]').length; } catch { return 0; }
}
