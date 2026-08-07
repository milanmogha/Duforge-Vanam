// src/config/brand.js — admin brand identity (single source of truth).
// Keep in sync with the storefront and backend config/brand.js.
// See docs/BRAND_REINVENTION.md.

const env = import.meta.env || {};

const BRAND = {
  name: "Vanam",
  tagline: "Atelier operations",
  storeUrl: env.VITE_STORE_URL || "http://localhost:5173",
  apiUrl: env.VITE_API_URL || "http://localhost:8000",
  colors: {
    bg: "#101210",
    ink: "#EDE8DF",
    brass: "#B98F52",
  },
};

export default BRAND;
export const BRAND_NAME = BRAND.name;
