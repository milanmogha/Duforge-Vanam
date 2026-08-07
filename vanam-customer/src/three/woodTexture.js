// src/three/woodTexture.js
// Procedurally generates wood-grain textures on a <canvas> at runtime.
// ORIGINAL, GENERATED assets — no third-party downloads, no licensing concerns
// (recorded as "original, generated" in docs/ASSET_LICENSES.md).

import * as THREE from 'three';
import { FINISHES } from './materialData';

// Named finishes → base/grain colors, defined in materialData (three-free).
// Re-exported here so scene modules keep a single import site.
export { FINISHES };

// Cheap value-noise so grain looks organic without a texture download.
function noise2D(seed) {
  const table = new Float32Array(256);
  let s = seed || 1;
  for (let i = 0; i < 256; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    table[i] = (s % 1000) / 1000;
  }
  return (x, y) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    return table[(xi + table[yi] * 255 | 0) & 255];
  };
}

function drawGrain(ctx, size, finish, seed) {
  const n = noise2D(seed);
  ctx.fillStyle = finish.base;
  ctx.fillRect(0, 0, size, size);

  // Concentric-ish grain lines warped by noise → plank-like figure.
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = finish.grain;
  ctx.lineWidth = 1.5;
  const rings = 46;
  for (let r = 0; r < rings; r++) {
    ctx.beginPath();
    for (let x = 0; x <= size; x += 4) {
      const warp = (n(x * 0.02, r * 0.6) - 0.5) * 26;
      const y = (r / rings) * size + warp + Math.sin(x * 0.01 + r) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Fine speckle for micro-texture.
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < size * 3; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

// Grayscale height field from the SAME grain, so the bump lines up exactly with
// the colour. Flat mid-grey = no displacement; the darker grain lines read as
// shallow troughs, which is what makes an otherwise matte colormap catch light
// like a finished plank.
function drawBump(ctx, size, seed) {
  const n = noise2D(seed);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1.5;
  const rings = 46;
  for (let r = 0; r < rings; r++) {
    ctx.beginPath();
    for (let x = 0; x <= size; x += 4) {
      const warp = (n(x * 0.02, r * 0.6) - 0.5) * 26;
      const y = (r / rings) * size + warp + Math.sin(x * 0.01 + r) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

const cache = new Map();
const bumpCache = new Map();

export function getWoodTexture(finishKey = 'walnut', size = 512) {
  const key = `${finishKey}:${size}`;
  if (cache.has(key)) return cache.get(key);

  const finish = FINISHES[finishKey] || FINISHES.walnut;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawGrain(ctx, size, finish, finishKey.length * 97 + 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;

  cache.set(key, texture);
  return texture;
}

// The bump is finish-independent (grain geometry is the same across stains), so
// it's keyed on size alone and shared by every finish.
export function getWoodBump(size = 512) {
  const key = `bump:${size}`;
  if (bumpCache.has(key)) return bumpCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawBump(ctx, size, 131);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;

  bumpCache.set(key, texture);
  return texture;
}

// Dispose everything (called on full unmount to avoid GPU leaks).
export function disposeWoodTextures() {
  for (const tex of cache.values()) tex.dispose();
  for (const tex of bumpCache.values()) tex.dispose();
  cache.clear();
  bumpCache.clear();
}
