// /controllers/paymentController.js
//
// Server-authoritative Razorpay flow. The client never dictates the amount,
// the breakdown, or the user id. See docs/PAYMENT_ARCHITECTURE.md.

import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { processOrderCreation } from './orderController.js';
import { Order } from '../models/Orders.js';
import AddressBook from '../models/AddressBook.js';
import shippingService from '../utils/shippingService.js';
import { razorpaySignatureValid, razorpayWebhookValid } from '../utils/security.js';

// Validate Razorpay configuration at startup
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ Razorpay credentials not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const DRAFT_TOKEN_TTL = '20m';

// Normalize the client's cart reference into [{ product, quantity }] with
// positive integer quantities. Product identity is validated against the DB
// inside the pricing step; nothing about money is trusted here.
const normalizeItems = (rawItems) =>
  (Array.isArray(rawItems) ? rawItems : [])
    .map((it) => ({
      product: typeof it.product === 'object' ? it.product?._id : it.product,
      quantity: Math.max(1, Math.min(999, parseInt(it.quantity, 10) || 1)),
    }))
    .filter((it) => it.product && mongoose.Types.ObjectId.isValid(it.product));

/**
 * POST /api/payment/create-order  (auth required)
 * Body: { items:[{product,quantity}], addressId, couponCode? }
 * Server recomputes the authoritative amount, creates the Razorpay order for
 * exactly that amount, and returns a signed draft token capturing the order.
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Payment gateway not configured.' });
    }

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const items = normalizeItems(req.body.items);
    const { addressId, couponCode = null } = req.body;

    if (!items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty or invalid.' });
    }
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ success: false, message: 'A valid delivery address is required.' });
    }

    // Address must belong to the requesting user (prevents using someone else's pincode/zone).
    const address = await AddressBook.findOne({ _id: addressId, user: userId });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });

    // Authoritative pricing from DB prices + resolved zone + validated coupon.
    const breakdown = await shippingService.calculateCharges({
      items,
      pincode: address.pincode,
      couponCode,
      userId,
    });

    if (!breakdown.total || breakdown.total <= 0) {
      return res.status(400).json({ success: false, message: 'Order total could not be computed.' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(breakdown.total * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { userId: String(userId) },
    });

    // Signed draft: the ONLY source of truth used at verification time.
    const draftToken = jwt.sign(
      {
        purpose: 'order-draft',
        userId: String(userId),
        razorpayOrderId: order.id,
        addressId: String(addressId),
        items,
        couponCode: breakdown.couponCode || null,
        breakdown: {
          itemsTotal: breakdown.itemsTotal,
          tax: breakdown.tax,
          shipping: breakdown.shipping,
          discount: breakdown.discount,
          total: breakdown.total,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: DRAFT_TOKEN_TTL }
    );

    console.log('🧾 Razorpay order created:', order.id, '₹', breakdown.total);

    return res.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      breakdown: {
        itemsTotal: breakdown.itemsTotal,
        tax: breakdown.tax,
        shipping: breakdown.shipping,
        discount: breakdown.discount,
        total: breakdown.total,
        zone: breakdown.zone,
      },
      draftToken,
    });
  } catch (error) {
    console.error('❌ createRazorpayOrder error:', error?.error?.description || error.message);
    return res.status(500).json({ success: false, message: 'Failed to create payment order. Please try again.' });
  }
};

// Build the Order document payload from a verified server-signed draft.
const orderDataFromDraft = (draft, razorpayDetails) => ({
  userAddress: draft.addressId,
  paymentMethod: 'Online',
  products: draft.items,
  paymentBreakdown: draft.breakdown,
  couponCode: draft.couponCode || null,
  razorpayDetails,
});

/**
 * POST /api/payment/verify  (auth required)
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, draftToken }
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, draftToken } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !draftToken) {
      return res.status(400).json({ success: false, message: 'Missing required payment parameters.' });
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Payment gateway not configured.' });
    }

    // 1. HMAC signature (order_id|payment_id) — timing-safe compare.
    const sigOk = razorpaySignatureValid(
      razorpay_order_id, razorpay_payment_id, razorpay_signature, process.env.RAZORPAY_KEY_SECRET
    );
    if (!sigOk) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    // 2. Verify the server-signed draft and bind it to this user + this order.
    let draft;
    try {
      draft = jwt.verify(draftToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Payment session expired. Please retry checkout.' });
    }
    if (
      draft.purpose !== 'order-draft' ||
      String(draft.userId) !== String(userId) ||
      draft.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({ success: false, message: 'Payment session mismatch.' });
    }

    // 3. Idempotency — if this Razorpay order already produced an order, return it.
    const existing = await Order.findOne({ 'razorpayDetails.orderId': razorpay_order_id })
      .populate('products.product')
      .populate('userAddress');
    if (existing) {
      return res.status(200).json({ success: true, message: 'Order already placed', order: existing });
    }

    // 4. Create the order strictly from the draft (never from client body).
    const orderData = orderDataFromDraft(draft, {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    const newOrder = await processOrderCreation(orderData, userId, req.io);
    return res.status(200).json({ success: true, message: 'Order Placed Successfully', order: newOrder });
  } catch (err) {
    console.error('❌ verifyRazorpayPayment error:', err.message);
    return res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
};

/**
 * POST /api/payment/webhook
 * Independent, idempotent reconciliation of Razorpay events. Uses the raw body
 * captured by the express.json `verify` hook in index.js.
 */
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set.');
      return res.status(503).json({ received: false });
    }

    const signature = req.headers['x-razorpay-signature'];
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body));
    if (!razorpayWebhookValid(raw, signature, secret)) {
      return res.status(400).json({ received: false, message: 'Invalid webhook signature.' });
    }

    const event = req.body?.event;
    const entity = req.body?.payload?.payment?.entity;
    const razorpayOrderId = entity?.order_id;

    if (razorpayOrderId && (event === 'payment.captured' || event === 'payment.failed')) {
      const status = event === 'payment.captured' ? 'CAPTURED' : 'FAILED';
      // Idempotent: only touch an order we already have; never create from a webhook.
      await Order.findOneAndUpdate(
        { 'razorpayDetails.orderId': razorpayOrderId },
        { $set: { paymentStatus: status } }
      );
    }

    // Always 200 quickly so Razorpay stops retrying a handled event.
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ razorpayWebhook error:', err.message);
    return res.status(200).json({ received: true }); // avoid infinite retries on our bug
  }
};
