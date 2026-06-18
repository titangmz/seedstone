import {
  catUseCase,
  gemUseCase,
  type MeowtarConfig,
  type SeedstoneConfig,
  type UseCase,
} from "seedstone";

export interface SummaryStat {
  label: string;
  value: string;
  pct?: number;
}

export interface Summary {
  title: string;
  subtitle?: string;
  swatch?: string;
  stats?: SummaryStat[];
}

export interface SiteUseCase {
  uc: UseCase;
  noun?: string;
  lede?: string;
  sampleSeeds?: string[];
  summarize?: (config: unknown, seed: string) => Summary;
}

export const DEFAULT_SAMPLE_SEEDS = [
  "@satoshi",
  "0x71C7...976F",
  "Orion-7",
  "Stripe Inc",
  "DOC-99812",
];

const GEM_NAME_RANGES: Array<{ a: number; b: number; names: string[] }> = [
  { a: 345, b: 20, names: ["ruby", "garnet", "rhodolite", "rubellite", "pyrope"] },
  { a: 20, b: 46, names: ["spessartite", "padparadscha", "fire opal", "hessonite", "sunstone"] },
  { a: 46, b: 66, names: ["citrine", "imperial topaz", "heliodor", "amber", "zircon"] },
  { a: 66, b: 150, names: ["peridot", "chrysoberyl", "sphene", "prehnite", "olivine"] },
  { a: 150, b: 176, names: ["emerald", "tsavorite", "jadeite", "dioptase", "uvarovite"] },
  { a: 176, b: 205, names: ["paraiba", "apatite", "larimar", "aquamarine", "grandidierite"] },
  { a: 205, b: 255, names: ["sapphire", "kyanite", "benitoite", "azurite", "lazulite"] },
  { a: 255, b: 292, names: ["tanzanite", "iolite", "sodalite", "sugilite", "lapis"] },
  { a: 292, b: 345, names: ["amethyst", "charoite", "kunzite", "morganite", "spinel"] },
];

function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch: number; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function mkrng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function statPct(v: number, lo: number, hi: number): number {
  return Math.max(4, Math.min(100, Math.round(((v - lo) / (hi - lo)) * 100)));
}

function deriveGemName(seed: string, hue: number): string {
  const r = mkrng(cyrb53(seed) >>> 0);
  const h = ((hue % 360) + 360) % 360;
  for (const { a, b, names } of GEM_NAME_RANGES) {
    if (a < b ? h >= a && h < b : h >= a || h < b)
      return names[Math.floor(r() * names.length)] ?? "crystal";
  }
  return "crystal";
}

function gemSummary(config: unknown, seed: string): Summary {
  const c = config as SeedstoneConfig | null;
  const hue = c?.gem.hue ?? 270;
  const sat = c?.gem.saturation ?? 0.8;
  const ior = c?.gem.material.ior ?? 2;
  const fire = c?.gem.material.iridescence ?? 0.5;
  const speed = c?.gem.speed ?? 1;
  const perfection = c?.gem.distortion.perfection ?? 0.5;
  const tilt = Math.round((c?.gem.tilt ?? 0) * (180 / Math.PI));
  const grade =
    perfection >= 0.88
      ? "Imperial"
      : perfection >= 0.75
        ? "Flawless"
        : perfection >= 0.58
          ? "Radiant"
          : perfection >= 0.38
            ? "Brilliant"
            : "Refined";

  return {
    title: deriveGemName(seed, hue),
    subtitle: `${grade} grade · tilt ${tilt >= 0 ? "+" : ""}${tilt}deg`,
    swatch: `oklch(0.62 ${(0.16 + sat * 0.1).toFixed(3)} ${hue.toFixed(1)})`,
    stats: [
      { label: "Saturation", pct: Math.round(sat * 100), value: `${Math.round(sat * 100)}%` },
      { label: "IOR", pct: statPct(ior, 1.5, 2.8), value: ior.toFixed(2) },
      { label: "Fire", pct: Math.round(fire * 100), value: `${Math.round(fire * 100)}%` },
      { label: "Speed", pct: statPct(speed, 0.3, 2), value: `x${speed.toFixed(2)}` },
      {
        label: "Perfection",
        pct: Math.round(perfection * 100),
        value: `${Math.round(perfection * 100)}%`,
      },
    ],
  };
}

function catSummary(config: unknown): Summary {
  const c = config as MeowtarConfig | null;
  return {
    title: c?.name ?? "Cat avatar",
    subtitle: c ? `${c.coat.pattern} coat · ${c.mood} mood` : "procedural SVG companion",
    swatch: c?.palette.coat,
    stats: c
      ? [
          {
            label: "Coat",
            value: `${Math.round(c.coat.hue)}deg`,
            pct: statPct(c.coat.hue, 0, 360),
          },
          { label: "Pattern", value: c.coat.pattern },
          { label: "Mood", value: c.mood },
          {
            label: "Floof",
            value: `${Math.round(c.face.floof * 100)}%`,
            pct: Math.round(c.face.floof * 100),
          },
          {
            label: "Whiskers",
            value: `x${c.whiskers.spread.toFixed(2)}`,
            pct: statPct(c.whiskers.spread, 0.82, 1.2),
          },
        ]
      : [],
  };
}

export function fallbackSummary(config: unknown, seed: string, uc: UseCase): Summary {
  const stats: SummaryStat[] = [];
  const walk = (value: unknown, path: string[] = []) => {
    if (stats.length >= 5) return;
    if (typeof value === "number") {
      stats.push({
        label: path.at(-1) ?? "value",
        value: Number.isInteger(value) ? String(value) : value.toFixed(2),
      });
    } else if (typeof value === "string") {
      stats.push({ label: path.at(-1) ?? "value", value });
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, next] of Object.entries(value)) walk(next, [...path, key]);
    }
  };
  walk(config);
  return { title: uc.name, subtitle: seed, stats };
}

export const siteUseCases: SiteUseCase[] = [
  {
    uc: gemUseCase,
    noun: "gemstone",
    lede: "Type a username, wallet, company, or AI agent — Seedstone forges a unique 3D gem as its permanent visual identity.",
    sampleSeeds: DEFAULT_SAMPLE_SEEDS,
    summarize: gemSummary,
  },
  {
    uc: catUseCase,
    noun: "cat",
    lede: "Type a username, wallet, company, or AI agent — Seedstone draws a deterministic SVG cat as its permanent visual identity.",
    sampleSeeds: ["@satoshi", "Mochi-77", "0x71C7...976F", "Patchwork Labs", "DOC-99812"],
    summarize: catSummary,
  },
];
