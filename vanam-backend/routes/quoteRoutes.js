import express from 'express';
import { verifyToken, verifyAdminToken, verifyAdminRole } from '../middleware/verifyToken.js';
import {
  createQuoteRequest, listMyQuoteRequests, adminListQuoteRequests, adminUpdateQuote,
} from '../controllers/quoteController.js';

const router = express.Router();

// Customer
router.post('/', verifyToken, createQuoteRequest);
router.get('/mine', verifyToken, listMyQuoteRequests);

// Admin
router.get('/admin', verifyAdminToken, verifyAdminRole, adminListQuoteRequests);
router.put('/admin/:id', verifyAdminToken, verifyAdminRole, adminUpdateQuote);

export default router;
