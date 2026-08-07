// src/three/Furniture.jsx
// Procedural wood furniture built from primitives — ORIGINAL generated
// geometry (no downloaded assets, no licensing concerns). Every model shares
// the generated wood-grain textures, so finish switching works everywhere.
// Each model is normalized: floor plane at y = FLOOR, fits a ~2.2u view box.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { getWoodTexture, getWoodBump, FINISHES } from './woodTexture';

export const FLOOR = -0.55;

export function useFurnitureMaterials(finishKey = 'walnut') {
  const materials = useMemo(() => {
    const finish = FINISHES[finishKey] || FINISHES.walnut;
    const map = getWoodTexture(finishKey, 512);
    const bumpMap = getWoodBump(512);

    // MeshPhysicalMaterial for the thin clearcoat layer — that faint sheen over
    // the grain is the difference between "raw timber" and "a finished, oiled
    // surface". The bumpMap makes the grain lines catch that sheen instead of
    // sitting flat under a colormap.
    const wood = new THREE.MeshPhysicalMaterial({
      map,
      bumpMap,
      bumpScale: 0.02,
      roughness: finish.roughness,
      metalness: 0.0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.45,
      envMapIntensity: 0.9,
    });
    // End grain: rougher, no clearcoat — cut ends of timber aren't polished.
    const woodEnd = new THREE.MeshStandardMaterial({ color: finish.grain, roughness: 0.8, metalness: 0.0 });
    const fabric = new THREE.MeshStandardMaterial({ color: '#cfc4ac', roughness: 0.95 });
    const fabricDeep = new THREE.MeshStandardMaterial({ color: '#b8ac91', roughness: 0.95 });
    const brass = new THREE.MeshStandardMaterial({ color: '#b08046', roughness: 0.32, metalness: 0.85, envMapIntensity: 1.1 });
    return { wood, woodEnd, fabric, fabricDeep, brass };
  }, [finishKey]);

  // Materials own GPU resources; the textures are cached and shared, but the
  // material objects are per-finish and must be released when the finish changes
  // or the viewer unmounts, or every swatch click leaks one.
  useEffect(() => () => {
    Object.values(materials).forEach((m) => m.dispose());
  }, [materials]);

  return materials;
}

// Every wooden part routes through this one primitive, so rounding it here
// rounds the whole catalogue at once. Real furniture has eased edges that pick
// up a highlight; a raw boxGeometry's hard 90° corners are the single biggest
// tell that you're looking at primitives rather than a product. The radius is
// proportional to the piece's thinnest dimension and capped, so a 12mm drawer
// front eases subtly while a tabletop eases more — never ballooning a thin panel.
const EDGE = 0.10;      // fraction of the smallest dimension to round
const EDGE_CAP = 0.03;  // absolute ceiling so large pieces don't over-round

const Box = ({ m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0] }) => {
  const radius = Math.min(Math.min(...s) * EDGE, EDGE_CAP);
  return (
    <RoundedBox
      material={m}
      position={p}
      rotation={r}
      args={s}
      radius={radius}
      smoothness={3}
      castShadow
      receiveShadow
    />
  );
};
const Cyl = ({ m, p = [0, 0, 0], r = 0.03, h = 0.4, rot = [0, 0, 0], rTop }) => (
  <mesh material={m} position={p} rotation={rot} castShadow receiveShadow>
    <cylinderGeometry args={[rTop ?? r, r, h, 20]} />
  </mesh>
);

