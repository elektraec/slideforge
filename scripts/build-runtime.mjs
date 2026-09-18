import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
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
