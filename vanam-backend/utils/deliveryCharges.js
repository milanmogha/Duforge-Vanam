// utils/deliveryCharges.js
// Dynamic Delivery Charges Calculator for Furniture

// ====================================================================
// ZONE MAPPING: Pincode ranges and cities mapped to delivery zones
// ====================================================================

const ZONE_MAPPING = {
  NCR: {
    pincodes: [
      // Delhi
      { start: 110001, end: 110097 },
      // Gurgaon
      { start: 122001, end: 122018 },
      { start: 122050, end: 122052 },
      { start: 122100, end: 122109 },
      // Noida & Greater Noida
      { start: 201301, end: 201318 },
      { start: 203207, end: 203207 },
      // Ghaziabad
      { start: 201001, end: 201017 },
      { start: 201102, end: 201102 },
      { start: 201204, end: 201206 },
      // Faridabad
      { start: 121001, end: 121010 },
      { start: 121101, end: 121109 },
      // Bahadurgarh, Sonipat, Panipat (nearby NCR)
      { start: 124001, end: 124507 },
      { start: 131001, end: 131103 },
      { start: 132103, end: 132140 },
    ],
    cities: ['delhi', 'new delhi', 'gurgaon', 'gurugram', 'noida', 'greater noida', 'ghaziabad', 'faridabad', 'bahadurgarh', 'sonipat']
  },

  NORTH: {
    states: ['punjab', 'haryana', 'himachal pradesh', 'jammu and kashmir', 'chandigarh', 'uttarakhand'],
    pincodes: [
      // Punjab
      { start: 140001, end: 160104 },
      // Haryana (excluding NCR parts already in NCR zone)
      { start: 121101, end: 136156 },
      // Himachal Pradesh
      { start: 171001, end: 177601 },
      // Jammu & Kashmir
      { start: 180001, end: 194404 },
      // Chandigarh
      { start: 160001, end: 160103 },
      // Uttarakhand
      { start: 244001, end: 263680 },
    ],
    cities: ['chandigarh', 'ludhiana', 'amritsar', 'jalandhar', 'patiala', 'karnal', 'ambala', 'rohtak', 'hisar', 'shimla', 'manali', 'jammu', 'srinagar', 'dehradun', 'haridwar', 'nainital']
  },

  ROI: {
    // Rest of India - Most of India excluding NCR, NORTH, and NE/SPL DEST
    states: ['uttar pradesh', 'madhya pradesh', 'rajasthan', 'gujarat', 'maharashtra', 'karnataka', 'telangana', 'andhra pradesh', 'tamil nadu', 'kerala', 'west bengal', 'odisha', 'bihar', 'jharkhand', 'chhattisgarh', 'goa'],
    pincodes: [
      // Uttar Pradesh
      { start: 201001, end: 285223 },
      // Madhya Pradesh
      { start: 450001, end: 488448 },
      // Rajasthan
      { start: 301001, end: 345034 },
      // Gujarat
      { start: 360001, end: 396580 },
      // Maharashtra
      { start: 400001, end: 445402 },
      // Karnataka
      { start: 560001, end: 591346 },
      // Telangana
      { start: 500001, end: 509412 },
      // Andhra Pradesh
      { start: 515001, end: 535594 },
      // Tamil Nadu
      { start: 600001, end: 643253 },
      // Kerala
      { start: 670001, end: 695615 },
      // West Bengal
      { start: 700001, end: 743711 },
      // Odisha
      { start: 751001, end: 770076 },
      // Bihar
      { start: 800001, end: 855117 },
      // Jharkhand
      { start: 813001, end: 835325 },
      // Chhattisgarh
      { start: 490001, end: 497778 },
      // Goa
      { start: 403001, end: 403806 },
    ]
  },

  'NE/SPL DEST': {
    // North-East India and Special Destinations (Islands, Remote areas)
    states: ['assam', 'arunachal pradesh', 'nagaland', 'manipur', 'mizoram', 'tripura', 'meghalaya', 'sikkim', 'andaman and nicobar islands', 'lakshadweep'],
    pincodes: [
      // Assam
      { start: 781001, end: 788931 },
      // Arunachal Pradesh
      { start: 790001, end: 792131 },
      // Nagaland
      { start: 797001, end: 798627 },
      // Manipur
      { start: 795001, end: 795159 },
      // Mizoram
      { start: 796001, end: 796901 },
      // Tripura
      { start: 799001, end: 799290 },
      // Meghalaya
      { start: 793001, end: 794115 },
      // Sikkim
      { start: 737101, end: 737139 },
      // Andaman & Nicobar
      { start: 744101, end: 744304 },
      // Lakshadweep
      { start: 682551, end: 682559 },
    ],
    cities: ['guwahati', 'itanagar', 'kohima', 'imphal', 'aizawl', 'agartala', 'shillong', 'gangtok', 'port blair']
  }
};

// ====================================================================
// DELIVERY CHARGE TABLES (From provided image)
// ====================================================================