/* ── Accent / dining chair ─────────────────────────────────────── */
export function Chair({ finishKey, angle = 0 }) {
  const M = useFurnitureMaterials(finishKey);
  const legH = 0.46, seatY = FLOOR + legH;
  return (
    <group rotation={[0, angle, 0]}>
      {/* tapered legs */}
      {[[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]].map(([x, z], i) => (
        <Cyl key={i} m={M.wood} p={[x, FLOOR + legH / 2, z]} r={0.032} rTop={0.024} h={legH} />
      ))}
      {/* seat with soft pad */}
      <Box m={M.wood} p={[0, seatY + 0.024, 0]} s={[0.5, 0.048, 0.46]} />
      <Box m={M.fabric} p={[0, seatY + 0.075, 0.01]} s={[0.44, 0.055, 0.4]} />
      {/* back posts, gently raked */}
      {[-0.2, 0.2].map((x, i) => (
        <Cyl key={i} m={M.wood} p={[x, seatY + 0.28, -0.215]} r={0.024} h={0.56} rot={[-0.12, 0, 0]} />
      ))}
      {/* back slats + crest rail */}
      <Box m={M.wood} p={[0, seatY + 0.52, -0.248]} s={[0.46, 0.085, 0.035]} r={[-0.12, 0, 0]} />
      <Box m={M.wood} p={[0, seatY + 0.36, -0.229]} s={[0.42, 0.06, 0.028]} r={[-0.12, 0, 0]} />
      <Box m={M.wood} p={[0, seatY + 0.22, -0.212]} s={[0.42, 0.06, 0.028]} r={[-0.12, 0, 0]} />
    </group>
  );
}

/* ── Sofa ──────────────────────────────────────────────────────── */
export function Sofa({ finishKey }) {
  const M = useFurnitureMaterials(finishKey);
  const s = 0.72; // fit view box
  return (
    <group scale={[s, s, s]} position={[0, 0, 0]}>
      {/* wooden plinth + legs */}
      {[[-0.85, -0.38], [0.85, -0.38], [-0.85, 0.38], [0.85, 0.38]].map(([x, z], i) => (
        <Cyl key={i} m={M.wood} p={[x, FLOOR / s + 0.07, z]} r={0.035} rTop={0.028} h={0.14} />
      ))}
      <Box m={M.wood} p={[0, FLOOR / s + 0.2, 0]} s={[1.95, 0.12, 0.9]} />
      {/* arms (wood) */}
      <Box m={M.wood} p={[-0.925, FLOOR / s + 0.48, 0]} s={[0.1, 0.44, 0.9]} />
      <Box m={M.wood} p={[0.925, FLOOR / s + 0.48, 0]} s={[0.1, 0.44, 0.9]} />
      {/* back frame */}
      <Box m={M.wood} p={[0, FLOOR / s + 0.62, -0.41]} s={[1.95, 0.72, 0.08]} />
      {/* seat cushions */}
      {[-0.59, 0, 0.59].map((x, i) => (
        <Box key={i} m={M.fabric} p={[x, FLOOR / s + 0.36, 0.05]} s={[0.56, 0.2, 0.72]} />
      ))}
      {/* back cushions */}
      {[-0.59, 0, 0.59].map((x, i) => (
        <Box key={`b${i}`} m={M.fabricDeep} p={[x, FLOOR / s + 0.66, -0.28]} s={[0.56, 0.42, 0.18]} r={[-0.08, 0, 0]} />
      ))}
    </group>
  );
}

/* ── Dining / coffee table ─────────────────────────────────────── */
export function Table({ finishKey, low = false }) {
  const M = useFurnitureMaterials(finishKey);
  const legH = low ? 0.34 : 0.7;
  const topY = FLOOR + legH;
  const w = low ? 1.15 : 1.7, d = low ? 0.7 : 0.95;
  return (
    <group>
      <Box m={M.wood} p={[0, topY + 0.03, 0]} s={[w, 0.06, d]} />
      <Box m={M.woodEnd} p={[0, topY - 0.005, 0]} s={[w - 0.06, 0.012, d - 0.06]} />
      {/* apron */}
      <Box m={M.wood} p={[0, topY - 0.07, d / 2 - 0.09]} s={[w - 0.3, 0.08, 0.035]} />
      <Box m={M.wood} p={[0, topY - 0.07, -(d / 2 - 0.09)]} s={[w - 0.3, 0.08, 0.035]} />
      {/* tapered legs */}
      {[[-(w / 2 - 0.12), -(d / 2 - 0.12)], [w / 2 - 0.12, -(d / 2 - 0.12)], [-(w / 2 - 0.12), d / 2 - 0.12], [w / 2 - 0.12, d / 2 - 0.12]].map(([x, z], i) => (
        <Cyl key={i} m={M.wood} p={[x, FLOOR + legH / 2, z]} r={0.045} rTop={0.03} h={legH} />
      ))}
    </group>
  );
}

