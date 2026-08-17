import { RoutingService, presentRoute } from './routing.js';

const facilities = window.CARE_ROUTE_FACILITIES;
const routingService = new RoutingService(window.CARE_ROUTE_CONFIG?.routing);
const state = { step: 1, location: null, routes: new Map() };
const MAX_SEARCH_MILES = 100;
let installPrompt = null;
const steps = [...document.querySelectorAll('.step')];
const titles = ['Who needs care?', 'What kind of concern?', 'Could this be an emergency?', 'Route from where you are?'];

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
  document.getElementById('form-title').textContent = titles[number - 1];
  document.getElementById('stepLabel').textContent = `Step ${number} of 4`;
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

document.getElementById('locateMe').addEventListener('click', () => {
  const status = document.getElementById('locationStatus');
  const locateButton = document.getElementById('locateMe');
  const submitButton = document.getElementById('showCareOptions');
  if (!navigator.geolocation) {
    status.textContent = 'Location is not supported by this browser. You can still view verified options.';
    return;
  }
  locateButton.disabled = true;
  status.textContent = 'Finding your location…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      state.location = { lat: coords.latitude, lon: coords.longitude };
      status.textContent = 'Location ready. Calculating nearby care options…';
      status.classList.add('success');
      locateButton.disabled = false;
      showCareOptions(submitButton);
    },
    (error) => {
      locateButton.disabled = false;
      status.classList.remove('success');
      status.textContent = error.code === error.PERMISSION_DENIED
        ? 'Location access is blocked. Allow it in your browser settings, or tap “See care options” to continue without location.'
        : error.code === error.TIMEOUT
          ? 'Location timed out. Try again, or tap “See care options” to continue without location.'
          : 'Location was not available. Tap “See care options” to continue without it.';
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
  );
});

document.getElementById('showCareOptions').addEventListener('click', (event) => showCareOptions(event.currentTarget));
document.getElementById('careForm').addEventListener('submit', (event) => event.preventDefault());

async function showCareOptions(button) {
  button.disabled = true;
  button.textContent = state.location ? 'Calculating routes…' : 'Loading options…';
  document.getElementById('questionnaire').hidden = true;
  document.getElementById('results').hidden = false;
  document.getElementById('resultsTitle').textContent = 'Finding care options…';
  document.getElementById('routingNote').textContent = state.location ? 'Calculating nearby driving routes…' : 'Loading verified facilities…';
  document.getElementById('cards').innerHTML = '<div class="empty"><p>Finding verified care options…</p></div>';
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    await renderResults();
  } catch (error) {
    console.error('Unable to render care options', error);
    document.getElementById('resultsTitle').textContent = 'Care options could not load';
    document.getElementById('routingNote').textContent = 'Please try again. If care may be an emergency, call 911 or go to the nearest emergency department.';
    document.getElementById('cards').innerHTML = '<div class="empty"><p>The care directory encountered an error. You can start over and continue without location, or use the Directions link from your preferred map app.</p></div>';
  } finally {
    button.disabled = false;
    button.textContent = 'See care options';
  }
}

