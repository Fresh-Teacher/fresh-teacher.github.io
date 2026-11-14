const logo = { url: '/__l5e/assets-v1/9d608eb2-8636-47b6-baf1-d8e22c43a085/b1770cff-logo.webp' };

// Tap feedback only while the engine starts; the original flipbook owns PDF loading.

let overlay: HTMLDivElement | undefined;
let poll: number | undefined;
let safety: number | undefined;

export function isViewerLoading() { return Boolean(overlay); }

export function showViewerLoading() {
  if (overlay || typeof document === 'undefined') return;
  overlay = document.createElement('div');
  overlay.className = 'viewer-loading-overlay';
  overlay.innerHTML = `<div class="logo-loader" role="status" aria-label="Opening document…"><span class="logo-loader-ring" aria-hidden="true"></span><img class="logo-loader-image" src="${logo.url}" alt="" aria-hidden="true"></div>`;
  document.body.appendChild(overlay);
  safety = window.setTimeout(hideViewerLoading, 30_000);
}

export function hideViewerLoading() {
  if (poll) window.clearInterval(poll);
  if (safety) window.clearTimeout(safety);
  poll = safety = undefined;
  overlay?.remove();
  overlay = undefined;
}

function visible(el: Element | null) {
  if (!el) return false;
  const style = getComputedStyle(el as HTMLElement);
  return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).getClientRects().length > 0;
}

// Hand off to the plugin's native preloader, not a second PDF rendering timer.
export function hideViewerLoadingWhenReady() {
  if (!overlay) return;
  if (poll) window.clearInterval(poll);
  const handoff = () => {
    const nativeLoading = [...document.querySelectorAll('.flipbook-preloader')].some(visible);
    const opened = [...document.querySelectorAll('.flipbook-overlay')].some(visible);
    if (nativeLoading || opened) hideViewerLoading();
  };
  handoff();
  if (!overlay) return;
  poll = window.setInterval(() => {
    handoff();
  }, 16);
}
