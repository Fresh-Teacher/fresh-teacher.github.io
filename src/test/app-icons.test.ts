import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const manifest = JSON.parse(read('public/manifest.webmanifest'));

// Every CDN icon URL the app ships must still be backed by a pointer file in this repo.
const pointerUrls = () =>
  readdirSync(resolve(process.cwd(), 'public/icons'))
    .filter(file => file.endsWith('.asset.json'))
    .map(file => JSON.parse(read(`public/icons/${file}`)).url as string);

describe('Installable app icons', () => {
  it('ships 192 any, 512 any and 512 maskable icons', () => {
    const entries = manifest.icons.map((icon: { sizes: string; purpose: string }) => `${icon.sizes} ${icon.purpose}`);
    expect(entries).toContain('192x192 any');
    expect(entries).toContain('512x512 any');
    expect(entries).toContain('512x512 maskable');
  });

  it('points every manifest and shortcut icon at an asset pointer that exists here', () => {
    const known = new Set(pointerUrls());
    const srcs: string[] = [
      ...manifest.icons.map((icon: { src: string }) => icon.src),
      ...manifest.shortcuts.flatMap((shortcut: { icons: { src: string }[] }) => shortcut.icons.map((icon: { src: string }) => icon.src)),
    ];
    expect(srcs.length).toBeGreaterThan(0);
    for (const src of srcs) {
      expect(known.has(src), `no pointer file for ${src}`).toBe(true);
    }
  });

  it('serves its PNG favicon through this project’s asset pointer', () => {
    const pointer = JSON.parse(read('public/favicon.png.asset.json'));
    expect(pointer.content_type).toBe('image/png');
    expect(pointer.original_filename).toBe('favicon.png');
    expect(pointer.size).toBeGreaterThan(0);
    expect(pointer.url).toMatch(/^\/(?:__l5e\/assets-v1|local-media)\//);
    if (pointer.url.startsWith('/local-media/')) {
      expect(existsSync(resolve(process.cwd(), 'public', pointer.url.slice(1)))).toBe(true);
    }
    expect(existsSync(resolve(process.cwd(), 'public/favicon.ico.asset.json'))).toBe(true);
  });
});
