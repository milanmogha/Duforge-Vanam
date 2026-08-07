// shippingService.js

import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { resolveZoneFromPincode } from './zoneResolver.js';

const LIGHT_WEIGHT_CHARGES = {
  NCR: { 0.5: 50, 1: 75, 1.5: 110, 2: 120, 2.5: 145, 3: 155 },
  NORTH: { 0.5: 65, 1: 90, 1.5: 130, 2: 130, 2.5: 165, 3: 175 },
  ROI: { 0.5: 70, 1: 100, 1.5: 140, 2: 165, 2.5: 185, 3: 210 },
  NE_SPL: { 0.5: 100, 1: 140, 1.5: 175, 2: 175, 2.5: 235, 3: 235 },
};

const HEAVY_WEIGHT_CHARGES = {
  NCR: { '3-5': 45, '5-10': 45, '10-20': 40, '21-50': 35, '51-100': 30 },
  NORTH: { '3-5': 50, '5-10': 45, '10-20': 40, '21-50': 40, '51-100': 35 },
  ROI: { '3-5': 60, '5-10': 50, '10-20': 45, '21-50': 40, '51-100': 35 },
  NE_SPL: { '3-5': 70, '5-10': 60, '10-20': 50, '21-50': 45, '51-100': 40 },
};

const DEFAULT_TAX_RATE = 0.1;

const pickPriceForWeight = (zone, weightKg) => {
  const normalizedZone = LIGHT_WEIGHT_CHARGES[zone] ? zone : 'ROI';

  if (weightKg <= 3) {
    const weights = [0.5, 1, 1.5, 2, 2.5, 3];
    let selectedWeight = 0.5;

    for (const weight of weights) {
      if (weightKg <= weight) {
        selectedWeight = weight;
        break;
      }
    }

    return LIGHT_WEIGHT_CHARGES[normalizedZone][selectedWeight];
  }

  let ratePerKg;

  if (weightKg <= 5) {
    ratePerKg = HEAVY_WEIGHT_CHARGES[normalizedZone]['3-5'];
  } else if (weightKg <= 10) {
    ratePerKg = HEAVY_WEIGHT_CHARGES[normalizedZone]['5-10'];
  } else if (weightKg <= 20) {
    ratePerKg = HEAVY_WEIGHT_CHARGES[normalizedZone]['10-20'];
  } else if (weightKg <= 50) {
    ratePerKg = HEAVY_WEIGHT_CHARGES[normalizedZone]['21-50'];
  } else {
    ratePerKg = HEAVY_WEIGHT_CHARGES[normalizedZone]['51-100'];
  }

  return Math.ceil(weightKg * ratePerKg);
};

export const calculateCharges = async ({
  items = [],
  pincode = '',
  couponCode = null,
  userId = null,
}) => {
  if (
    pincode === '999999' &&
    (process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_TEST_PINCODE === 'true')
  ) {
    return {
      itemsTotal: 0,
      shipping: 0,
      discount: 0,
      tax: 0,
      total: 1,
      zone: 'TEST',
      weightKg: 0,
      couponCode: null,
    };
  }

  const productIds = items.map(i => i.product);
  const products = await Product.find({ _id: { $in: productIds } });

  const prodMap = {};
  products.forEach(p => {
    prodMap[p._id.toString()] = p;
  });

  let itemsTotal = 0;
  let totalWeight = 0;

  for (const it of items) {
    const p = prodMap[it.product];
    if (!p) continue;

    const qty = it.quantity || 1;
    const priceAfterDiscount = Math.round(
      (p.price * (100 - (p.discount || 0))) / 100
    );

    itemsTotal += priceAfterDiscount * qty;
    totalWeight += (p.weightKg || p.weight || 0.5) * qty;
  }

  const zone = resolveZoneFromPincode(pincode);

  console.log('🚚 Zone resolved:', zone, 'for pincode', pincode);

  let shipping = pickPriceForWeight(zone, totalWeight);

  let discount = 0;
  let coupon = null;

  if (couponCode) {
    coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
    });

    if (coupon && new Date(coupon.expiryDate) >= new Date()) {
      if (coupon.discountPercent > 0) {
        discount = Math.floor((coupon.discountPercent / 100) * itemsTotal);
        if (coupon.maxDiscountAmount > 0) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
      } else {
        discount = coupon.discountAmount || 0;
      }

      if (coupon.type === 'FREE_SHIPPING') {
        shipping = 0;
      }
    }
  }

  const taxable = Math.max(0, itemsTotal - discount);
  const tax = Math.round(taxable * DEFAULT_TAX_RATE);
  const total = Math.round(itemsTotal - discount + tax + shipping);

  return {
    itemsTotal,
    shipping,
    discount,
    tax,
    total,
    zone,
    weightKg: Math.round(totalWeight * 100) / 100,
    couponCode: coupon ? coupon.code : null,
  };
};

export default { calculateCharges };
