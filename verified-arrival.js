const ARRIVAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createHandoffCode(values = crypto.getRandomValues(new Uint8Array(6))) {
  return `NS-${[...values].map((value) => ARRIVAL_ALPHABET[value % ARRIVAL_ALPHABET.length]).join('')}`;
}

export function buildDemoConfirmation(facility, inputs, outcome = 'accepted') {
  if (!facility || !inputs) throw new TypeError('Facility and inputs are required');
  const patient = inputs.patientGroup === 'pediatric' ? 'Child or teen' : 'Adult';
  const mode = outcome === 'redirected' ? 'redirected' : 'accepted';
  return {
    mode,
    facilityId: facility.id,
    facilityName: facility.name,
    patient,
    concern: inputs.need,
    code: createHandoffCode(),
    confirmedAt: new Date().toISOString(),
    notice: 'Demonstration only — no information was transmitted and no facility confirmed care.'
  };
}

export function nextAlternative(facilities, selectedId) {
  return facilities.find((facility) => facility.id !== selectedId) || null;
}
