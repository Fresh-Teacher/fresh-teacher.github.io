import { convertedPdfUrl } from '@/lib/converted-documents';
import { downloadFile } from '@/lib/file-download';
import { useState } from 'react';
import { Download, LoaderCircle, Check, Link2, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { resourceTitle, type ResourceRecord } from '@/lib/resources';
import { documentSlug } from '@/lib/document-metadata';
import { classMenuAnimations } from '@/lib/class-hubs';

export const shareAnimations = [...new Set(Object.values(classMenuAnimations))];

// Official WhatsApp glyph in its brand green.
function WhatsAppIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
}


// Official brand glyphs in their brand colours.
function FacebookIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M16.67 15.47 17.2 12h-3.33V9.75c0-.95.47-1.87 1.96-1.87h1.51V4.92s-1.37-.23-2.69-.23c-2.74 0-4.53 1.66-4.53 4.67V12H7.08v3.47h3.04V24a12.1 12.1 0 0 0 3.75 0v-8.53z"/></svg>;
}
function GmailIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M1.64 21h3.82v-9.27L0 7.64v11.73C0 20.27.73 21 1.64 21z"/><path fill="#34A853" d="M18.55 21h3.81c.91 0 1.64-.73 1.64-1.64V7.64l-5.45 4.09z"/><path fill="#FBBC04" d="M18.55 4.64v7.09L24 7.64V5.45c0-2.02-2.31-3.18-3.93-1.96z"/><path fill="#EA4335" d="M5.45 11.73V4.64L12 9.55l6.55-4.91v7.09L12 16.64z"/><path fill="#C5221F" d="M0 5.45v2.19l5.45 4.09V4.64L3.93 3.49C2.31 2.27 0 3.43 0 5.45z"/></svg>;
}
function XIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#000"/><path fill="#fff" d="M13.5 10.7 18.9 4.5h-1.3l-4.7 5.4-3.7-5.4H4.9l5.7 8.2-5.7 6.6h1.3l5-5.8 4 5.8h4.3zm-1.8 2-.6-.8-4.6-6.5h2l3.7 5.3.6.8 4.8 6.9h-2z"/></svg>;
}
function TelegramIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#26A5E4"/><path fill="#fff" d="M5.43 11.87c3.5-1.52 5.83-2.53 7-3.02 3.33-1.39 4.02-1.63 4.48-1.64.1 0 .32.02.46.14.12.1.15.23.17.33.02.09.04.3.02.47-.18 1.9-.96 6.52-1.36 8.65-.17.9-.5 1.2-.82 1.23-.7.06-1.22-.46-1.9-.9-1.05-.69-1.64-1.12-2.66-1.79-1.18-.78-.41-1.2.26-1.9.18-.18 3.23-2.96 3.29-3.21 0-.03.01-.15-.06-.21s-.17-.04-.25-.02c-.1.02-1.79 1.14-5.06 3.35-.48.33-.91.49-1.3.48-.43-.01-1.25-.24-1.86-.44-.75-.24-1.35-.37-1.3-.79.03-.22.33-.44.89-.67z"/></svg>;
}

export function ShareMenuItems({ copied, copy, subject, introduction, message, link }: { copied: boolean; copy: () => Promise<void>; subject: string; introduction: string; message: () => string; link: () => string }) {
  const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
  const enc = encodeURIComponent;
  return <>
      <DropdownMenuItem onSelect={() => void copy()}>{copied ? <Check size={16} /> : <Link2 size={16} />} Share link</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => open(`https://wa.me/?text=${enc(message())}`)}><WhatsAppIcon /> WhatsApp</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => { window.location.href = `mailto:?subject=${enc(subject)}&body=${enc(message())}`; }}><GmailIcon /> Gmail / Email</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(link())}`)}><FacebookIcon /> Facebook</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => open(`https://x.com/intent/post?text=${enc(introduction)}&url=${enc(link())}`)}><XIcon /> X</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => open(`https://t.me/share/url?url=${enc(link())}&text=${enc(introduction)}`)}><TelegramIcon /> Telegram</DropdownMenuItem>
  </>;
}

