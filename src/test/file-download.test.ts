import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadFile } from '@/lib/file-download';

const clicked: HTMLAnchorElement[] = [];
const watchClicks = () => {
  const listener = (event: MouseEvent) => {
    if (event.target instanceof HTMLAnchorElement) clicked.push(event.target);
  };
  document.addEventListener('click', listener);
  return () => document.removeEventListener('click', listener);
};

describe('Full-file download', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    clicked.length = 0;
  });

  const serve = (body: string) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob([body]) }));
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:sharebility/file'), revokeObjectURL: vi.fn() });
  };

  it('saves the whole file under its own name', async () => {
    serve('%PDF-1.4 whole document');
    const stop = watchClicks();
    const ok = await downloadFile('https://fresh-teacher.github.io/p6/P.6-SST.pdf');
    stop();
    expect(ok).toBe(true);
    expect(clicked).toHaveLength(1);
    const [anchor] = clicked;
    expect(anchor?.getAttribute('download')).toBe('P.6-SST.pdf');
    expect(anchor?.getAttribute('href')).toBe('blob:sharebility/file');
  });

  it('keeps literal hash characters in captured filenames', async () => {
    serve('%PDF-1.4 whole document');
    const stop = watchClicks();
    const ok = await downloadFile('https://fresh-teacher.github.io/p6/P.6#CREATIVE PRINTERS SCIENCE.pdf');
    stop();
    expect(ok).toBe(true);
    const [anchor] = clicked;
    expect(anchor?.getAttribute('download')).toBe('P.6#CREATIVE PRINTERS SCIENCE.pdf');
  });

  it('reports failure when the file cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await downloadFile('https://fresh-teacher.github.io/p6/P.6-SST.pdf')).toBe(false);
    expect(clicked).toHaveLength(0);
  });
});
