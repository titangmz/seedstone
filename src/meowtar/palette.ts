/**
 * Colour derivation — every swatch is computed from the coat hue, so the whole
 * cat shifts along one axis. Pattern choice nudges saturation/lightness so each
 * marking reads correctly (a masked cat wants a pale body; speckles want a deep
 * fleck colour). Uses the core `hslToHex` primitive — no local colour maths.
 */

import { hslToHex } from "../core/index";
import type { MeowtarValues } from "./config";

/** Every fill the drawing needs, as `#rrggbb` strings. */
export interface Palette {
  /** Backdrop disc behind the cat. */
  field: string;
  /** Main coat fill (head, ears, shoulders). */
  coat: string;
  /** Deeper coat — ear backs, fold flaps, under-chin. */
  shade: string;
  /** Marking ink — stripes, speckles, mask, patch. */
  ink: string;
  /** Muzzle, chest bib, blaze — pale, near-white tint. */
  cream: string;
  /** Contour outline. */
  line: string;
  /** Inner-ear pink. */
  petal: string;
  /** Nose pink. */
  nose: string;
  /** Left / right iris (right differs when an odd eye lands). */
  irisL: string;
  irisR: string;
}

const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n);

/** HSL → `#rrggbb` (core's `hslToHex` returns a packed int). */
const hex = (h: number, s: number, l: number): string =>
  "#" +
  hslToHex(((h % 360) + 360) % 360, clamp(s, 0, 1), clamp(l, 0, 1))
    .toString(16)
    .padStart(6, "0");

/** Build the full palette from resolved coat + eye traits. */
export function buildPalette(v: MeowtarValues): Palette {
  const h = v.coat.hue;
  let s = v.coat.saturation;
  let l = v.coat.lightness;

  // Pattern nudges so each marking has contrast to land on.
  if (v.coat.pattern === "masked") l = Math.min(0.82, l + 0.16); // pale body, dark mask
  if (v.coat.pattern === "patched") s = Math.min(1, s + 0.06);

  const oddEye = v.eyes.odd > 0.85;
  const eyeR = oddEye ? v.eyes.hue + 150 : v.eyes.hue;

  return {
    field: hex(h, s * 0.4, Math.min(0.93, l + 0.36)),
    coat: hex(h, s, l),
    shade: hex(h, Math.min(1, s + 0.08), l * 0.52),
    ink: hex(h, Math.min(1, s + 0.16), l * 0.46),
    cream: hex(h, s * 0.26, Math.min(0.96, l + 0.32)),
    line: hex(h, s * 0.5, l * 0.3),
    petal: hex(348, 0.5, 0.83),
    nose: hex(350, 0.52, 0.72),
    irisL: hex(v.eyes.hue, 0.72, 0.52),
    irisR: hex(eyeR, 0.72, 0.52),
  };
}
