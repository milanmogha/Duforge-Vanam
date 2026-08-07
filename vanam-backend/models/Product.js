// backend/models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, unique: true, sparse: true },

    // Slug-based categories (frontend contract)
    category: { type: String, required: true, trim: true },      // e.g. "furniture"
    subCategory: { type: String, trim: true },                    // e.g. "living-room"
    childCategory: { type: String, trim: true },                  // e.g. "sofas"

    color: { type: String, trim: true },

    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    weight: { type: Number, default: 1 }, // Weight in KG for delivery charge calculation
    details: { type: String },
    discount: { type: Number, default: 0 },

    // Dynamic filter fields for furniture-specific attributes
    bedSize: { type: String, trim: true },
    primaryMaterial: { type: String, trim: true },
    storageIncluded: { type: String, trim: true },
    seatingCapacity: { type: String, trim: true },
    sofaType: { type: String, trim: true },
    wardrobeType: { type: String, trim: true },
    numberOfDoors: { type: String, trim: true },
    tableShape: { type: String, trim: true },
    chairType: { type: String, trim: true },
    adjustableHeight: { type: String, trim: true },
    wheelBase: { type: String, trim: true },
    materialType: { type: String, trim: true },
    dishwasherSafe: { type: String, trim: true },
    ovenSafe: { type: String, trim: true },
    numberOfPieces: { type: String, trim: true },
    lightType: { type: String, trim: true },
    powerSource: { type: String, trim: true },
    frameType: { type: String, trim: true },
    threadCount: { type: String, trim: true },
    fabricType: { type: String, trim: true },
    pattern: { type: String, trim: true },
    brand: { type: String, trim: true },

    images: {
      image1: { data: Buffer, contentType: String },
      image2: { data: Buffer, contentType: String },
      image3: { data: Buffer, contentType: String },
      image4: { data: Buffer, contentType: String },
      image5: { data: Buffer, contentType: String },
    },

    rating: {
      count: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Indexes for fast filtering
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ childCategory: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
