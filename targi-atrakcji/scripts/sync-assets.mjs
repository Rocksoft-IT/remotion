/**
 * Przenosi logotypy z folderu identyfikacji do public/logo pod nazwami bez
 * diakrytykow, bo Remotion serwuje pliki wylacznie z public/.
 *
 *   node scripts/sync-assets.mjs ["../Logo Targi Atrakcji"]
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './bundle.mjs';

const source = process.argv[2] ?? path.join(ROOT, '..', 'Logo Targi Atrakcji');

if (!existsSync(source)) {
  console.error(`Nie znalazlem folderu z logotypami: ${source}`);
  console.error('Podaj sciezke jako argument albo wrzuc pliki recznie do public/logo/.');
  process.exit(1);
}

const TARGETS = [
  { match: /logo.*bia|logo.*white/i, as: 'logo-biale.png' },
  { match: /logo.*granat|logo.*navy|logo.*dark/i, as: 'logo-granat.png' },
  { match: /znak.*primary|znak|mark|sygnet/i, as: 'znak-primary.png' },
];

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const files = walk(source).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
const dest = path.join(ROOT, 'public', 'logo');
mkdirSync(dest, { recursive: true });

let copied = 0;
for (const target of TARGETS) {
  const hit = files.find((f) => target.match.test(path.basename(f)));
  if (!hit) {
    console.warn(`brak dopasowania dla ${target.as}`);
    continue;
  }
  copyFileSync(hit, path.join(dest, target.as));
  console.log(`${path.basename(hit)}  ->  public/logo/${target.as}`);
  copied++;
}

console.log(`\nSkopiowano ${copied} z ${TARGETS.length} plikow.`);
