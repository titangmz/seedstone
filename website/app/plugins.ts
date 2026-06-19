import { catPlugin, gemPlugin, type MeowtarConfig, type GemConfig, type Plugin } from "seedstone";

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

export interface SitePlugin {
  plugin: Plugin;
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

function statPct(v: number, lo: number, hi: number): number {
  return Math.max(4, Math.min(100, Math.round(((v - lo) / (hi - lo)) * 100)));
}

function gemSummary(config: unknown): Summary {
  const c = config as GemConfig | null;
  const hue = c?.gem.hue ?? 270;
  const sat = c?.gem.saturation ?? 0.8;
  const ior = c?.gem.material.ior ?? 2;
  const fire = c?.gem.material.iridescence ?? 0.5;
  const speed = c?.gem.speed ?? 1;
  const perfection = c?.gem.distortion.perfection ?? 0.5;
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
    title: c?.gem.cut ?? "crystal",
    swatch: `oklch(0.62 ${(0.16 + sat * 0.1).toFixed(3)} ${hue.toFixed(1)})`,
    stats: [
      { label: "Grade", value: grade },
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

export function fallbackSummary(config: unknown, seed: string, plugin: Plugin): Summary {
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
  return { title: plugin.name, subtitle: seed, stats };
}

export const sitePlugins: SitePlugin[] = [
  {
    plugin: gemPlugin,
    noun: "gemstone",
    lede: "Type a username, wallet, company, or AI agent — Seedstone forges a unique 3D gem as its permanent visual identity.",
    sampleSeeds: DEFAULT_SAMPLE_SEEDS,
    summarize: gemSummary,
  },
  {
    plugin: catPlugin,
    noun: "cat",
    lede: "Type a username, wallet, company, or AI agent — Seedstone draws a deterministic SVG cat as its permanent visual identity.",
    sampleSeeds: ["@satoshi", "Mochi-77", "0x71C7...976F", "Patchwork Labs", "DOC-99812"],
    summarize: catSummary,
  },
];
