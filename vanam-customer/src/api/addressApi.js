// src/api/addressApi.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch all addresses for the current user
 * @param {string} token  JWT auth token
 * @returns {Promise<Array>}
 */
export const fetchAddresses = async (token) => {
  const res = await axios.get(
    `${BASE_URL}/api/addresses`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
};

/**
 * Create a new address
 */
export const createAddress = async (token, addressData) => {
  const res = await axios.post(
    `${BASE_URL}/api/addresses`,
    addressData,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
  );
  return res.data;
};
/**
 * Update an existing address
 * @param {string} token
 * @param {string} id  Address document ID
 * @param {Object} addressData
 * @returns {Promise<Object>} updated address
 */
export const updateAddress = async (token, id, addressData) => {
  const res = await axios.put(
    `${BASE_URL}/api/addresses/${id}`,
    addressData,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
  );
  return res.data;
};

/**
 * Delete an address
 * @param {string} token
 * @param {string} id  Address document ID
 * @returns {Promise<Object>} deletion response
 */
export const deleteAddress = async (token, id) => {
  const res = await axios.delete(
    `${BASE_URL}/api/addresses/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
};
