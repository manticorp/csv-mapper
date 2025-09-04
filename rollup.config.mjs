// rollup.config.mjs
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import del from 'rollup-plugin-delete';

const input = 'src/csvMapper.ts';   // TypeScript source
const name = 'CsvMapper';            // global for UMD builds

export default [
  // Unminified builds
  {
    input,
    output: [
      { file: 'dist/csv-mapper.esm.js',  format: 'es',  sourcemap: true, exports: 'named' },
      { file: 'dist/csv-mapper.umd.js',  format: 'umd', name, sourcemap: true, exports: 'named' },
    ],
    plugins: [
      // Clean dist folder before building (only on first build)
      del({ 
        targets: 'dist/*',
        verbose: true 
      }),
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
        rootDir: './src'
      }),
    ],
  },

  // Minified builds
  {
    input,
    output: [
      { file: 'dist/csv-mapper.esm.min.js',  format: 'es',  sourcemap: true, exports: 'named' },
      { file: 'dist/csv-mapper.umd.min.js',  format: 'umd', name, sourcemap: true, exports: 'named' },
    ],
    plugins: [
      // Don't clean again for minified builds
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false, // Don't generate declarations for minified builds
        declarationMap: false // Don't generate declaration maps for minified builds
      }),
      terser(),
    ],
  },
];
