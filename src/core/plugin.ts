import { isSeeded, isPick, isConstant, type Traits } from "./traits";
import type { Plugin, View, CreateOptions, LabControls, LabSlider } from "./contract";

/** Identity helper — declare a plugin with full type inference. */
export function definePlugin<T extends Traits, C>(plugin: Plugin<T, C>): Plugin<T, C> {
  return plugin;
}

/**
 * Mount a plugin and return a live view — the entry point for rendering any
 * plugin. The runtime resolves `target` (a CSS selector or an element),
 * validates the inputs, then invokes the plugin's `mount` hook. End users call
 * `create`; they never call `plugin.mount` directly.
 *
 *   const view = create(gemPlugin, "#avatar", "alice");
 *   const view = create(catPlugin, el, "alice", { config: { coat: { hue: constant(120) } } });
 */
export function create<T extends Traits, C>(
  plugin: Plugin<T, C>,
  target: string | HTMLElement,
  seed: string,
  options?: CreateOptions,
): View<C> {
  const container = typeof target === "string" ? document.querySelector(target) : target;
  if (!(container instanceof HTMLElement)) {
    const where = typeof target === "string" ? ` for selector "${target}"` : "";
    throw new Error(`[seedstone] create(${plugin.id}): no container element found${where}.`);
  }
  if (typeof seed !== "string") {
    throw new TypeError(`[seedstone] create(${plugin.id}): seed must be a string.`);
  }
  return plugin.mount(container, seed, options);
}

/**
 * Build the `LabControls` map for a plugin's lab UI:
 *   - `seeded(min, max)` traits → `{ min, max }` slider (auto-filled; entry in
 *     `ranges` overrides if present)
 *   - `constant(number)` traits → `{ min, max }` slider only if `ranges` has an
 *     entry for the dot-path (constants have no inherent range)
 *   - `pick(options)` traits → `string[]` dropdown (auto-filled)
 *   - `constant(string)` traits → skipped
 */
export function buildLabControls(
  traits: Traits,
  ranges: Record<string, LabSlider> = {},
): LabControls {
  const out: LabControls = {};

  const walk = (node: unknown, path: string[]): void => {
    const dotted = path.join(".");
    if (isSeeded(node)) {
      out[dotted] = ranges[dotted] ?? { min: node.min, max: node.max };
      return;
    }
    if (isConstant(node)) {
      if (typeof node.value !== "number") return;
      if (dotted in ranges) out[dotted] = ranges[dotted];
      return;
    }
    if (isPick(node)) {
      out[dotted] = node.options();
      return;
    }
    if (node && typeof node === "object" && !Array.isArray(node)) {
      for (const [key, child] of Object.entries(node)) walk(child, [...path, key]);
    }
  };

  walk(traits, []);
  return out;
}

/** Reusable string→div renderer for SVG/HTML plugins. Owns the container:
 *  holds seed + overrides + resolved config, recomputes and swaps `innerHTML`
 *  on `update`/`setConfig`, and clears on `destroy`. Not part of the public API
 *  surface — import from `@seedstone/core/plugin` for plugin authoring. */
export function mountString<C>(
  container: HTMLElement,
  seed: string,
  resolve: (seed: string, overrides: object) => C,
  render: (config: C) => string,
  options: CreateOptions = {},
): View<C> {
  let currentSeed = seed;
  let overrides: object = options.config ?? {};
  let config = resolve(currentSeed, overrides);

  const paint = () => {
    container.innerHTML = render(config);
  };
  paint();
  options.onReady?.();

  return {
    get config() {
      return config;
    },
    update(next: string) {
      currentSeed = next;
      config = resolve(currentSeed, overrides);
      paint();
    },
    setConfig(next: object = {}) {
      overrides = next;
      config = resolve(currentSeed, overrides);
      paint();
    },
    destroy() {
      container.innerHTML = "";
    },
  };
}
