# seedstone website

The [Nuxt](https://nuxt.com) site for [seedstone](../README.md) — a live playground, cut gallery, and gem-DNA inspector. Statically generated; all Three.js rendering happens client-side.

## Setup

The site consumes the built library from `../dist`, so build that first:

```sh
# from the repo root
npm install
npm run build

# then in this directory
cd website
npm install
```

## Development

```sh
npm run dev        # dev server on http://localhost:3000
```

Or, from the repo root, `npm run dev` runs the library in watch mode and this dev server together.

## Production

```sh
npm run generate   # static site → .output/public
npm run preview    # preview the production build locally
```
