import { describe, it, expect } from "vitest";
import { gemPlugin } from "../src/gem/index";
import { catPlugin } from "../src/meowtar/index";
import { isSeeded, isConstant, isPick } from "../src/core/index";

/** Every numeric trait path (seeded, or constant with a number value). */
function numericPaths(node: unknown, path: string[] = []): string[] {
  if (isSeeded(node)) return [path.join(".")];
  if (isConstant(node)) return typeof node.value === "number" ? [path.join(".")] : [];
  if (isPick(node)) return [];
  if (node && typeof node === "object" && !Array.isArray(node)) {
    return Object.entries(node).flatMap(([k, v]) => numericPaths(v, [...path, k]));
  }
  return [];
}

/** Every pick trait path. */
function pickPaths(node: unknown, path: string[] = []): string[] {
  if (isPick(node)) return [path.join(".")];
  if (isSeeded(node) || isConstant(node)) return [];
  if (node && typeof node === "object" && !Array.isArray(node)) {
    return Object.entries(node).flatMap(([k, v]) => pickPaths(v, [...path, k]));
  }
  return [];
}

describe.each([
  ["gem", gemPlugin],
  ["cat", catPlugin],
])("%s plugin", (_, plugin) => {
  it("has the functional shape", () => {
    expect(typeof plugin.id).toBe("string");
    expect(typeof plugin.name).toBe("string");
    expect(typeof plugin.mount).toBe("function");
    expect(plugin.traits).toBeTruthy();
  });

  it("lab covers every numeric trait with a slider", () => {
    const paths = numericPaths(plugin.traits);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      const control = plugin.lab?.[p];
      expect(control, `${plugin.id} missing lab.${p}`).toBeTruthy();
      expect(Array.isArray(control), `${plugin.id} lab.${p} should be a slider, not array`).toBe(false);
    }
  });

  it("lab covers every pick trait with a dropdown", () => {
    const paths = pickPaths(plugin.traits);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      const control = plugin.lab?.[p];
      expect(Array.isArray(control), `${plugin.id} missing dropdown for lab.${p}`).toBe(true);
      expect((control as string[]).length, `${plugin.id} lab.${p} has no options`).toBeGreaterThan(0);
    }
  });

  it("carries no website/presentation fields (functional only)", () => {
    for (const key of ["copy", "summarize", "sampleSeeds", "noun"]) {
      expect(key in plugin, `${plugin.id} should not expose ${key}`).toBe(false);
    }
  });
});
