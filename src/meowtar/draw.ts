/**
 * The drawing — a pure function from a resolved cat config to an SVG string.
 *
 * The aesthetic is deliberately flat: solid fills, crisp contours, slit pupils,
 * a tinted backdrop disc. The subject is a face-forward bust (head, ears, a hint
 * of shoulders) rather than a full body, so it reads well at avatar sizes. The
 * silhouette is fixed; the seed only scales it within bounds and swaps markings,
 * ear carriage, eye colour, and expression — so every output is a valid cat.
 *
 * No gradients, no external assets, no <image>. Element ids carry a per-cat
 * suffix so many inline cats can share a page without their clip-paths colliding.
 */

import { mulberry32 } from "../core/index";
import type { MeowtarValues } from "./config";
import type { Palette } from "./palette";

/** A cat ready to draw: resolved traits, palette, name, and a placement seed. */
export interface MeowtarConfig extends MeowtarValues {
  palette: Palette;
  name: string;
  /** Integer seed for marking placement (speckles, patch side). */
  rngSeed: number;
}

/** Round to 2dp; collapse -0 → 0. Keeps markup short and byte-stable. */
function f(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
}

const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n);

const CX = 128;

/** Build the complete `<svg>…</svg>` for a resolved cat config. */
export function drawCat(config: MeowtarConfig): string {
  const { coat, face, ears, eyes, whiskers, mood, palette: p } = config;
  const rng = mulberry32(config.rngSeed);
  const uid = (config.rngSeed >>> 0).toString(36);

  const fw = face.width;
  const es = ears.size;
  const halfW = 64 * fw;
  const headTop = 98;
  const headCY = 150;
  const chinY = 214;

  // ── Ears ────────────────────────────────────────────────────────────────────
  const earSpan = halfW * 0.86;
  const tipRise = 58 * es;
  const upright = ears.shape === "upright";

  const earPath = (sign: 1 | -1): string => {
    const baseOutX = CX + sign * earSpan;
    const baseOutY = headTop + 18;
    const baseInX = CX + sign * halfW * 0.28;
    const baseInY = headTop - 2;
    if (upright) {
      const tipX = CX + sign * (earSpan - 6);
      const tipY = headTop - tipRise;
      return (
        `M ${f(baseOutX)},${f(baseOutY)} ` +
        `Q ${f(CX + sign * (earSpan + 7))},${f(headTop - tipRise * 0.5)} ${f(tipX)},${f(tipY)} ` +
        `Q ${f(CX + sign * halfW * 0.5)},${f(headTop - 8)} ${f(baseInX)},${f(baseInY)} Z`
      );
    }
    // Folded: a short rounded flap bent toward the centre.
    const foldY = headTop - tipRise * 0.42;
    return (
      `M ${f(baseOutX)},${f(baseOutY)} ` +
      `Q ${f(CX + sign * (earSpan + 4))},${f(foldY - 8)} ${f(CX + sign * earSpan * 0.5)},${f(foldY)} ` +
      `Q ${f(CX + sign * halfW * 0.16)},${f(foldY + 12)} ${f(baseInX)},${f(baseInY)} Z`
    );
  };

  const innerEar = (sign: 1 | -1): string => {
    const bx = CX + sign * earSpan;
    const by = headTop + 16;
    const tx = CX + sign * (earSpan - 8);
    const ty = upright ? headTop - tipRise * 0.62 : headTop - tipRise * 0.12;
    const ix = CX + sign * halfW * 0.34;
    const iy = headTop + 4;
    return `M ${f(bx)},${f(by)} L ${f(tx)},${f(ty)} L ${f(ix)},${f(iy)} Z`;
  };

  const tuftMark = (sign: 1 | -1): string => {
    if (!upright || ears.tuft < 0.45) return "";
    const tx = CX + sign * (earSpan - 6);
    const ty = headTop - tipRise;
    const len = 6 + ears.tuft * 12;
    return `<path d="M ${f(tx)},${f(ty)} l ${f(sign * -3)},${f(-len)} l ${f(sign * 7)},${f(len * 0.6)}" fill="none" stroke="${p.shade}" stroke-width="2.4" stroke-linecap="round"/>`;
  };

  // ── Head + shoulders ─────────────────────────────────────────────────────────
  const headPath =
    `M ${f(CX)},${f(headTop)} ` +
    `C ${f(CX + halfW * 0.74)},${f(headTop)} ${f(CX + halfW)},${f(headCY - 36)} ${f(CX + halfW)},${f(headCY)} ` +
    `C ${f(CX + halfW)},${f(headCY + 34)} ${f(CX + halfW * 0.62)},${f(chinY)} ${f(CX)},${f(chinY)} ` +
    `C ${f(CX - halfW * 0.62)},${f(chinY)} ${f(CX - halfW)},${f(headCY + 34)} ${f(CX - halfW)},${f(headCY)} ` +
    `C ${f(CX - halfW)},${f(headCY - 36)} ${f(CX - halfW * 0.74)},${f(headTop)} ${f(CX)},${f(headTop)} Z`;

  const shoulders = `M 34,256 C 34,212 78,196 128,196 C 178,196 222,212 222,256 Z`;

  const floof = (sign: 1 | -1): string => {
    if (face.floof < 0.4) return "";
    const bx = CX + sign * (halfW - 3);
    const by = headCY + 4;
    const out = sign * (10 + face.floof * 10);
    return (
      `<path d="M ${f(bx)},${f(by)} l ${f(out)},7 l ${f(-out * 0.7)},7 l ${f(out * 0.9)},8 l ${f(-out * 0.8)},8" ` +
      `fill="none" stroke="${p.line}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
    );
  };

  // ── Markings (clipped to head + ears) ────────────────────────────────────────
  let marks = "";
  if (coat.pattern === "striped") {
    const parts: string[] = [];
    for (const sgn of [-1, 0, 1] as const) {
      const x = CX + sgn * 13 * fw;
      parts.push(`<path d="M ${f(x)},${f(headTop + 12)} L ${f(x + sgn * 4)},${f(headCY - 16)}"/>`);
    }
    for (const sgn of [-1, 1] as const) {
      for (let k = 1; k <= 3; k++) {
        const x = CX + sgn * (18 + k * 13) * fw;
        parts.push(`<path d="M ${f(x)},${f(headCY - 8)} q ${f(sgn * 6)},18 0,38"/>`);
      }
    }
    marks = `<g fill="none" stroke="${p.ink}" stroke-width="4.5" stroke-linecap="round" opacity="0.55">${parts.join("")}</g>`;
  } else if (coat.pattern === "masked") {
    marks =
      `<g fill="${p.shade}" opacity="0.6">` +
      `<path d="${earPath(-1)}"/><path d="${earPath(1)}"/>` +
      `<path d="M ${f(CX - halfW * 0.86)},${f(headCY - 6)} Q ${f(CX)},${f(headCY - 40)} ${f(CX + halfW * 0.86)},${f(headCY - 6)} ` +
      `Q ${f(CX)},${f(headCY + 18)} ${f(CX - halfW * 0.86)},${f(headCY - 6)} Z"/>` +
      `</g>`;
  } else if (coat.pattern === "patched") {
    const sign: 1 | -1 = rng() < 0.5 ? -1 : 1;
    marks =
      `<g fill="${p.shade}" opacity="0.85">` +
      `<path d="${earPath(sign)}"/>` +
      `<ellipse cx="${f(CX + sign * halfW * 0.46)}" cy="${f(headCY - 2)}" rx="${f(halfW * 0.5)}" ry="${f(46)}"/>` +
      `</g>`;
  } else if (coat.pattern === "speckled") {
    const parts: string[] = [];
    for (let i = 0; i < 22; i++) {
      const x = CX + (rng() - 0.5) * halfW * 1.7;
      const y = headTop + 16 + rng() * (chinY - headTop - 30);
      const r = 1.8 + rng() * 2.6;
      parts.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`);
    }
    marks = `<g fill="${p.ink}" opacity="0.6">${parts.join("")}</g>`;
  } else if (coat.pattern === "blaze") {
    marks =
      `<path d="M ${f(CX - 11)},${f(headTop + 2)} Q ${f(CX)},${f(headTop - 4)} ${f(CX + 11)},${f(headTop + 2)} ` +
      `L ${f(CX + 7)},${f(headCY + 30)} Q ${f(CX)},${f(headCY + 36)} ${f(CX - 7)},${f(headCY + 30)} Z" ` +
      `fill="${p.cream}" opacity="0.9"/>`;
  }

  // ── Face ─────────────────────────────────────────────────────────────────────
  const eyeY = 144;
  const eyeDX = 31 * fw;
  const exL = CX - eyeDX;
  const exR = CX + eyeDX;

  const tongueOut = mood === "derp";
  const mulFor = (side: 1 | -1): number =>
    mood === "smug"
      ? 0.78
      : mood === "wide"
        ? 1.22
        : mood === "derp"
          ? side < 0
            ? 1.18
            : 0.66
          : 1;
  const roundPupil = mood === "wide";

  const eye = (ex: number, side: 1 | -1, iris: string): string => {
    if (mood === "sleepy") {
      return `<path d="M ${f(ex - 15)},${f(eyeY)} Q ${f(ex)},${f(eyeY + 8)} ${f(ex + 15)},${f(eyeY)}" fill="none" stroke="${p.line}" stroke-width="2.6" stroke-linecap="round"/>`;
    }
    const ry = clamp(eyes.aperture * mulFor(side), 0.18, 1.25) * 17;
    const pupil = roundPupil
      ? `<ellipse cx="${f(ex)}" cy="${f(eyeY)}" rx="6.5" ry="${f(ry * 0.62)}" fill="#15111e"/>`
      : `<ellipse cx="${f(ex)}" cy="${f(eyeY)}" rx="3.4" ry="${f(ry * 0.92)}" fill="#15111e"/>`;
    return (
      `<ellipse cx="${f(ex)}" cy="${f(eyeY)}" rx="15" ry="${f(ry)}" fill="${iris}" stroke="${p.line}" stroke-width="1.6"/>` +
      pupil +
      `<circle cx="${f(ex - 5)}" cy="${f(eyeY - ry * 0.42)}" r="3" fill="#ffffff" opacity="0.92"/>` +
      `<circle cx="${f(ex + 4)}" cy="${f(eyeY + ry * 0.3)}" r="1.4" fill="#ffffff" opacity="0.6"/>`
    );
  };

  const brows =
    mood === "smug"
      ? `<g stroke="${p.line}" stroke-width="2.2" stroke-linecap="round">` +
        `<path d="M ${f(exL - 12)},${f(eyeY - 20)} L ${f(exL + 8)},${f(eyeY - 14)}"/>` +
        `<path d="M ${f(exR + 12)},${f(eyeY - 20)} L ${f(exR - 8)},${f(eyeY - 14)}"/>` +
        `</g>`
      : "";

  const noseY = 165;
  const nose = `<path d="M ${f(CX - 8)},${f(noseY)} Q ${f(CX)},${f(noseY - 2)} ${f(CX + 8)},${f(noseY)} L ${f(CX)},${f(noseY + 9)} Z" fill="${p.nose}" stroke="${p.line}" stroke-width="0.7"/>`;

  const my = noseY + 9;
  let mouth: string;
  if (mood === "sleepy") {
    mouth = `<path d="M ${f(CX - 9)},${f(my + 4)} Q ${f(CX)},${f(my + 8)} ${f(CX + 9)},${f(my + 4)}" fill="none" stroke="${p.line}" stroke-width="1.5" stroke-linecap="round"/>`;
  } else if (mood === "smug") {
    mouth = `<path d="M ${f(CX)},${f(my)} v3 M ${f(CX)},${f(my + 3)} Q ${f(CX - 10)},${f(my + 6)} ${f(CX - 19)},${f(my + 1)} M ${f(CX)},${f(my + 3)} Q ${f(CX + 8)},${f(my + 11)} ${f(CX + 18)},${f(my + 6)}" fill="none" stroke="${p.line}" stroke-width="1.5" stroke-linecap="round"/>`;
  } else if (mood === "derp") {
    mouth = `<path d="M ${f(CX)},${f(my)} v2 M ${f(CX - 13)},${f(my + 2)} Q ${f(CX)},${f(my + 14)} ${f(CX + 13)},${f(my + 2)} Z" fill="#3a2230" stroke="${p.line}" stroke-width="1.4" stroke-linejoin="round"/>`;
  } else {
    mouth = `<path d="M ${f(CX)},${f(my)} v3 M ${f(CX)},${f(my + 3)} Q ${f(CX - 9)},${f(my + 9)} ${f(CX - 18)},${f(my + 3)} M ${f(CX)},${f(my + 3)} Q ${f(CX + 9)},${f(my + 9)} ${f(CX + 18)},${f(my + 3)}" fill="none" stroke="${p.line}" stroke-width="1.5" stroke-linecap="round"/>`;
  }
  const tongue = tongueOut
    ? `<path d="M ${f(CX - 5)},${f(my + 8)} h10 a5,7 0 0 1 -10,0 Z" fill="${p.petal}" stroke="${p.line}" stroke-width="0.6"/>`
    : "";

  const whiskerParts: string[] = [];
  for (const sgn of [-1, 1] as const) {
    const ox = CX + sgn * 15;
    const tx = CX + sgn * 56 * whiskers.spread;
    whiskerParts.push(
      `<path d="M ${f(ox)},${f(noseY + 4)} Q ${f((ox + tx) / 2)},${f(noseY - 2)} ${f(tx)},${f(noseY - 5)}"/>`,
      `<path d="M ${f(ox)},${f(noseY + 8)} Q ${f((ox + tx) / 2)},${f(noseY + 8)} ${f(tx)},${f(noseY + 8)}"/>`,
      `<path d="M ${f(ox)},${f(noseY + 12)} Q ${f((ox + tx) / 2)},${f(noseY + 16)} ${f(tx)},${f(noseY + 20)}"/>`,
    );
  }
  const whiskers2 = `<g fill="none" stroke="${p.line}" stroke-width="0.9" stroke-linecap="round" opacity="0.5">${whiskerParts.join("")}</g>`;

  // ── Assemble ─────────────────────────────────────────────────────────────────
  const earBack = upright ? p.coat : p.shade;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%" role="img" aria-label="${escapeAttr(config.name)}, a cat avatar">` +
    `<defs><clipPath id="m${uid}"><path d="${headPath}"/><path d="${earPath(-1)}"/><path d="${earPath(1)}"/></clipPath></defs>` +
    `<rect x="6" y="6" width="244" height="244" rx="62" fill="${p.field}"/>` +
    `<path d="${shoulders}" fill="${p.coat}" stroke="${p.line}" stroke-width="3" stroke-linejoin="round"/>` +
    `<ellipse cx="${CX}" cy="238" rx="34" ry="24" fill="${p.cream}"/>` +
    `<path d="${earPath(-1)}" fill="${earBack}" stroke="${p.line}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${earPath(1)}" fill="${earBack}" stroke="${p.line}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${innerEar(-1)}" fill="${p.petal}" opacity="0.92"/>` +
    `<path d="${innerEar(1)}" fill="${p.petal}" opacity="0.92"/>` +
    tuftMark(-1) +
    tuftMark(1) +
    `<path d="${headPath}" fill="${p.coat}" stroke="${p.line}" stroke-width="4" stroke-linejoin="round"/>` +
    floof(-1) +
    floof(1) +
    `<g clip-path="url(#m${uid})">${marks}</g>` +
    `<ellipse cx="${f(CX - 13)}" cy="180" rx="18" ry="15" fill="${p.cream}"/>` +
    `<ellipse cx="${f(CX + 13)}" cy="180" rx="18" ry="15" fill="${p.cream}"/>` +
    `<g>${brows}${eye(exL, -1, p.irisL)}${eye(exR, 1, p.irisR)}${nose}${mouth}${tongue}${whiskers2}</g>` +
    `</svg>`
  );
}

/** Minimal attribute escaping for the aria-label text. */
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
