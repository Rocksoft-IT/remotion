/**
 * Render blokow do out/*.mp4.
 *
 *   npm run render                 -> wszystkie 6 blokow
 *   npm run render -- LoopPrzerwa  -> tylko wskazane kompozycje
 *   npm run render -- --all        -> bloki + PelnyDeck
 *
 * Blok D (LoopPrzerwa) ma zegar odliczajacy liczony od momentu renderu,
 * wiec renderuj go rano w dniu targow albo puszczaj z Remotion Studio.
 */
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { KOMPOZYCJE } from '../slides.ts';
import { ROOT, bar, buildBundle } from './bundle.mjs';

const args = process.argv.slice(2);
const wantAll = args.includes('--all');
const explicit = args.filter((a) => !a.startsWith('--'));

const ids = explicit.length
  ? explicit
  : [...KOMPOZYCJE.map((k) => k.id), ...(wantAll ? ['PelnyDeck'] : [])];

const outDir = path.join(ROOT, 'out');
mkdirSync(outDir, { recursive: true });

const serveUrl = await buildBundle();

for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id, inputProps: {} });
  const outputLocation = path.join(outDir, `${id}.mp4`);
  let last = -1;

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 16,
    outputLocation,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      if (pct !== last) {
        last = pct;
        process.stdout.write(`\r${id.padEnd(18)} ${bar(progress)}`);
      }
    },
  });

  process.stdout.write(`\r${id.padEnd(18)} ${bar(1)}  ->  out/${id}.mp4\n`);
}

console.log(`\nGotowe: ${ids.length} plik(ow) w out/`);
