import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },

  name: { type: String, default: "User" },

  email: { type: String, default: "" },

  role: { type: String, default: "customer" },

  otp: { type: String, default: null },

  otpExpiresAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
