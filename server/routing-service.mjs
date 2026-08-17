const DEFAULT_TIMEOUT_MS = 5000;

function validCoordinate(point) {
  return point && Number.isFinite(point.lat) && Math.abs(point.lat) <= 90 && Number.isFinite(point.lon) && Math.abs(point.lon) <= 180;
}

export function validateMatrixRequest(body) {
  if (!validCoordinate(body?.origin)) throw new TypeError('A valid origin is required.');
  if (!Array.isArray(body?.destinations) || body.destinations.length < 1 || body.destinations.length > 25) {
    throw new TypeError('Provide between 1 and 25 destinations.');
  }
  if (body.destinations.some((item) => !item.id || !validCoordinate(item))) throw new TypeError('Every destination needs an id and valid coordinates.');
}

function durationSeconds(value) {
  return Number(String(value || '').replace(/s$/, ''));
}

export async function googleRouteMatrix({ origin, destinations, apiKey, fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!apiKey) throw new Error('Google Routes API key is not configured.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
      method: 'POST', signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'destinationIndex,duration,staticDuration,distanceMeters,status,condition'
      },
      body: JSON.stringify({
        origins: [{ waypoint: { location: { latLng: { latitude: origin.lat, longitude: origin.lon } } } }],
        destinations: destinations.map(({ lat, lon }) => ({ waypoint: { location: { latLng: { latitude: lat, longitude: lon } } } })),
        travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE'
      })
    });
    if (!response.ok) throw new Error(`Google Routes returned ${response.status}.`);
    const rows = await response.json();
    const calculatedAt = new Date().toISOString();
    return rows.filter((row) => row.condition === 'ROUTE_EXISTS' && !row.status)
      .map((row) => ({
        facilityId: destinations[row.destinationIndex].id,
        durationSeconds: durationSeconds(row.duration),
        staticDurationSeconds: durationSeconds(row.staticDuration),
        distanceMeters: row.distanceMeters,
        provider: 'Google Routes', trafficAware: true, calculatedAt
      }));
  } finally { clearTimeout(timer); }
}

export async function osrmRouteMatrix({ origin, destinations, endpoint = 'https://router.project-osrm.org', fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const coordinates = [origin, ...destinations].map(({ lon, lat }) => `${lon},${lat}`).join(';');
  const destinationIndexes = destinations.map((_, index) => index + 1).join(';');
  const url = `${endpoint}/table/v1/driving/${coordinates}?sources=0&destinations=${destinationIndexes}&annotations=duration,distance`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`OSRM returned ${response.status}.`);
    const payload = await response.json();
    const calculatedAt = new Date().toISOString();
    return destinations.flatMap((destination, index) => Number.isFinite(payload.durations?.[0]?.[index]) ? [{
      facilityId: destination.id,
      durationSeconds: payload.durations[0][index], staticDurationSeconds: payload.durations[0][index],
      distanceMeters: payload.distances[0][index], provider: 'OpenStreetMap / OSRM', trafficAware: false, calculatedAt
    }] : []);
  } finally { clearTimeout(timer); }
}

export async function routeMatrix(body, options = {}) {
  validateMatrixRequest(body);
  const primary = options.primary || (options.googleApiKey ? 'google' : 'osrm');
  if (primary === 'google') {
    try { return { routes: await googleRouteMatrix({ ...body, apiKey: options.googleApiKey, fetchImpl: options.fetchImpl, timeoutMs: options.timeoutMs }), fallbackUsed: false }; }
    catch (error) {
      if (options.allowFallback === false) throw error;
      return { routes: await osrmRouteMatrix({ ...body, endpoint: options.osrmEndpoint, fetchImpl: options.fetchImpl, timeoutMs: options.timeoutMs }), fallbackUsed: true };
    }
  }
  return { routes: await osrmRouteMatrix({ ...body, endpoint: options.osrmEndpoint, fetchImpl: options.fetchImpl, timeoutMs: options.timeoutMs }), fallbackUsed: false };
}
