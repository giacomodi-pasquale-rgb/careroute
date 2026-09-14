export const XRAY_REASON_ORDER = ['state','population','age','setting','capability','distance'];

export function evaluateAccessFacility(facility, inputs, options = {}) {
  if (inputs.selectedState && facility.state !== inputs.selectedState) return 'state';
  const populationFits = inputs.patientGroup === 'adult'
    ? facility.patientGroups.includes('adult')
    : facility.patientGroups.includes('pediatric') && (facility.type !== 'emergency' || facility.pediatricSpecific);
  if (!populationFits) return 'population';
  if (inputs.patientGroup !== 'adult' && facility.age.verifiedLimits && (inputs.ageMonths < facility.age.minMonths || inputs.ageMonths > facility.age.maxMonths)) return 'age';
  if (inputs.emergency && facility.type !== 'emergency') return 'setting';
  if (inputs.need !== 'other' && !facility.capabilities.includes(inputs.need)) return 'capability';
  if (options.routeMap?.size) {
    const distance = options.routeMap.get(facility.id)?.distanceMeters;
    if (!Number.isFinite(distance) || distance > options.maxDistanceMeters) return 'distance';
  }
  return null;
}

export function analyzeAccess(facilities, inputs, options = {}) {
  const excluded = [];
  const eligible = [];
  const counts = Object.fromEntries(XRAY_REASON_ORDER.map(reason => [reason,0]));
  for (const facility of facilities) {
    const reason=evaluateAccessFacility(facility,inputs,options);
    if (reason) { counts[reason]+=1; excluded.push({facility,reason}); }
    else eligible.push(facility);
  }
  const inState=facilities.length-counts.state;
  return {total:facilities.length,inState,eligible,excluded,counts};
}

export function primaryAccessGap(analysis) {
  const relevant=XRAY_REASON_ORDER.filter(reason=>reason!=='state').map(reason=>({reason,count:analysis.counts[reason]})).sort((a,b)=>b.count-a.count);
  return relevant[0] || {reason:'capability',count:0};
}
