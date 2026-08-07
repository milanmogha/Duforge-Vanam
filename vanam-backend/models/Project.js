// models/Project.js — customer "project boards" (moodboard of saved products).
import mongoose from 'mongoose';

const projectItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    finish: { type: String, default: '' },
    room: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1, max: 999 },
    note: { type: String, default: '', maxlength: 500 },
  },
  { _id: true, timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 1000 },
    items: { type: [projectItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);
export default Project;
