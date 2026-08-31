# National expansion model

## Coverage layers

1. **National identity seed:** CMS Hospital General Information supplies hospital identity, address, phone, hospital characteristics, and whether emergency services are reported. HRSA Health Center Service Delivery and Look-Alike data supplies official identities for active community health-center service sites and the foundation for affordable-care expansion.
2. **Service evidence review:** a provider, state, or other authoritative source must establish hours, patient population (adult, pediatric, or both), location-level capability, and coordinates. CMS emergency status and HRSA program participation alone are insufficient for patient routing.
3. **Verified publication:** age limits, hours, phone, capabilities, and evidence dates pass release validation before the facility appears to families.
4. **Operational enrichment:** traffic routing, insurer eligibility, capacity, and wait data remain separate live integrations with their own timestamps and provenance.

## Batch order

Expansion should be risk- and population-aware: neighboring New York/Pennsylvania first to make the pilot region contiguous, then the largest pediatric population centers and major rural referral regions. State review batches can run concurrently, but publication remains record-by-record.

## National source policy

- CMS is the primary national hospital identity seed.
- HRSA is the primary national community-health-center identity seed. Its public daily export has no listed usage limitations, but inclusion does not prove a particular service, fee, language, schedule, or same-day availability.
- State licensing agencies and official health-system/facility pages establish pediatric services and hours.
- CMS overall hospital ratings may be displayed only as general hospital context, never converted into a pediatric emergency ranking.
- Urgent-care networks require location-level evidence; brand-level pediatric claims do not prove every site has the same ages, services, or hours.
- No crowdsourced listing, search snippet, or map result is sufficient to publish a medical capability claim.

The generated queue covers U.S. territories as well as the 50 states and District of Columbia. Product wording must distinguish “nationwide inventory seeded” from “national care network verified.”

## Current proof-of-concept scale

- **22,292 officially indexed records:** 4,495 CMS emergency-hospital candidates plus 17,797 active HRSA service-site candidates
- **9,972 evidence-enriched candidates:** records with additional location, contact, operating, or reconciliation evidence, still not patient-visible
- **99 decision-ready locations:** records that passed NearSignal's release-blocking checks and may appear in patient results, including urgent-care coverage across every Northeast pilot state

This funnel is a product capability, not merely a data count. It lets NearSignal demonstrate a credible national expansion path while refusing to disguise unverified listings as care recommendations.