document.getElementById('startOver').addEventListener('click', () => {
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
    ageMonths: unit === 'months' ? value : value * 12,
    need: document.querySelector('[name=need]:checked').value,
    emergency: document.querySelector('[name=emergency]:checked').value === 'yes'
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
  const settingFit = inputs.emergency ? 50 : (facility.type === 'urgent-care' ? 45 : 20);
  const capability = facility.capabilities.includes(inputs.need) ? 20 : 0;
  const travel = route ? Math.max(0, 30 - route.minutes * 0.75) : 0;
  return settingFit + specialization + capability + travel;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function facilityCard(facility, index, inputs) {
  const route = state.routes.has(facility.id) ? presentRoute(state.routes.get(facility.id)) : null;
  const open = isOpenNow(facility.hours);
  const status = open === true ? '<span class="open">Open now</span>' : open === false ? '<span class="closed">Closed now</span>' : '<span class="unknown">Hours: check live</span>';
  const routeText = route ? `<span class="metric strong">${route.minutes} min drive</span><span class="metric">${route.miles} mi by road</span><span class="metric">Arrive about ${route.arrivalLabel}</span>` : '<span class="metric">Driving time unavailable</span>';
  const ageText = facility.age.verifiedLimits ? '' : '<span class="metric warning">Age limit: verify</span>';
  const facts = facility.highlights.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(facility.address)}`;
  const reason = inputs.emergency
    ? inputs.patientGroup === 'adult'
      ? 'Shown because the provider verifies a 24-hour emergency department serving adults.'
      : 'Shown because the provider verifies dedicated pediatric emergency capability.'
    : facility.type === 'urgent-care'
      ? 'Non-emergency urgent-care match based on published age and service information.'
      : 'Hospital emergency backup; urgent care may be more appropriate for a non-emergency concern.';
  return `<article class="card ${index === 0 ? 'best' : ''}">
    <div class="card-top"><div><div class="rank">${route ? (index === 0 ? 'Closest strong match' : `Option ${index + 1}`) : `Verified option ${index + 1}`}</div><h3>${escapeHtml(facility.name)}</h3><p class="facility-type">${escapeHtml(facility.typeLabel)} · ${escapeHtml(facility.city)}</p></div>${status}</div>
    <div class="metrics">${routeText}${ageText}<span class="metric">Wait: not available</span><span class="metric">Insurance: verify</span></div>
    <p class="reason">${reason}</p>
    <ul class="facts">${facts}</ul>
    <p class="hours"><strong>Published hours:</strong> ${escapeHtml(facility.hours.label)}</p>
    ${route ? `<p class="route-source"><strong>Route source:</strong> ${escapeHtml(route.provider)} · ${route.trafficAware ? 'Current traffic included' : 'Current traffic not included'} · calculated ${new Date(route.calculatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>` : ''}
    <p class="quality"><strong>Quality:</strong> ${escapeHtml(facility.quality.note)}${facility.quality.url ? ` <a href="${facility.quality.url}" target="_blank" rel="noopener">NJ report</a>` : ''}</p>
    <div class="card-actions"><a class="primary link-button" href="${directions}" target="_blank" rel="noopener">Directions</a><a class="secondary link-button" href="tel:${facility.phone.replace(/\D/g, '')}">Call</a><a class="text-link" href="${facility.sourceUrl}" target="_blank" rel="noopener">Verify details ↗</a></div>
  </article>`;
}

async function renderResults() {
  const inputs = getInputs();
  let eligible = facilities.filter((facility) => {
    const groupEligible = inputs.patientGroup === 'adult'
      ? facility.patientGroups.includes('adult')
      : facility.patientGroups.includes('pediatric') && (facility.type !== 'emergency' || facility.pediatricSpecific);
    const ageEligible = inputs.patientGroup === 'adult' || !facility.age.verifiedLimits || (inputs.ageMonths >= facility.age.minMonths && inputs.ageMonths <= facility.age.maxMonths);
    const settingEligible = !inputs.emergency || facility.type === 'emergency';
    const capabilityEligible = inputs.need === 'other' || facility.capabilities.includes(inputs.need);
    const geographyEligible = state.location || facility.state === 'NJ';
    return groupEligible && ageEligible && settingEligible && capabilityEligible && geographyEligible;
  });
  const routed = await loadRoutes(eligible);
  if (routed) eligible = eligible.filter((facility) => (state.routes.get(facility.id)?.distanceMeters || Infinity) <= MAX_SEARCH_MILES * 1609.344);
  eligible = eligible.map((facility) => ({ ...facility, rankScore: scoreFacility(facility, inputs) }))
    .sort((a, b) => b.rankScore - a.rankScore || a.name.localeCompare(b.name));

  document.getElementById('resultsTitle').textContent = inputs.emergency ? `${inputs.patientGroup === 'adult' ? 'Adult' : 'Pediatric'} emergency departments` : 'Care options for this concern';
  document.getElementById('emergencyBanner').hidden = !inputs.emergency;
  document.getElementById('routingNote').textContent = routed
    ? 'Driving distance, duration, and estimated arrival are current road-network calculations. Each card states whether live traffic is included.'
    : state.location
      ? 'Live routing is temporarily unavailable. Facility facts are still shown; use Directions for current navigation.'
      : 'Share your location on a new search to add road-network driving estimates. No wait times are estimated.';
  document.getElementById('cards').innerHTML = eligible.length
    ? eligible.map((facility, index) => facilityCard(facility, index, inputs)).join('')
    : '<div class="empty"><h3>No verified match in this pilot dataset</h3><p>This does not mean care is unavailable. Call your clinician, insurer, or a facility directly. If symptoms could be an emergency, call 911 or go to an emergency department.</p></div>';
}
