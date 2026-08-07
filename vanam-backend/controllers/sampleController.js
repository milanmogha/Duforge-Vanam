// controllers/sampleController.js
import mongoose from 'mongoose';
import SampleRequest, { SAMPLE_STATUSES } from '../models/SampleRequest.js';
import { createNotification } from './notificationController.js';

const valid = (id) => mongoose.Types.ObjectId.isValid(id);

// ── Customer ──────────────────────────────────────────────────────
export const createSampleRequest = async (req, res) => {
  try {
    const { product, finish = '', quantity = 1, address, note = '' } = req.body;
    if (!valid(product)) return res.status(400).json({ message: 'Valid product is required' });
    const doc = await SampleRequest.create({
      user: req.user.userId,
      product,
      finish: String(finish).slice(0, 60),
      quantity: Math.max(1, Math.min(10, parseInt(quantity, 10) || 1)),
      address: valid(address) ? address : undefined,
      note: String(note).slice(0, 500),
    });
    try {
      await createNotification({
        type: 'SAMPLE_REQUEST',
        title: 'New sample request',
        message: `A sample was requested (${doc.finish || 'default finish'}).`,
        link: `/admin/samples`,
        priority: 'medium',
      });
    } catch { /* non-blocking */ }
    res.status(201).json(doc);
  } catch (err) {
    console.error('createSampleRequest error:', err.message);
    res.status(500).json({ message: 'Failed to create sample request' });
  }
};

export const listMySampleRequests = async (req, res) => {
  try {
    const rows = await SampleRequest.find({ user: req.user.userId })
      .populate('product', 'name slug images.image1')
      .sort({ createdAt: -1 })
      .lean();
    for (const r of rows) {
      const img = r.product?.images?.image1;
      if (img?.data) {
        r.product.imageUrl = `data:${img.contentType};base64,${img.data.toString('base64')}`;
        delete r.product.images;
      }
    }
    res.json(rows);
  } catch (err) {
    console.error('listMySampleRequests error:', err.message);
    res.status(500).json({ message: 'Failed to load sample requests' });
  }
};

// ── Admin ─────────────────────────────────────────────────────────
export const adminListSampleRequests = async (req, res) => {
  try {
    const rows = await SampleRequest.find()
      .populate('product', 'name slug')
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(rows);
  } catch (err) {
    console.error('adminListSampleRequests error:', err.message);
    res.status(500).json({ message: 'Failed to load sample requests' });
  }
};

export const adminUpdateSampleStatus = async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const { status, adminNote } = req.body;
    if (status && !SAMPLE_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = String(adminNote).slice(0, 1000);
    const doc = await SampleRequest.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Sample request not found' });
    res.json(doc);
  } catch (err) {
    console.error('adminUpdateSampleStatus error:', err.message);
    res.status(500).json({ message: 'Failed to update sample request' });
  }
};
