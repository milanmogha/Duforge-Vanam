// backend/socket.js
import { Server } from "socket.io";
import brand from "./config/brand.js";

let io;

// Keep the socket CORS allow-list in sync with the HTTP allow-list (index.js).
const allowedOrigins = [
  brand.urls.store,
  brand.urls.admin,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001",
  ...brand.extraOrigins,
].filter(Boolean);

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);
    
    // Listen for client type identification
    socket.on('identify', (data) => {
      if (data.type === 'admin') {
        socket.join('admin-room');
        console.log(`📢 Socket ${socket.id} joined admin-room`);
      } else if (data.type === 'customer') {
        console.log(`👤 Customer socket ${socket.id} connected`);
      }
    });
    
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
