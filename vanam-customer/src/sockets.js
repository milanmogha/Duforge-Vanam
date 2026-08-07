// src/sockets.js

import { io } from 'socket.io-client';

// Ensure environment value is a clean string (strip accidental quotes)
const rawUrl = import.meta.env.VITE_API_URL;
const cleaned = rawUrl ? String(rawUrl).replace(/^['"]|['"]$/g, '').replace(/\/$/, '') : null;
const SOCKET_URL = cleaned || undefined; // undefined -> use current origin (dev proxy)
console.log('🔌 Customer socket connecting to (sanitized):', SOCKET_URL || '(same origin)');

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

socket.on('connect', () => {
  console.log('✅ Customer socket connected:', socket.id);
  // Identify as customer client
  socket.emit('identify', { type: 'customer' });
  console.log('👤 Identified as customer');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Customer socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🔌 Customer socket connection error:', error.message);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Customer socket reconnected after', attemptNumber, 'attempts');
});

export default socket;