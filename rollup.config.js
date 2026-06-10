import resolve   from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

const banner = `/**
 * lumina-gem v1.0.0 — https://github.com/lumina-gem
 * MIT License
 */`;

export default [
  // ESM build (tree-shakeable, for bundlers) — Three.js is external
  {
    input: 'src/index.ts',
    output: {
      file:      'dist/lumina-gem.esm.js',
      format:    'esm',
      banner,
      sourcemap: true,
    },
    external: ['three'],
    plugins: [resolve(), typescript({ tsconfig: './tsconfig.json' })],
  },
  // UMD build (for bundlers / Node) — Three.js is external
  {
    input: 'src/index.ts',
    output: {
      file:      'dist/lumina-gem.umd.js',
      format:    'umd',
      name:      'LuminaGem',
      banner,
      sourcemap: true,
      globals:   { three: 'THREE' },
    },
    external: ['three'],
    plugins: [resolve(), typescript({ tsconfig: './tsconfig.json' }), terser()],
  },
  // Standalone IIFE build (bundles Three.js) — for demo / CDN <script> tag
  {
    input: 'src/index.ts',
    output: {
      file:      'dist/lumina-gem.standalone.js',
      format:    'iife',
      name:      'LuminaGem',
      banner,
      sourcemap: false,
    },
    plugins: [resolve(), typescript({ tsconfig: './tsconfig.json' }), terser()],
  },
];