/* ── Bed ───────────────────────────────────────────────────────── */
export function Bed({ finishKey }) {
  const M = useFurnitureMaterials(finishKey);
  const s = 0.62;
  return (
    <group scale={[s, s, s]} rotation={[0, 0.35, 0]}>
      {/* platform + legs */}
      <Box m={M.wood} p={[0, FLOOR / s + 0.22, 0]} s={[1.75, 0.16, 2.3]} />
      {[[-0.8, -1.05], [0.8, -1.05], [-0.8, 1.05], [0.8, 1.05]].map(([x, z], i) => (
        <Cyl key={i} m={M.wood} p={[x, FLOOR / s + 0.07, z]} r={0.04} h={0.14} />
      ))}
      {/* headboard */}
      <Box m={M.wood} p={[0, FLOOR / s + 0.72, -1.19]} s={[1.75, 1.0, 0.09]} />
      {/* mattress + duvet + pillows */}
      <Box m={M.fabric} p={[0, FLOOR / s + 0.4, 0.04]} s={[1.6, 0.22, 2.1]} />
      <Box m={M.fabricDeep} p={[0, FLOOR / s + 0.47, 0.45]} s={[1.62, 0.12, 1.25]} />
      {[-0.4, 0.4].map((x, i) => (
        <Box key={i} m={M.fabric} p={[x, FLOOR / s + 0.57, -0.78]} s={[0.62, 0.14, 0.4]} r={[-0.18, 0, 0]} />
      ))}
    </group>
  );
}

/* ── Bookshelf ─────────────────────────────────────────────────── */
export function Shelf({ finishKey }) {
  const M = useFurnitureMaterials(finishKey);
  const s = 0.78;
  const H = 1.9, W = 1.15, D = 0.34;
  const bookMats = useMemo(
    () => ['#7a5c44', '#4d5a43', '#a86648', '#3b332c', '#8c8271'].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })
    ),
    []
  );
  return (
    <group scale={[s, s, s]}>
      {/* uprights + top/bottom */}
      <Box m={M.wood} p={[-W / 2, FLOOR / s + H / 2, 0]} s={[0.05, H, D]} />
      <Box m={M.wood} p={[W / 2, FLOOR / s + H / 2, 0]} s={[0.05, H, D]} />
      <Box m={M.wood} p={[0, FLOOR / s + H - 0.025, 0]} s={[W, 0.05, D]} />
      {/* shelves */}
      {[0.05, 0.5, 0.95, 1.4].map((y, i) => (
        <Box key={i} m={M.wood} p={[0, FLOOR / s + y, 0]} s={[W - 0.06, 0.045, D - 0.04]} />
      ))}
      {/* books (varied heights/leans) */}
      {[0.5, 0.95, 1.4].map((shelfY, row) =>
        [...Array(6)].map((_, i) => {
          const h = 0.26 + ((i * 7 + row * 3) % 4) * 0.03;
          const lean = i === 4 ? 0.18 : 0;
          return (
            <Box
              key={`${row}-${i}`}
              m={bookMats[(i + row) % bookMats.length]}
              p={[-0.42 + i * 0.15, FLOOR / s + shelfY + h / 2 + 0.025, 0]}
              s={[0.075, h, D - 0.12]}
              r={[0, 0, lean]}
            />
          );
        })
      )}
    </group>
  );
}

