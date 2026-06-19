/**
 * The fox plugin — mounts a live, seed-driven fox into a container.
 *
 * Browser path: svg.js draws straight into the real DOM (no svgdom). The View
 * owns the svg.js root, repaints on `update`/`setConfig`, and tears down on
 * `destroy`. The headless string path lives in ./render.
 */

import { SVG } from "@svgdotjs/svg.js";
import { definePlugin, buildLabControls, type View } from "../core/index";
import { foxTraits, resolveFox, type FoxTraits, type FoxOverrides } from "./config";
import { drawFox, type FoxConfig } from "./draw";

export const foxPlugin = definePlugin<FoxTraits, FoxConfig>({
  id: "fox",
  name: "Fox",
  traits: foxTraits,
  lab: buildLabControls(foxTraits),
  mount: (container, seed, options = {}): View<FoxConfig> => {
    const canvas = SVG().addTo(container).viewbox(0, 0, 256, 256).attr({ width: "100%", height: "100%" });

    let currentSeed = seed;
    let overrides = (options.config ?? {}) as FoxOverrides;
    let config = resolveFox(currentSeed, overrides);

    const paint = () => {
      canvas.clear();
      drawFox(canvas, config);
    };
    paint();
    options.onReady?.();

    return {
      get config() {
        return config;
      },
      update(next: string) {
        currentSeed = next;
        config = resolveFox(currentSeed, overrides);
        paint();
      },
      setConfig(next: object = {}) {
        overrides = next as FoxOverrides;
        config = resolveFox(currentSeed, overrides);
        paint();
      },
      destroy() {
        canvas.remove();
        container.innerHTML = "";
      },
    };
  },
});
