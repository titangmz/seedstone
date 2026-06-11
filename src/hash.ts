/**
 * Deterministic string → gem DNA.
 * Same input always produces the exact same gemstone.
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
 * Derive a stable float in [0, 1) from a string + slot index.
 * Each `index` acts as an independent "channel" — same string, different index
 * → different float.  The 1_000_000 divisor gives 6 decimal digits of precision
 * while staying well within safe integer range for 32-bit hashes.
 */
export function derive(str: string, index: number): number {
  return (djb2(str + '\x00' + index) % 1_000_000) / 1_000_000;
}

// Supported radial facet counts.
const FACET_CHOICES = [6, 7, 8] as const;

// ── DNA types ─────────────────────────────────────────────────────────────────

export interface GemDNA {
  /** Base hue 0–360 */
  hue:        number;
  /** Saturation 0.55–1.0 */
  saturation: number;
  /** Radial facet count: 6 | 7 | 8 */
  facets:     6 | 7 | 8;
  /** Gem cut shape, e.g. 'brilliant' | 'marquise' */
  cut:        string;
  /** Rotation speed multiplier */
  speed:      number;
  /** Slight Z-axis tilt in radians */
  tilt:       number;
  /** Primary accent light hue 0–360 */
  light1Hue:  number;
  /** Secondary accent light hue 0–360 (auto-complementary) */
  light2Hue:  number;
  /** Index of refraction 1.8–2.8 */
  ior:        number;
  /** Iridescence / fire intensity 0.3–1.0 */
  brilliance: number;
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Convert any string into a fully-specified `GemDNA`.
 * @param str       Input seed — empty string falls back to `'lumina'`.
 * @param cutNames  Sorted list of available cut names. Defaults to the geometry registry.
 */
export function stringToDNA(str: string, cutNames: string[] = listCuts()): GemDNA {
  const s = str.length === 0 ? 'lumina' : str;
  const cuts = cutNames.length > 0 ? cutNames : ['brilliant'];
  return {
    hue:        derive(s, 0) * 360,
    saturation: 0.55 + derive(s, 1) * 0.45,
    facets:     FACET_CHOICES[Math.floor(derive(s, 2) * 3)],
    cut:        cuts[Math.floor(derive(s, 8) * cuts.length)],
    speed:      0.6  + derive(s, 3) * 0.8,
    tilt:       (derive(s, 4) - 0.5) * 0.4,
    light1Hue:  derive(s, 5) * 360,
    // Intentionally reuses slot 5 — the +120° offset keeps the two accent lights
    // always one third of the colour wheel apart (complementary fire tones).
    light2Hue:  (derive(s, 5) * 360 + 120) % 360,
    ior:        1.8  + derive(s, 6) * 1.0,
    brilliance: 0.3  + derive(s, 7) * 0.7,
  };
}
