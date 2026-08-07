// src/api/couponApi.js

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch all visible + non-expired coupons (public)
 * GET /api/coupons
 */
export const fetchAvailableCoupons = async () => {
  console.log('[couponApi] fetchAvailableCoupons → GET /api/coupons');
  try {
    const res = await axios.get(`${BASE_URL}/api/coupons`);
    console.log('[couponApi] fetchAvailableCoupons response:', res.data);
    return res.data;
  } catch (err) {
    console.error(
      '[couponApi] fetchAvailableCoupons error:',
      err.response?.data || err.message
    );
    const msg =
      err.response?.data?.error || err.message || 'Failed to fetch coupons';
    throw new Error(msg);
  }
};

/**
 * Apply a coupon code (requires JWT auth)
 * POST /api/coupons/apply
 *
 * @param {string} code       Coupon code (string)
 * @param {number} orderTotal Total amount before discount
 * @param {string} token      JWT auth token (Bearer)
 * @returns {Promise<{ code: string, discount: number }>}
 */
export const applyCoupon = async (code, orderTotal, token) => {
  console.log(
    '[couponApi] applyCoupon called with:',
    { code, orderTotal, token: token ? '<<REDACTED>>' : null }
  );
  if (!token) {
    console.warn('[couponApi] applyCoupon missing token');
    throw new Error('Missing authentication token');
  }

  try {
    const res = await axios.post(
      `${BASE_URL}/api/coupons/apply`,
      { code, orderTotal },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('[couponApi] applyCoupon success:', res.data);
    return res.data; // { code: 'XXXX', discount: Number }
  } catch (err) {
    if (err.response) {
      console.error(
        '[couponApi] applyCoupon error response data:',
        err.response.data
      );
      console.error(
        '[couponApi] applyCoupon error response status:',
        err.response.status
      );
    } else {
      console.error('[couponApi] applyCoupon network/error:', err.message);
    }
    const msg =
      err.response?.data?.error || err.message || 'Failed to apply coupon';
    throw new Error(msg);
  }
};

/**
 * (Admin-only) Fetch all coupons
 * GET /api/admin/coupons
 *
 * @param {string} adminToken Admin JWT
 */
export const fetchAllCouponsAdmin = async (adminToken) => {
  console.log(
    '[couponApi] fetchAllCouponsAdmin called with token:',
    adminToken ? '<<REDACTED>>' : null
  );
  if (!adminToken) {
    console.warn('[couponApi] fetchAllCouponsAdmin missing admin token');
    throw new Error('Missing admin authentication token');
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/admin/coupons`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    console.log('[couponApi] fetchAllCouponsAdmin response:', res.data);
    return res.data;
  } catch (err) {
    if (err.response) {
      console.error(
        '[couponApi] fetchAllCouponsAdmin error response data:',
        err.response.data
      );
      console.error(
        '[couponApi] fetchAllCouponsAdmin error response status:',
        err.response.status
      );
    } else {
      console.error('[couponApi] fetchAllCouponsAdmin network/error:', err.message);
    }
    const msg =
      err.response?.data?.error || err.message || 'Failed to fetch all coupons';
    throw new Error(msg);
  }
};

/**
 * (Admin-only) Create a new coupon
 * POST /api/admin/coupons
 *
 * @param {string} adminToken Admin JWT
 * @param {Object} data       Coupon data
 */
export const createCouponAdmin = async (adminToken, data) => {
  console.log('[couponApi] createCouponAdmin called with:', {
    data: { ...data, expiryDate: data.expiryDate?.toString() },
    token: adminToken ? '<<REDACTED>>' : null,
  });
  if (!adminToken) {
    console.warn('[couponApi] createCouponAdmin missing admin token');
    throw new Error('Missing admin authentication token');
  }

  try {
    const res = await axios.post(
      `${BASE_URL}/api/admin/coupons`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    console.log('[couponApi] createCouponAdmin success:', res.data);
    return res.data;
  } catch (err) {
    if (err.response) {
      console.error(
        '[couponApi] createCouponAdmin error response data:',
        err.response.data
      );
      console.error(
        '[couponApi] createCouponAdmin error response status:',
        err.response.status
      );
    } else {
      console.error('[couponApi] createCouponAdmin network/error:', err.message);
    }
    const msg =
      err.response?.data?.error || err.message || 'Failed to create coupon';
    throw new Error(msg);
  }
};

/**
 * (Admin-only) Delete a coupon by ID
 * DELETE /api/admin/coupons/:id
 *
 * @param {string} adminToken Admin JWT
 * @param {string} id         Coupon ID
 */
export const deleteCoupon = async (adminToken, id) => {
  console.log(
    '[couponApi] deleteCoupon called with id:',
    id,
    'token:',
    adminToken ? '<<REDACTED>>' : null
  );
  if (!adminToken) {
    console.warn('[couponApi] deleteCoupon missing admin token');
    throw new Error('Missing admin authentication token');
  }

  try {
    const res = await axios.delete(`${BASE_URL}/api/admin/coupons/${id}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    console.log('[couponApi] deleteCoupon success:', res.data);
    return res.data;
  } catch (err) {
    if (err.response) {
      console.error(
        '[couponApi] deleteCoupon error response data:',
        err.response.data
      );
      console.error(
        '[couponApi] deleteCoupon error response status:',
        err.response.status
      );
    } else {
      console.error('[couponApi] deleteCoupon network/error:', err.message);
    }
    const msg =
      err.response?.data?.error || err.message || 'Failed to delete coupon';
    throw new Error(msg);
  }
};

/**
 * (Admin-only) Update a coupon by ID
 * PUT /api/admin/coupons/:id
 *
 * @param {string} adminToken Admin JWT
 * @param {string} id         Coupon ID
 * @param {Object} data       Coupon payload
 */
export const updateCoupon = async (adminToken, id, data) => {
  console.log('[couponApi] updateCoupon called with:', {
    id,
    data: { ...data, expiryDate: data.expiryDate?.toString() },
    token: adminToken ? '<<REDACTED>>' : null,
  });
  if (!adminToken) {
    console.warn('[couponApi] updateCoupon missing admin token');
    throw new Error('Missing admin authentication token');
  }

  try {
    const res = await axios.put(
      `${BASE_URL}/api/admin/coupons/${id}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    console.log('[couponApi] updateCoupon success:', res.data);
    return res.data;
  } catch (err) {
    if (err.response) {
      console.error(
        '[couponApi] updateCoupon error response data:',
        err.response.data
      );
      console.error(
        '[couponApi] updateCoupon error response status:',
        err.response.status
      );
    } else {
      console.error('[couponApi] updateCoupon network/error:', err.message);
    }
    const msg =
      err.response?.data?.error || err.message || 'Failed to update coupon';
    throw new Error(msg);
  }
};
