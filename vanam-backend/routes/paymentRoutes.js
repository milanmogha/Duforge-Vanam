// /routes/paymentRoutes.js

import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
} from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { rateLimit } from '../utils/rateLimit.js';

const router = express.Router();

const paymentLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, bucket: 'payment' });

// Create order — authenticated; server computes the authoritative amount.
router.post('/create-order', paymentLimiter, verifyToken, createRazorpayOrder);

// Verify — authenticated; identity comes from the JWT, order comes from the
// server-signed draft token (not from the request body).
router.post('/verify', verifyToken, verifyRazorpayPayment);

// Webhook — no user auth; authenticity is the Razorpay HMAC signature.
router.post('/webhook', razorpayWebhook);

export default router;
