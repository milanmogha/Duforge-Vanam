// config/brand.js
// Single source of truth for public brand identity on the backend.
// Used by emails, invoice PDFs, SEO/JSON-LD, sitemap, SMS copy and CORS.
// To rename the public brand later, change values here (and the matching
// config/brand.js in the storefront and admin apps). See docs/BRAND_REINVENTION.md.

const env = process.env;

const brand = {
  // Public brand (working identity — see docs/BRAND_REINVENTION.md).
  name: env.BRAND_NAME || "Vanam",
  // Legal/registered entity name. PLACEHOLDER until the owner provides the real
  // one — invoices/legal copy must not invent a legal identity.
  legalName: env.BRAND_LEGAL_NAME || "Vanam (legal entity name pending)",
  tagline: env.BRAND_TAGLINE || "Furniture in its element.",

  domain: env.BRAND_DOMAIN || "vanam.example", // UNVERIFIED — placeholder domain
  urls: {
    store: env.STORE_URL || "http://localhost:5173",
    admin: env.ADMIN_URL || "http://localhost:5174",
    api: env.API_URL || "http://localhost:8000",
  },

  support: {
    email: env.SUPPORT_EMAIL || "support@vanam.example",
    phone: env.SUPPORT_PHONE || "", // empty until provided — no fabricated number
  },

  // Extra origins (comma-separated) allowed by CORS in addition to the URLs above.
  extraOrigins: (env.EXTRA_CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  theme: {
    bg: "#101210",
    ink: "#EDE8DF",
    brass: "#B98F52",
  },

  social: {
    // Empty until real handles exist — do not fabricate.
    instagram: env.SOCIAL_INSTAGRAM || "",
    pinterest: env.SOCIAL_PINTEREST || "",
  },
};

export default brand;
