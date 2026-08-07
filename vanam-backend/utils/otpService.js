import crypto from "crypto";
import Otp from "../models/Otp.js";
import { sendSMS } from "./smsService.js";
import brand from "../config/brand.js";

const hashOTP = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

// Config with safe defaults (fixes the NaN-expiry bug when env is unset).
const EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) > 0
  ? Number(process.env.OTP_EXPIRY_MINUTES)
  : 10;
const RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) > 0
  ? Number(process.env.OTP_RESEND_COOLDOWN_SECONDS)
  : 30;
const MAX_VERIFY_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) > 0
  ? Number(process.env.OTP_MAX_ATTEMPTS)
  : 5;

/**
 * Generate + send an OTP. Enforces a per-phone resend cooldown so the endpoint
 * cannot be abused for SMS bombing / cost abuse.
 * @returns {{success:boolean, error?:string, retryAfter?:number}}
 */
export const sendOTP = async (phone) => {
  const existing = await Otp.findOne({ phone });
  if (existing?.lastSentAt) {
    const elapsedMs = Date.now() - new Date(existing.lastSentAt).getTime();
    const waitMs = RESEND_COOLDOWN_SECONDS * 1000 - elapsedMs;
    if (waitMs > 0) {
      return {
        success: false,
        error: "OTP recently sent. Please wait before requesting another.",
        retryAfter: Math.ceil(waitMs / 1000),
      };
    }
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOTP(otp);
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await Otp.findOneAndUpdate(
    { phone },
    { otpHash, expiresAt, attempts: 0, lastSentAt: new Date() },
    { upsert: true, new: true }
  );

  const message = `Your ${brand.name} OTP is ${otp}. Valid for ${EXPIRY_MINUTES} minutes. Do not share.`;
  return sendSMS(phone, message);
};

/**
 * Verify an OTP with brute-force protection: a bounded number of attempts per
 * issued OTP, and expiry enforcement. The OTP is consumed on success and also
 * once the attempt ceiling is reached.
 */
export const verifyOTP = async (phone, otp) => {
  const record = await Otp.findOne({ phone });
  if (!record) return false;

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ phone });
    return false;
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    // Too many wrong guesses — invalidate so the attacker must request a new OTP
    // (which is itself rate-limited).
    await Otp.deleteOne({ phone });
    return false;
  }

  const isValid = record.otpHash === hashOTP(String(otp));
  if (isValid) {
    await Otp.deleteOne({ phone });
    return true;
  }

  await Otp.updateOne({ phone }, { $inc: { attempts: 1 } });
  return false;
};
