import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'packed', 'manifest.json'), 'utf8'));
const restoreSource = process.argv.includes('--restore-source');
const entries = restoreSource ? Object.entries(manifest) : [['index', manifest.index]];
for (const [name, asset] of entries) {
  if (!asset || !Array.isArray(asset.chunks) || !asset.chunks.length) {
    throw new Error(`Manifesto inválido para ${name}`);
  }
  const encoded = asset.chunks.map(file => readFileSync(join(root, 'packed', name, file), 'utf8').trim()).join('');
  const output = gunzipSync(Buffer.from(encoded, 'base64'));
  const sha = createHash('sha256').update(output).digest('hex');
  if (output.length !== asset.length || sha !== asset.sha256) {
    throw new Error(`Integridade SHA-256/tamanho não corresponde para ${name}: ${sha}`);
  }
  const target = name === 'index' ? join(root, 'dist', 'index.html') : join(root, asset.destination);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, output);
  console.log(`OK ${name}: ${output.length} bytes, SHA-256 ${sha}`);
}

// A Beta 4 compactada é verificada antes de receber os recursos PWA.
await import('./pwa-build.mjs');