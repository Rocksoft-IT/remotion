#!/usr/bin/env node
// CLI: pull a presenter's video/audio/photo and candidate bullet text out of their .pptx, for
// the `wystapienie` (real talk) slot introduced in Phase 4 (plan: steady-purring-spring.md).
//
//   node scripts/import-talk.mjs <file.pptx> --slide c2-czyz [--dry-run]
//
// Deliberately does NOT edit slides.ts or presenter/talks.ts. This project's own philosophy
// (see agenda-slajdy.md, and the decision made 2026-09-17 to let an AI agent convert presenter
// slides "potem tylko poprawione przez człowieka") is extraction + a human paste, not silent
// rewriting of a file the README calls "the only one to edit day to day". Reuses the sibling
// Electron app's zero-dependency pptx reader (scripts/pptx-lib/*, copied verbatim) — the OOXML
// parsing problem is identical regardless of which app plays the result.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { convertPptx } = require('./pptx-lib/pptx-converter.cjs');
const { decodeEntities } = require('./pptx-lib/pptx-xml.cjs');

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--slide') out.slide = argv[++i];
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else out._.push(a);
  }
  return out;
}

function extOf(name) {
  const m = /\.[a-z0-9]+$/i.exec(name);
  return m ? m[0] : '';
}

/** Pull <li> and standalone <p> text back out of the converter's generated HTML — a plain
 *  regex is fine here, this is throwaway extraction feeding a human review step, not a renderer. */
function candidateLines(html) {
  const out = [];
  for (const m of html.matchAll(/<(?:li|p)>([\s\S]*?)<\/(?:li|p)>/g)) {
    const text = decodeEntities(m[1].replace(/<[^>]+>/g, '').trim());
    if (text && !/^\(empty slide\)$/.test(text)) out.push(text);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length === 0) {
    console.log(`Usage: node scripts/import-talk.mjs <file.pptx> --slide <slideId> [--dry-run]

Extracts embedded video/audio/photo and candidate bullet text from a presenter's .pptx for the
slide identified by --slide (must already exist in slides.ts, e.g. c2-czyz). Prints a ready-to-
paste snippet; never edits slides.ts or presenter/talks.ts itself.`);
    process.exit(args.help ? 0 : 1);
  }
  if (!args.slide) { console.error('Error: --slide <slideId> is required (which slides.ts entry this talk belongs to).'); process.exit(1); }

  const pptxPath = path.resolve(args._[0]);
  if (!fs.existsSync(pptxPath)) { console.error(`Error: file not found: ${pptxPath}`); process.exit(1); }

  const { slides, extractedMedia, problems } = convertPptx(pptxPath, {});
  if (problems.length) {
    console.log('Uwagi z konwersji:');
    for (const p of problems) console.log(`  - ${p}`);
    console.log('');
  }
  if (slides.length === 0) {
    console.error('Nie znaleziono żadnych slajdów — sprawdź, czy to prawidłowy plik .pptx.');
    process.exit(1);
  }

  const video = extractedMedia.find((m) => m.kind === 'video') || null;
  const audio = extractedMedia.find((m) => m.kind === 'audio') || null;
  const image = extractedMedia.find((m) => m.kind === 'image') || null;

  const bulletCandidates = [];
  for (const s of slides) for (const line of candidateLines(s.html)) if (!bulletCandidates.includes(line)) bulletCandidates.push(line);

  const notes = slides.map((s) => s.notes).filter(Boolean).join('\n\n');

  console.log(`Plik: ${pptxPath}`);
  console.log(`Slajdów w pptx: ${slides.length}`);
  console.log('');

  const talkDir = path.join(ROOT, 'public', 'talks', args.slide);
  const fotoDir = path.join(ROOT, 'public', 'foto');
  const registry = {};

  if (video) {
    const rel = `talks/${args.slide}/video${extOf(video.name) || '.mp4'}`;
    console.log(`Wideo: ${video.name} -> public/${rel}  (sprawdź kodek: mp4 H.264/AAC albo webm, inne mogą się nie odtworzyć)`);
    registry.video = rel;
    if (!args.dryRun) {
      fs.mkdirSync(talkDir, { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'public', rel), video.data);
    }
  } else {
    console.log('Wideo: brak w tym pliku.');
  }

  if (audio) {
    const rel = `talks/${args.slide}/audio${extOf(audio.name) || '.mp3'}`;
    console.log(`Audio: ${audio.name} -> public/${rel}`);
    registry.audio = rel;
    if (!args.dryRun) {
      fs.mkdirSync(talkDir, { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'public', rel), audio.data);
    }
  } else {
    console.log('Audio: brak w tym pliku.');
  }

  let photoRel = null;
  if (image) {
    photoRel = `foto/${args.slide}${extOf(image.name) || '.png'}`;
    console.log(`Zdjęcie (kandydat, pierwsze osadzone): ${image.name} -> public/${photoRel} — sprawdź, czy to faktycznie portret prelegenta, nie logo firmy.`);
    if (!args.dryRun) {
      fs.mkdirSync(fotoDir, { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'public', photoRel), image.data);
    }
  } else {
    console.log('Zdjęcie: brak osadzonego obrazu.');
  }

  console.log('');
  console.log('Kandydaci na bullet points (wybierz max 3, wklej do pola `bullets` w slides.ts):');
  if (bulletCandidates.length === 0) console.log('  (nic nie znaleziono — slajdy są głównie obrazkami/wykresami, wpisz ręcznie)');
  for (const line of bulletCandidates.slice(0, 8)) console.log(`  - ${line}`);

  if (notes) {
    console.log('');
    console.log('Notatki prelegenta z pptx (do pola `note`, TYLKO dla operatora — nigdy nie pokazuje się widowni):');
    console.log(notes.split('\n').map((l) => `  ${l}`).join('\n'));
  }

  console.log('');
  console.log(`Do wklejenia w slides.ts, w slajdzie "${args.slide}":`);
  console.log('  bullets: [');
  for (const line of bulletCandidates.slice(0, 3)) console.log(`    ${JSON.stringify(line)},`);
  console.log('  ],');
  if (photoRel) console.log(`  photo: ${JSON.stringify(photoRel)},`);

  if (registry.video || registry.audio) {
    console.log('');
    console.log('Do wklejenia w presenter/talks.ts, w tablicy TALKS:');
    console.log('  {');
    console.log(`    slideId: ${JSON.stringify(args.slide)},`);
    if (registry.video) console.log(`    video: ${JSON.stringify(registry.video)},`);
    if (registry.audio) console.log(`    audio: ${JSON.stringify(registry.audio)},`);
    console.log('  },');
  } else {
    console.log('');
    console.log('Brak wideo/audio w tym pliku — ten prelegent zostaje na samej karcie tytułowej (`wystapienie` niepotrzebne), chyba że plik wideo dostaniesz osobno.');
  }

  if (args.dryRun) console.log('\n(--dry-run: nic nie zapisano na dysk)');
}

main();
