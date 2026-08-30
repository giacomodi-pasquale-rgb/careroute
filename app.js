import { RoutingService, presentRoute } from './routing.js';
import { currentLanguage, format, initLanguage, t } from './i18n.js?v=7';

const facilities = window.CARE_ROUTE_FACILITIES;
const routingService = new RoutingService(window.CARE_ROUTE_CONFIG?.routing);
const state = { step: 1, location: null, locationSource: null, routes: new Map(), showAllResults: false, demoScenario: false };
const MAX_SEARCH_MILES = 100;
const NORTHEAST_STATES = new Set(['CT', 'ME', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT']);
let installPrompt = null;
const steps = [...document.querySelectorAll('.step')];
const titleKeys = ['step1', 'step2', 'step3', 'step4'];

initLanguage();
document.getElementById('facilityCount').textContent = facilities.length;
const evidenceNetwork = window.CARE_ROUTE_EVIDENCE_NETWORK;
if (evidenceNetwork) {
  const number = new Intl.NumberFormat().format;
  document.getElementById('networkOfficial').textContent = number(evidenceNetwork.tiers.officiallyIndexed.total);
  document.getElementById('networkHospitals').textContent = number(evidenceNetwork.tiers.officiallyIndexed.hospitalCandidates);
  document.getElementById('networkHealthCenters').textContent = number(evidenceNetwork.tiers.officiallyIndexed.affordableHealthCenterCandidates);
  document.getElementById('networkReady').textContent = number(evidenceNetwork.tiers.decisionReady.total);
}

if ('serviceWorker' in navigator) window.addEventListener('load', async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  if ('caches' in window) await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
});
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  document.getElementById('installApp').hidden = false;
});
document.getElementById('installApp').addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  document.getElementById('installApp').hidden = true;
});

function showStep(number) {
  state.step = number;
  steps.forEach((item) => item.classList.toggle('active', Number(item.dataset.step) === number));
  document.getElementById('form-title').textContent = t(titleKeys[number - 1]);
  document.getElementById('stepLabel').textContent = format('stepLabel', { n: number });
  document.getElementById('progressBar').style.width = `${number * 25}%`;
}

document.querySelectorAll('.next').forEach((button) => button.addEventListener('click', () => {
  if (state.step === 1 && document.querySelector('[name=patientGroup]:checked').value === 'pediatric' && !document.getElementById('ageValue').reportValidity()) return;
  showStep(state.step + 1);
}));
document.querySelectorAll('[name=patientGroup]').forEach((input) => input.addEventListener('change', () => {
  document.getElementById('childAge').hidden = input.value !== 'pediatric';
}));
document.querySelectorAll('.back').forEach((button) => button.addEventListener('click', () => showStep(state.step - 1)));
document.addEventListener('careroute:language', async () => {
  showStep(state.step);
  if (!document.getElementById('results').hidden) await renderResults();
});
showStep(state.step);

function clearLocation() {
  state.location = null;
  state.locationSource = null;
  state.routes.clear();
  document.getElementById('locationStatus').textContent = '';
  document.getElementById('locationStatus').classList.remove('success');
}

document.getElementById('stateSelect').addEventListener('change', () => {
  clearLocation();
  document.getElementById('zipStatus').textContent = '';
  document.getElementById('zipStatus').classList.remove('success');
});

