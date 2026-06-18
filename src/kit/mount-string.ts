import type { Mounted, MountOptions } from "./contract";

/**
 * The reusable string→div renderer for use cases whose output is a string (SVG,
 * HTML, …). Owns the container: it holds the current seed + overrides + resolved
 * config, recomputes and swaps `innerHTML` on `update` / `setConfig`, and clears
 * on `destroy`. Cheap enough to call on every keystroke — there's no canvas or
 * render loop, a render is a pure function of the seed.
 *
 * A use case wires it up with its own `resolve` (seed + overrides → config) and
 * `render` (config → string); see the cat's `mount`.
 */
export function mountString<C>(
  container: HTMLElement,
  seed: string,
  resolve: (seed: string, overrides: object) => C,
  render: (config: C) => string,
  options: MountOptions = {},
): Mounted<C> {
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
