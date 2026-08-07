// src/three/useDeviceTier.js
// Conservative WebGL capability detection → a quality tier the 3D scenes read.
// See docs/3D_STRATEGY.md for the tier definitions.

import { useEffect, useState } from 'react';

export const TIERS = { HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW', FALLBACK: 'FALLBACK' };

function probe() {
  if (typeof window === 'undefined') return { supported: false, tier: TIERS.FALLBACK };

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData;

  // WebGL support probe.
  let gl = null;
  try {
    const canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  } catch {
    gl = null;
  }
  if (!gl) return { supported: false, tier: TIERS.FALLBACK, reducedMotion };

  // Reduced-motion + save-data → present the accessible poster fallback.
  if (reducedMotion && saveData) return { supported: false, tier: TIERS.FALLBACK, reducedMotion };

  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches; // touch / mobile

  let tier;
  if (coarse || cores <= 4 || mem <= 3 || saveData) {
    tier = (cores <= 2 || mem <= 2) ? TIERS.LOW : TIERS.MEDIUM;
  } else {
    tier = TIERS.HIGH;
  }

  // Clean up the probe context.
  gl.getExtension('WEBGL_lose_context')?.loseContext();

  return { supported: true, tier, reducedMotion };
}

// Quality knobs derived from the tier, consumed by the Canvas/scenes.
export function tierSettings(tier, reducedMotion) {
  switch (tier) {
    case TIERS.HIGH:
      return { dpr: [1, 2], shadows: true, envResolution: 256, autoRotate: !reducedMotion, particles: 0 };
    case TIERS.MEDIUM:
      return { dpr: [1, 1.5], shadows: false, envResolution: 128, autoRotate: !reducedMotion, particles: 0 };
    case TIERS.LOW:
      return { dpr: 1, shadows: false, envResolution: 64, autoRotate: false, particles: 0 };
    default:
      return { dpr: 1, shadows: false, envResolution: 0, autoRotate: false, particles: 0 };
  }
}

export default function useDeviceTier() {
  // SSR/first paint: assume unsupported until we've probed on the client.
  const [state, setState] = useState({ supported: false, tier: TIERS.FALLBACK, reducedMotion: false, ready: false });

  useEffect(() => {
    const result = probe();
    setState({ ...result, ready: true });
  }, []);

  return state;
}
