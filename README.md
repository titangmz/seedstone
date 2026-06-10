# seedstone

Render a beautiful 3D rotating gemstone from any string. The same string always produces the exact same gem — a different string produces a different one.

Every trait of the gem — colour, cut, refraction, fire, imperfections — is derived deterministically from the input, making seedstone a drop-in visual identity for usernames, hashes, UUIDs, or anything else you can stringify.

- **Deterministic** — same seed in, same gem out, on every machine
- **Zero config** — one `<script>` tag or one import; Three.js is bundled
- **Eight cuts** — from a sharp tetrahedron to an 80-facet geodesic sphere
- **Physically based** — transmission, iridescence, and refraction via `MeshPhysicalMaterial`

## Quick start

### ES module

```js
import { SeedstoneRenderer } from 'seedstone';

// Pass any string — username, hash, UUID, word, anything.
const gem = new SeedstoneRenderer('alice', {
  container: document.getElementById('gem'),
});
```

### Script tag

```html
<script src="node_modules/seedstone/dist/seedstone.standalone.js"></script>
<script>
  const { SeedstoneRenderer } = window.Seedstone;
  new SeedstoneRenderer('alice', {
    container: document.getElementById('gem'),
  });
</script>
```

A runnable copy of this lives in [demo/index.html](demo/index.html) — build the library, then open it directly in a browser.

## API

### `new SeedstoneRenderer(seed, options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `container` | `HTMLElement` | — | **Required.** Element the canvas is appended to. |
| `width` | `number` | container width | Canvas width in px. |
| `height` | `number` | container height | Canvas height in px. |
| `background` | `string \| number \| null` | `null` | Background colour, or `null` for transparent. |
| `autoRotate` | `boolean` | `true` | Start the render loop on construction. If `false`, a single still frame is rendered. |
| `pixelRatio` | `number` | `min(devicePixelRatio, 2)` | Canvas pixel ratio. |
| `targetFPS` | `number` | uncapped | Cap the frame rate — handy for thumbnails (e.g. `24`). |
| `overrides` | `Partial<GemDNA>` | `{}` | Force individual DNA traits, e.g. `{ cut: 'garnet' }`. |
| `preserveDrawingBuffer` | `boolean` | `false` | Keep the buffer readable for `canvas.toDataURL()`. Costs performance. |

### Methods

```ts
gem.update(seed, overrides?)  // swap to a new seed — reuses the WebGL context
gem.resize(width, height)     // call from a ResizeObserver
gem.pause()
gem.play()
gem.destroy()                 // frees all GPU resources
gem.dna                       // read-only: the GemDNA derived from the seed
```

### Standalone helpers

```ts
import { stringToDNA, buildGeometry, listCuts } from 'seedstone';

stringToDNA('alice')     // → GemDNA: hue, saturation, cut, ior, brilliance, …
listCuts()               // → ['citrine', 'fluorite', 'garnet', …]
buildGeometry('garnet')  // → THREE.BufferGeometry for a cut
```

## How it works

The seed string is hashed (djb2) into independent channels, one per DNA trait. Each trait maps its channel onto a tuned range — hue across the full wheel, index of refraction between 1.8 and 2.8, a `perfection` grade that controls how distorted the raw crystal is, and so on. The DNA then drives geometry selection, vertex distortion, material parameters, and the orbiting accent lights.

## The cuts

| Cut | Shape | Facets |
|---|---|---|
| `spinel` | Tetrahedron | 4 |
| `pyrite` | Cube | 6 |
| `fluorite` | Octahedron | 8 |
| `garnet` | Dodecahedron | 12 |
| `citrine` | Pentagonal antiprism | 16 |
| `tanzanite` | Icosahedron | 20 |
| `tourmaline` | Elongated bipyramid | 20 |
| `zircon` | Geodesic sphere | 80 |

### Adding a new cut

1. Create `src/geometries/<name>.ts`.
2. Export a default `GemCutModule` with a unique `name` and a `build()` function.
3. Build. The registry auto-discovers the file and the DNA system can select it.

```ts
import type { GemCutModule } from './index';

const mod: GemCutModule = {
  name: 'mycut',
  build: () => /* return a THREE.BufferGeometry */,
};
export default mod;
```

## Repo structure

```
seedstone/
├── src/
│   ├── config.ts     # Central tuning file — every visual/performance knob
│   ├── dna.ts        # Seed string → GemDNA derivation
│   ├── renderer.ts   # WebGL context, render loop, public API
│   ├── scene/        # Environment, gem, lights, sparkles
│   └── geometries/   # Cut registry + geometry builders
├── dist/         # Built library output (published to npm)
├── demo/         # Standalone HTML demo — open directly in a browser
├── test/         # Node test suite (runs against the built ESM output)
└── website/      # Nuxt site (separate package, not published to npm)
```

The library (`/`) and the website (`/website`) are **independent packages** — `npm install` in the root only installs library build tools.

## Development

```sh
npm install
npm run build   # bundle ESM + UMD + standalone into dist/
npm test        # builds, then runs the test suite
```

### Tuning the look

Every visual and performance knob — material physics, light rig, environment
colours, sparkle behaviour, camera, frame pacing — lives in
[src/config.ts](src/config.ts), commented and grouped by scene module. Edit it
and rebuild; values are baked into the bundle, and types are inferred from the
values themselves so there is no schema to keep in sync.

To work on the website (it consumes the built library, so build that first):

```sh
npm run build
cd website
npm install
npm run dev
```

## License

[MIT](LICENSE)
