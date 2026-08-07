import axios from '../utils/axiosSetup';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = `${BASE_URL}/api/users/profile`;

export async function getProfile() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  try {
    const res = await axios.get(API_BASE, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const json = err.response?.data;
    let msg = `Failed to fetch profile (${status || 'network'})`;
    if (json?.message) msg = json.message;
    throw new Error(msg);
  }
}

export async function updateProfile(updates) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  try {
    const res = await axios.put(API_BASE, updates, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const json = err.response?.data;
    let msg = `Failed to update profile (${status || 'network'})`;
    if (json?.message) msg = json.message;
    throw new Error(msg);
  }
}

export async function deleteProfile() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  console.log('Attempting DELETE on:', API_BASE);
  try {
    const res = await axios.delete(API_BASE, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const json = err.response?.data;
    let msg = `Failed to delete profile (${status || 'network'})`;
    if (json?.message) msg = json.message;
    throw new Error(msg);
  }
}