// Table 1: For weights 0.5 KG to 3 KG
const LIGHT_WEIGHT_CHARGES = {
  'NCR': { 0.5: 50, 1: 75, 1.5: 110, 2: 120, 2.5: 145, 3: 155 },
  'NORTH': { 0.5: 65, 1: 90, 1.5: 130, 2: 130, 2.5: 165, 3: 175 },
  'ROI': { 0.5: 70, 1: 100, 1.5: 140, 2: 165, 2.5: 185, 3: 210 },
  'NE/SPL DEST': { 0.5: 100, 1: 140, 1.5: 175, 2: 175, 2.5: 235, 3: 235 }
};

// Table 2: For weights 3+ KG (per kg pricing)
const HEAVY_WEIGHT_CHARGES = {
  'NCR': { '3-5': 45, '5-10': 45, '10-20': 40, '21-50': 35, '51-100': 30 },
  'NORTH': { '3-5': 50, '5-10': 45, '10-20': 40, '21-50': 40, '51-100': 35 },
  'ROI': { '3-5': 60, '5-10': 50, '10-20': 45, '21-50': 40, '51-100': 35 },
  'NE/SPL DEST': { '3-5': 70, '5-10': 60, '10-20': 50, '21-50': 45, '51-100': 40 }
};

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Determine delivery zone based on pincode or city/state
 * @param {string} pincode 
 * @param {string} city 
 * @param {string} state 
 * @returns {string} Zone name (NCR, NORTH, ROI, NE/SPL DEST)
 */
function getZone(pincode, city = '', state = '') {
  const pin = parseInt(pincode);
  const cityLower = city.toLowerCase().trim();
  const stateLower = state.toLowerCase().trim();

  // Check each zone
  for (const [zoneName, zoneData] of Object.entries(ZONE_MAPPING)) {
    // Check pincode ranges
    if (zoneData.pincodes) {
      for (const range of zoneData.pincodes) {
        if (pin >= range.start && pin <= range.end) {
          return zoneName;
        }
      }
    }

    // Check cities
    if (zoneData.cities && zoneData.cities.some(c => cityLower.includes(c))) {
      return zoneName;
    }

    // Check states
    if (zoneData.states && zoneData.states.some(s => stateLower.includes(s) || s.includes(stateLower))) {
      return zoneName;
    }
  }

  // Default to ROI if no match found
  return 'ROI';
}

/**
 * Calculate delivery charge based on total weight and zone
 * @param {number} totalWeight Total weight in KG
 * @param {string} zone Delivery zone
 * @returns {number} Delivery charge in INR
 */
function calculateDeliveryCharge(totalWeight, zone) {
  // Validate zone
  if (!LIGHT_WEIGHT_CHARGES[zone]) {
    zone = 'ROI'; // Default to ROI if invalid zone
  }

  // For weights 3 KG or less, use fixed rates from table 1
  if (totalWeight <= 3) {
    // Find the closest weight bracket
    const weights = [0.5, 1, 1.5, 2, 2.5, 3];
    let selectedWeight = 0.5;
    
    for (const w of weights) {
      if (totalWeight <= w) {
        selectedWeight = w;
        break;
      }
    }
    
    return LIGHT_WEIGHT_CHARGES[zone][selectedWeight];
  }

  // For weights above 3 KG, use per-kg pricing from table 2
  let ratePerKg;
  
  if (totalWeight <= 5) {
    ratePerKg = HEAVY_WEIGHT_CHARGES[zone]['3-5'];
  } else if (totalWeight <= 10) {
    ratePerKg = HEAVY_WEIGHT_CHARGES[zone]['5-10'];
  } else if (totalWeight <= 20) {
    ratePerKg = HEAVY_WEIGHT_CHARGES[zone]['10-20'];
  } else if (totalWeight <= 50) {
    ratePerKg = HEAVY_WEIGHT_CHARGES[zone]['21-50'];
  } else {
    ratePerKg = HEAVY_WEIGHT_CHARGES[zone]['51-100'];
  }

  return Math.ceil(totalWeight * ratePerKg);
}

/**
 * Main function to calculate delivery charge for an order
 * @param {Array} products Array of {product, quantity} where product has weight field
 * @param {Object} address Address object with pincode, city, state
 * @returns {Object} { zone, totalWeight, deliveryCharge }
 */
export function calculateOrderDeliveryCharge(products, address) {
  // Calculate total weight
  let totalWeight = 0;
  for (const item of products) {
    const productWeight = item.product?.weight || 1; // Default 1 KG if not specified
    totalWeight += productWeight * item.quantity;
  }

  // Determine zone
  const zone = getZone(address.pincode, address.city, address.state);

  // Calculate delivery charge
  const deliveryCharge = calculateDeliveryCharge(totalWeight, zone);

  return {
    zone,
    totalWeight: Math.round(totalWeight * 100) / 100, // Round to 2 decimal places
    deliveryCharge
  };
}

/**
 * Get delivery charge estimate for a specific address
 * @param {number} totalWeight Total weight in KG
 * @param {string} pincode 
 * @param {string} city 
 * @param {string} state 
 * @returns {Object} { zone, totalWeight, deliveryCharge }
 */
export function getDeliveryEstimate(totalWeight, pincode, city = '', state = '') {
  const zone = getZone(pincode, city, state);
  const deliveryCharge = calculateDeliveryCharge(totalWeight, zone);

  return {
    zone,
    totalWeight,
    deliveryCharge
  };
}

export { getZone, calculateDeliveryCharge };
