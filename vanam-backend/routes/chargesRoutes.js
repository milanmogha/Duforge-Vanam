// chargeRoutes.js

import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import shippingService from '../utils/shippingService.js';
import AddressBook from '../models/AddressBook.js';

const router = express.Router();

router.post('/calculate', verifyToken, async (req, res) => {
  try {
    const { items, pincode, district, couponCode } = req.body;
    if (!Array.isArray(items) || !pincode) {
      return res.status(400).json({ message: 'items and pincode are required' });
    }
    const result = await shippingService.calculateCharges({
      items,
      pincode,
      district,
      couponCode,
      userId: req.user?.userId,
    });
    return res.json(result);
  } catch (err) {
    console.error('Charges calculate failed', err);
    res.status(500).json({ message: 'Failed to calculate charges' });
  }
});

router.post('/calculate-dynamic', verifyToken, async (req, res) => {
  try {
    const { addressId, products, couponCode } = req.body;

    if (!addressId || !Array.isArray(products)) {
      return res.status(400).json({ error: 'addressId and products are required' });
    }

    const address = await AddressBook.findById(addressId);
    if (!address) {
      return res.status(400).json({ error: 'Invalid address ID' });
    }

    const shippingDetails = await shippingService.calculateCharges({
      items: products,
      pincode: address.pincode,
      couponCode,
      userId: req.user.userId,
    });

    return res.json(shippingDetails);
  } catch (error) {
    console.error('Shipping calculation failed:', error);
    return res.status(500).json({
      error: 'Failed to calculate shipping charges',
      message: error.message,
    });
  }
});

export default router;
