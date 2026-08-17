window.CARE_ROUTE_FACILITIES = [
  {
    id: 'cooperman-barnabas-peds-ed', name: 'Cooperman Barnabas Medical Center', city: 'Livingston', type: 'emergency', typeLabel: 'Pediatric emergency department', pediatricSpecific: true,
    address: '94 Old Short Hills Road, Livingston, NJ 07039', coordinates: { lat: 40.7634604, lon: -74.3048418 }, phone: '(973) 322-5180',
    age: { minMonths: 0, maxMonths: 216 }, capabilities: ['illness', 'breathing', 'injury', 'wound', 'stomach', 'other'],
    hours: { kind: 'always', label: 'Open 24 hours', days: {} },
    highlights: ['Dedicated nine-room pediatric suite', 'Pediatric emergency medicine specialists', 'Pediatric critical-care room and trauma capability'],
    sourceUrl: 'https://www.rwjbh.org/cooperman-barnabas-medical-center/treatment-care/emergency-department/pediatric-emergency-services/',
    quality: { note: 'NJ hospital measures exist, but no comparable pediatric urgent/emergency score is displayed.', url: 'https://web.doh.nj.gov/apps2/hpr/hospitals.aspx' }
  },
  {
    id: 'newark-beth-israel-peds-ed', name: "Children’s Hospital of New Jersey at Newark Beth Israel", city: 'Newark', type: 'emergency', typeLabel: 'Pediatric emergency department', pediatricSpecific: true,
    address: '201 Lyons Avenue, Newark, NJ 07112', coordinates: { lat: 40.7102728, lon: -74.2125846 }, phone: '(973) 926-7337',
    age: { minMonths: 0, maxMonths: 216 }, capabilities: ['illness', 'breathing', 'injury', 'wound', 'stomach', 'other'],
    hours: { kind: 'always', label: 'Open 24 hours', days: {} },
    highlights: ['Separate pediatric emergency area', 'Board-certified pediatric emergency specialists', 'On-site pediatric intensive and specialty services'],
    sourceUrl: 'https://www.rwjbh.org/newark-beth-israel-medical-center/treatment-care/emergency-room-services/',
    quality: { note: 'NJ hospital measures exist, but no comparable pediatric urgent/emergency score is displayed.', url: 'https://web.doh.nj.gov/apps2/hpr/profile.aspx?name=Newark+Beth+Israel+Medical+Center&num=10709' }
  },
  {
    id: 'university-hospital-peds-ed', name: 'University Hospital Pediatric Emergency Department', city: 'Newark', type: 'emergency', typeLabel: 'Pediatric emergency department', pediatricSpecific: true,
    address: '150 Bergen Street, Newark, NJ 07103', coordinates: { lat: 40.7405364, lon: -74.1911759 }, phone: '(973) 972-4300',
    age: { minMonths: 0, maxMonths: 216 }, capabilities: ['illness', 'breathing', 'injury', 'wound', 'stomach', 'other'],
    hours: { kind: 'always', label: 'Open 24 hours', days: {} },
    highlights: ['Dedicated pediatric emergency room', 'Pediatric emergency-trained physicians', 'Hospital pediatric critical-care and inpatient support'],
    sourceUrl: 'https://www.uhnj.org/services/emergency-medicine/pediatric-emergency-medicine/',
    quality: { note: 'No pediatric-specific emergency quality measure was found for display.', url: 'https://web.doh.nj.gov/apps2/hpr/hospitals.aspx' }
  },
  {
    id: 'pm-pediatric-livingston', name: 'PM Pediatric Urgent Care', city: 'Livingston', type: 'urgent-care', typeLabel: 'Pediatric urgent care', pediatricSpecific: true,
    address: '571 West Mt. Pleasant Avenue, Livingston, NJ 07039', coordinates: { lat: 40.7974457, lon: -74.3522841 }, phone: '(973) 992-4767',
    age: { minMonths: 0, maxMonths: 312 }, capabilities: ['illness', 'breathing', 'injury', 'wound', 'stomach'],
    hours: { kind: 'live', label: 'Dynamic—check the provider page or call before travel', days: {} },
    highlights: ['Treats ages 0–26', 'X-ray, splinting, lab testing, stitches, oxygen and nebulizer treatments', 'Walk-ins accepted; online check-in available'],
    sourceUrl: 'https://pmpediatriccare.com/location/new-jersey-livingston/',
    quality: { note: 'No comparable public pediatric urgent-care quality measure found.', url: null }
  },
  {
    id: 'afc-west-orange', name: 'AFC Urgent Care West Orange', city: 'West Orange', type: 'urgent-care', typeLabel: 'Child-capable urgent care', pediatricSpecific: false,
    address: '464 Eagle Rock Avenue, West Orange, NJ 07052', coordinates: { lat: 40.8034229, lon: -74.2499729 }, phone: '(973) 669-5900',
    age: { minMonths: 12, maxMonths: 216 }, capabilities: ['illness', 'injury', 'wound', 'stomach'],
    hours: { kind: 'weekly', label: 'Mon–Fri 8am–8pm; Sat–Sun 8am–5pm', days: { 0: [480, 1020], 1: [480, 1200], 2: [480, 1200], 3: [480, 1200], 4: [480, 1200], 5: [480, 1200], 6: [480, 1020] } },
    highlights: ['Provider states it treats children age 1 and older', 'Walk-in care seven days a week', 'On-site X-ray and laboratory'],
    sourceUrl: 'https://www.afcurgentcare.com/west-orange/patient-services/pediatric-care/',
    quality: { note: 'No comparable public pediatric urgent-care quality measure found.', url: null }
  },
  {
    id: 'summit-urgent-care-livingston', name: 'Summit Health Urgent Care', city: 'Livingston', type: 'urgent-care', typeLabel: 'Child-capable urgent care', pediatricSpecific: false,
    address: '75 East Northfield Road, Livingston, NJ 07039', coordinates: { lat: 40.7737922, lon: -74.3204303 }, phone: '(973) 436-1500',
    age: { minMonths: 0, maxMonths: 216, verifiedLimits: false }, capabilities: ['illness', 'injury', 'wound', 'stomach'],
    hours: { kind: 'weekly', label: 'Mon–Fri 8am–8pm; Sat–Sun 8am–5pm', days: { 0: [480, 1020], 1: [480, 1200], 2: [480, 1200], 3: [480, 1200], 4: [480, 1200], 5: [480, 1200], 6: [480, 1020] } },
    highlights: ['Provider lists pediatric care; exact age limits are not published', 'X-ray, CT, and lab capabilities published', 'No appointment necessary'],
    sourceUrl: 'https://www.summithealth.com/locations/livingston-summit-health-urgent-care',
    quality: { note: 'No comparable public pediatric urgent-care quality measure found.', url: null }
  }
];
