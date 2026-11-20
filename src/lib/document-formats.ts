// Compressed folders are listed alongside documents and open as downloads.
export const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'zipx'];
const documentExtensions = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'pps', 'ppsx', 'odt', 'ods', 'odp', 'rtf', 'txt', ...archiveExtensions]);

export function documentExtension(url: string) {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return '';
    const extension = parsed.pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? '';
    if (documentExtensions.has(extension)) return extension;
    // Some captured filenames contain literal # characters; preserve those source records.
    return url.split('?')[0]?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? extension;
  } catch { return ''; }
}

export function isDocumentFile(url: string) {
  return documentExtensions.has(documentExtension(url));
}

/** Marker the thumbnail pipeline stamps on records whose source file returned 404. */
export const BROKEN_THUMB_URL = '/thumbs/broken-link.webp';
/** Marker for live PDFs the pipeline could not render because they are password-protected. */
export const LOCKED_THUMB_URL = '/thumbs/locked-pdf.webp';

/**
 * Every real document file is listed, including missing and locked ones, so problems
 * stay visible in the library (missing files show the broken cover, locked ones the lock cover).
 */
export function isVisibleDocument(item: { pdfUrl: string; thumbUrl?: string }) {
  return isDocumentFile(item.pdfUrl);
}
