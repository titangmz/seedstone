import { describe, it, expect } from "vitest";
import {
  configSchema,
  resolveConfig,
  mergeSchema,
  isScalarParam,
  seeded,
} from "../dist/seedstone.esm.js";

function seedKnobs(node, path = []) {
  if (isScalarParam(node)) return node.mode === "dna" ? [{ path: path.join("."), knob: node }] : [];
  if (!node || typeof node !== "object" || Array.isArray(node)) return [];
  return Object.entries(node).flatMap(([k, v]) => seedKnobs(v, [...path, k]));
}

function getPath(obj, path) {
  return path.split(".").reduce((o, key) => o?.[key], obj);
}

describe("engine", () => {
  it("same seed always resolves to the same config", () => {
    for (const seed of ["alice", "hello world", "0x1a2b3c", "✦"]) {
      expect(resolveConfig(configSchema, seed)).toEqual(resolveConfig(configSchema, seed));
    }
  });

  it("different seeds produce different configs", () => {
    expect(resolveConfig(configSchema, "alice")).not.toEqual(resolveConfig(configSchema, "bob"));
  });

  it("empty seed falls back to seedstone", () => {
    expect(resolveConfig(configSchema, "")).toEqual(resolveConfig(configSchema, "seedstone"));
  });

  it("every seed-derived knob stays within its declared range", () => {
    const knobs = seedKnobs(configSchema);
    expect(knobs.length).toBeGreaterThan(0);
    for (let i = 0; i < 20; i++) {
      const resolved = resolveConfig(configSchema, `seed-${i}`);
      for (const { path, knob } of knobs) {
        const value = getPath(resolved, path);
        expect(value, `${path} out of range`).toBeGreaterThanOrEqual(knob.min);
        expect(value, `${path} out of range`).toBeLessThanOrEqual(knob.max);
      }
    }
  });

  it("knobs are independent — changing seed affects each knob separately", () => {
    const knobs = seedKnobs(configSchema);
    const a = resolveConfig(configSchema, "alice");
    const b = resolveConfig(configSchema, "bob");
    // At least one knob must differ (they're not all the same)
    const diffCount = knobs.filter(({ path }) => getPath(a, path) !== getPath(b, path)).length;
    expect(diffCount).toBeGreaterThan(0);
    // But not all knobs should differ identically (statistical independence check)
    // i.e. values don't all shift in lock-step — we verify by checking at least two
    // knobs with different relative differences
    const diffs = knobs.map(({ path, knob }) => {
      const range = knob.max - knob.min;
      return (getPath(a, path) - getPath(b, path)) / range;
    });
    const unique = new Set(diffs.map((d) => d.toFixed(4)));
    expect(unique.size).toBeGreaterThan(1);
  });

  it("pinned overrides are fixed across all seeds", () => {
    const schema = mergeSchema({ gem: { hue: 200 }, sparkles: { count: 50 } });
    for (const seed of ["alice", "bob", ""]) {
      const resolved = resolveConfig(schema, seed);
      expect(resolved.gem.hue).toBe(200);
      expect(resolved.sparkles.count).toBe(50);
    }
  });

  it("seeded() flips a fixed param back to seed-generated", () => {
    // transmission is c() by default — fixed for all seeds
    const fixed = resolveConfig(configSchema, "alice").gem.material.transmission;
    expect(resolveConfig(configSchema, "bob").gem.material.transmission).toBe(fixed);

    const schema = mergeSchema({ gem: { material: { transmission: seeded() } } });
    const a = resolveConfig(schema, "alice").gem.material.transmission;
    const b = resolveConfig(schema, "bob").gem.material.transmission;
    expect(a).not.toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
  });
});
