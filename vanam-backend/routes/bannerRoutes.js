import express from 'express';
import multer from 'multer';
import { getBanners, addBanner, deleteBanner } from '../controllers/bannerController.js';
import { verifyAdminToken, verifyAdminRole } from '../middleware/verifyToken.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|avif)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// Fetch all banners (public)
router.get('/', getBanners);

// Add a new banner — admin only (previously UNAUTHENTICATED — critical fix)
// Expect multipart/form-data with fields:
//  - image: the banner image file
//  - text:  optional banner text
//  - link:  optional URL to apply to the banner
router.post('/', verifyAdminToken, verifyAdminRole, upload.single('image'), addBanner);

// Delete a banner by ID — admin only
router.delete('/:id', verifyAdminToken, verifyAdminRole, deleteBanner);

/**
 * @route   GET /api/banners/public
 * @desc    Fetch all banners for the public/customer portal
 * @access  Public
 */
router.get('/public', getBanners);

export default router;
