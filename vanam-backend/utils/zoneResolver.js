// zoneResolver.js

import { lookup } from 'india-pincode-lookup';

const norm = (v = '') => v.trim().toUpperCase();

const NCR_DISTRICTS = new Set([
  'DELHI',
  'NEW DELHI',
  'GURUGRAM',
  'GURGAON',
  'NOIDA',
  'GHAZIABAD',
  'FARIDABAD',
  'SONIPAT',
  'PANIPAT',
  'BAGHPAT',
  'MEERUT',
  'MUZAFFARNAGAR',
]);

const NORTH_STATES = new Set([
  'PUNJAB',
  'HARYANA',
  'HIMACHAL PRADESH',
  'UTTARAKHAND',
  'RAJASTHAN',
  'UTTAR PRADESH',
]);

const NE_STATES = new Set([
  'ASSAM',
  'MEGHALAYA',
  'MANIPUR',
  'MIZORAM',
  'NAGALAND',
  'TRIPURA',
  'ARUNACHAL PRADESH',
  'SIKKIM',
]);

export function resolveZoneFromPincode(pincode) {
  const data = lookup(pincode)?.[0];

  if (!data) {
    console.warn('⚠️ Pincode lookup failed:', pincode);
    return 'ROI';
  }

  const district = norm(data.districtName);
  const state = norm(data.stateName);

  console.log('📍 Pincode resolved:', { pincode, district, state });

  if (NCR_DISTRICTS.has(district) || state === 'DELHI') {
    return 'NCR';
  }

  if (NORTH_STATES.has(state)) {
    return 'NORTH';
  }

  if (NE_STATES.has(state)) {
    return 'NE_SPL';
  }

  return 'ROI';
}
