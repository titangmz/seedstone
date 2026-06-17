# seedstone website

The [Nuxt](https://nuxt.com) site for [seedstone](../README.md) — a live playground, cut gallery, and gem-DNA inspector. Statically generated; all Three.js rendering happens client-side.

## Setup

The site consumes the built library from `../dist`, so build that first:

```sh
# from the repo root — installs every workspace, including this one
pnpm install
pnpm build
```

## Development

```sh
# from the repo root
pnpm --filter seedstone-website dev   # dev server on http://localhost:3000
```

Or, from the repo root, `pnpm dev` runs the library in watch mode and this dev server together.

## Production

```sh
# from the repo root
pnpm --filter seedstone-website generate   # static site → .output/public
pnpm --filter seedstone-website preview    # preview the production build locally
```
