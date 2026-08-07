// models/Review.js

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    // userId is the MongoDB user _id
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Changed from String to ObjectId
      required: true,
      ref: "User", // Reference to the User model
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
