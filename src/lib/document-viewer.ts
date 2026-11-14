import { documentExtension } from './document-formats';
import { convertedPdfUrl } from './converted-documents';

export function documentViewer(url: string) {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return { kind: 'unsupported' as const }; }
  if (!['https:', 'http:'].includes(parsed.protocol)) return { kind: 'unsupported' as const };
  const extension = documentExtension(url);
  if (extension === 'pdf') return { kind: 'pdf' as const, src: url };
  const converted = convertedPdfUrl(url);
  if (converted) return { kind: 'pdf' as const, src: converted };
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'pps', 'ppsx', 'odt', 'ods', 'odp', 'rtf'].includes(extension ?? '')) {
    // Only public source catalog URLs are passed to third-party viewers.
    const rawFreshTeacher = parsed.hostname === 'raw.githubusercontent.com' && parsed.pathname.startsWith('/Fresh-Teacher/');
    if (parsed.hostname !== 'fresh-teacher.github.io' && !rawFreshTeacher) return { kind: 'unsupported' as const };
    const office = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'pps', 'ppsx'].includes(extension ?? '');
    return { kind: 'office' as const, src: office ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}` : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}` };
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension ?? '')) return { kind: 'image' as const, src: url };
  if (['txt', 'csv'].includes(extension ?? '')) return { kind: 'text' as const, src: url };
  return { kind: 'unsupported' as const };
}