# seedstone

Render a 3D rotating gemstone from any string. The same string always produces the exact same gem.

Every trait — colour, cut, refraction, iridescence, imperfections — is derived deterministically from the seed, making seedstone a drop-in visual identity for usernames, hashes, or UUIDs.

## Quick start

```ts
import { SeedstoneRenderer } from "seedstone";

new SeedstoneRenderer("alice", {
  container: document.getElementById("gem")!,
});
```

**Script tag** — include `dist/seedstone.standalone.js`, then use `window.Seedstone.SeedstoneRenderer`.

## Overrides

Pass a `config` tree to pin or re-randomise any trait. `SeedstoneConfigOverrides` is a
deep-partial of the trait tree: a plain number/string pins a value for every seed, while
`seeded()` flips a value to seed-generated instead.

```ts
import { SeedstoneRenderer, seeded, type SeedstoneConfigOverrides } from "seedstone";

const config: SeedstoneConfigOverrides = {
  gem: {
    cut: "spinel", // pin every gem to the spinel cut
    bodyLightness: seeded(), // make the body lightness vary by seed
    distortion: { perfection: 1 }, // pin to fully flawless
  },
};

new SeedstoneRenderer("alice", {
  container: document.getElementById("gem")!,
  config,
});
```

All tunable traits live in [`src/config.ts`](src/config.ts).

## Live updates

`update(seed)` swaps to a new seed and `setConfig(overrides)` re-applies overrides — both
reconcile the existing instance in place, so they're cheap enough to call on every keystroke.
Read back the fully-resolved values for the current seed from `gem.config` (a `SeedstoneConfig`).

```ts
import { SeedstoneRenderer, type SeedstoneConfig } from "seedstone";

const gem = new SeedstoneRenderer("alice", {
  container: document.getElementById("gem")!,
});

input.addEventListener("input", () => gem.update(input.value)); // new seed, same instance

gem.setConfig({ gem: { cut: "garnet", hue: 200 } }); // pin traits live
gem.setConfig({}); // clear overrides

const resolved: SeedstoneConfig = gem.config; // every trait, resolved for this seed
console.log(resolved.gem.hue, resolved.gem.speed);
```

## API stability

The **core API** — `SeedstoneRenderer`, `seeded()`, and the `SeedstoneConfig` /
`SeedstoneConfigOverrides` types — follows semver and stays stable across a major version.

The **advanced exports** for schema introspection (`configSchema`, `mergeSchema`,
`resolveConfig`, `isScalarParam`, `isChoiceParam`, and the `ScalarParam` / `ChoiceParam` /
`SeedstoneSchema` types) exist for building a UI against the raw schema. They may change in any
minor release — only depend on them if you pin the version.

## Development

```sh
# one-time setup (installs the library and website workspaces)
pnpm install

pnpm dev    # watches the library and serves the website simultaneously
pnpm build  # production bundle into dist/
pnpm test   # build + run test suite
```

## Acknowledgements

The repo also bundles [`meowtar`](src/meowtar/) — a deterministic SVG **cat avatar** built on the same seed engine. It was inspired by [**@jaameypr**](https://github.com/jaameypr)'s [catsum](https://github.com/jaameypr/catsum) fork. Thanks to [@jaameypr](https://github.com/jaameypr) for the idea.

## License

[MIT](LICENSE)
