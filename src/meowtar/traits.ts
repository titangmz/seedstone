/**
 * meowtar — trait declaration for a deterministic flat-design cat bust.
 *
 * Built entirely on the core engine: declare each trait as `constant`, `seeded`,
 * or `pick`, hand the tree a seed, and `derive` resolves it. No three.js, no
 * canvas — a cat is just an SVG string, so this whole use case depends on `core`
 * alone. Flip any trait between fixed and seed-driven by editing its constructor.
 */

import { seeded, pick, type Config, type Override } from "../core/index";

/** Coat markings. Each is a distinct overlay drawn on the flat silhouette. */
const PATTERNS = ["plain", "striped", "masked", "patched", "speckled", "blaze"] as const;
/** Expression presets — drive the eyes, mouth, and tongue together. */
const MOODS = ["calm", "smug", "wide", "sleepy", "derp"] as const;
/** Ear carriage: upright triangles, or bent-forward (fold-breed) flaps. */
const EAR_SHAPES = ["upright", "folded"] as const;

export const meowtarTraits = {
  coat: {
    hue: seeded(0, 360), // the main anti-collision axis
    saturation: seeded(0.34, 0.86),
    lightness: seeded(0.46, 0.7),
    pattern: pick(() => [...PATTERNS]),
  },

  face: {
    width: seeded(0.9, 1.16), // head width multiplier
    floof: seeded(0, 1), // cheek-fluff amount (0 = sleek, 1 = mufti tufts)
  },

  ears: {
    size: seeded(0.85, 1.22),
    shape: pick(() => [...EAR_SHAPES]),
    tuft: seeded(0, 1), // lynx-tip tuft length
  },

  eyes: {
    hue: seeded(40, 210), // amber → green → blue
    aperture: seeded(0.5, 1), // how wide open
    odd: seeded(0, 1), // > 0.85 lands a heterochromatic second eye
  },

  whiskers: {
    spread: seeded(0.82, 1.2),
  },

  mood: pick(() => [...MOODS]),
};

/** The raw trait tree — traits still wrapped. Walk it to build a trait UI. */
export type MeowtarTraits = typeof meowtarTraits;

/** The resolved trait values for a seed — every trait unwrapped to its value. */
export type MeowtarValues = Config<MeowtarTraits>;

/** Deep-partial override tree: pin a value, or flip with `seeded`/`pick`. */
export type MeowtarOverrides = Override<MeowtarTraits>;
