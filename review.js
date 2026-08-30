const reviewData = window.CARE_ROUTE_REVIEW_QUEUE;
const evidenceNetwork = window.CARE_ROUTE_EVIDENCE_NETWORK;
const queueElement = document.getElementById('reviewQueue');
const searchElement = document.getElementById('reviewSearch');
const filterElement = document.getElementById('reviewFilter');
const stateElement = document.getElementById('stateFilter');

if (evidenceNetwork) {
  const indexed = evidenceNetwork.tiers.officiallyIndexed;
  document.getElementById('evidenceSummary').innerHTML = [
    ['Official records indexed', indexed.total],
    ['CMS hospital candidates', indexed.hospitalCandidates],
    ['HRSA health-center candidates', indexed.affordableHealthCenterCandidates],
    ['Decision-ready locations', evidenceNetwork.tiers.decisionReady.total]
  ].map(([label, value], index) => `<article${index === 3 ? ' class="ready"' : ''}><strong>${Number(value).toLocaleString()}</strong><span>${label}</span></article>`).join('');
  document.getElementById('evidenceTiers').innerHTML = [
    ['01', 'Officially indexed', `${indexed.total.toLocaleString()} identities from free federal datasets`, false],
    ['02', 'Evidence enriched', `${evidenceNetwork.tiers.evidenceEnriched.total.toLocaleString()} records with added operating or verification evidence`, false],
    ['03', 'Decision-ready', `${evidenceNetwork.tiers.decisionReady.total.toLocaleString()} records that passed release-blocking checks`, true]
  ].map(([number, title, body, visible]) => `<article><span>${number}</span><div><strong>${title}</strong><p>${body}</p></div><em>${visible ? 'Patient visible' : 'Not patient visible'}</em></article>`).join('');
}

document.getElementById('summary').innerHTML = [
  ['Emergency-service hospitals', reviewData.summary.total],
  ['Jurisdictions', reviewData.summary.jurisdictions],
  ['Already verified', reviewData.summary.matchedVerified],
  ['Pending service review', reviewData.summary.pendingReview]
].map(([label, value]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join('');
document.getElementById('reviewGenerated').textContent = `Queue generated ${new Date(reviewData.generatedAt).toLocaleDateString()}`;
stateElement.insertAdjacentHTML('beforeend', reviewData.summary.states.map(({ state, total }) => `<option value="${state}">${state} (${total})</option>`).join(''));

function renderQueue() {
  const query = searchElement.value.trim().toLowerCase();
  const filter = filterElement.value;
  const state = stateElement.value;
  const candidates = reviewData.candidates.filter((candidate) => {
    const pending = candidate.reconciliation.status === 'unmatched';
    const filterMatch = filter === 'all' || (filter === 'pending' && pending) || (filter === 'matched' && !pending);
    const stateMatch = state === 'all' || candidate.location.state === state;
    const haystack = [candidate.identity.name, candidate.location.city, candidate.location.county, candidate.cmsCertificationNumber].join(' ').toLowerCase();
    return filterMatch && stateMatch && (!query || haystack.includes(query));
  });
  const visible = candidates.slice(0, 100);
  document.getElementById('queueCount').textContent = candidates.length > visible.length
    ? `${candidates.length} matches · showing the first ${visible.length}; select a jurisdiction or search to narrow the queue`
    : `${candidates.length} records shown`;
  queueElement.innerHTML = visible.map(card).join('') || '<div class="empty"><h3>No matching records</h3><p>Adjust the search or queue filter.</p></div>';
}

function card(candidate) {
  const matched = candidate.reconciliation.status === 'matched-verified';
  const decisionStatus = candidate.reviewDecision?.status;
  const status = matched ? '<span class="review-status verified">Matched verified record</span>'
    : decisionStatus === 'not-verified' ? '<span class="review-status pending">Held—not verified</span>'
      : decisionStatus === 'out-of-scope' ? '<span class="review-status pending">Out of scope</span>'
        : '<span class="review-status pending">Service review pending</span>';
  const rating = candidate.cmsOverallHospitalRating ? `CMS overall hospital rating: ${escapeHtml(candidate.cmsOverallHospitalRating)}` : 'CMS overall hospital rating: unavailable';
  const sourceSearch = `https://www.google.com/search?q=${encodeURIComponent(`${candidate.identity.name} pediatric emergency department official`)}`;
  return `<article class="review-card">
    <div class="review-card-head"><div><span class="ccn">CMS ${escapeHtml(candidate.cmsCertificationNumber)}</span><h2>${escapeHtml(candidate.identity.name)}</h2><p>${escapeHtml(candidate.location.city)}, ${escapeHtml(candidate.location.state)} · ${escapeHtml(candidate.location.county)} County</p></div>${status}</div>
    <div class="review-facts"><span>CMS reports emergency services</span><span>${escapeHtml(candidate.identity.hospitalType)}</span><span>${rating}</span></div>
    <p class="review-address">${escapeHtml(candidate.location.address1)}, ${escapeHtml(candidate.location.city)}, ${escapeHtml(candidate.location.state)} ${escapeHtml(candidate.location.postalCode)} · ${formatPhone(candidate.phone)}</p>
    ${matched ? `<p class="matched-note">Linked to CareRoute record <code>${escapeHtml(candidate.reconciliation.facilityId)}</code> by ${escapeHtml(candidate.reconciliation.method)}.</p>` : candidate.reviewDecision ? `<p class="pending-note"><strong>${escapeHtml(candidate.reviewDecision.status)}:</strong> ${escapeHtml(candidate.reviewDecision.reason)}</p>` : '<p class="pending-note"><strong>Unknown:</strong> verified hours, adult/child population, coordinates, and location-level services.</p>'}
    <div class="review-actions"><a href="${sourceSearch}" target="_blank" rel="noopener">Find authoritative pediatric source ↗</a><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${candidate.identity.name} ${candidate.location.city} ${candidate.location.state}`)}" target="_blank" rel="noopener">Check location ↗</a></div>
  </article>`;
}

function formatPhone(value) { return value?.replace(/^(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3') || 'Phone unavailable'; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }

searchElement.addEventListener('input', renderQueue);
filterElement.addEventListener('change', renderQueue);
stateElement.addEventListener('change', renderQueue);
renderQueue();
