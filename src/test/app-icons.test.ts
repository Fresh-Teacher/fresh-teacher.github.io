import { readdirSync, readFileSync } from 'node:fs';
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


});

describe.skip('Search-result favicon (files now served from GitHub)', () => {
  const bytes = (path: string) => readFileSync(resolve(process.cwd(), path));

  it('ships /favicon.ico with 16, 32 and 48 px layers', () => {
    const ico = bytes('public/favicon.ico');
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico[6 + i * 16] || 256);
    expect(sizes).toEqual(expect.arrayContaining([16, 32, 48]));
  });

  it.each([48, 96])('ships a %ipx square PNG (Google wants multiples of 48)', size => {
    const png = bytes(`public/favicon-${size}x${size}.png`);
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  });
});
