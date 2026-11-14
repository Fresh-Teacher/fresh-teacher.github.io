import { archiveExtensions, documentExtension } from '@/lib/document-formats';
const pdf = { url: '/__l5e/assets-v1/fbbe5aef-2f08-436a-9d9f-18a4721a9f41/e3f2c139-pdf.webp' };
const word = { url: '/__l5e/assets-v1/60a9a214-def8-4813-bb6e-e375663ecf8f/cd164d7b-word.webp' };
const excel = { url: '/__l5e/assets-v1/3510217c-0f36-4dd0-a459-4647394d99b0/76c3c917-excel.webp' };
const powerpoint = { url: '/__l5e/assets-v1/33394639-26b6-49ed-bc0a-eaf5a181948c/995dbb07-powerpoint.webp' };
const archive = { url: '/__l5e/assets-v1/a62e7473-b710-43a9-8bbe-ec9c96c16158/e3e38388-archive.webp' };
const rtf = { url: '/__l5e/assets-v1/93c27c9a-02d2-4a97-9091-f71bcd311872/03dc7ab4-rtf.png' };
const txt = { url: '/__l5e/assets-v1/d7100035-d464-4d7c-bbc6-e24b82fc9db4/cd7794b8-txt.webp' };

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
