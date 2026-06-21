import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { geometryGlob, banner } from "./build/geometry-glob.js";

// Legacy bundler — kept for now alongside Rolldown (the primary bundler) so the
// two can be compared. Type declarations are produced separately by `tsc` (see
// the `build:types` npm script), so the TypeScript plugin here only transpiles
// — keeping this an apples-to-apples JavaScript-bundling comparison.
//
// Three.js is bundled into every output — no peer dependency required.
const buildPlugins = (minify = false) => [
  geometryGlob(),
  resolve(),
  typescript({ tsconfig: "./tsconfig.json" }),
  ...(minify ? [terser({ maxWorkers: 1 })] : []),
];

export default [
  // ESM build — tree-shakeable, for bundlers
  {
    input: "src/index.ts",
    output: { file: "dist/seedstone.esm.js", format: "esm", banner, sourcemap: true },
    plugins: buildPlugins(),
  },
  // UMD build — for CommonJS / legacy bundlers
  {
    input: "src/index.ts",
    output: {
      file: "dist/seedstone.umd.js",
      format: "umd",
      name: "Seedstone",
      banner,
      sourcemap: true,
    },
    plugins: buildPlugins(true),
  },
  // IIFE build — single <script> tag, no setup required
  {
    input: "src/index.ts",
    output: { file: "dist/seedstone.standalone.js", format: "iife", name: "Seedstone", banner },
    plugins: buildPlugins(true),
  },
];
