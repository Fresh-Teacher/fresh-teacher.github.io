export const readingModes = ['book', 'vertical'] as const;
export type ReadingMode = typeof readingModes[number];

export function flipbookOptions(pdfUrl: string) {
  return {
    pdfUrl, lightBox: false, viewMode: 'webgl',
    singlePageMode: false, singlePageModeIfMobile: false, layout: 1,
    sound: true, menuOverBook: false, btnSize: 18,
    btnFirst: { enabled: true, title: 'First page', hideOnMobile: true }, btnLast: { enabled: true, title: 'Last page', hideOnMobile: true },
    currentPage: { enabled: true, title: 'Go to page', vAlign: 'top', hAlign: 'center' },
    btnPrev: { enabled: true, title: 'Previous page' }, btnNext: { enabled: true, title: 'Next page' },
    btnZoomIn: { enabled: true, title: 'Zoom in' }, btnZoomOut: { enabled: true, title: 'Zoom out' },
    btnThumbs: { enabled: true, title: 'Page thumbnails' },
    btnExpand: { enabled: false }, btnRotateLeft: { enabled: false }, btnRotateRight: { enabled: false }, btnClose: { enabled: false },
    btnShare: { enabled: false }, btnPrint: { enabled: false },
    btnDownloadPdf: { enabled: true, title: 'Download PDF', icon: 'fa-download', icon2: 'file_download', url: pdfUrl, forceDownload: false, openInNewWindow: true },
    btnDownloadPages: { enabled: false }, btnSound: { enabled: true, title: 'Page-turn sound', hideOnMobile: false }, btnAutoplay: { enabled: true, title: 'Autoplay', hideOnMobile: false },
    btnSearch: { enabled: true, title: 'Search document' }, btnSelect: { enabled: false }, btnBookmark: { enabled: false }, btnToc: { enabled: false },
  };
}