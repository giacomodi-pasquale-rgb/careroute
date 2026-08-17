import test from 'node:test';
import assert from 'node:assert/strict';
import { googleRouteMatrix, routeMatrix, validateMatrixRequest } from '../server/routing-service.mjs';

const request = { origin: { lat: 40.8, lon: -74.25 }, destinations: [{ id: 'hospital', lat: 40.76, lon: -74.3 }] };

test('matrix input rejects invalid coordinates and oversized destination sets', () => {
  assert.throws(() => validateMatrixRequest({ origin: { lat: 999, lon: 0 }, destinations: [] }));
  assert.throws(() => validateMatrixRequest({ ...request, destinations: Array(26).fill(request.destinations[0]) }));
});

test('Google adapter requests traffic-aware routes and returns provenance', async () => {
  let sent;
  const routes = await googleRouteMatrix({ ...request, apiKey: 'test', fetchImpl: async (_url, options) => {
    sent = JSON.parse(options.body);
    return { ok: true, json: async () => [{ destinationIndex: 0, duration: '840s', staticDuration: '720s', distanceMeters: 10200, condition: 'ROUTE_EXISTS' }] };
  }});
  assert.equal(sent.routingPreference, 'TRAFFIC_AWARE');
  assert.deepEqual(routes[0], { facilityId: 'hospital', durationSeconds: 840, staticDurationSeconds: 720, distanceMeters: 10200, provider: 'Google Routes', trafficAware: true, calculatedAt: routes[0].calculatedAt });
});

test('gateway falls back to traffic-unaware OSRM without hiding that fact', async () => {
  let calls = 0;
  const result = await routeMatrix(request, { primary: 'google', googleApiKey: 'test', fetchImpl: async () => {
    calls += 1;
    if (calls === 1) return { ok: false, status: 503 };
    return { ok: true, json: async () => ({ durations: [[600]], distances: [[8000]] }) };
  }});
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.routes[0].trafficAware, false);
  assert.equal(result.routes[0].provider, 'OpenStreetMap / OSRM');
});
