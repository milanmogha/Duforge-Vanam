import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Accept either a phone string or a payload { phone, name, email }
export const sendOtp = (phoneOrPayload) => {
  const payload = typeof phoneOrPayload === 'string' ? { phone: phoneOrPayload } : phoneOrPayload || {};
  return axios.post(`${BASE_URL}/api/auth/send-otp`, payload);
};

export const verifyOtp = (phone, otp) =>
  axios.post(`${BASE_URL}/api/auth/verify-otp`, { phone, otp });

// Dev-login (development only). Returns { enabled, roles } from the backend;
// the endpoint 404s in production or when ALLOW_DEV_LOGIN !== 'true'.
export const getDevLoginAvailability = () =>
  axios.get(`${BASE_URL}/api/auth/dev-login/available`).then((r) => r.data).catch(() => ({ enabled: false, roles: [] }));

export const devLogin = (role) =>
  axios.post(`${BASE_URL}/api/auth/dev-login`, { role }).then((r) => r.data);
