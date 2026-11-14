import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Build-only Node utility; never imported by app routes.
import { materialize, rewriteMedia } from '../../scripts/build_standalone.mjs';

describe('standalone deployment media', () => {
  const path = '/__l5e/assets-v1/123/cover.webp';
  const mapping = new Map([[path, '/local-media/123/cover.webp']]);
  it('uses local files for relative and absolute media references', () => {
    expect(rewriteMedia(`url("${path}") https://example.com${path}`, mapping))
      .toBe('url("/local-media/123/cover.webp") /local-media/123/cover.webp');
  });
  it('refuses missing media instead of shipping broken images', () => {
    expect(() => rewriteMedia('/__l5e/assets-v1/123/missing.png', mapping)).toThrow('no project pointer');
  });
  it('keeps teaching document links unchanged', () => {
    const url = 'https://github.com/Fresh-Teacher/Notes/raw/main/notes.pdf';
    expect(rewriteMedia(url, mapping)).toBe(url);
  });
  it('downloads physical media and rewrites deployable references while ignoring test fixtures', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'standalone-test-'));
    vi.stubGlobal('fetch', vi.fn(async () => new Response('image', { headers: { 'content-type': 'image/webp' } })));
    try {
      await mkdir(join(directory, 'src/test'), { recursive: true });
      await mkdir(join(directory, 'public'));
      await writeFile(join(directory, 'src/cover.asset.json'), JSON.stringify({
        url: path, asset_id: '123', original_filename: 'cover.webp', size: 5, content_type: 'image/webp',
      }));
      await writeFile(join(directory, 'public/manifest.webmanifest'), JSON.stringify({ src: path }));
      await writeFile(join(directory, 'src/test/fixture.ts'), '"/__l5e/assets-v1/123/missing.png"');
      expect(await materialize(directory, 'https://example.com')).toBe(1);
      expect(await readFile(join(directory, 'public/local-media/123/cover.webp'), 'utf8')).toBe('image');
      expect(JSON.parse(await readFile(join(directory, 'src/cover.asset.json'), 'utf8')).url).toBe('/local-media/123/cover.webp');
      expect(JSON.parse(await readFile(join(directory, 'public/manifest.webmanifest'), 'utf8')).src).toBe('/local-media/123/cover.webp');
    } finally {
      vi.unstubAllGlobals();
      await rm(directory, { recursive: true, force: true });
    }
  });
  it('rejects corrupt downloads before rewriting source', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'standalone-corrupt-'));
    vi.stubGlobal('fetch', vi.fn(async () => new Response('bad', { headers: { 'content-type': 'image/webp' } })));
    try {
      await mkdir(join(directory, 'src'));
      await mkdir(join(directory, 'public'));
      await writeFile(join(directory, 'src/cover.asset.json'), JSON.stringify({
        url: path, asset_id: '123', original_filename: 'cover.webp', size: 5, content_type: 'image/webp',
      }));
      await expect(materialize(directory, 'https://example.com')).rejects.toThrow('Media size differs');
      expect(JSON.parse(await readFile(join(directory, 'src/cover.asset.json'), 'utf8')).url).toBe(path);
    } finally {
      vi.unstubAllGlobals();
      await rm(directory, { recursive: true, force: true });
    }
  });
});