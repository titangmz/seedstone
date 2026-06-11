import resolve   from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import fs from 'node:fs';
import path from 'node:path';

const banner = `/**
 * lumina-gem v1.0.0 — https://github.com/titangmz/lumina-gem
 * MIT License
 */`;

// Three.js is bundled into every output — no peer dependency required.
function geometryGlob() {
  return {
    name: 'geometry-glob',
    transform(code, id) {
      if (!id.endsWith(path.join('src', 'geometries', 'index.ts'))) return null;

      const globCall = /import\.meta\.glob(?:<GemCutModule>)?\('\.\/\*\.ts',\s*\{\s*eager:\s*true,\s*import:\s*'default',\s*\}\)/m;
      if (!globCall.test(code)) return null;

      const dir = path.dirname(id);
      const geometryFiles = fs.readdirSync(dir)
        .filter(file => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.d.ts'))
        .sort();

      const imports = geometryFiles
        .map((file, index) => `import geometry${index} from './${file}';`)
        .join('\n');
      const registry = `{\n${geometryFiles
        .map((file, index) => `  './${file}': geometry${index},`)
        .join('\n')}\n}`;

      return {
        code: `${imports}\n${code.replace(globCall, registry)}`,
        map: null,
      };
    },
  };
}

const buildPlugins = (minify = false) => [
  geometryGlob(),
  resolve(),
  typescript({ tsconfig: './tsconfig.json' }),
  ...(minify ? [terser({ maxWorkers: 1 })] : []),
];

export default [
  // ESM build — tree-shakeable, for bundlers
  {
    input:   'src/index.ts',
    output:  { file: 'dist/lumina-gem.esm.js', format: 'esm', banner, sourcemap: true },
    plugins: buildPlugins(),
  },
  // UMD build — for CommonJS / legacy bundlers
  {
    input:   'src/index.ts',
    output:  { file: 'dist/lumina-gem.umd.js', format: 'umd', name: 'LuminaGem', banner, sourcemap: true },
    plugins: buildPlugins(true),
  },
  // IIFE build — single <script> tag, no setup required
  {
    input:   'src/index.ts',
    output:  { file: 'dist/lumina-gem.standalone.js', format: 'iife', name: 'LuminaGem', banner },
    plugins: buildPlugins(true),
  },
];
