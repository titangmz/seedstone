/**
 * The derivation engine
 *
 * Declare a tree of **traits** (each value either fixed or seed-driven), hand it
 * a seed, and `derive` resolves it to a plain config object. Every use case (the
 * gem, an SVG, a server thumbnail) starts here.
 *
 *   constant(value)   fixed — the same for every output (number OR string)
 *   seeded(min, max)  seed-driven scalar, sampled uniformly from [min, max)
 *   pick(options)     seed-driven choice from a list
 *
 * Flip a value between fixed and seed-driven by editing its constructor at the
 * declaration — `constant(200)` ⇄ `seeded(0, 360)`. Each seeded value samples an
 * independent hash of its dot-path and the seed, so adding, removing, or pinning
 * one never affects the others.
 */

import { sampleUnit } from "./random";

// ── Trait constructors ──────────────────────────────────────────────────────

/** A fixed value — number or string — that derivation reads verbatim. */
export interface ConstantTrait<V extends number | string = number | string> {
  readonly kind: "constant";
  readonly value: V;
}

/** A seed-driven scalar, sampled uniformly from [min, max). */
export interface SeededTrait {
  readonly kind: "seeded";
  readonly min: number;
  readonly max: number;
}

/** A seed-driven categorical choice. The options list is read lazily, so it can
 *  come from a registry that is still populating when the traits are declared. */
export interface PickTrait {
  readonly kind: "pick";
  readonly options: () => string[];
}

export type Trait = ConstantTrait | SeededTrait | PickTrait;

/** Fixed value — same for every seed. Pin a pinnable choice with `constant("garnet")`. */
export function constant<V extends number | string>(value: V): ConstantTrait<V> {
  return { kind: "constant", value };
}

/** Seed-driven scalar sampled uniformly from [min, max). */
export function seeded(min: number, max: number): SeededTrait {
  return { kind: "seeded", min, max };
}

/** Seed-driven choice from a list. */
export function pick(options: () => string[]): PickTrait {
  return { kind: "pick", options };
}

// ── Guards ──────────────────────────────────────────────────────────────────

export function isConstant(v: unknown): v is ConstantTrait {
  return typeof v === "object" && v !== null && (v as { kind?: unknown }).kind === "constant";
}

export function isSeeded(v: unknown): v is SeededTrait {
  return typeof v === "object" && v !== null && (v as { kind?: unknown }).kind === "seeded";
}

export function isPick(v: unknown): v is PickTrait {
  return typeof v === "object" && v !== null && (v as { kind?: unknown }).kind === "pick";
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ── Types ───────────────────────────────────────────────────────────────────

/** A declaration tree: traits, nested groups, and raw passthrough values. */
export type Traits = Record<string, unknown>;

/** The resolved shape of a traits tree — every trait unwrapped to its value. */
export type Config<T> =
  T extends ConstantTrait<infer V>
    ? V
    : T extends SeededTrait
      ? number
      : T extends PickTrait
        ? string
        : T extends readonly unknown[]
          ? T
          : T extends object
            ? { [K in keyof T]: Config<T[K]> }
            : T;

/**
 * A deep-partial override tree. At any leaf:
 *   - a plain number/string pins the value (sugar for `constant(...)`),
 *   - `seeded(min, max)` makes a scalar seed-driven (even over a constant),
 *   - `pick(options)` re-opens a pinned choice,
 *   - a `constant(...)` trait pins explicitly.
 */
export type Override<T> =
  T extends ConstantTrait<infer V>
    ? V | Trait
    : T extends SeededTrait
      ? number | Trait
      : T extends PickTrait
        ? string | Trait
        : T extends readonly unknown[]
          ? T
          : T extends object
            ? { [K in keyof T]?: Override<T[K]> }
            : T;

// ── Resolution ──────────────────────────────────────────────────────────────

/**
 * Resolve a traits tree to plain values. Constants collapse to their value;
 * seeded scalars/choices are sampled from the seed and the node's dot-path as
 * the hash label. Without a seed, seeded scalars resolve to their range midpoint
 * and choices to their first option (used for static defaults).
 */
export function derive<T extends Traits>(traits: T, seed?: string): Config<T> {
  function resolve(node: unknown, path: string): unknown {
    if (isConstant(node)) return node.value;
    if (isSeeded(node)) {
      return seed !== undefined
        ? node.min + sampleUnit(seed, path) * (node.max - node.min)
        : (node.min + node.max) / 2;
    }
    if (isPick(node)) {
      const options = node.options();
      return seed !== undefined
        ? options[Math.floor(sampleUnit(seed, path) * options.length)]
        : options[0];
    }
    if (Array.isArray(node)) return node;
    if (isPlainObject(node)) {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) out[k] = resolve(v, path ? `${path}.${k}` : k);
      return out;
    }
    return node;
  }
  return resolve(traits, "") as Config<T>;
}

/**
 * Apply an override tree onto traits, returning a new traits tree (then pass it
 * to `derive`). A plain number/string pins a leaf to a fixed value; a trait
 * (`constant`/`seeded`/`pick`) replaces the leaf outright — so a `seeded(min,max)`
 * override flips a constant back to seed-driven.
 */
export function merge<T extends Traits>(base: T, overrides: Override<T> = {} as Override<T>): T {
  function mergeNode(baseNode: unknown, patch: unknown): unknown {
    if (patch === undefined) return baseNode;
    if (typeof patch === "number" || typeof patch === "string") return constant(patch);
    if (isConstant(patch) || isSeeded(patch) || isPick(patch)) return patch;
    if (isPlainObject(baseNode) && isPlainObject(patch)) {
      const merged: Record<string, unknown> = { ...baseNode };
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) continue;
        merged[key] = mergeNode(baseNode[key], value);
      }
      return merged;
    }
    return patch;
  }
  return mergeNode(base, overrides) as T;
}
