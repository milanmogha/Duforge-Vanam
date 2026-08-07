// userRoutes.js

import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getAllUsers,
} from '../controllers/userController.js';
import {
  verifyToken,
  verifyAdminToken,
  verifyAdminRole,
} from '../middleware/verifyToken.js';

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private (JWT-based)
 */
router.get('/profile', verifyToken, getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private (JWT-based)
 */
router.put('/profile', verifyToken, updateUserProfile);

/**
 * @route   DELETE /api/users/profile
 * @desc    Delete current user profile
 * @access  Private (JWT-based)
 */
router.delete('/profile', verifyToken, deleteUserProfile);

/**
 * @route   GET /api/users/admin/users
 * @desc    Get all users (admin only)
 * @access  Private (JWT-based, admin role)
 */
router.get(
  '/admin/users',
  verifyAdminToken,  // checks for a valid JWT and populates req.user.role
  verifyAdminRole,   // ensures req.user.role === 'admin'
  getAllUsers
);

export default router;
