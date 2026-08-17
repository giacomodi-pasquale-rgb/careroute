import { createServer } from 'node:http';
import { routeMatrix } from './routing-service.mjs';

const port = Number(process.env.PORT || 8787);
const allowedOrigin = process.env.CAREROUTE_ALLOWED_ORIGIN || 'https://giacomodi-pasquale-rgb.github.io';

createServer(async (request, response) => {
  const cors = { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'content-type', 'Content-Type': 'application/json' };
  if (request.method === 'OPTIONS') { response.writeHead(204, cors); return response.end(); }
  if (request.method !== 'POST' || request.url !== '/v1/routes/matrix') { response.writeHead(404, cors); return response.end(JSON.stringify({ error: 'Not found' })); }
  try {
    let raw = '';
    for await (const chunk of request) {
      raw += chunk;
      if (raw.length > 50_000) throw new TypeError('Request is too large.');
    }
    const result = await routeMatrix(JSON.parse(raw), {
      primary: process.env.ROUTING_PROVIDER,
      googleApiKey: process.env.GOOGLE_ROUTES_API_KEY,
      osrmEndpoint: process.env.OSRM_ENDPOINT,
      allowFallback: process.env.ROUTING_ALLOW_FALLBACK !== 'false'
    });
    response.writeHead(200, { ...cors, 'Cache-Control': 'private, max-age=30' });
    response.end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof TypeError || error instanceof SyntaxError ? 400 : 502;
    response.writeHead(status, cors);
    response.end(JSON.stringify({ error: status === 400 ? error.message : 'Routing is temporarily unavailable.' }));
  }
}).listen(port, () => console.log(`CareRoute routing API listening on ${port}`));
