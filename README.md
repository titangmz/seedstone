# lumina-gem

Render a beautiful 3D rotating gemstone from any string. Same string always produces the same gem.

## Install

```sh
npm install lumina-gem
```

No other dependencies required — Three.js is bundled.

## Build from source

```sh
npm install
npm run build   # outputs to dist/
```

## Usage

The input string is the **gem seed** — any string you like. The same string always
produces the exact same gem; a different string produces a different one.

### ES module

```js
import { LuminaRenderer } from 'lumina-gem';

// Pass any string — username, hash, UUID, word, anything.
const gem = new LuminaRenderer('alice', {
  container: document.getElementById('gem'),
});
```

### Script tag

```html
<script src="node_modules/lumina-gem/dist/lumina-gem.standalone.js"></script>
<script>
  const { LuminaRenderer } = window.LuminaGem;
  new LuminaRenderer('alice', {
    container: document.getElementById('gem'),
  });
</script>
```

## API

```ts
new LuminaRenderer(input: string, options: LuminaOptions)
```

| Option | Type | Default | Description |
|---|---|---|---|
| `container` | `HTMLElement` | — | **Required.** Element to render into. |
| `width` | `number` | container width | Canvas width in px. |
| `height` | `number` | container height | Canvas height in px. |
| `background` | `string \| number \| null` | `null` | Background colour, or `null` for transparent. |
| `cut` | `GemCut` | `'brilliant'` | Geometry cut style. |
| `autoRotate` | `boolean` | `true` | Start rotating on construction. |
| `pixelRatio` | `number` | `devicePixelRatio` | Canvas pixel ratio. |

```ts
gem.resize(width, height)  // call from a ResizeObserver
gem.pause()
gem.play()
gem.destroy()              // frees all GPU resources
gem.dna                    // read-only: the GemDNA derived from the input string
```

## Adding a new geometry

1. Create `src/geometries/<name>.ts` exporting `build<Name>Geometry(facets: number)`.
2. Register it in `src/geometries/index.ts` — add to `GEM_CUTS` and extend the `GemCut` union.
3. Pass `cut: '<name>'` to `LuminaRenderer`.

## Demo

Open either file directly in a browser (no server needed):

- `demo/index.html` — full demo with gallery, input, DNA pills
- `demo/minimal.html` — single gem, ~4 lines of code
