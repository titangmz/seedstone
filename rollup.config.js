import resolve   from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const banner = `/**
 * lumina-gem v1.0.0 — https://github.com/titangmz/lumina-gem
 * MIT License
 */`;

// Three.js is bundled into every output — no peer dependency required.
const sharedPlugins = [resolve(), typescript({ tsconfig: './tsconfig.json' })];

export default [
  // ESM build — tree-shakeable, for bundlers
  {
    input:   'src/index.ts',
    output:  { file: 'dist/lumina-gem.esm.js', format: 'esm', banner, sourcemap: true },
    plugins: sharedPlugins,
  },
  // UMD build — for CommonJS / legacy bundlers
  {
    input:   'src/index.ts',
    output:  { file: 'dist/lumina-gem.umd.js', format: 'umd', name: 'LuminaGem', banner, sourcemap: true },
    plugins: [...sharedPlugins, terser()],
  },
  // IIFE build — single <script> tag, no setup required
  {
    input:   'src/index.ts',
    output:  { file: 'dist/lumina-gem.standalone.js', format: 'iife', name: 'LuminaGem', banner },
    plugins: [...sharedPlugins, terser()],
  },
];
