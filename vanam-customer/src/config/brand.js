// src/config/brand.js
// Single source of truth for the storefront's brand identity.
// Rename the public brand by editing values here (and the matching
// config/brand.js in the admin and backend apps). See docs/BRAND_REINVENTION.md.

const env = import.meta.env || {};

const BRAND = {
  // Public brand (working identity — see docs/BRAND_REINVENTION.md).
  name: "Vanam",
  tagline: "Furniture in its element.",
  descriptor: "A furniture atelier.",
  // Legal/registered entity — PLACEHOLDER until provided by the owner.
  legalName: "Vanam (legal entity name pending)",

  domain: env.VITE_BRAND_DOMAIN || "vanam.example", // UNVERIFIED placeholder
  url: env.VITE_STORE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173"),

  support: {
    email: env.VITE_SUPPORT_EMAIL || "support@vanam.example",
    phone: env.VITE_SUPPORT_PHONE || "", // empty until real — never fabricate
  },

  // Light editorial "Atelier" palette (Graft-inspired redesign, 2026-07).
  colors: {
    bg: "#F2EEE6",
    surface: "#FAF8F3",
    line: "#D9D1C0",
    ink: "#1C1915",
    mist: "#5A5347",
    brass: "#8A5A32",
    moss: "#3D6B45",
  },

  // Empty until real handles exist — do not fabricate social links.
  social: {
    instagram: env.VITE_SOCIAL_INSTAGRAM || "",
    pinterest: env.VITE_SOCIAL_PINTEREST || "",
  },
};

export default BRAND;
export const BRAND_NAME = BRAND.name;
