# seedstone

Turn any string into a deterministic visual identity. The same seed always
produces the same output; change one character and you get a different — but
equally stable — result.

seedstone is split into two layers:

- a small, dependency-free **core** that maps a seed to a config and defines the
  plugin contract, and
- **plugins** that take that config and render something (a WebGL gem, an SVG
  avatar, an HTML badge — anything).

The core knows nothing about any specific plugin. A plugin depends only on the
core. That boundary is deliberate: each plugin can be extracted into its own
package without touching the engine.

```
src/
  core/        the engine — traits, determinism, the plugin contract, the runtime
  gem/         reference plugin: a 3D gemstone (WebGL / three.js)
  meowtar/     reference plugin: an SVG cat avatar (string output, SSR-safe)
  index.ts     public entry point — re-exports core + the bundled plugins
```

---

## Mental model

```
seed ──▶ traits ──▶ derive() ──▶ config ──▶ render ──▶ View
         (declared    (core)      (plain      (plugin)
          per plugin)              object)
```

1. A plugin **declares a tree of traits** — each leaf is either fixed or
   seed-driven.
2. The core **derives** that tree against a seed into a plain config object.
3. The plugin **renders** the config into a container and returns a **`View`** —
   a live handle you can re-seed, override, resize, or destroy.

Everything else (the lab UI, overrides, SSR) is built on those three steps.

---

## Part 1 — The core (`core/`)

The engine. Zero runtime dependencies, no DOM assumptions, no knowledge of any
plugin.

### Traits — declaring what varies

A **trait** is a single setting. There are three kinds:

```ts
import { constant, seeded, pick } from "seedstone";

constant(0.9); // fixed — same for every seed (number or string)
seeded(0, 360); // seed-driven scalar, uniform in [min, max)
pick(() => ["a", "b"]); // seed-driven choice from a list
```

You compose them into a nested **traits tree**:

```ts
const traits = {
  body: {
    hue: seeded(0, 360),
    shape: pick(() => ["disc", "ring", "star"]),
    opacity: constant(0.9),
  },
};
```

Flip any leaf between fixed and seed-driven by editing its constructor —
`constant(200)` ⇄ `seeded(140, 240)`. Each seeded leaf hashes an independent
function of its **dot-path** (`"body.hue"`) and the seed, so adding, removing, or
pinning one trait never shifts the others.

### Deriving — seed → config

`derive(traits, seed)` walks the tree and resolves every trait to a plain value:

```ts
import { derive } from "seedstone";

derive(traits, "alice");
// → { body: { hue: 142.7, shape: "star", opacity: 0.9 } }
```

Called without a seed, seeded scalars resolve to their range midpoint and picks
to their first option — handy for static defaults.

The resolved shape is fully typed:

```ts
import type { Config } from "seedstone";
type MyConfig = Config<typeof traits>;
// { body: { hue: number; shape: string; opacity: number } }
```

### Overrides — merging before derive

`merge(base, overrides)` applies a deep-partial override tree onto the base
traits, returning a new traits tree to derive. An override leaf is itself a
trait, so it can **pin** a value or **re-open** it to the seed:

```ts
import { merge, derive, constant, seeded } from "seedstone";

const pinned = merge(traits, { body: { hue: constant(200) } });
derive(pinned, "alice").body.hue; // → 200, for every seed

const ranged = merge(traits, { body: { hue: seeded(140, 240) } });
// hue is now seed-driven within a narrower band
```

`Override<T>` types the override tree; omitting a key leaves that trait at its
base declaration.

### Determinism primitives

The low-level functions the engine is built on, exported for plugins that need
their own deterministic randomness (scattering particles, jittering geometry):

```ts
sampleUnit(seed, label); // uniform float in [0,1) for a seed + label pair
mulberry32(int); // seeded stream PRNG → () => float in [0,1)
hash2D(seed, i); // stateless indexable float in [0,1) from two ints
hslToHex(h, s, l); // color helper
```

`sampleUnit` is what `derive` uses internally; the others are conveniences.

### The plugin contract

Three types define everything a plugin must provide and everything a consumer
gets back.

**`Plugin<T, C>`** — a passive descriptor the runtime drives:

```ts
interface Plugin<T extends Traits, C> {
  id: string; // stable id, e.g. "gem"
  name: string; // human label, e.g. "Gemstone"
  traits: T; // the trait declaration tree
  lab?: LabControls; // optional UI metadata (see Part 3)
  mount(container, seed, options?): View<C>; // runtime hook — see below
}
```