document.getElementById('useZip').addEventListener('click', async () => {
  state.demoScenario = false;
  const input = document.getElementById('zipCode');
  const button = document.getElementById('useZip');
  const status = document.getElementById('zipStatus');
  const zip = input.value.trim();
  status.classList.remove('success');
  if (!/^\d{5}$/.test(zip)) {
    status.textContent = t('zipInvalid');
    input.focus();
    return;
  }
  button.disabled = true;
  status.textContent = t('zipFinding');
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal: controller.signal });
    if (!response.ok) throw new Error('ZIP not found');
    const data = await response.json();
    const place = data.places?.[0];
    const region = place?.['state abbreviation'];
    const lat = Number(place?.latitude);
    const lon = Number(place?.longitude);
    if (!NORTHEAST_STATES.has(region)) {
      clearLocation();
      status.textContent = t('zipOutside');
      return;
    }
    document.getElementById('stateSelect').value = region;
    state.location = { lat, lon };
    state.locationSource = 'zip';
    status.textContent = format('zipReady', { zip, place: place['place name'] });
    status.classList.add('success');
  } catch (error) {
    clearLocation();
    status.textContent = t('zipUnavailable');
  } finally {
    window.clearTimeout(timeout);
    button.disabled = false;
  }
});

document.getElementById('locateMe').addEventListener('click', () => {
  state.demoScenario = false;
  const status = document.getElementById('locationStatus');
  const locateButton = document.getElementById('locateMe');
  const submitButton = document.getElementById('showCareOptions');
  if (!navigator.geolocation) {
    status.textContent = t('locationUnsupported');
    return;
  }
  locateButton.disabled = true;
  status.textContent = t('findingLocation');
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      state.location = { lat: coords.latitude, lon: coords.longitude };
      state.locationSource = 'geolocation';
      status.textContent = t('locationReady');
      status.classList.add('success');
      locateButton.disabled = false;
      showCareOptions(submitButton);
    },
    (error) => {
      locateButton.disabled = false;
      status.classList.remove('success');
      status.textContent = error.code === error.PERMISSION_DENIED
        ? t('locationBlocked')
        : error.code === error.TIMEOUT
          ? t('locationTimeout')
          : t('locationUnavailable');
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
  );
});

document.getElementById('showCareOptions').addEventListener('click', (event) => {
  state.demoScenario = false;
  showCareOptions(event.currentTarget);
});
document.getElementById('careForm').addEventListener('submit', (event) => event.preventDefault());
document.getElementById('tryDemo').addEventListener('click', () => {
  document.querySelector('[name=patientGroup][value=pediatric]').checked = true;
  document.getElementById('childAge').hidden = false;
  document.getElementById('ageValue').value = '5';
  document.getElementById('ageUnit').value = 'years';
  document.getElementById('stateSelect').value = 'NJ';
  document.querySelector('[name=need][value=illness]').checked = true;
  document.querySelector('[name=emergency][value=no]').checked = true;
  document.querySelectorAll('[name=accessNeed]').forEach((input) => { input.checked = ['uninsured', 'low-cost'].includes(input.value); });
  state.location = { lat: 40.7357, lon: -74.1724 };
  state.locationSource = 'demo';
  state.demoScenario = true;
  showCareOptions(document.getElementById('showCareOptions'));
});

async function showCareOptions(button) {
  state.showAllResults = false;
  button.disabled = true;
  button.textContent = state.location ? t('calculatingRoutes') : t('loadingOptions');
  document.getElementById('questionnaire').hidden = true;
  document.getElementById('results').hidden = false;
  document.getElementById('resultsTitle').textContent = t('findingOptions');
  document.getElementById('routingNote').textContent = state.location ? t('calculatingNearby') : t('loadingFacilities');
  document.getElementById('cards').innerHTML = `<div class="empty"><p>${t('findingOptions')}</p></div>`;
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    await renderResults();
  } catch (error) {
    console.error('Unable to render care options', error);
    document.getElementById('resultsTitle').textContent = t('loadErrorTitle');
    document.getElementById('routingNote').textContent = t('loadErrorNote');
    document.getElementById('cards').innerHTML = `<div class="empty"><p>${t('loadErrorBody')}</p></div>`;
  } finally {
    button.disabled = false;
    button.textContent = t('seeOptions');
  }
}

