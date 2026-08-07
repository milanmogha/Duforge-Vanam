// Order.js 

import mongoose from 'mongoose';
import crypto from 'crypto';

const { Schema, model, Types } = mongoose;

// Sub-schemas (orderedProductSchema, paymentBreakdownSchema) remain the same...
const orderedProductSchema = new Schema(
  {
    product:  { type: Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const paymentBreakdownSchema = new Schema(
  {
    itemsTotal: { type: Number, required: true },
    tax:        { type: Number, required: true },
    shipping:   { type: Number, required: true },
    discount:   { type: Number, default: 0 },
    total:      { type: Number, required: true }
  },
  { _id: false }
);


// Main Order schema
const orderSchema = new Schema(
  {
    // *** NEW FIELD ADDED HERE ***
    user: {
        type: mongoose.Schema.Types.ObjectId, // Changed from String to ObjectId
        ref: 'User', // Reference to the User model
        required: true,
        index: true,
    },
    orderId: {
      type: String,
      unique: true,
      index: true
    },
    userAddress: {
      type: Types.ObjectId,
      ref: 'AddressBook',
      required: true
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['CashOnDelivery', 'Card', 'UPI', 'NetBanking', 'Online']
    },
    paymentBreakdown: {
      type: paymentBreakdownSchema,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    // Payment lifecycle, independent of fulfilment status.
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'CREATED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING'
    },
    trackingLink: {
      type: String,
      default: null
    },
    // Notification flags to track SMS delivery per stage
    notificationFlags: {
      confirmed_sms_sent: { type: Boolean, default: false },
      shipped_sms_sent: { type: Boolean, default: false },
      delivered_sms_sent: { type: Boolean, default: false },
      cancelled_sms_sent: { type: Boolean, default: false }
    },
    products: {
      type: [orderedProductSchema],
      required: true
    },
    couponCode: {
      type: String,
      default: null
    },
    razorpayDetails: { // To store payment gateway info
        type: Object,
        default: {}
    }
  },
  {
    timestamps: true
  }
);

// Pre-validation hook for orderId remains the same...
orderSchema.pre('validate', function (next) {
  if (this.isNew) {
    const timestamp = Date.now();
    const randomComponent = crypto.randomBytes(2).toString('hex');
    this.orderId = `OD-${timestamp}-${randomComponent}`;
  }
  next();
});

// One order per Razorpay order — enforces payment idempotency at the DB level.
// Sparse so COD orders (no razorpayDetails.orderId) don't collide on null.
orderSchema.index({ 'razorpayDetails.orderId': 1 }, { unique: true, sparse: true });


export const Order = model('Order', orderSchema);
