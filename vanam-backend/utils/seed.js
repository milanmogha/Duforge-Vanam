// utils/seed.js
// Idempotent development seed: demo admin, demo customers, a demo address,
// a coupon, a banner, and a small catalog with generated (non-broken) images.
//
// Run with: npm run seed
// Safe to re-run — everything is upserted by a natural key.
//
// SECURITY: demo credentials come from env (with dev-only fallbacks) and are for
// LOCAL DEVELOPMENT ONLY. Never run this against a production database.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import sharp from 'sharp';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Banner from '../models/Banner.js';
import AddressBook from '../models/AddressBook.js';
import { DEMO } from './demoUsers.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vanam_dev';

// Generate a warm wood-tone product image so nothing renders as a broken image.
const makeImage = async (label, tone) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${tone[0]}'/><stop offset='1' stop-color='${tone[1]}'/>
    </linearGradient></defs>
    <rect width='800' height='800' fill='url(#g)'/>
    <g opacity='0.10' stroke='#000' stroke-width='2'>
      ${Array.from({ length: 16 }, (_, i) => `<path d='M0 ${i * 52 + 10} C 200 ${i * 52}, 600 ${i * 52 + 24}, 800 ${i * 52 + 8}'/>`).join('')}
    </g>
    <text x='400' y='420' fill='#F4EFE6' font-family='Georgia, serif' font-size='40'
      text-anchor='middle' letter-spacing='2' opacity='0.92'>${label}</text>
  </svg>`;
  const data = await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer();
  return { data, contentType: 'image/jpeg' };
};

const TONES = {
  walnut: ['#4a3524', '#6b4a30'],
  oak: ['#8a6a3f', '#a9855a'],
  teak: ['#7a4e2c', '#9a6a3c'],
  ash: ['#5b5346', '#7d7362'],
};

// Small demo catalog — clearly marked DEMO content (no fabricated claims).
const CATALOG = [
  { name: 'Aranya Three-Seat Sofa, Walnut', category: 'Living Room', subCategory: 'sofas', price: 84000, discount: 10, stock: 12, weight: 45, color: 'Walnut', primaryMaterial: 'Solid Walnut', tone: 'walnut', details: 'DEMO product. Low-slung three-seater with a solid walnut frame and wool-blend upholstery.' },
  { name: 'Kastha Lounge Chair, Oak', category: 'Living Room', subCategory: 'chairs', price: 32000, discount: 0, stock: 20, weight: 14, color: 'Oak', primaryMaterial: 'White Oak', tone: 'oak', details: 'DEMO product. Sculpted lounge chair in oiled white oak.' },
  { name: 'Patra Coffee Table, Teak', category: 'Living Room', subCategory: 'coffee-tables', price: 26000, discount: 5, stock: 18, weight: 18, color: 'Teak', primaryMaterial: 'Burma Teak', tone: 'teak', details: 'DEMO product. Rounded-edge teak coffee table with a hand-rubbed finish.' },
  { name: 'Vriksha Dining Table, Oak', category: 'Dining Room', subCategory: 'dining-tables', price: 96000, discount: 12, stock: 8, weight: 60, color: 'Oak', primaryMaterial: 'European Oak', tone: 'oak', details: 'DEMO product. Six-seat oak dining table with a book-matched top.' },
  { name: 'Taru Sideboard, Walnut', category: 'Dining Room', subCategory: 'storage', price: 72000, discount: 8, stock: 10, weight: 55, color: 'Walnut', primaryMaterial: 'American Walnut', tone: 'walnut', details: 'DEMO product. Four-door walnut sideboard with brass pulls.' },
  { name: 'Silva Platform Bed, Teak', category: 'Bedroom', subCategory: 'beds', price: 110000, discount: 15, stock: 6, weight: 80, color: 'Teak', primaryMaterial: 'Reclaimed Teak', tone: 'teak', bedSize: 'King', details: 'DEMO product. King platform bed in reclaimed teak with a floating base.' },
  { name: 'Aranya Wardrobe, Ash', category: 'Bedroom', subCategory: 'wardrobes', price: 88000, discount: 0, stock: 7, weight: 90, color: 'Ash', primaryMaterial: 'Ash Veneer', tone: 'ash', details: 'DEMO product. Three-door ash wardrobe with soft-close hinges.' },
  { name: 'Kastha Writing Desk, Oak', category: 'Office', subCategory: 'desks', price: 42000, discount: 6, stock: 15, weight: 28, color: 'Oak', primaryMaterial: 'Solid Oak', tone: 'oak', details: 'DEMO product. Compact oak writing desk with a cable channel.' },
];

const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || DEMO.admin.email).toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || DEMO.admin.password;
  let admin = await Admin.findOne({ email });
  if (admin) {
    admin.password = password; admin.role = 'owner'; await admin.save();
  } else {
    admin = await Admin.create({ name: 'Demo Admin', email, password, role: 'owner' });
  }
  console.log(`✅ Admin: ${email}`);
  return admin;
}

async function seedUsers() {
  const out = {};
  for (const key of ['customer', 'designer']) {
    const d = DEMO[key];
    out[key] = await User.findOneAndUpdate(
      { phone: d.phone },
      { $set: { name: d.name, email: d.email, role: d.role } },
      { upsert: true, new: true }
    );
    console.log(`✅ User (${key}): ${d.phone}`);
  }
  return out;
}

async function seedAddress(user) {
  const existing = await AddressBook.findOne({ user: user._id });
  if (existing) return existing;
  const addr = await AddressBook.create({
    user: user._id,
    fullName: user.name,
    phone: user.phone.replace('+91', ''),
    flat: '4B, Atelier Residences',
    area: 'Sector 54',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    isDefault: true,
  });
  console.log('✅ Demo address created for demo customer');
  return addr;
}

async function seedCatalog() {
  for (const item of CATALOG) {
    const slug = slugify(item.name);
    const image1 = await makeImage(item.color, TONES[item.tone]);
    const doc = {
      name: item.name, slug,
      category: item.category, subCategory: item.subCategory,
      color: item.color, price: item.price, discount: item.discount,
      stock: item.stock, weight: item.weight,
      primaryMaterial: item.primaryMaterial, details: item.details,
      ...(item.bedSize ? { bedSize: item.bedSize } : {}),
      images: { image1 },
    };
    await Product.findOneAndUpdate({ slug }, { $set: doc }, { upsert: true, new: true });
  }
  console.log(`✅ Catalog: ${CATALOG.length} demo products`);
}

async function seedCoupon() {
  await Coupon.findOneAndUpdate(
    { code: 'WELCOME10' },
    {
      $set: {
        code: 'WELCOME10',
        heading: 'Welcome offer',
        description: 'DEMO coupon — 10% off your first order (max ₹5,000).',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 1000, minOrderValue: 10000,
        discountPercent: 10, maxDiscountAmount: 5000, visible: true,
      },
    },
    { upsert: true }
  );
  console.log('✅ Coupon: WELCOME10');
}

async function seedBanner() {
  const count = await Banner.countDocuments();
  if (count > 0) return;
  const img = await makeImage('VANAM — New Season', ['#101210', '#2A2E2A']);
  await Banner.create({ image: img, text: 'DEMO banner', link: '/products' });
  console.log('✅ Banner: 1 demo banner');
}

(async () => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
      console.error('❌ Refusing to seed with NODE_ENV=production (set ALLOW_PROD_SEED=true to override).');
      process.exit(1);
    }
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected for seeding');
    await seedAdmin();
    const users = await seedUsers();
    await seedAddress(users.customer);
    await seedCatalog();
    await seedCoupon();
    await seedBanner();
    console.log('\n🌱 Seed complete. Demo logins are documented in docs/LOCAL_DEVELOPMENT.md');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
})();
