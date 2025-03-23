// @ts-check
import * as esbuild from 'esbuild';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { globSync } from 'glob';

/** @type {esbuild.BuildOptions} */
const baseConfig = {
  bundle: true,
  external: ['vscode'],
  format: 'esm',
  minify: process.argv.includes('--minify'),
  outdir: 'dist',
  platform: 'browser',
  sourcemap: true,
  target: 'es2020',
  plugins: [
    NodeGlobalsPolyfillPlugin({
      buffer: true
    })
  ]
};

// Web extension
const webExtensionConfig = {
  ...baseConfig,
  outdir: 'dist/web',
  entryPoints: [
    './src/web/extension.ts'
  ],
};

// Tests
const webTestConfig = {
  ...baseConfig,
  outdir: 'dist/web/test',
  entryPoints: globSync('./src/web/test/**/*.ts')
};

const watch = process.argv.includes('--watch');
const prod = process.argv.includes('--production');

if (watch) {
  const webExtContext = await esbuild.context(webExtensionConfig);
  await webExtContext.watch();
  
  const webTestContext = await esbuild.context(webTestConfig);
  await webTestContext.watch();
} else {
  if (prod) {
    baseConfig.minify = true;
  }
  await esbuild.build(webExtensionConfig);
  await esbuild.build(webTestConfig);
} 