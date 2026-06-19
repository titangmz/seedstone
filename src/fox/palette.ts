/**
 * Colour derivation for the fox — every swatch is computed from the coat hue, so
 * the whole animal shifts along one axis. A light/base coat pair drives a soft
 * top-down gradient; dark accents (ear tips, nose) and a pale belly give the
 * classic fox contrast. Uses the core `hslToHex` primitive — no local maths.
 */

import { hslToHex } from "../core/index";
import type { FoxValues } from "./config";

/** Every fill the drawing needs, as `#rrggbb` strings. */
export interface Palette {
  /** Coat gradient — lit top, base bottom. */
  coatLight: string;
  coat: string;
  /** Pale muzzle, cheeks, chest, blaze. */
  belly: string;
  /** Near-black accents — ear tips, nose. */
  dark: string;
  /** Contour outline. */
  line: string;
  /** Marking wash — mask, sooty, freckles. */
  ink: string;
  /** Inner-ear pink. */
  earInner: string;
  /** Left / right iris (right differs when an odd eye lands). */
  irisL: string;
  irisR: string;
}

const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n);

const hex = (h: number, s: number, l: number): string =>
  "#" +
  hslToHex(((h % 360) + 360) % 360, clamp(s, 0, 1), clamp(l, 0, 1))
    .toString(16)
    .padStart(6, "0");

/** Build the full palette from resolved coat + eye traits. */
export function buildPalette(v: FoxValues): Palette {
  const h = v.coat.hue;
  const s = v.coat.saturation;
  let l = v.coat.lightness;

  if (v.coat.pattern === "sooty") l = Math.max(0.4, l - 0.05); // a touch darker base

  const oddEye = v.eyes.odd > 0.85;
  const eyeR = oddEye ? v.eyes.hue + 140 : v.eyes.hue;

  return {
    coatLight: hex(h, Math.min(1, s + 0.03), Math.min(0.72, l + 0.13)),
    coat: hex(h, s, l),
    belly: hex(h, s * 0.14, Math.min(0.98, l + 0.4)),
    dark: hex(h, Math.min(0.9, s * 0.55), l * 0.2),
    line: hex(h, s * 0.42, l * 0.2),
    ink: hex(h, Math.min(1, s + 0.1), l * 0.34),
    earInner: hex(346, 0.52, 0.86),
    irisL: hex(v.eyes.hue, 0.85, 0.52),
    irisR: hex(eyeR, 0.85, 0.52),
  };
}
