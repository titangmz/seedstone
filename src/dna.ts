/**
 * Deterministic seed string → gem DNA.
 * The same seed always produces the exact same gemstone.
 */

import { listCuts } from './geometries/index';

// ── djb2 hash ─────────────────────────────────────────────────────────────────

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h;
}

/**
 * Derive a stable float in [0, 1) from a seed + slot index.
 * Each `index` acts as an independent "channel" — same seed, different index
 * → different float. The 1_000_000 divisor gives 6 decimal digits of precision
 * while staying well within safe integer range for 32-bit hashes.
 */
function derive(seed: string, index: number): number {
  return (djb2(seed + '\x00' + index) % 1_000_000) / 1_000_000;
}

// ── DNA type ──────────────────────────────────────────────────────────────────

export interface GemDNA {
  /** Base hue 0–360 */
  hue:        number;
  /** Saturation 0.55–1.0 */
  saturation: number;
  /** Gem cut shape, e.g. 'garnet' | 'zircon' */
  cut:        string;
  /** Rotation speed multiplier 0.6–1.4 */
  speed:      number;
  /** Slight Z-axis tilt in radians, ±0.2 */
  tilt:       number;
  /** Primary accent light hue 0–360 */
  light1Hue:  number;
  /** Secondary accent light hue 0–360 (always 120° from light1Hue) */
  light2Hue:  number;
  /** Index of refraction 1.8–2.8 */
  ior:        number;
  /** Iridescence / fire intensity 0.3–1.0 */
  brilliance: number;
  /** Gem quality: 0 = heavily distorted, 1 = flawless */
  perfection: number;
  /** Per-axis scale seeds (0–1 raw), interpreted by the distort module */
  scaleX:     number;
  scaleY:     number;
  scaleZ:     number;
  /** Seed for vertex noise directions (0–1 raw) */
  noiseSeed:  number;
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Convert any string into a fully-specified `GemDNA`.
 *
 * Slot indices are part of the contract: changing them changes every gem
 * ever generated. Add new traits at the end; never renumber existing ones.
 *
 * @param seed      Input seed — empty string falls back to `'seedstone'`.
 * @param cutNames  Available cut names. Defaults to the geometry registry.
 */
export function stringToDNA(seed: string, cutNames: string[] = listCuts()): GemDNA {
  const s = seed.length === 0 ? 'seedstone' : seed;
  const cuts = cutNames.length > 0 ? cutNames : ['garnet'];
  return {
    hue:        derive(s, 0) * 360,
    saturation: 0.55 + derive(s, 1) * 0.45,
    cut:        cuts[Math.floor(derive(s, 2) * cuts.length)],
    speed:      0.6  + derive(s, 3) * 0.8,
    tilt:       (derive(s, 4) - 0.5) * 0.4,
    light1Hue:  derive(s, 5) * 360,
    // Intentionally reuses slot 5 — the +120° offset keeps the two accent
    // lights always one third of the colour wheel apart (complementary fire).
    light2Hue:  (derive(s, 5) * 360 + 120) % 360,
    ior:        1.8  + derive(s, 6) * 1.0,
    brilliance: 0.3  + derive(s, 7) * 0.7,
    perfection: derive(s, 8),
    scaleX:     derive(s, 9),
    scaleY:     derive(s, 10),
    scaleZ:     derive(s, 11),
    noiseSeed:  derive(s, 12),
  };
}
