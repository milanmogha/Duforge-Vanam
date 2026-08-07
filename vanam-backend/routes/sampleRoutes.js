import express from 'express';
import { verifyToken, verifyAdminToken, verifyAdminRole } from '../middleware/verifyToken.js';
import {
  createSampleRequest, listMySampleRequests, adminListSampleRequests, adminUpdateSampleStatus,
} from '../controllers/sampleController.js';

const router = express.Router();

// Customer
router.post('/', verifyToken, createSampleRequest);
router.get('/mine', verifyToken, listMySampleRequests);

// Admin
router.get('/admin', verifyAdminToken, verifyAdminRole, adminListSampleRequests);
router.put('/admin/:id', verifyAdminToken, verifyAdminRole, adminUpdateSampleStatus);

export default router;
