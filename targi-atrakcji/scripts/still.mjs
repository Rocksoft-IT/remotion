/**
 * Stopklatka kazdego slajdu do out/still/*.png. Do korekty tresci na papierze
 * i do slajdow recznych, ktore operator moze wyswietlic jako obraz.
 *
 *   npm run still                  -> wszystkie slajdy
 *   npm run still -- c2-czyz       -> tylko wskazane id ze slides.ts
 */
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { renderStill, selectComposition } from '@remotion/renderer';
import { deck } from '../slides.ts';
import { ROOT, buildBundle } from './bundle.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const slides = args.length ? deck.filter((s) => args.includes(s.id)) : deck;

if (!slides.length) {
  console.error(`Nie znalazlem slajdow: ${args.join(', ')}`);
  process.exit(1);
}

const outDir = path.join(ROOT, 'out', 'still');
mkdirSync(outDir, { recursive: true });

const serveUrl = await buildBundle();

for (const slide of slides) {
  const id = `Slajd-${slide.id.replace(/[^a-zA-Z0-9-]/g, '-')}`;
  const composition = await selectComposition({ serveUrl, id, inputProps: {} });
  const output = path.join(outDir, `${slide.id}.png`);

  await renderStill({
    composition,
    serveUrl,
    output,
    // Srodek slajdu: animacje wejscia sa juz skonczone, wyjscia jeszcze nie zaczete.
    frame: Math.floor(slide.durationInFrames / 2),
    imageFormat: 'png',
    overwrite: true,
  });

  console.log(`out/still/${slide.id}.png`);
}

console.log(`\nGotowe: ${slides.length} stopklatek.`);
