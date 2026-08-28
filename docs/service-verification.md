# Service-level verification standard

A hospital may appear in patient results only after a reviewer confirms all release-blocking facts from location-specific authoritative sources.

## Release-blocking checks

1. Match the hospital to its CMS Certification Number and current legal/provider identity.
2. Confirm the exact emergency-department entrance or routing address and telephone number.
3. Confirm that emergency care is available 24 hours a day, seven days a week.
4. Confirm whether the location treats adults, children, or both. CMS emergency-service status alone does not establish pediatric care.
5. Record pediatric minimum and maximum ages only when the provider publishes them; otherwise keep both values explicitly unknown.
6. Confirm each displayed capability and highlight from a provider, state, or federal source.
7. Geocode the verified address and retain the government or OpenStreetMap provenance used.
8. Check financial-assistance, uninsured-care, language-assistance, and operational-status claims separately. Never infer that emergency access means all services are free.
9. Add claim-level evidence, the review date, and a review deadline no more than 90 days later.
10. Run the data validator, browser-data build, automated tests, and a patient-flow visual check before publication.

## Outcomes

- `verified`: all displayed claims, including any published age limits, are supported.
- `verified-with-unknowns`: release-blocking safety claims are supported, but one or more non-blocking facts remain explicitly unknown.
- `pending-service-verification`: not visible to patients. The review queue must identify the missing evidence.

Every correction must update the canonical dataset and evidence record; the generated browser file is never edited directly.
