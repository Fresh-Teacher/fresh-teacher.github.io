// Renders first-page thumbnails for remote PDFs using the pdf.js copy that
// already ships with the flipbook viewer (public/resource-source/js/pdf.min.js).
import { readThumbnail, saveThumbnail } from '@/lib/thumbnail-cache';

let loading: Promise<void> | undefined;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); reject(new Error('pdf.js could not load.')); };
    document.body.appendChild(script);
  });
}

interface PdfPage {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
}

interface PdfDocument {
  numPages?: number;
  getPage: (page: number) => Promise<PdfPage>;
  destroy?: () => void;
}

interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { url: string; disableAutoFetch?: boolean; disableStream?: boolean; rangeChunkSize?: number }) => { promise: Promise<PdfDocument> };
}

async function ensurePdfJs(): Promise<PdfJsLib> {
  if (!loading) {
    loading = loadScript('/resource-source/js/pdf.min.js').then(() => {
      const lib = (window as unknown as { pdfjsLib?: PdfJsLib }).pdfjsLib;
      if (!lib) throw new Error('pdf.js is unavailable.');
      lib.GlobalWorkerOptions.workerSrc = '/resource-source/js/pdf.worker.min.js';
    }).catch(error => { loading = undefined; throw error; });
  }
  await loading;
  return (window as unknown as { pdfjsLib: PdfJsLib }).pdfjsLib;
}

// Limit concurrent renders so a full page of cards does not open dozens of
// PDF downloads at once.
let active = 0;
const waiters: Array<() => void> = [];

async function acquire() {
  if (active >= 2) await new Promise<void>(resolve => waiters.push(resolve));
  else active += 1;
}

function release() {
  const next = waiters.shift();
  if (next) next();
  else active -= 1;
}

const cache = new Map<string, Promise<string | null>>();
const pageCounts = new Map<string, number>();

export function pdfPageCount(url: string) { return pageCounts.get(url); }

async function render(url: string): Promise<string | null> {
  const saved = await readThumbnail(url);
  if (saved) {
    if (saved.pages) pageCounts.set(url, saved.pages);
    return saved.src;
  }
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return null;
  await acquire();
  let doc: PdfDocument | undefined;
  try {
    const lib = await ensurePdfJs();
    doc = await lib.getDocument({ url, disableAutoFetch: true, disableStream: true, rangeChunkSize: 65536 }).promise;
    if (doc.numPages) pageCounts.set(url, doc.numPages);
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 240 / base.width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const src = canvas.toDataURL('image/jpeg', 0.82);
    void saveThumbnail(url, src, doc.numPages);
    return src;
  } catch {
    return null;
  } finally {
    doc?.destroy?.();
    release();
  }
}

export function pdfThumbnail(url: string): Promise<string | null> {
  let cached = cache.get(url);
  if (!cached) {
    cached = render(url).then(result => {
      if (!result) cache.delete(url);
      return result;
    });
    cache.set(url, cached);
  }
  return cached;
}

/** Start fetching pdf.js (and its worker) as soon as a document card mounts. */
export function preloadPdfJs() {
  if (typeof window === 'undefined') return;
  void ensurePdfJs().catch(() => undefined);
  if (!document.querySelector('link[data-pdf-worker]')) {
    const link = document.createElement('link');
    link.rel = 'prefetch'; link.as = 'script'; link.href = '/resource-source/js/pdf.worker.min.js';
    link.setAttribute('data-pdf-worker', '');
    document.head.appendChild(link);
  }
}