/* ── Wardrobe ──────────────────────────────────────────────────── */
export function Wardrobe({ finishKey }) {
  const M = useFurnitureMaterials(finishKey);
  const s = 0.62;
  const H = 2.2, W = 1.5, D = 0.6;
  return (
    <group scale={[s, s, s]} rotation={[0, 0.28, 0]}>
      <Box m={M.wood} p={[0, FLOOR / s + H / 2, 0]} s={[W, H, D]} />
      {/* door seam + panels */}
      <Box m={M.woodEnd} p={[0, FLOOR / s + H / 2, D / 2 + 0.002]} s={[0.015, H - 0.1, 0.01]} />
      <Box m={M.woodEnd} p={[-W / 4, FLOOR / s + H / 2, D / 2 + 0.004]} s={[W / 2 - 0.12, H - 0.24, 0.008]} />
      <Box m={M.woodEnd} p={[W / 4, FLOOR / s + H / 2, D / 2 + 0.004]} s={[W / 2 - 0.12, H - 0.24, 0.008]} />
      {/* brass handles */}
      <Cyl m={M.brass} p={[-0.09, FLOOR / s + H / 2, D / 2 + 0.03]} r={0.012} h={0.22} />
      <Cyl m={M.brass} p={[0.09, FLOOR / s + H / 2, D / 2 + 0.03]} r={0.012} h={0.22} />
      {/* plinth */}
      <Box m={M.woodEnd} p={[0, FLOOR / s + 0.04, 0]} s={[W - 0.06, 0.08, D - 0.04]} />
    </group>
  );
}

/* ── Desk ──────────────────────────────────────────────────────── */
export function Desk({ finishKey }) {
  const M = useFurnitureMaterials(finishKey);
  const legH = 0.68, topY = FLOOR + legH;
  return (
    <group rotation={[0, -0.2, 0]}>
      <Box m={M.wood} p={[0, topY + 0.025, 0]} s={[1.5, 0.05, 0.72]} />
      {/* drawer pedestal */}
      <Box m={M.wood} p={[0.47, FLOOR + legH / 2 + 0.02, 0]} s={[0.5, legH - 0.04, 0.62]} />
      {[0.18, -0.05, -0.28].map((dy, i) => (
        <group key={i}>
          <Box m={M.woodEnd} p={[0.47, topY - 0.14 + dy, 0.312]} s={[0.44, 0.17, 0.012]} />
          <Cyl m={M.brass} p={[0.47, topY - 0.14 + dy, 0.335]} r={0.01} h={0.12} rot={[0, 0, Math.PI / 2]} />
        </group>
      ))}
      {/* legs on open side */}
      {[-0.68, -0.05].map((x, i) => (
        <Cyl key={i} m={M.wood} p={[x, FLOOR + legH / 2, 0.3]} r={0.035} rTop={0.026} h={legH} />
      ))}
      {[-0.68, -0.05].map((x, i) => (
        <Cyl key={`b${i}`} m={M.wood} p={[x, FLOOR + legH / 2, -0.3]} r={0.035} rTop={0.026} h={legH} />
      ))}
    </group>
  );
}

/* ── TV unit / sideboard ───────────────────────────────────────── */
export function Sideboard({ finishKey }) {
  const M = useFurnitureMaterials(finishKey);
  return (
    <group rotation={[0, 0.18, 0]}>
      <Box m={M.wood} p={[0, FLOOR + 0.34, 0]} s={[1.9, 0.5, 0.55]} />
      {/* door fronts */}
      {[-0.71, -0.24, 0.24, 0.71].map((x, i) => (
        <Box key={i} m={M.woodEnd} p={[x, FLOOR + 0.34, 0.281]} s={[0.42, 0.42, 0.012]} />
      ))}
      {[-0.48, 0.48].map((x, i) => (
        <Cyl key={i} m={M.brass} p={[x, FLOOR + 0.34, 0.3]} r={0.011} h={0.14} />
      ))}
      {/* legs */}
      {[[-0.85, -0.2], [0.85, -0.2], [-0.85, 0.2], [0.85, 0.2]].map(([x, z], i) => (
        <Cyl key={`l${i}`} m={M.wood} p={[x, FLOOR + 0.045, z]} r={0.028} rTop={0.02} h={0.09} />
      ))}
    </group>
  );
}

const MODELS = { chair: Chair, sofa: Sofa, table: Table, coffee: (p) => <Table {...p} low />, bed: Bed, shelf: Shelf, wardrobe: Wardrobe, desk: Desk, sideboard: Sideboard };

export default function FurnitureModel({ type = 'table', finishKey = 'walnut', ...rest }) {
  const Model = MODELS[type] || Table;
  return <Model finishKey={finishKey} {...rest} />;
}
