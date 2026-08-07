import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  resendCount: { type: Number, default: 0 },
  // Number of failed verification attempts against the current OTP.
  attempts: { type: Number, default: 0 },
  // When the most recent OTP was issued (for resend throttling).
  lastSentAt: { type: Date, default: Date.now }
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);
