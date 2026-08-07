// utils/adminSeeder.js
// Creates/updates a single admin account from environment variables.
// For a full catalog + demo-user seed, use `npm run seed` (utils/seed.js).
//
// Required env: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD. Never hardcode credentials.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerceDB';

const seedAdmin = async () => {
  const email = (process.env.SEED_ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error('❌ Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env before seeding an admin.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ SEED_ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected for seeding');

    let admin = await Admin.findOne({ email });
    if (admin) {
      admin.password = password; // re-hashed by pre-save hook
      admin.role = admin.role || 'owner';
      await admin.save();
      console.log('✅ Admin password updated:', email);
    } else {
      admin = await Admin.create({ name: 'Administrator', email, password, role: 'owner' });
      console.log('✅ Admin user created:', email);
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
