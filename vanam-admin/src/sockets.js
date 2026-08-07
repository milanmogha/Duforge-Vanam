import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('🔌 Connecting to socket server:', SOCKET_URL);

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
  // Identify as admin client
  socket.emit('identify', { type: 'admin' });
  console.log('📢 Identified as admin');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🔌 Socket connection error:', error.message);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
});

// Listen for notification events
socket.on('new-notification', (notification) => {
  console.log('📢 Received new-notification event:', notification);
});

socket.on('order-placed', (order) => {
  console.log('📢 Order placed:', order);
});

socket.on('order-updated', (order) => {
  console.log('📢 Order updated:', order);
});

export default socket;
