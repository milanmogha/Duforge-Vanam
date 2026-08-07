// src/api/featuresApi.js — admin client for sample & quote requests.
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
});

export const fetchSampleRequests = () =>
  axios.get(`${BASE_URL}/api/samples/admin`, authHeaders()).then((r) => r.data);
export const updateSampleRequest = (id, payload) =>
  axios.put(`${BASE_URL}/api/samples/admin/${id}`, payload, authHeaders()).then((r) => r.data);

export const fetchQuoteRequests = () =>
  axios.get(`${BASE_URL}/api/quotes/admin`, authHeaders()).then((r) => r.data);
export const updateQuoteRequest = (id, payload) =>
  axios.put(`${BASE_URL}/api/quotes/admin/${id}`, payload, authHeaders()).then((r) => r.data);

export const SAMPLE_STATUSES = ['REQUESTED', 'REVIEWING', 'APPROVED', 'DISPATCHED', 'DELIVERED', 'REJECTED'];
export const QUOTE_STATUSES = ['SUBMITTED', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'DECLINED', 'CLOSED'];
