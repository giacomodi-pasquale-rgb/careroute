const reviewData = window.CARE_ROUTE_REVIEW_QUEUE;
const queueElement = document.getElementById('reviewQueue');
const searchElement = document.getElementById('reviewSearch');
const filterElement = document.getElementById('reviewFilter');

document.getElementById('summary').innerHTML = [
  ['NJ emergency hospitals', reviewData.summary.total],
  ['Already verified', reviewData.summary.matchedVerified],
  ['Essex awaiting review', reviewData.summary.pendingEssex],
  ['Other NJ awaiting review', reviewData.summary.pendingOtherNewJersey]
].map(([label, value]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join('');
document.getElementById('reviewGenerated').textContent = `Queue generated ${new Date(reviewData.generatedAt).toLocaleDateString()}`;

function renderQueue() {
  const query = searchElement.value.trim().toLowerCase();
  const filter = filterElement.value;
  const candidates = reviewData.candidates.filter((candidate) => {
    const pending = candidate.reconciliation.status === 'unmatched';
    const filterMatch = filter === 'all' || (filter === 'essex' && candidate.reviewPriority === 1) || (filter === 'pending' && pending) || (filter === 'matched' && !pending);
    const haystack = [candidate.identity.name, candidate.location.city, candidate.location.county, candidate.cmsCertificationNumber].join(' ').toLowerCase();
    return filterMatch && (!query || haystack.includes(query));
  });
  document.getElementById('queueCount').textContent = `${candidates.length} of ${reviewData.summary.total} records shown`;
  queueElement.innerHTML = candidates.map(card).join('') || '<div class="empty"><h3>No matching records</h3><p>Adjust the search or queue filter.</p></div>';
}

function card(candidate) {
  const matched = candidate.reconciliation.status === 'matched-verified';
  const status = matched ? '<span class="review-status verified">Matched verified record</span>' : candidate.reviewPriority === 1 ? '<span class="review-status priority">Essex priority review</span>' : '<span class="review-status pending">Pediatric review pending</span>';
  const rating = candidate.cmsOverallHospitalRating ? `CMS overall hospital rating: ${escapeHtml(candidate.cmsOverallHospitalRating)}` : 'CMS overall hospital rating: unavailable';
  const sourceSearch = `https://www.google.com/search?q=${encodeURIComponent(`${candidate.identity.name} pediatric emergency department official`)}`;
  return `<article class="review-card">
    <div class="review-card-head"><div><span class="ccn">CMS ${escapeHtml(candidate.cmsCertificationNumber)}</span><h2>${escapeHtml(candidate.identity.name)}</h2><p>${escapeHtml(candidate.location.city)}, ${escapeHtml(candidate.location.state)} · ${escapeHtml(candidate.location.county)} County</p></div>${status}</div>
    <div class="review-facts"><span>CMS reports emergency services</span><span>${escapeHtml(candidate.identity.hospitalType)}</span><span>${rating}</span></div>
    <p class="review-address">${escapeHtml(candidate.location.address1)}, ${escapeHtml(candidate.location.city)}, ${escapeHtml(candidate.location.state)} ${escapeHtml(candidate.location.postalCode)} · ${formatPhone(candidate.phone)}</p>
    ${matched ? `<p class="matched-note">Linked to CareRoute record <code>${escapeHtml(candidate.reconciliation.facilityId)}</code> by ${escapeHtml(candidate.reconciliation.method)}.</p>` : '<p class="pending-note"><strong>Unknown:</strong> pediatric capability, pediatric hours, age limits, and relevant pediatric services.</p>'}
    <div class="review-actions"><a href="${sourceSearch}" target="_blank" rel="noopener">Find authoritative pediatric source ↗</a><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${candidate.identity.name} ${candidate.location.city} NJ`)}" target="_blank" rel="noopener">Check location ↗</a></div>
  </article>`;
}

function formatPhone(value) { return value?.replace(/^(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3') || 'Phone unavailable'; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }

searchElement.addEventListener('input', renderQueue);
filterElement.addEventListener('change', renderQueue);
renderQueue();
