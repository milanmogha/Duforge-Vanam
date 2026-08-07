// utils/demoUsers.js
// Deterministic demo identities for LOCAL DEVELOPMENT ONLY.
// Shared by the seed script and the dev-login endpoint so they stay in sync.
//
// These are NOT secrets and NOT production accounts. The dev-login endpoint that
// consumes them is hard-gated (NODE_ENV !== 'production' AND ALLOW_DEV_LOGIN=true).

export const DEMO = {
  admin: {
    email: (process.env.SEED_ADMIN_EMAIL || 'admin@admin.com').toLowerCase(),
    password: process.env.SEED_ADMIN_PASSWORD || 'admin',
  },
  customer: {
    phone: process.env.DEMO_CUSTOMER_PHONE || '+919999900001',
    name: 'Demo Customer',
    email: 'customer@vanam.local',
    role: 'customer',
  },
  designer: {
    phone: process.env.DEMO_DESIGNER_PHONE || '+919999900002',
    name: 'Demo Designer',
    email: 'designer@vanam.local',
    role: 'designer',
  },
};

export default DEMO;
