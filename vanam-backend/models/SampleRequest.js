// models/SampleRequest.js — customer requests a physical material sample.
import mongoose from 'mongoose';

export const SAMPLE_STATUSES = ['REQUESTED', 'REVIEWING', 'APPROVED', 'DISPATCHED', 'DELIVERED', 'REJECTED'];

const sampleRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    finish: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1, max: 10 },
    address: { type: mongoose.Schema.Types.ObjectId, ref: 'AddressBook' },
    note: { type: String, default: '', maxlength: 500 },
    status: { type: String, enum: SAMPLE_STATUSES, default: 'REQUESTED', index: true },
    adminNote: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

export const SampleRequest = mongoose.model('SampleRequest', sampleRequestSchema);
export default SampleRequest;
