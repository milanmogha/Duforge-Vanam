// utils/security.js — small, pure, unit-testable security helpers.
import crypto from 'crypto';

// Escape user input before using it inside a $regex (prevents ReDoS / injection).
export const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Constant-time compare of two strings (length-checked first).
export const timingSafeEqualStr = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

// Verify a Razorpay checkout signature: HMAC-SHA256(order_id|payment_id, secret).
export const razorpaySignatureValid = (orderId, paymentId, signature, secret) => {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return timingSafeEqualStr(expected, signature);
};

// Verify a Razorpay webhook signature against the raw request body.
export const razorpayWebhookValid = (rawBody, signature, secret) => {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEqualStr(expected, signature);
};
