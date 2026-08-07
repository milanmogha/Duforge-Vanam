// models/QuoteRequest.js — bulk / custom / trade quote requests.
import mongoose from 'mongoose';

export const QUOTE_STATUSES = ['SUBMITTED', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'DECLINED', 'CLOSED'];

const quoteItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, default: '' }, // free-text fallback for non-catalog items
    quantity: { type: Number, default: 1, min: 1 },
    dimensions: { type: String, default: '' },
    note: { type: String, default: '', maxlength: 500 },
  },
  { _id: false }
);

const quoteRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, default: '', maxlength: 200 },
    projectType: { type: String, default: '' }, // residential | commercial | hospitality...
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    items: { type: [quoteItemSchema], default: [] },
    details: { type: String, default: '', maxlength: 2000 },
    status: { type: String, enum: QUOTE_STATUSES, default: 'SUBMITTED', index: true },
    // Admin-provided response metadata (no automated pricing — see docs).
    adminNote: { type: String, default: '', maxlength: 2000 },
    quotedAmount: { type: Number, default: null },
    quotedValidUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

export const QuoteRequest = mongoose.model('QuoteRequest', quoteRequestSchema);
export default QuoteRequest;
