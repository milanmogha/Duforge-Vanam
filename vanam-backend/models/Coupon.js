// models/Coupon.js

import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    heading: { type: String, required: true },
    description: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 }, // Cap for percentage-based discounts

    // Array of User ObjectId who have used this coupon
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // If a coupon is invisible, only assignedTo can use it
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // if true → show publicly. if false → only assignedTo can call apply
    visible: { type: Boolean, default: true },

    // Optional: categories this coupon applies to
    applicableCategories: {
      type: [String],
      default: []
    },
    
    // Optional: specific products this coupon applies to
    applicableProducts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Product',
      default: []
    },

    // Coupon type
    type: {
      type: String,
      enum: ['DISCOUNT', 'FREE_SHIPPING'],
      default: 'DISCOUNT'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Coupon', couponSchema);
