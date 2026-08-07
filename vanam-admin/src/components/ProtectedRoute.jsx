// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // look for "adminToken" now
  return localStorage.getItem('adminToken')
    ? children
    : <Navigate to="/login" replace />;
}
