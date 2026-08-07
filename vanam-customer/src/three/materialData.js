// src/three/materialData.js
// Pure data about finishes and panel construction — NO three.js import.
// Safe to use from any page without pulling WebGL code into its chunk.
// (Scene modules re-export these for backwards compatibility.)

export const FINISHES = {
  walnut: { label: 'Walnut', base: '#5a4030', grain: '#3a2718', roughness: 0.55 },
  oak: { label: 'Oak', base: '#a9855a', grain: '#7c5f37', roughness: 0.6 },
  teak: { label: 'Teak', base: '#8a5a32', grain: '#5f3c1f', roughness: 0.5 },
  ebonized: { label: 'Ebonized', base: '#2a2622', grain: '#141210', roughness: 0.4 },
};

// Bottom → top. `gap` is the exploded offset (multiplied by progress).
// DEMO/illustrative construction — not a claim about a specific product.
export const LAYERS = [
  { key: 'backing', label: 'Backing layer', color: '#3a2f27', thickness: 0.18, y: -0.55, gap: -1.1 },
  { key: 'core', label: 'Structural core', color: '#6a5844', thickness: 0.42, y: -0.1, gap: 0 },
  { key: 'decor', label: 'Decorative layer', color: null, thickness: 0.12, y: 0.28, gap: 1.0 },
  { key: 'finish', label: 'Surface finish', color: null, thickness: 0.06, y: 0.5, gap: 2.0 },
];

// Dispose generated GPU textures without statically importing three.js.
// No-op if the woodTexture module was never loaded is fine — the dynamic
// import only executes when called (on unmount of a 3D view).
export function disposeWoodTexturesAsync() {
  import('./woodTexture').then((m) => m.disposeWoodTextures()).catch(() => {});
}

// Lighting presets (three-free data; scenes re-export them).
export const LIGHTING = {
  daylight: { key: 'daylight', label: 'Daylight', color: '#eaf0ff', intensity: 2.2, ambient: 0.5 },
  warm: { key: 'warm', label: 'Warm interior', color: '#f4d9a8', intensity: 2.0, ambient: 0.35 },
  studio: { key: 'studio', label: 'Neutral studio', color: '#ffffff', intensity: 1.6, ambient: 0.7 },
};

export const ROOM_LIGHTING = {
  daylight: { label: 'Daylight', color: '#eaf0ff', intensity: 2.4, ambient: 0.55 },
  warm: { label: 'Warm interior', color: '#f4d9a8', intensity: 2.0, ambient: 0.4 },
  studio: { label: 'Neutral studio', color: '#ffffff', intensity: 1.7, ambient: 0.7 },
};

// Map a product's category text to a procedural furniture model type.
// Three-free — safe to call from any page.
export function furnitureTypeFromProduct(p) {
  const s = `${p?.childCategory || ''} ${p?.subCategory || ''} ${p?.category || ''} ${p?.name || ''}`.toLowerCase();
  if (/sofa|recliner|couch|lounge/.test(s)) return 'sofa';
  if (/bed(?!side)|mattress/.test(s)) return 'bed';
  if (/wardrobe|almirah|cupboard/.test(s)) return 'wardrobe';
  if (/bookshelf|shelf|shelving|bookcase/.test(s)) return 'shelf';
  if (/desk|workstation|study/.test(s)) return 'desk';
  if (/tv unit|sideboard|console|cabinet/.test(s)) return 'sideboard';
  if (/coffee table|side table|nightstand/.test(s)) return 'coffee';
  if (/chair|seating|stool/.test(s)) return 'chair';
  if (/table|dining/.test(s)) return 'table';
  return 'table';
}
