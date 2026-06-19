/**
 * meowtar — trait declaration and resolver for a deterministic flat-design cat bust.
 *
 * Built entirely on the core engine: declare each trait as `constant`, `seeded`,
 * or `pick`, hand the tree a seed, and `derive` resolves it. No three.js, no
 * canvas — a cat is just an SVG string. Flip any trait between fixed and
 * seed-driven by editing its constructor.
 */

import { seeded, pick, derive, merge, sampleUnit, type Config, type Override } from "../core/index";
import { buildPalette } from "./palette";
import { nameFor } from "./name";
import type { MeowtarConfig } from "./draw";

const PATTERNS = ["plain", "striped", "masked", "patched", "speckled", "blaze"] as const;
const MOODS = ["calm", "smug", "wide", "sleepy", "derp"] as const;
const EAR_SHAPES = ["upright", "folded"] as const;

export const meowtarTraits = {
  coat: {
    hue: seeded(0, 360),
    saturation: seeded(0.48, 0.92),
    lightness: seeded(0.5, 0.72),
    pattern: pick(() => [...PATTERNS]),
  },

  face: {
    width: seeded(0.9, 1.16),
    floof: seeded(0, 1),
  },

  ears: {
    size: seeded(0.85, 1.22),
    shape: pick(() => [...EAR_SHAPES]),
    tuft: seeded(0, 1),
  },

  eyes: {
    hue: seeded(40, 210),
    aperture: seeded(0.5, 1),
    odd: seeded(0, 1),
  },

  whiskers: {
    spread: seeded(0.82, 1.2),
  },

  mood: pick(() => [...MOODS]),
};

export type MeowtarTraits = typeof meowtarTraits;
export type MeowtarValues = Config<MeowtarTraits>;
export type MeowtarOverrides = Override<MeowtarTraits>;

export function resolveMeowtar(seed: string, overrides?: MeowtarOverrides): MeowtarConfig {
  const values: MeowtarValues = derive(merge<MeowtarTraits>(meowtarTraits, overrides), seed);
  const rngSeed = Math.floor(sampleUnit(seed, "meowtar.marks") * 4294967296);
  return { ...values, palette: buildPalette(values), name: nameFor(seed), rngSeed };
}

export default resolveMeowtar;
