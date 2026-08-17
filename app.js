const facilities = window.CARE_ROUTE_FACILITIES;
const state = { step: 1, location: null, routes: new Map() };
const steps = [...document.querySelectorAll('.step')];
const titles = ['How old is your child?', 'What kind of concern?', 'Could this be an emergency?', 'Route from where you are?'];

function showStep(number) {
  state.step = number;
  steps.forEach((item) => item.classList.toggle('active', Number(item.dataset.step) === number));
  document.getElementById('form-title').textContent = titles[number - 1];
  document.getElementById('stepLabel').textContent = `Step ${number} of 4`;
  document.getElementById('progressBar').style.width = `${number * 25}%`;
}

document.querySelectorAll('.next').forEach((button) => button.addEventListener('click', () => {
  if (state.step === 1 && !document.getElementById('ageValue').reportValidity()) return;
  showStep(state.step + 1);
}));
document.querySelectorAll('.back').forEach((button) => button.addEventListener('click', () => showStep(state.step - 1)));

document.getElementById('locateMe').addEventListener('click', () => {
  const status = document.getElementById('locationStatus');
  if (!navigator.geolocation) {
    status.textContent = 'Location is not supported by this browser. You can still view verified options.';
    return;
  }
  status.textContent = 'Finding your location…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      state.location = { lat: coords.latitude, lon: coords.longitude };
      status.textContent = 'Location ready. Driving times will be requested when you continue.';
      status.classList.add('success');
    },
    () => { status.textContent = 'Location was not available. You can continue without it.'; },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
  );
});

document.getElementById('careForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  button.textContent = state.location ? 'Calculating routes…' : 'Loading options…';
  await renderResults();
  button.disabled = false;
  button.textContent = 'See care options';
});

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
  const points = [state.location, ...list.map((facility) => facility.coordinates)];
  const coordinates = points.map((point) => `${point.lon},${point.lat}`).join(';');
  try {
    const response = await fetch(`https://router.project-osrm.org/table/v1/driving/${coordinates}?sources=0&annotations=duration,distance`);
    if (!response.ok) throw new Error('Routing request failed');
    const data = await response.json();
    list.forEach((facility, index) => {
      const duration = data.durations?.[0]?.[index + 1];
      const distance = data.distances?.[0]?.[index + 1];
      if (Number.isFinite(duration)) state.routes.set(facility.id, { minutes: Math.max(1, Math.round(duration / 60)), miles: (distance / 1609.344).toFixed(1) });
    });
    return state.routes.size > 0;
  } catch (error) {
    console.warn('Live routing unavailable', error);
    return false;
  }
}

function scoreFacility(facility, inputs) {
  const route = state.routes.get(facility.id);
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
  const route = state.routes.get(facility.id);
  const open = isOpenNow(facility.hours);
  const status = open === true ? '<span class="open">Open now</span>' : open === false ? '<span class="closed">Closed now</span>' : '<span class="unknown">Hours: check live</span>';
  const routeText = route ? `<span class="metric strong">${route.minutes} min drive</span><span class="metric">${route.miles} mi by road</span>` : '<span class="metric">Driving time unavailable</span>';
  const ageText = facility.age.verifiedLimits ? '' : '<span class="metric warning">Age limit: verify</span>';
  const facts = facility.highlights.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(facility.address)}`;
  const reason = inputs.emergency
    ? 'Shown because the provider verifies a dedicated pediatric emergency service.'
    : facility.type === 'urgent-care'
      ? 'Non-emergency urgent-care match based on published age and service information.'
      : 'Hospital pediatric emergency backup; urgent care may be more appropriate for a non-emergency concern.';
  return `<article class="card ${index === 0 ? 'best' : ''}">
    <div class="card-top"><div><div class="rank">${route ? (index === 0 ? 'Closest strong match' : `Option ${index + 1}`) : `Verified option ${index + 1}`}</div><h3>${escapeHtml(facility.name)}</h3><p class="facility-type">${escapeHtml(facility.typeLabel)} · ${escapeHtml(facility.city)}</p></div>${status}</div>
    <div class="metrics">${routeText}${ageText}<span class="metric">Wait: not available</span><span class="metric">Insurance: verify</span></div>
    <p class="reason">${reason}</p>
    <ul class="facts">${facts}</ul>
    <p class="hours"><strong>Published hours:</strong> ${escapeHtml(facility.hours.label)}</p>
    <p class="quality"><strong>Quality:</strong> ${escapeHtml(facility.quality.note)}${facility.quality.url ? ` <a href="${facility.quality.url}" target="_blank" rel="noopener">NJ report</a>` : ''}</p>
    <div class="card-actions"><a class="primary link-button" href="${directions}" target="_blank" rel="noopener">Directions</a><a class="secondary link-button" href="tel:${facility.phone.replace(/\D/g, '')}">Call</a><a class="text-link" href="${facility.sourceUrl}" target="_blank" rel="noopener">Verify details ↗</a></div>
  </article>`;
}

async function renderResults() {
  const inputs = getInputs();
  let eligible = facilities.filter((facility) => {
    const ageEligible = !facility.age.verifiedLimits || (inputs.ageMonths >= facility.age.minMonths && inputs.ageMonths <= facility.age.maxMonths);
    const settingEligible = !inputs.emergency || facility.type === 'emergency';
    const capabilityEligible = inputs.need === 'other' || facility.capabilities.includes(inputs.need);
    return ageEligible && settingEligible && capabilityEligible;
  });
  const routed = await loadRoutes(eligible);
  eligible = eligible.map((facility) => ({ ...facility, rankScore: scoreFacility(facility, inputs) }))
    .sort((a, b) => b.rankScore - a.rankScore || a.name.localeCompare(b.name));

  document.getElementById('resultsTitle').textContent = inputs.emergency ? 'Pediatric emergency departments' : 'Care options for this concern';
  document.getElementById('emergencyBanner').hidden = !inputs.emergency;
  document.getElementById('routingNote').textContent = routed
    ? 'Driving estimates are live OSRM road-network calculations. Traffic, closures, and emergency response conditions are not included.'
    : state.location
      ? 'Live routing is temporarily unavailable. Facility facts are still shown; use Directions for current navigation.'
      : 'Share your location on a new search to add road-network driving estimates. No wait times are estimated.';
  document.getElementById('cards').innerHTML = eligible.length
    ? eligible.map((facility, index) => facilityCard(facility, index, inputs)).join('')
    : '<div class="empty"><h3>No verified match in this pilot dataset</h3><p>This does not mean care is unavailable. Call your pediatrician, insurer, or a facility directly. If symptoms could be an emergency, call 911 or go to an emergency department.</p></div>';
  document.getElementById('questionnaire').hidden = true;
  document.getElementById('results').hidden = false;
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
