# CareRoute v0.6 Access

CareRoute is a production-oriented, mobile-first foundation for national care navigation for adults and children. The patient-facing verified pilot currently covers the Northeast corridor; the data-operations layer seeds a nationwide evidence review queue.

## What is real

- Twelve verified adult and/or pediatric emergency, urgent-care, or community health-center locations
- Complete patient-facing navigation in English, Spanish, Portuguese, and Haitian Creole, including questionnaire screens, live status messages, results, access badges, explanations, and translated summaries of provider-sourced details; professional translation review remains required before a clinical release
- Optional uninsured, low-cost, and language-support needs without weakening emergency safety gates
- Verified FQHC access labels for insurance-free entry, income-based sliding fees, and no-denial-for-lack-of-funds policies
- Provider-sourced identity, address, phone, care setting, adult/child population, services, and published hours
- Browser geolocation, with location kept in memory only
- Sourced road-network distance, drive duration, and estimated arrival time, including explicit provider, timestamp, and traffic-awareness status
- Conservative emergency gating: adult emergency searches show verified adult EDs; child searches require pediatric-specific emergency capability
- Direct provider-source, calling, and navigation links

No wait time, insurance acceptance, price, clinical recommendation, or invented quality score is displayed. Dynamic or unavailable fields are labeled as such. New Jersey hospital-quality reporting is linked where applicable but is not transformed into a pediatric emergency-care rating.

## Platform foundation

`data/v1/facilities.json` is the canonical, versioned dataset. Every facility includes structured identity, location, age limits, capabilities, hours, explicit unavailable/live-only fields, verification status, review deadlines, and claim-level evidence. `data/facilities.js` is generated from that source for GitHub Pages and must not be edited by hand.

The production contract now also includes:

- `db/migrations/001_initial.sql`: normalized PostgreSQL schema for facilities, locations, capabilities, hours, evidence, and revision history
- `api/openapi.yaml`: initial read-only mobile/web API contract
- `docs/routing.md`: staged routing design from the OSRM pilot to server-side traffic-aware production routing
- `server/`: validated Google traffic-aware routing gateway with an explicitly labeled OSRM fallback
- `service-worker.js` and `manifest.webmanifest`: installable/offline-safe PWA shell
- `capacitor.config.json` and `docs/native-app.md`: native iOS/Android packaging path
- `scripts/validate-data.mjs`: release-blocking data and safety validation
- `scripts/build-web-data.mjs`: deterministic canonical-data-to-web adapter
- `scripts/import-cms-hospitals.mjs`: converts the official CMS Hospital General Information CSV into non-publishable review candidates; CMS records never establish pediatric capability by themselves
- `scripts/reconcile-national.mjs`: reconciles the national emergency-hospital inventory and produces jurisdiction-level coverage reporting
- `tests/data-validation.test.mjs`: automated checks against invented waits, insurance claims, quality scores, stale records, and unsafe emergency records

### Development checks

Use Node.js 20 or newer:

```sh
npm run validate:data
npm run build:data
npm test
```

Any future facility expansion should update the canonical JSON (or, once deployed, the PostgreSQL/API layer), attach evidence, pass review, and regenerate the web artifact. The validator intentionally fails releases containing stale verification, unsupported capabilities, missing evidence, invented wait times, unverified insurance plans, or unapproved comparative quality scores.

To seed a state review queue from the official CMS download:

```sh
npm run import:cms -- HOSPITAL_GENERAL_INFORMATION.csv work/nj-candidates.json NJ
```

The resulting candidates are deliberately marked `publishable: false`. A reviewer must verify hours, adult/child population, coordinates, and location-level service evidence before promotion into the patient dataset.

The national queue is available at `review.html`. The current CMS seed contains 4,495 hospitals reporting emergency services across 56 states, districts, and territories. Seven match verified CareRoute emergency records; all others remain non-publishable until their location-level service details are verified from authoritative sources. This operational view is explicitly not a patient directory.

Data reviewed: August 17, 2026.

### Primary facility sources

- [Cooperman Barnabas Pediatric Emergency Services](https://www.rwjbh.org/cooperman-barnabas-medical-center/treatment-care/emergency-department/pediatric-emergency-services/)
- [Newark Beth Israel Emergency Services](https://www.rwjbh.org/newark-beth-israel-medical-center/treatment-care/emergency-room-services/)
- [University Hospital Pediatric Emergency Medicine](https://www.uhnj.org/services/emergency-medicine/pediatric-emergency-medicine/)
- [Clara Maass Pediatric Services](https://www.rwjbh.org/clara-maass-medical-center/treatment-care/pediatrics/) and [Emergency Services](https://www.rwjbh.org/clara-maass-medical-center/treatment-care/emergency-room-services/)
- [Children’s Hospital of Philadelphia Emergency Department](https://www.chop.edu/locations/emergency-department-main-hospital)
- [NewYork-Presbyterian Pediatric Emergency Care and Trauma](https://www.nyp.org/pediatrics/emergency-care-and-trauma)
- [PM Pediatric Livingston](https://pmpediatriccare.com/location/new-jersey-livingston/)
- [AFC West Orange Pediatric Care](https://www.afcurgentcare.com/west-orange/patient-services/pediatric-care/) and [hours/contact](https://www.afcurgentcare.com/west-orange/resources/contact-us/)
- [Summit Health Livingston Urgent Care](https://www.summithealth.com/locations/livingston-summit-health-urgent-care)
- [NJ Department of Health Hospital Performance Report](https://web.doh.nj.gov/apps2/hpr/hospitals.aspx)
- Coordinates: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)

## Run locally

Serve the directory over HTTP so browser geolocation and routing behave normally:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Production path

The traffic gateway uses `ROUTING_PROVIDER=google`, a server-only `GOOGLE_ROUTES_API_KEY`, and `CAREROUTE_ALLOWED_ORIGIN` for the web origin. The client should be switched from OSRM to the CareRoute API only after that gateway has TLS, monitoring, quotas, budget alerts, and a stable domain. Raw origins are not logged or persisted by the included server.

The GitHub Pages version is a useful pilot, not a complete clinical product. A production release needs a governed database and update workflow, commercial routing with traffic/SLA, authenticated provider and insurer feeds, monitoring, analytics with consent, privacy/security review, accessibility and clinical safety validation, legal/regulatory review, and operational ownership. Native iOS/Android can share the dataset/API and scoring contract, then add native location, maps, notifications, secure storage, and app-store distribution.
