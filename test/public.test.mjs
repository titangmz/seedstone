import { describe, it, expect } from "vitest";
import { configSchema, derive, merge, isSeeded, seeded } from "../dist/seedstone.esm.js";

// Exercises the *built bundle's* public engine API end-to-end (the new names),
// over the real gem trait tree. The engine internals are unit-tested against
// source in core.test.ts.

function seededLeaves(node, path = []) {
  if (isSeeded(node)) return [{ path: path.join("."), min: node.min, max: node.max }];
  if (!node || typeof node !== "object" || Array.isArray(node) || "kind" in node) return [];
  return Object.entries(node).flatMap(([k, v]) => seededLeaves(v, [...path, k]));
}

function getPath(obj, path) {
  return path.split(".").reduce((o, key) => o?.[key], obj);
}

describe("public engine (built bundle)", () => {
  it("same seed always derives the same config", () => {
    for (const seed of ["alice", "hello world", "0x1a2b3c", "✦"]) {
      expect(derive(configSchema, seed)).toEqual(derive(configSchema, seed));
    }
  });

  it("different seeds derive different configs", () => {
    expect(derive(configSchema, "alice")).not.toEqual(derive(configSchema, "bob"));
  });

  it("empty seed falls back to seedstone", () => {
    expect(derive(configSchema, "")).toEqual(derive(configSchema, "seedstone"));
  });

  it("every seeded knob stays within its declared range", () => {
    const knobs = seededLeaves(configSchema);
    expect(knobs.length).toBeGreaterThan(0);
    for (let i = 0; i < 20; i++) {
      const resolved = derive(configSchema, `seed-${i}`);
      for (const { path, min, max } of knobs) {
        const value = getPath(resolved, path);
        expect(value, `${path} out of range`).toBeGreaterThanOrEqual(min);
        expect(value, `${path} out of range`).toBeLessThan(max);
      }
    }
  });

  it("merge pins overrides fixed across all seeds", () => {
    const traits = merge(configSchema, { gem: { hue: 200 }, sparkles: { count: 50 } });
    for (const seed of ["alice", "bob", ""]) {
      const resolved = derive(traits, seed);
      expect(resolved.gem.hue).toBe(200);
      expect(resolved.sparkles.count).toBe(50);
    }
  });

  it("seeded(min, max) flips a constant back to seed-generated", () => {
    // gem.material.transmission is constant — fixed for all seeds
    const fixed = derive(configSchema, "alice").gem.material.transmission;
    expect(derive(configSchema, "bob").gem.material.transmission).toBe(fixed);

    const traits = merge(configSchema, { gem: { material: { transmission: seeded(0, 1) } } });
    const a = derive(traits, "alice").gem.material.transmission;
    const b = derive(traits, "bob").gem.material.transmission;
    expect(a).not.toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });
});
