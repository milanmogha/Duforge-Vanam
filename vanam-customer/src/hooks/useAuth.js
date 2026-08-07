// src/hooks/useAuth.js
import { useAuth as useAuthContext } from '../pages/AuthContext';

export const useAuth = () => {
  const ctx = useAuthContext();
  return ctx || { user: null, loading: true, login: () => {}, logout: () => {}, getIdToken: async () => null };
};