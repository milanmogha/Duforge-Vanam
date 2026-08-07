// src/api/featuresApi.js — client for project boards, samples, and quotes.
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// ── Projects ──────────────────────────────────────────────────────
export const listProjects = (token) =>
  axios.get(`${BASE_URL}/api/projects`, auth(token)).then((r) => r.data);
export const getProject = (token, id) =>
  axios.get(`${BASE_URL}/api/projects/${id}`, auth(token)).then((r) => r.data);
export const createProject = (token, payload) =>
  axios.post(`${BASE_URL}/api/projects`, payload, auth(token)).then((r) => r.data);
export const updateProject = (token, id, payload) =>
  axios.put(`${BASE_URL}/api/projects/${id}`, payload, auth(token)).then((r) => r.data);
export const deleteProject = (token, id) =>
  axios.delete(`${BASE_URL}/api/projects/${id}`, auth(token)).then((r) => r.data);
export const addProjectItem = (token, id, item) =>
  axios.post(`${BASE_URL}/api/projects/${id}/items`, item, auth(token)).then((r) => r.data);
export const removeProjectItem = (token, id, itemId) =>
  axios.delete(`${BASE_URL}/api/projects/${id}/items/${itemId}`, auth(token)).then((r) => r.data);

// ── Samples ───────────────────────────────────────────────────────
export const requestSample = (token, payload) =>
  axios.post(`${BASE_URL}/api/samples`, payload, auth(token)).then((r) => r.data);
export const listMySamples = (token) =>
  axios.get(`${BASE_URL}/api/samples/mine`, auth(token)).then((r) => r.data);

// ── Quotes ────────────────────────────────────────────────────────
export const requestQuote = (token, payload) =>
  axios.post(`${BASE_URL}/api/quotes`, payload, auth(token)).then((r) => r.data);
export const listMyQuotes = (token) =>
  axios.get(`${BASE_URL}/api/quotes/mine`, auth(token)).then((r) => r.data);
