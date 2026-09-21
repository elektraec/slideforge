import { build } from 'esbuild';
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

await mkdir('public/runtime', { recursive: true });
await build({
  entryPoints: [resolve('src/player/index.js')],
  bundle: true,
  format: 'iife',
  target: ['es2022'],
  outfile: resolve('public/runtime/player.js'),
  minify: true,
  loader: { '.woff': 'dataurl', '.woff2': 'dataurl', '.ttf': 'dataurl', '.svg': 'dataurl' },
  logLevel: 'warning'
});

const jsBytes = (await stat(resolve('public/runtime/player.js'))).size;
const cssBytes = (await stat(resolve('public/runtime/player.css'))).size;
if (jsBytes + cssBytes > 5_500_000 || cssBytes > 200_000) throw new Error(`El runtime excede el presupuesto: JS ${jsBytes} bytes, CSS ${cssBytes} bytes.`);
console.log(`Runtime: ${jsBytes} bytes JS + ${cssBytes} bytes CSS`);
