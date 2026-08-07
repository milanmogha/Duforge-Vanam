// backend/routes/productRoutes.js
import express from "express";
import multer from "multer";
import {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { verifyAdminToken, verifyAdminRole } from "../middleware/verifyToken.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|avif)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error("Only PNG, JPEG, WEBP or AVIF images are allowed"));
  },
});

const uploadFields = upload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
  { name: "image5", maxCount: 1 },
]);

// Public reads
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin-only writes (previously UNAUTHENTICATED — critical fix)
router.post("/", verifyAdminToken, verifyAdminRole, uploadFields, addProduct);
router.put("/:id", verifyAdminToken, verifyAdminRole, uploadFields, updateProduct);
router.delete("/:id", verifyAdminToken, verifyAdminRole, deleteProduct);

export default router;
