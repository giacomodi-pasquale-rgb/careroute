# Routing and travel-information strategy

## Fields CareRoute displays

Every successful route result carries:

- road distance in meters (displayed as miles)
- estimated drive duration in seconds
- traffic-free/static duration when the provider supplies it
- estimated arrival time calculated on the device
- provider name
- whether current traffic was included
- calculation timestamp

The app never labels a duration as traffic-aware unless the provider response explicitly says so. Routing failures leave travel fields unavailable and preserve facility results.

## Provider stages

### Public pilot: OSRM

The GitHub Pages pilot calls the public OSRM table service. It supplies real road-network distance and duration but no current traffic, uptime guarantee, or production SLA. Cards say that current traffic is not included.

### Production: server-side traffic provider

The mobile and production web clients will call CareRoute's `/v1/routes/matrix` endpoint. The server will call a commercial provider so credentials, quotas, caching, failover, and spend controls remain off-device.

Recommended primary provider: Google Routes `ComputeRouteMatrix` with `TRAFFIC_AWARE` for normal ranking and `TRAFFIC_AWARE_OPTIMAL` for a final selected route. It can provide traffic-aware duration, static duration, and distance. Mapbox `driving-traffic` Matrix is a viable alternative. Apple Maps directions/ETA should be evaluated for the native iOS presentation layer, but using one server-side matrix provider keeps cross-platform rankings consistent.

The repository now includes this gateway in `server/`. It validates coordinates and destination limits, keeps credentials off-device, requests Google traffic-aware matrices, and fails over to OSRM while preserving an explicit `trafficAware: false` label. Point the client at a deployed gateway only after TLS, monitoring, budgets, and origin restrictions are configured.

## Reliability requirements

- 30–60 second cache for identical rounded origins and destination sets
- per-provider timeout and circuit breaker
- traffic-aware primary provider with traffic-unaware fallback
- results stamped with provider and calculation time
- monitoring for latency, errors, quota, and cost
- no route estimate treated as emergency-response time
- direct deep link to Apple Maps or Google Maps for turn-by-turn navigation
- origin coordinates kept ephemeral unless the user separately consents to storage

## Still unavailable without partnerships

Drive time does not include facility queue time. “Time to care” must not be displayed until a facility supplies a reliable live wait/capacity feed with a timestamp and defined semantics. Insurance status likewise requires payer or provider eligibility data and remains “verify” in the pilot.
