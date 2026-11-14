import type { ResourceRecord } from './resources';
import { convertedPdfUrl } from './converted-documents';
import media from '@/data/resource-media.json';
import { downloadBlob } from './download-file';
import { hideViewerLoading, hideViewerLoadingWhenReady } from './viewer-loading';

let currentDownload: { url: string; name: string } | undefined;
let downloadListener = false;

function installDownloadHandler() {
  if (downloadListener) return;
  downloadListener = true;
  const handle = (event: Event) => {
    const target = event.target as Element | null;
    if (!target?.closest?.('[data-name="btnDownloadPdf"]') || !currentDownload) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    if (event.type !== 'click' && event.type !== 'touchend') return;
    const { url, name } = currentDownload;
    fetch(url)
      .then(response => { if (!response.ok) throw new Error(String(response.status)); return response.blob(); })
      .then(blob => downloadBlob(new Blob([blob], { type: 'application/pdf' }), name))
      .catch(() => { window.open(url, '_blank', 'noopener'); });
  };
  for (const type of ['touchend', 'click']) document.addEventListener(type, handle, true);
}

function pdfFileName(item: ResourceRecord, url: string) {
  let base = item.title?.trim() || url.substring(url.lastIndexOf('/') + 1).split('?')[0] || 'document';
  try { base = decodeURIComponent(base); } catch { /* keep source name */ }
  base = base.replace(/\.(pdf|docx?|pptx?|xlsx?)$/i, '').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'document';
  return `${base}.pdf`;
}

let loading: Promise<void> | undefined;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); reject(new Error('The file viewer could not load.')); };
    document.body.appendChild(script);
  });
}

export async function openResourceViewer(element: HTMLElement, item: ResourceRecord, allowPageExport = false) {
  try { await openViewer(element, item, allowPageExport); hideViewerLoadingWhenReady(); }
  catch (error) { hideViewerLoading(); throw error; }
}

// Warm the viewer engine ahead of a tap so View opens without waiting on script downloads.
export function preloadResourceViewer() {
  if (!loading) {
    loading = loadScript('/resource-source/js/jquery.js')
      .then(() => loadScript('/resource-source/js/flipbook.min.js'))
      .catch(error => { loading = undefined; throw error; });
  }
  return loading;
}

async function openViewer(element: HTMLElement, item: ResourceRecord, allowPageExport: boolean) {
  await preloadResourceViewer();
  const jquery = (window as unknown as { jQuery?: (node: HTMLElement) => { flipBook: (options: Record<string, unknown>) => unknown; trigger: (event: string) => void } }).jQuery;
  if (!jquery) throw new Error('The file viewer is unavailable.');
  const button = jquery(element);
  const pdfUrl = convertedPdfUrl(item.pdfUrl) ?? item.pdfUrl;
  currentDownload = { url: pdfUrl, name: pdfFileName(item, pdfUrl) };
  installDownloadHandler();
  if (!element.dataset['viewerReady']) {
    button.flipBook({
      pdfUrl, lightBox: true, layout: 3, lightboxBackground: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim(),
      currentPage: { vAlign: 'bottom', hAlign: 'left', title: 'Go to page' },
      btnFirst: { enabled: true, title: 'First page', hideOnMobile: true }, btnLast: { enabled: true, title: 'Last page', hideOnMobile: true },
      btnSearch: { enabled: true, title: 'Search document' }, btnSelect: { enabled: false },
      btnShare: { enabled: false }, btnPrint: { enabled: allowPageExport }, btnDownloadPages: { enabled: false },
      btnDownloadPdf: { enabled: true, title: 'Download PDF', icon: 'fa-download', icon2: 'file_download', hideOnMobile: false, url: pdfUrl, forceDownload: false },
      btnBookmark: { enabled: false },
      btnColor: 'rgb(255,120,60)', sideBtnColor: 'rgb(255,120,60)', sideBtnSize: 60,
      sideBtnBackground: 'rgba(0,0,0,.7)', sideBtnRadius: 60,
      btnSound: { enabled: true, hideOnMobile: false, vAlign: 'top', hAlign: 'left' }, btnAutoplay: { enabled: true, title: 'Autoplay', hideOnMobile: false, vAlign: 'top', hAlign: 'left' },
      assets: {
        preloader: media['images/preloader.jpg'], overlay: media['images/overlay.png'],
        flipMp3: media['mp3/turnPage.mp3'], spinner: media['images/spinner.gif'],
      },
    });
    element.dataset['viewerReady'] = 'true';
    button.trigger('click');
  }
}