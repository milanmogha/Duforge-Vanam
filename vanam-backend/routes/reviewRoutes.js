// routes/reviewRoutes.js

import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  canUserReviewProduct,
  createReview,
  getReviewsByProduct,
} from "../controllers/reviewController.js";


const router = express.Router();

// 0) Check if a user is eligible to review this product
//    (Must come *before* the generic `/:productId` route.)
//    The :userId param is retained for backward-compat but is IGNORED by the
//    controller, which derives the user from the JWT (IDOR fix).
router.get("/eligible/:productId/:userId", verifyToken, canUserReviewProduct);
router.get("/eligible/:productId", verifyToken, canUserReviewProduct);

// 1) POST a new review for a given product (auth required)
router.post("/:productId", verifyToken, createReview);

// 2) GET all reviews for a given product (public)
router.get("/:productId", getReviewsByProduct);

export default router;