document.getElementById('startOver').addEventListener('click', () => {
  state.showAllResults = false;
  state.demoScenario = false;
  clearLocation();
  document.getElementById('zipCode').value = '';
  document.getElementById('zipStatus').textContent = '';
  document.getElementById('zipStatus').classList.remove('success');
  document.getElementById('results').hidden = true;
  document.getElementById('questionnaire').hidden = false;
  showStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function getInputs() {
  const value = Number(document.getElementById('ageValue').value);
  const unit = document.getElementById('ageUnit').value;
  return {
    patientGroup: document.querySelector('[name=patientGroup]:checked').value,
    selectedState: document.getElementById('stateSelect').value,
    ageMonths: unit === 'months' ? value : value * 12,
    need: document.querySelector('[name=need]:checked').value,
    emergency: document.querySelector('[name=emergency]:checked').value === 'yes',
    accessNeeds: new Set([...document.querySelectorAll('[name=accessNeed]:checked')].map((input) => input.value))
  };
}

function isOpenNow(schedule) {
  if (schedule.kind === 'always') return true;
  if (schedule.kind !== 'weekly') return null;
  const now = new Date();
  const period = schedule.days[now.getDay()];
  if (!period) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= period[0] && minutes < period[1];
}

async function loadRoutes(list) {
  state.routes.clear();
  if (!state.location || !list.length) return false;
  try {
    state.routes = await routingService.matrix(state.location, list);
    return state.routes.size > 0;
  } catch (error) {
    console.warn('Live routing unavailable', error);
    return false;
  }
}

function scoreFacility(facility, inputs) {
  const route = state.routes.has(facility.id) ? presentRoute(state.routes.get(facility.id)) : null;
  const specialization = facility.pediatricSpecific ? 30 : 18;
  const settingFit = inputs.emergency ? 50 : (facility.type === 'urgent-care' ? 45 : facility.type === 'community-health-center' ? 38 : 20);
  const capability = facility.capabilities.includes(inputs.need) ? 20 : 0;
  const travel = route ? Math.max(0, 30 - route.minutes * 0.75) : 0;
  const accessMatch = inputs.emergency ? 0
    : (inputs.accessNeeds.has('uninsured') && facility.access.uninsuredWelcome ? 30 : 0)
      + (inputs.accessNeeds.has('low-cost') && (facility.access.slidingFee || facility.access.noOneTurnedAway) ? 35 : 0)
      + (inputs.accessNeeds.has('language') && facility.access.languages.length ? 25 : 0);
  return settingFit + specialization + capability + travel + accessMatch;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function journeySummary(inputs) {
  const needKeys = { illness: 'summaryIllness', breathing: 'summaryBreathing', injury: 'summaryInjury', wound: 'summaryWound', stomach: 'summaryStomach', other: 'summaryOther' };
  const chips = [
    t(inputs.patientGroup === 'adult' ? 'summaryAdult' : 'summaryChild'),
    t(needKeys[inputs.need]),
    t(inputs.emergency ? 'summaryEmergency' : 'summaryNonEmergency'),
    inputs.selectedState ? t(`state${inputs.selectedState}`) : t('allStates')
  ];
  if (inputs.accessNeeds.has('uninsured')) chips.push(t('summaryUninsured'));
  if (inputs.accessNeeds.has('low-cost')) chips.push(t('summaryLowCost'));
  if (inputs.accessNeeds.has('language')) chips.push(t('summaryLanguage'));
  return `<strong>${t('yourSituation')}</strong><div>${chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join('')}</div>`;
}

function facilityCard(facility, index, inputs) {
  const route = state.routes.has(facility.id) ? presentRoute(state.routes.get(facility.id)) : null;
  const open = isOpenNow(facility.hours);
  const status = open === true ? `<span class="open">${t('openNow')}</span>` : open === false ? `<span class="closed">${t('closedNow')}</span>` : `<span class="unknown">${t('hoursCheck')}</span>`;
  const routeText = route ? `<span class="metric strong">${format('minuteDrive',{n:route.minutes})}</span><span class="metric">${format('milesRoad',{n:route.miles})}</span><span class="metric">${format('arriveAbout',{time:route.arrivalLabel})}</span>` : `<span class="metric">${t('driveUnavailable')}</span>`;
  const ageText = facility.age.verifiedLimits ? '' : `<span class="metric warning">${t('ageVerify')}</span>`;
  const operationalStatus = facility.type === 'emergency' && facility.state === 'NJ'
  ? `<a class="metric" href="https://njdivert.juvare.com/" target="_blank" rel="noopener">${t('njStatus')}</a>`
  : `<a class="metric" href="${facility.sourceUrl}" target="_blank" rel="noopener">${t('waitProvider')}</a>`;
  const accessBadges = [
    facility.access.uninsuredWelcome ? `<span class="metric access-strong">${t('insuranceNotRequired')}</span>` : '',
    facility.access.slidingFee ? `<span class="metric access">${t('slidingFee')}</span>` : '',
    facility.access.noOneTurnedAway ? `<span class="metric access">${t('noOneTurnedAway')}</span>` : '',
    facility.access.charityCare ? `<a class="metric access" href="https://www.nj.gov/health/charitycare/" target="_blank" rel="noopener">${t('charityCare')}</a>` : '',
    facility.access.flatFee ? `<span class="metric access">Published self-pay: ${escapeHtml(facility.access.flatFee)}</span>` : ''
  ].join('');
  const translatedFacts = currentLanguage() === 'en' ? facility.highlights.slice(0, 3) : t(facility.type === 'emergency' ? 'genericEmergencyFacts' : facility.type === 'urgent-care' ? 'genericUrgentFacts' : 'genericCommunityFacts');
  const facts = translatedFacts.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const typeLabel = currentLanguage() === 'en' ? facility.typeLabel : t(facility.type === 'emergency' ? 'typeEmergency' : facility.type === 'urgent-care' ? 'typeUrgent' : 'typeCommunity');
  const hoursLabel = currentLanguage() === 'en' ? facility.hours.label : t(facility.hours.kind === 'always' ? 'hoursAlways' : facility.hours.kind === 'weekly' ? 'hoursWeekly' : 'hoursLive');
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(facility.address)}`;
  const reason = inputs.emergency
    ? inputs.patientGroup === 'adult'
      ? t('adultEmergencyReason')
      : t('pediatricEmergencyReason')
    : facility.type === 'urgent-care'
      ? t('urgentReason')
      : facility.type === 'community-health-center'
        ? t('communityReason')
      : t('hospitalBackupReason');
  return `<article class="card ${index === 0 ? 'best' : ''}">
    <div class="card-top"><div><div class="rank">${route ? (index === 0 ? t('closestMatch') : format('option',{n:index+1})) : format('verifiedOption',{n:index+1})}</div><h3>${escapeHtml(facility.name)}</h3><p class="facility-type">${escapeHtml(typeLabel)} · ${escapeHtml(facility.city)}</p></div>${status}</div>
    <div class="metrics">${routeText}${ageText}${operationalStatus}${accessBadges}${facility.access.uninsuredWelcome ? '' : `<span class="metric">${t('insuranceVerify')}</span>`}</div>
    <p class="reason"><strong>${t('whyThisFits')}</strong> ${reason}</p>
    <ul class="facts">${facts}</ul>
    <p class="hours"><strong>${t('publishedHours')}</strong> ${escapeHtml(hoursLabel)}</p>
    ${facility.access.note ? `<p class="access-note"><strong>${t('costAccess')}</strong> ${escapeHtml(currentLanguage()==='en' ? facility.access.note : t('accessNote'))} <a class="text-link" href="${facility.access.sourceUrl}" target="_blank" rel="noopener">${t('officialSource')}</a></p>` : ''}
    ${route ? `<p class="route-source"><strong>${t('routeSource')}</strong> ${escapeHtml(route.provider)} · ${route.trafficAware ? t('trafficYes') : t('trafficNo')} · ${t('calculated')} ${new Date(route.calculatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>` : ''}
    <p class="verification-line">✓ ${format('verificationReviewed', { date: new Date(`${facility.verification.reviewedAt}T12:00:00`).toLocaleDateString(currentLanguage(), { month: 'short', day: 'numeric', year: 'numeric' }) })}</p>
    <p class="quality"><strong>${t('quality')}</strong> ${escapeHtml(currentLanguage()==='en' ? facility.quality.note : t('qualityUnavailable'))}${facility.quality.url ? ` <a href="${facility.quality.url}" target="_blank" rel="noopener">${t('njReport')}</a>` : ''}</p>
    <div class="card-actions"><a class="primary link-button" href="${directions}" target="_blank" rel="noopener">${t('directions')}</a><a class="secondary link-button" href="tel:${facility.phone.replace(/\D/g, '')}">${t('call')}</a><a class="text-link" href="${facility.sourceUrl}" target="_blank" rel="noopener">${t('verifyDetails')}</a></div>
  </article>`;
}

async function renderResults() {
  const inputs = getInputs();
  let eligible = facilities.filter((facility) => {
    const groupEligible = inputs.patientGroup === 'adult'
      ? facility.patientGroups.includes('adult')
      : facility.patientGroups.includes('pediatric') && (facility.type !== 'emergency' || facility.pediatricSpecific);
    const ageEligible = inputs.patientGroup === 'adult' || !facility.age.verifiedLimits || (inputs.ageMonths >= facility.age.minMonths && inputs.ageMonths <= facility.age.maxMonths);
    const settingEligible = inputs.emergency ? facility.type === 'emergency' : true;
    const capabilityEligible = inputs.need === 'other' || facility.capabilities.includes(inputs.need);
    const stateEligible = !inputs.selectedState || facility.state === inputs.selectedState;
    return groupEligible && ageEligible && settingEligible && capabilityEligible && stateEligible;
  });
  const routed = await loadRoutes(eligible);
  if (routed) eligible = eligible.filter((facility) => (state.routes.get(facility.id)?.distanceMeters || Infinity) <= MAX_SEARCH_MILES * 1609.344);
  eligible = eligible.map((facility) => ({ ...facility, rankScore: scoreFacility(facility, inputs) }))
    .sort((a, b) => b.rankScore - a.rankScore || a.name.localeCompare(b.name));

  document.getElementById('resultsTitle').textContent = inputs.emergency ? t(inputs.patientGroup === 'adult' ? 'adultEDs' : 'pediatricEDs') : t('concernOptions');
  document.getElementById('emergencyBanner').hidden = !inputs.emergency;
  document.getElementById('demoBanner').hidden = !state.demoScenario;
  document.getElementById('journeySummary').innerHTML = journeySummary(inputs);
  document.getElementById('routingNote').textContent = routed
    ? t('routingReady')
    : state.location
      ? t('routingFailed')
      : t('routingOptional');
  const visible = state.showAllResults ? eligible : eligible.slice(0, 3);
  const resultControls = eligible.length > 3
    ? `<div class="result-controls"><p>${format('showingResults', { shown: visible.length, total: eligible.length })}</p><button class="secondary" id="toggleAllResults" type="button">${state.showAllResults ? t('showTopThree') : format('viewAllOptions', { n: eligible.length })}</button></div>`
    : '';
  document.getElementById('cards').innerHTML = eligible.length
    ? `${resultControls}${visible.map((facility, index) => facilityCard(facility, index, inputs)).join('')}`
    : `<div class="empty"><h3>${t('noMatchTitle')}</h3><p>${t('noMatchBody')}</p></div>`;
  document.getElementById('toggleAllResults')?.addEventListener('click', async () => {
    state.showAllResults = !state.showAllResults;
    await renderResults();
    document.getElementById('cards').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