**`View<C>`** — the live handle returned after mounting:

```ts
interface View<C> {
  readonly config: C; // the config currently rendered
  update(seed: string): void; // re-render for a new seed
  setConfig(overrides: object): void; // replace overrides and re-render
  resize?(w: number, h: number): void; // optional — present on canvas plugins
  destroy(): void; // tear down, release the container
}
```

**`CreateOptions`** — optional hints passed at mount time (`config` overrides
traits; `width`/`height`/`background`/`targetFPS` are used by plugins that can,
ignored by those that can't; `onReady` fires when first paint completes).

> `mount` is a **runtime hook**: plugin authors implement it, the runtime calls
> it. Consumers never call `plugin.mount` directly — they call `create` (below).

### `create` — the runtime entry point

`create` is how a consumer runs _any_ plugin. It resolves the target (a CSS
selector or an element), validates inputs, then invokes the plugin's `mount`
hook:

```ts
import { create } from "seedstone";

const view = create(myPlugin, "#avatar", "alice");
const view = create(myPlugin, el, "alice", { config: { body: { hue: constant(200) } } });

view.update("bob"); // re-seed
view.setConfig({ body: { hue: constant(0) } }); // pin a trait
view.setConfig({}); // reset all overrides
view.config; // current resolved config
view.destroy();
```

This is the seam that makes a plugin a _plugin_: it plugs into the seedstone
runtime. The single chokepoint is also where cross-cutting concerns (validation,
error messages, and — once plugins ship as independent packages — version
checks) live.

---

## Part 2 — Anatomy of a plugin

A plugin is a folder that depends only on `../core`. The reference plugins follow
a four-file convention; only `plugin.ts` is strictly required.

```
my-plugin/
  config.ts    traits + the resolve function (the seed → config contract)
  render.ts    turns a config into pixels/markup and returns a View
  lab.ts       optional — control metadata for a tuning UI
  plugin.ts    definePlugin(): ties traits + render together
  index.ts     barrel — the plugin's public surface
```

### `config.ts` — traits + resolve

Declare the traits and a `resolve(seed, overrides?)` that produces the final
config. Keeping both here gives one typed source of truth:

```ts
import { seeded, pick, constant, derive, merge, type Config, type Override } from "../core/index";

export const myTraits = {
  body: {
    hue: seeded(0, 360),
    shape: pick(() => ["disc", "ring", "star"]),
    opacity: constant(0.9),
  },
};

export type MyTraits = typeof myTraits;
export type MyConfig = Config<MyTraits>;
export type MyOverrides = Override<MyTraits>;

export function resolveMy(seed: string, overrides?: MyOverrides): MyConfig {
  return derive(merge<MyTraits>(myTraits, overrides), seed);
}
```

A `resolve` can do more than `derive` — derive post-processing (a palette, a
display name, a PRNG seed) belongs here too, so the renderer receives a
ready-to-draw config.

### `render.ts` — config → a `View`

The renderer owns the container. It paints on mount and reconciles in place on
`update` / `setConfig`. The shape you return _is_ the `View`.

For **string-based renderers** (SVG, HTML — anything that's "render a string and
swap it in"), the core ships `mountString`, which handles the seed/override
state machine for you:

```ts
import { mountString, type View, type CreateOptions } from "../core/index";
import { resolveMy, type MyConfig, type MyOverrides } from "./config";

function draw(config: MyConfig): string {
  const { hue, shape, opacity } = config.body;
  return `<svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="hsl(${hue} 70% 55%)" opacity="${opacity}" />
  </svg>`;
}

export function mountMy(
  container: HTMLElement,
  seed: string,
  options: CreateOptions = {},
): View<MyConfig> {
  return mountString<MyConfig>(
    container,
    seed,
    (s, overrides) => resolveMy(s, overrides as MyOverrides),
    draw,
    options,
  );
}
```

For **stateful renderers** (WebGL, canvas, animation loops) you implement the
`View` yourself — a class whose methods satisfy the interface — so you can manage
the render loop, resize handling, and teardown. (The gem plugin does this.)

### `plugin.ts` — wire it together

`definePlugin` is an identity helper that locks in full type inference:

```ts
import { definePlugin } from "../core/index";
import { myTraits, type MyTraits, type MyConfig } from "./config";
import { mountMy } from "./render";
import { myLab } from "./lab";

export const myPlugin = definePlugin<MyTraits, MyConfig>({
  id: "my-plugin",
  name: "My Plugin",
  traits: myTraits,
  lab: myLab, // optional
  mount: (container, seed, options) => mountMy(container, seed, options),
});
```

### `index.ts` — the barrel

Export the plugin and the types a consumer needs. Keep internals (the renderer
class, the resolve function) out unless they're genuinely useful headless:

```ts
export { myPlugin } from "./plugin";
export type { MyTraits, MyConfig, MyOverrides } from "./config";
```

That's a complete plugin. Drop it anywhere and `create(myPlugin, el, seed)`
works.

---

## Part 3 — The lab (optional)

The lab is **developer-only metadata** for building a tuning UI — sliders to
explore values and find good defaults, then harden them back into `config.ts`.
It has no effect on how a plugin renders.

`LabControls` is a flat map keyed by dot-path. Each entry is discriminated by
shape:

```ts
type LabSlider = { min: number; max: number }; // → a slider (numeric trait)
type LabOptions = string[]; // → a dropdown (options trait)
type LabControls = Record<string, LabSlider | LabOptions>;
```

`buildLabControls(traits, ranges?)` generates the map from a traits tree:

- `seeded(min, max)` → slider bounds auto-filled from the trait
- `pick(options)` → dropdown options auto-filled by calling `options()`
- `constant(number)` → slider **only if** `ranges` supplies bounds (a constant
  has no inherent range)
- `constant(string)` → skipped

```ts
import { buildLabControls } from "../core/index";
import { myTraits } from "./config";

// seeded + pick traits need no entry; only constant numbers do.
export const myLab = buildLabControls(myTraits, {
  "body.opacity": { min: 0, max: 1 },
});
```

A lab UI reads `plugin.lab`, renders a slider or dropdown per entry, and drives
the live preview through `view.setConfig(...)` — pinning a value with
`constant()`, re-opening it with `seeded()`, or removing the key to fall back to
the declaration.

---

## Part 4 — Package boundaries

The dependency rule is one-directional:

```
core/      depends on nothing
plugins/   depend only on core/
index.ts   depends on core/ + the bundled plugins
```

Because of that, extracting a plugin into its own repo/package is a near
mechanical change:

1. Move the plugin folder out.
2. Replace `from "../core/index"` with `from "@seedstone/core"`.
3. Declare `@seedstone/core` as a **`peerDependency`**, not a regular
   `dependency` (see below).
4. Publish. Consumers `create(thatPlugin, el, seed)` exactly as before.

The core is the host runtime everyone imports; plugins are interchangeable units
that plug into it. Keep new code on the correct side of that line — engine
concerns in `core/`, rendering concerns in the plugin — and the boundary stays
clean.

### One core, shared by everyone

Both the consuming app and every plugin import the core — that's by design: the
core is the shared contract (`Plugin`, `View`, the trait constructors), and the
only way two packages can interoperate is by referencing the _same_ definitions.
This is the React/Vue model — apps and component libraries both import the
framework.

The thing to protect is that there is exactly **one installed copy** of the core.
Two copies in the dependency tree means two sets of types and wasted bytes. So
when a plugin is its own package, it must list the core as a `peerDependency`:

```jsonc
// my-plugin/package.json
{
  "peerDependencies": { "@seedstone/core": "^1.0.0" },
}
```

The app installs the core once; every plugin binds to that single instance.

This is hardened in the engine, too: the trait guards are **structural**, not
nominal — `isConstant(v)` checks `v.kind === "constant"`, never
`v instanceof …`. So a `constant()` produced by one copy of the core is still
recognized by another copy's `isConstant`, which sidesteps the worst of the
dual-package hazard. Keep them that way.

---

## Public surface (`index.ts`)

```ts
// Engine
constant, seeded, pick, derive, merge, isConstant, isSeeded, isPick
sampleUnit, mulberry32, hash2D, hslToHex
type Trait, ConstantTrait, SeededTrait, PickTrait, Traits, Config, Override

// Plugin framework
definePlugin, create, buildLabControls
type Plugin, View, CreateOptions, LabControl, LabSlider, LabOptions, LabControls

// Bundled plugins
gemPlugin, buildGeometry, listCuts
catPlugin, renderMeowtar
type GemConfig, GemTraits, GemOverrides, GemCut, GemCutModule
type MeowtarConfig, MeowtarTraits, MeowtarOverrides, MeowtarValues, Palette
```