export function DocumentShare({ item }: { item: ResourceRecord }) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [animation, setAnimation] = useState('flipInY');
  // Radix owns the open/close toggle: its trigger opens the menu on press and its
  // dismiss layer closes it on an outside press, so pressing the same button again
  // only ever closes. modal={false} keeps the trigger reachable while the menu is
  // open — with the modal overlay up the press never reaches the button, and the
  // click that follows reopens the menu.
  const chooseEntrance = (opened: boolean) => {
    setShareOpen(opened);
    if (!opened) return;
    setCopied(false);
    setAnimation(previous => {
      const choices = shareAnimations.filter(name => name !== previous);
      return choices[Math.floor(Math.random() * choices.length)] ?? 'slideInUp';
    });
  };
  const title = resourceTitle(item);
  const link = () => {
    const url = new URL(`/doc/${documentSlug(item)}`, window.location.origin);
    const here = window.location.pathname.replace(/^\//, '');
    const source = here.startsWith('more/') ? here : new URLSearchParams(window.location.search).get('source');
    if (source?.startsWith('more/')) url.searchParams.set('source', source);
    return url.href;
  };
  const introduction = `Hello, I have discovered this useful resource from Fresh Teacher’s Library.\n\n${title}\n\nFollow this link to check it out:`;
  const message = () => `${introduction}\n${link()}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(message()); setCopied(true); toast.success('Link copied'); window.setTimeout(() => setCopied(false), 2000); }
    catch { toast.error('Could not copy message and link'); }
  };
  return <DropdownMenu open={shareOpen} onOpenChange={chooseEntrance} modal={false}>
    <DropdownMenuTrigger asChild>
      <Button variant="source" size="source" className="dg-action dg-share" aria-label={`Share ${title}`}><Share2 size={16} /> Share</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" collisionPadding={12} sideOffset={8} aria-label={`Share ${title}`} className={`dg-share-popup dg-share-${animation}`}>
      <div className="dg-share-head"><span>Share</span><button type="button" className="dg-share-close" aria-label="Close share menu" onClick={() => setShareOpen(false)}><X size={20} /></button></div>
      <ShareMenuItems copied={copied} copy={copy} subject={title} introduction={introduction} message={message} link={link} />
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function DocumentDownload({ item }: { item: ResourceRecord }) {
  const pdf = convertedPdfUrl(item.pdfUrl);
  if (!pdf) return <FileDownload item={item} url={item.pdfUrl} />;
  return <><FileDownload item={item} url={pdf} label="PDF" /><FileDownload item={item} url={item.pdfUrl} label={(item.pdfUrl.split('.').pop() ?? 'Original').toUpperCase()} /></>;
}

function FileDownload({ item, url: fileUrl, label }: { item: ResourceRecord; url: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const download = async () => {
    setState('loading');
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('File unavailable');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = decodeURIComponent(fileUrl.split('/').pop() ?? '') || 'document';
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setState('done');
    } catch { setState('error'); }
  };
  return <><Button variant="source" size="source" className="dg-action dg-download" disabled={state === 'loading'} onClick={() => void download()} aria-label={`Download ${resourceTitle(item)}${label ? ` as ${label}` : ''}`}>
    {state === 'loading' ? <LoaderCircle className="dg-spin" size={16} /> : state === 'done' ? <Check size={16} /> : <Download size={16} />}{state === 'loading' ? 'Downloading…' : state === 'done' ? 'Downloaded' : label ? `Download ${label}` : 'Download'}
  </Button>{state === 'error' && <span role="alert" className="dg-download-error">Download unavailable. <a href={fileUrl} target="_blank" rel="noopener noreferrer">Open original file</a></span>}</>;
}