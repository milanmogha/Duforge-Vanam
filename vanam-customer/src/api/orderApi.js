// src/api/orderApi.js

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Create a new order
 * @param {string} token       JWT (Bearer token)
 * @param {Object} orderData   {
 *   userAddress: string (Address _id),
 *   paymentMethod: string,
 *   paymentBreakdown: { itemsTotal, tax, shipping, discount?, total },
 *   products: [ { product: string, quantity: number } ],
 *   couponCode: string (optional, uppercase trimmed)
 * }
 * @returns {Promise<Object>}  The created order
 */
export const createOrder = async (token, orderData) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/api/orders`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      'Failed to create order';
    throw new Error(msg);
  }
};

/**
 * Fetch current user’s orders
 * @param {string} token  JWT (Bearer token)
 * @returns {Promise<Array>} List of orders
 */
export const getMyOrders = async (token) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/orders/my`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      'Failed to fetch your orders';
    throw new Error(msg);
  }
};

/**
 * Fetch all orders (admin only)
 * @param {string} token  JWT for admin
 * @returns {Promise<Array>} List of all orders
 */
export const getAllOrders = async (token) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/orders`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      'Failed to fetch all orders';
    throw new Error(msg);
  }
};

/**
 * Fetch a single order by its Mongo _id or business orderId
 * @param {string} token    JWT (or admin JWT)
 * @param {string} orderId  Mongo _id or orderId (e.g. "OD-31_05_2025_1")
 * @returns {Promise<Object>} The order details
 */
export const getOrder = async (token, orderId) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/orders/${orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      `Failed to fetch order ${orderId}`;
    throw new Error(msg);
  }
};

/**
 * Update the status of an order
 * @param {string} token    JWT (or admin JWT)
 * @param {string} orderId  Mongo _id of the order
 * @param {string} status   New status ('Pending','Confirmed','Shipped','Delivered','Cancelled')
 * @returns {Promise<Object>} The updated order
 */
export const updateOrderStatus = async (token, orderId, status) => {
  try {
    const res = await axios.put(
      `${BASE_URL}/api/orders/${orderId}/status`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      `Failed to update order ${orderId}`;
    throw new Error(msg);
  }
};

/**
 * Calculate delivery charges for products and address
 * @param {string} token       JWT (Bearer token)
 * @param {Array} products     Array of { product: string (ID), quantity: number }
 * @param {string} addressId   Address _id
 * @returns {Promise<Object>}  { zone, totalWeight, deliveryCharge }
 */
export const calculateDeliveryCharges = async (token, products, addressId) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/api/orders/calculate-delivery`,
      { products, addressId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      'Failed to calculate delivery charges';
    throw new Error(msg);
  }
};
