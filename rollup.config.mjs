// rollup.config.mjs
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const input = 'src/csv-mapper.js';   // ESM source
const name = 'CsvMapper';            // global for UMD builds

export default [
  // Unminified builds
  {
    input,
    output: [
      { file: 'dist/csv-mapper.esm.js',  format: 'es',  sourcemap: true },
      { file: 'dist/csv-mapper.umd.js',  format: 'umd', name, sourcemap: true },
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
    ],
  },

  // Minified builds
  {
    input,
    output: [
      { file: 'dist/csv-mapper.esm.min.js',  format: 'es',  sourcemap: true },
      { file: 'dist/csv-mapper.umd.min.js',  format: 'umd', name, sourcemap: true },
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      terser(),
    ],
  },
];
