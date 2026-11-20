import { archiveExtensions, documentExtension } from '@/lib/document-formats';
const pdf = { url: '/__l5e/assets-v1/650d8450-1d7c-4e97-9aa3-dfb60fa131f6/e3f2c139-pdf.webp' };
const word = { url: '/__l5e/assets-v1/5139fad7-f650-4f0f-b3f0-c4593dafb5d9/cd164d7b-word.webp' };
const excel = { url: '/__l5e/assets-v1/c9a05b36-8bb2-4eb1-9109-5d4e1b5af267/76c3c917-excel.webp' };
const powerpoint = { url: '/__l5e/assets-v1/042e4e01-1062-458d-80df-29ab2e354a75/995dbb07-powerpoint.webp' };
const archive = { url: '/__l5e/assets-v1/cff6f437-27d7-4a0f-bc29-c78360873f28/e3e38388-archive.webp' };
const rtf = { url: '/__l5e/assets-v1/1d4f744e-224a-4449-a559-0f641eb4e6f7/03dc7ab4-rtf.png' };
const txt = { url: '/__l5e/assets-v1/6239e50a-d457-4aaa-8535-8a103f91e469/cd7794b8-txt.webp' };

const placeholders = { pdf, word, excel, powerpoint, archive, rtf, txt };

export function documentPlaceholder(url: string) {
  const extension = documentExtension(url);
  if (extension === 'pdf') return placeholders.pdf;
  if (['doc', 'docx'].includes(extension)) return placeholders.word;
  if (['xls', 'xlsx'].includes(extension)) return placeholders.excel;
  if (['ppt', 'pptx', 'pps', 'ppsx'].includes(extension)) return placeholders.powerpoint;
  if (extension === 'rtf') return placeholders.rtf;
  if (extension === 'txt') return placeholders.txt;
  if (archiveExtensions.includes(extension)) return placeholders.archive;
  return null;
}
