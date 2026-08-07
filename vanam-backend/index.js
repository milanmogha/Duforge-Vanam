// index.js

import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env & DB
import './config/env.js';
import validateEnv from './config/validateEnv.js';
import connectDB from './config/db.js';
import brand from './config/brand.js';
import { initSocket, getIO } from './socket.js';
import User from './models/User.js';

// Routes
import adminRoutes from './routes/adminRoutes.js';
import productRoutes from './routes/productRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import CouponRoutes from './routes/couponRoutes.js';
import userRoutes from './routes/userRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import customerOrderRoutes from './routes/customerOrderRoutes.js';
import adminOrderRoutes from './routes/adminOrderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import publicCouponRoutes from './routes/publicCouponRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import reviewRoutes from "./routes/reviewRoutes.js";
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import sitemapRoutes from './routes/sitemapRoutes.js';
import robotsRoutes from './routes/robotsRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import chargesRoutes from './routes/chargesRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import sampleRoutes from './routes/sampleRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';

dotenv.config();
validateEnv();

const app = express();
const server = http.createServer(app);

// Security headers
app.use(helmet());

// Gzip compression for responses (sitemap, assets)
app.use(compression());

// ─── GLOBAL ERROR LOGGING ──────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  // Note: It's recommended to restart the process after this
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', {
    promise: promise,
    reason: reason,
    timestamp: new Date().toISOString()
  });
});

// ─── ALLOWED ORIGINS (from brand config + local dev) ───────────
const allowedOrigins = [
  brand.urls.store,
  brand.urls.admin,
  brand.urls.api,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3003",
  ...brand.extraOrigins,
].filter(Boolean);

// In development, dev servers hop to whatever port is free (3002, 3003, …),
// so allow any localhost/127.0.0.1 origin instead of whitelisting each port.
const isDev = process.env.NODE_ENV !== "production";
const isLocalhostOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

// ─── CORS CONFIG ───────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman, server-to-server, curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (isDev && isLocalhostOrigin(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for origin: " + origin), false);
    },
    credentials: true,
  })
);

// body size limit for images; capture the raw body so the Razorpay webhook can
// verify its HMAC signature against the exact bytes Razorpay signed.
app.use(express.json({
  limit: "50mb",
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static upload directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── SOCKET.IO CONFIG ──────────────────────────────────────────
const io = initSocket(server);
console.log('✅ Socket.IO initialized');

// Attach socket.io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── ROUTES ──────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/admin/coupons', CouponRoutes);
app.use('/api/coupons', publicCouponRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/orders', customerOrderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
// Sitemap (served from root)
app.use('/', sitemapRoutes);
// Robots.txt (served from root)
app.use('/', robotsRoutes);
// Media route for product images
app.use('/', mediaRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/charges', chargesRoutes);
app.use('/api/shipping', chargesRoutes);
// Continuation features: project boards, sample requests, quote requests
app.use('/api/projects', projectRoutes);
app.use('/api/samples', sampleRoutes);
app.use('/api/quotes', quoteRoutes);

// ─── 404 ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── ERROR HANDLER ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || 500;

  // Never log the request body (may contain OTPs/PII/secrets) or a stack in prod.
  console.error('❌ SERVER ERROR:', {
    message: err.message || 'Server error',
    status,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ...(isProd ? {} : { stack: err.stack }),
  });

  res.status(status).json({
    message: isProd && status === 500 ? 'Server error' : (err.message || 'Server error'),
    status,
    timestamp: new Date().toISOString(),
  });
});

// ─── START SERVER ───────────────────────────────────────────────
const PORT = process.env.PORT || 8000;

// Connect to Mongo, tidy legacy indexes, and start listening. Exported so tests
// can drive the app in-process (they connect Mongo themselves and app.listen(0)).
export async function start() {
  await connectDB();
  console.log('✅ MongoDB connected');

  // Cleanup leftover legacy indexes that reference Firebase fields removed from schema
  try {
    const indexes = await User.collection.indexes();
    const hasFirebaseIndex = indexes.some(ix => ix.name === 'firebaseUid_1');
    if (hasFirebaseIndex) {
      try {
        await User.collection.dropIndex('firebaseUid_1');
        console.log('✅ Dropped legacy index firebaseUid_1');
      } catch (dropErr) {
        console.warn('Could not drop firebaseUid_1 index:', dropErr.message || dropErr);
      }
    }
  } catch (ixErr) {
    console.warn('Could not inspect/drop legacy indexes:', ixErr.message || ixErr);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// Only auto-start when run directly (node index.js), not when imported by tests.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  start().catch((err) => {
    console.error('❌ Database connection failed', err);
    process.exit(1);
  });
}

export { app, server };

