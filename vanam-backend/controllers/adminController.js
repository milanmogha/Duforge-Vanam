// src/controllers/adminController.js

import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import AuditLog from '../models/AuditLogs.js'; // updated to match the model filename

/**
 * @desc    Authenticate admin/owner & get JWT
 * @route   POST /api/admin/login
 * @access  Public
 */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await Admin.findOne({ email: String(email).toLowerCase().trim() });
    // Generic error message — do not reveal whether the email exists.
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('Missing JWT_SECRET env var');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token, admin: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('❌ loginAdmin error:', err.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

/**
 * @desc    Fetch system logs (audit logs)
 * @route   GET /api/admin/logs
 * @access  Owner only
 */
export const getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role') // include admin info if needed
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    console.error('❌ getLogs error:', err);
    res.status(500).json({ message: 'Could not fetch logs' });
  }
};
