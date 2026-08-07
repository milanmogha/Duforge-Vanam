import axios from 'axios';

// Base URL for your backend
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000');

/**
 * Attempt to log in as admin
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string }>} JWT token on success
 */
export async function loginAdmin({ email, password }) {
  const response = await axios.post(
    `${BASE_URL}/api/admin/login`,
    { email, password },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
}
