// config/validateEnv.js
// Fail fast on missing critical config; warn on optional-but-important config.

export default function validateEnv() {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter((k) => !process.env[k] || !String(process.env[k]).trim());

  if (missing.length) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Copy .env.example to .env and fill these in. See docs/LOCAL_DEVELOPMENT.md');
    process.exit(1);
  }

  if (String(process.env.JWT_SECRET).length < 16) {
    console.error('❌ JWT_SECRET is too short. Use a random string of at least 32 characters.');
    process.exit(1);
  }

  const warnIfMissing = {
    RAZORPAY_KEY_ID: 'Razorpay checkout will be disabled',
    RAZORPAY_KEY_SECRET: 'Razorpay checkout will be disabled',
    RAZORPAY_WEBHOOK_SECRET: 'Razorpay webhook reconciliation will be disabled',
    FAST2SMS_API_KEY: 'OTP SMS will fail unless SMS_DEV_MODE=true',
  };
  for (const [key, effect] of Object.entries(warnIfMissing)) {
    if (!process.env[key]) console.warn(`⚠️  ${key} not set — ${effect}.`);
  }
}
