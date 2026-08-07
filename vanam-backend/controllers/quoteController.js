// controllers/quoteController.js
import mongoose from 'mongoose';
import QuoteRequest, { QUOTE_STATUSES } from '../models/QuoteRequest.js';
import { createNotification } from './notificationController.js';

const valid = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((it) => ({
      product: valid(it.product) ? it.product : undefined,
      name: String(it.name || '').slice(0, 200),
      quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
      dimensions: String(it.dimensions || '').slice(0, 120),
      note: String(it.note || '').slice(0, 500),
    }))
    .filter((it) => it.product || it.name);

// ── Customer ──────────────────────────────────────────────────────
export const createQuoteRequest = async (req, res) => {
  try {
    const { company = '', projectType = '', contactEmail = '', contactPhone = '', items, details = '' } = req.body;
    const normItems = normalizeItems(items);
    if (!normItems.length && !String(details).trim()) {
      return res.status(400).json({ message: 'Add at least one item or project details' });
    }
    const doc = await QuoteRequest.create({
      user: req.user.userId,
      company: String(company).slice(0, 200),
      projectType: String(projectType).slice(0, 60),
      contactEmail: String(contactEmail).slice(0, 200),
      contactPhone: String(contactPhone).slice(0, 40),
      items: normItems,
      details: String(details).slice(0, 2000),
    });
    try {
      await createNotification({
        type: 'QUOTE_REQUEST',
        title: 'New quote request',
        message: `Quote request${company ? ` from ${company}` : ''} (${normItems.length} item(s)).`,
        link: `/admin/quotes`,
        priority: 'high',
      });
    } catch { /* non-blocking */ }
    res.status(201).json(doc);
  } catch (err) {
    console.error('createQuoteRequest error:', err.message);
    res.status(500).json({ message: 'Failed to create quote request' });
  }
};

export const listMyQuoteRequests = async (req, res) => {
  try {
    const rows = await QuoteRequest.find({ user: req.user.userId })
      .populate('items.product', 'name slug')
      .sort({ createdAt: -1 })
      .lean();
    res.json(rows);
  } catch (err) {
    console.error('listMyQuoteRequests error:', err.message);
    res.status(500).json({ message: 'Failed to load quote requests' });
  }
};

// ── Admin ─────────────────────────────────────────────────────────
export const adminListQuoteRequests = async (req, res) => {
  try {
    const rows = await QuoteRequest.find()
      .populate('items.product', 'name slug')
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(rows);
  } catch (err) {
    console.error('adminListQuoteRequests error:', err.message);
    res.status(500).json({ message: 'Failed to load quote requests' });
  }
};

export const adminUpdateQuote = async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const { status, adminNote, quotedAmount, quotedValidUntil } = req.body;
    if (status && !QUOTE_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = String(adminNote).slice(0, 2000);
    if (quotedAmount !== undefined) update.quotedAmount = quotedAmount === null ? null : Number(quotedAmount);
    if (quotedValidUntil !== undefined) update.quotedValidUntil = quotedValidUntil ? new Date(quotedValidUntil) : null;
    const doc = await QuoteRequest.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Quote request not found' });
    res.json(doc);
  } catch (err) {
    console.error('adminUpdateQuote error:', err.message);
    res.status(500).json({ message: 'Failed to update quote request' });
  }
};
