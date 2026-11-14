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