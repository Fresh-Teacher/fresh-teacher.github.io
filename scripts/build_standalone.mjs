/** Build outside the working copy so Lovable pointers remain intact. */
import { cp, mkdtemp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['.git', '.lovable', '.workspace', '.site-import', 'node_modules', '.tanstack', '.nitro', '.output', '.vinxi', '.wrangler', '.vercel', 'dist', 'dist-ssr', '__pycache__', '.pytest_cache']);
const textExtensions = /\.(tsx?|jsx?|css|json|html|webmanifest|md|svg|txt|xml)$/;
const assetPattern = /(?:https?:\/\/[^/\s"'<>]+)?(\/__l5e\/assets-v1\/[a-zA-Z0-9-]+\/[^\s"'<>?)\\;]+)/g;

export function rewriteMedia(text, mapping) {
  return text.replace(assetPattern, (_, path) => {
    if (!mapping.has(path)) throw new Error(`Media has no project pointer: ${path}`);
    return mapping.get(path);
  });
}

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}

export async function materialize(source, origin) {
  const all = [...await files(join(source, 'src')), ...await files(join(source, 'public'))];
  const pointers = all.filter(path => path.endsWith('.asset.json'));
  if (!pointers.length) throw new Error('No media pointers found.');
  const records = await Promise.all(pointers.map(async path => ({ path, data: JSON.parse(await readFile(path, 'utf8')) })));
  const mapping = new Map(records.map(({ data }) => [data.url, `/local-media/${data.asset_id}/${data.original_filename}`]));
  const queue = [...new Map(records.map(({ data }) => [data.url, data])).values()];
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const data = queue.pop();
      if (!data) return;
      const target = resolve(source, 'public', `.${mapping.get(data.url)}`);
      if (!target.startsWith(resolve(source, 'public', 'local-media') + '/')) throw new Error('Invalid media destination.');
      let payload;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(new URL(data.url, origin), { signal: AbortSignal.timeout(60000) });
          if (!response.ok) throw new Error(`Media download failed: ${response.status}`);
          if ((response.headers.get('content-type') || '').includes('text/html')) throw new Error('Media returned an HTML page.');
          payload = Buffer.from(await response.arrayBuffer());
          if (!payload.length || payload.length !== data.size) throw new Error(`Media size differs: ${data.original_filename}`);
          break;
        } catch (error) {
          if (attempt === 2) throw error;
        }
      }
      if (!payload) throw new Error('Missing media payload.');
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, payload);
    }
  }));
  for (const path of await files(source)) {
    // Tests contain intentionally nonexistent media URLs, not deployable assets.
    if (path.startsWith(join(source, 'src', 'test') + '/')) continue;
    if (!textExtensions.test(path)) continue;
    const text = await readFile(path, 'utf8');
    const updated = rewriteMedia(text, mapping);
    if (updated !== text) await writeFile(path, updated);
  }
  for (const { path, data } of records) {
    await writeFile(path, JSON.stringify({ url: mapping.get(data.url), original_filename: data.original_filename, size: data.size, content_type: data.content_type }, null, 2) + '\n');
  }
  return mapping.size;
}

async function main() {
  const pages = process.argv.includes('--pages');
  const staging = await mkdtemp(join(tmpdir(), 'fresh-teacher-build-'));
  try {
    await cp(root, staging, { recursive: true, filter: path => {
      const name = path.split('/').pop() || '';
      return !excluded.has(name) && !name.startsWith('.env') && name !== '.dev.vars' && !/\.(tsbuildinfo|log|pem|key|local)$/.test(name);
    } });
    const count = await materialize(staging, process.env.STANDALONE_ASSET_ORIGIN || 'https://fresh-roots-library.lovable.app');
    console.log(`Validated ${count} local media files; deployment will not use the Lovable media proxy.`);
    // Install into staging; never copy dependencies or generated output into source deliveries.
    for (const args of [['install', '--frozen-lockfile'], ['run', pages ? 'build:pages:runtime' : 'build']]) {
      const result = spawnSync('bun', args, { cwd: staging, stdio: 'inherit', env: process.env });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error('Standalone build failed; deployment refused.');
    }
    let outputs = 0;
    for (const name of ['dist', '.output', '.vercel']) {
      if (!await stat(join(staging, name)).catch(() => null)) continue;
      await rm(join(root, name), { recursive: true, force: true });
      await cp(join(staging, name), join(root, name), { recursive: true });
      outputs++;
    }
    if (!outputs) throw new Error('No hosting output generated.');
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}