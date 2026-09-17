import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Jeden bundle na uruchomienie skryptu, wspoldzielony przez wszystkie rendery. */
export const buildBundle = async () => {
  process.stdout.write('Buduje bundle... ');
  const url = await bundle({
    entryPoint: path.join(ROOT, 'src', 'index.ts'),
    publicDir: path.join(ROOT, 'public'),
    onProgress: () => undefined,
  });
  process.stdout.write('gotowe\n');
  return url;
};

export const bar = (progress) => {
  const width = 28;
  const filled = Math.round(progress * width);
  return `[${'#'.repeat(filled)}${'.'.repeat(width - filled)}] ${String(Math.round(progress * 100)).padStart(3)}%`;
};
