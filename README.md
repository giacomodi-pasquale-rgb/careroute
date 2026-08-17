# CareRoute Pediatric v0.2

CareRoute is a production-oriented, mobile-first web foundation for comparing pediatric care settings in the Essex County, New Jersey pilot area (West Orange, Livingston, Montclair, and Newark).

## What is real

- Six real pediatric emergency or pediatric-capable urgent-care locations
- Provider-sourced identity, address, phone, care setting, pediatric capability, services, and published hours
- Browser geolocation, with location kept in memory only
- Road-network travel time and distance from the public OSRM demonstration service
- Conservative emergency gating: emergency/unsure results contain only verified pediatric emergency departments
- Direct provider-source, calling, and navigation links

No wait time, insurance acceptance, price, clinical recommendation, or invented quality score is displayed. Dynamic or unavailable fields are labeled as such. New Jersey hospital-quality reporting is linked where applicable but is not transformed into a pediatric emergency-care rating.

## Data architecture

`data/facilities.js` is the current static repository layer. Each record contains routing coordinates, age bounds, care setting, capability tags, hours provenance, display facts, and source links. `app.js` contains separate eligibility, hours, routing, scoring, and presentation functions so the static layer can later be replaced by an API/database without rewriting the interface.

Data reviewed: August 17, 2026.

### Primary facility sources

- [Cooperman Barnabas Pediatric Emergency Services](https://www.rwjbh.org/cooperman-barnabas-medical-center/treatment-care/emergency-department/pediatric-emergency-services/)
- [Newark Beth Israel Emergency Services](https://www.rwjbh.org/newark-beth-israel-medical-center/treatment-care/emergency-room-services/)
- [University Hospital Pediatric Emergency Medicine](https://www.uhnj.org/services/emergency-medicine/pediatric-emergency-medicine/)
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

The GitHub Pages version is a useful pilot, not a complete clinical product. A production release needs a governed database and update workflow, commercial routing with traffic/SLA, authenticated provider and insurer feeds, monitoring, analytics with consent, privacy/security review, accessibility and clinical safety validation, legal/regulatory review, and operational ownership. Native iOS/Android can share the dataset/API and scoring contract, then add native location, maps, notifications, secure storage, and app-store distribution.
