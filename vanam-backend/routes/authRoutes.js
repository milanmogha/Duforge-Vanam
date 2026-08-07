import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendOTP, verifyOTP } from "../utils/otpService.js";
import { rateLimit } from "../utils/rateLimit.js";
import { DEMO } from "../utils/demoUsers.js";

const router = express.Router();

// Is the dev-login convenience enabled? Hard-gated: never in production.
const devLoginEnabled = () =>
  process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_LOGIN === "true";

/**
 * POST /api/auth/dev-login  { role: 'customer' | 'designer' }
 * DEVELOPMENT ONLY. Issues a JWT for a seeded demo user without OTP so the
 * storefront's "Use Demo Customer" button works. Returns 404 in production or
 * when ALLOW_DEV_LOGIN is not 'true' (so it's invisible unless deliberately on).
 */
router.get("/dev-login/available", (req, res) => {
  res.json({ enabled: devLoginEnabled(), roles: ["customer", "designer"] });
});

router.post("/dev-login", async (req, res) => {
  if (!devLoginEnabled()) return res.status(404).json({ message: "Not found" });

  const role = req.body?.role === "designer" ? "designer" : "customer";
  const demo = DEMO[role];
  const user = await User.findOne({ phone: demo.phone });
  if (!user) {
    return res.status(404).json({ message: "Demo user not seeded. Run `npm run seed` first." });
  }
  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
  res.json({
    token,
    user: { id: user._id, phone: user.phone, name: user.name, email: user.email, role: user.role },
  });
});

// Throttle OTP endpoints to blunt SMS-bombing and OTP brute-forcing.
const sendOtpLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, bucket: "send-otp" });
const verifyOtpLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, bucket: "verify-otp" });

const normalizePhone = (raw) => String(raw || "").replace(/[^\d+]/g, "").trim();

/**
 * POST /api/auth/send-otp
 */
router.post("/send-otp", sendOtpLimiter, async (req, res) => {
  const { name, email } = req.body;
  const phone = normalizePhone(req.body.phone);
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return res.status(400).json({ message: "A valid phone number is required" });
  }

  // Ensure a User record exists (do not overwrite existing name/email)
  try {
    await User.findOneAndUpdate(
      { phone },
      { $setOnInsert: { name: name || "User", email: email || "" } },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Failed to ensure user for send-otp:', err.message);
    return res.status(500).json({ message: 'Failed to create user record' });
  }

  const result = await sendOTP(phone);
  if (!result.success) {
    // Cooldown -> 429 with Retry-After; other failures -> 502.
    if (result.retryAfter) {
      res.setHeader("Retry-After", result.retryAfter);
      return res.status(429).json({ message: result.error, retryAfter: result.retryAfter });
    }
    console.error('OTP send failed:', result.error || 'unknown');
    return res.status(502).json({ message: "Could not send OTP. Please try again." });
  }

  res.json({ success: true, message: "OTP sent" });
});

/**
 * POST /api/auth/verify-otp
 */
router.post("/verify-otp", verifyOtpLimiter, async (req, res) => {
  const { otp, name, email } = req.body;
  const phone = normalizePhone(req.body.phone);
  if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP are required" });

  try {
    const valid = await verifyOTP(phone, otp);
    if (!valid) return res.status(401).json({ message: "Invalid or expired OTP" });

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, name: name || 'User', email: email || '' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('Missing JWT_SECRET env var');
      return res.status(500).json({ message: 'Server misconfiguration' });
    }

    let expiresIn = process.env.JWT_EXPIRES_IN;
    if (!expiresIn) {
      expiresIn = '1h';
    } else if (/^\d+$/.test(String(expiresIn).trim())) {
      expiresIn = Number(String(expiresIn).trim());
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      secret,
      { expiresIn }
    );

    res.json({
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error in verify-otp route:', err.message);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

export default router;
