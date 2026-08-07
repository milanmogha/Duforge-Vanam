import express from 'express';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import sharp from 'sharp';

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Serve product images stored in MongoDB at /images/products/:id/:key
router.get('/images/products/:id/:key', async (req, res) => {
  try {
    const { id, key } = req.params;
    if (!isValidObjectId(id)) return res.status(400).send('Invalid ID');

    const product = await Product.findById(id).select('images');
    if (!product) return res.status(404).send('Not found');

    const image = product.images && product.images[key];
    if (!image || !image.data) return res.status(404).send('Image not found');

    // If client accepts WebP, transcode on-the-fly to WebP for better compression
    const accept = req.get('Accept') || '';
    res.set('Cache-Control', 'public, max-age=86400');
    if (accept.includes('image/webp')) {
      try {
        const webpBuffer = await sharp(image.data).webp({ quality: 80 }).toBuffer();
        res.set('Content-Type', 'image/webp');
        return res.send(webpBuffer);
      } catch (err) {
        console.warn('WebP conversion failed, falling back to original', err.message);
      }
    }

    res.set('Content-Type', image.contentType || 'image/jpeg');
    return res.send(image.data);
  } catch (err) {
    console.error('Failed to serve product image', err);
    res.status(500).send('Server error');
  }
});

export default router;
