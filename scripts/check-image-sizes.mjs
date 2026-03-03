import { readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);
const TARGETS = [
  { dir: 'src/assets', maxKb: 300 },
  { dir: 'public', maxKb: 300 },
];

const toKb = (bytes) => bytes / 1024;

const collectFiles = (dirPath) => {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    const ext = extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
};

const offenders = [];

for (const target of TARGETS) {
  const absoluteDir = join(ROOT, target.dir);
  const files = collectFiles(absoluteDir);

  for (const file of files) {
    const stats = statSync(file);
    const fileKb = toKb(stats.size);
    if (fileKb > target.maxKb) {
      offenders.push({
        file: relative(ROOT, file),
        sizeKb: fileKb,
        maxKb: target.maxKb,
      });
    }
  }
}

if (offenders.length > 0) {
  console.error('Image size check failed. These files exceed the project budget:\n');
  for (const offender of offenders) {
    console.error(
      `- ${offender.file}: ${offender.sizeKb.toFixed(1)} KB (max ${offender.maxKb} KB)`,
    );
  }
  console.error(
    '\nRun `npm run assets:optimize -- <input> <output> [maxWidth] [quality]` to generate smaller assets.',
  );
  process.exit(1);
}

console.log('Image size check passed.');
