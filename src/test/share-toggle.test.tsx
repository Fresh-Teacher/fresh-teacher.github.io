import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentShare } from '@/components/document-actions';
import { resourceTitle, type ResourceRecord } from '@/lib/resources';
import { documentSlug } from '@/lib/document-metadata';

// jsdom ships neither PointerEvent nor the pointer-capture helpers Radix calls.
const globals = globalThis as Record<string, unknown>;
if (!('PointerEvent' in globals)) globals['PointerEvent'] = globals['MouseEvent'];
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.setPointerCapture ??= () => {};
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

const item: ResourceRecord = {
  title: 'P7 Mathematics Notes',
  description: 'Primary Seven',
  price: 5000,
  pdfUrl: 'https://fresh-teacher.github.io/primary/p7 mathematics notes.pdf',
};

// A real press is a pointerdown followed by a click; Radix dismisses on the click.
const press = (element: Element) => {
  fireEvent.pointerDown(element, { button: 0, ctrlKey: false, bubbles: true, cancelable: true });
  fireEvent.click(element, { button: 0, ctrlKey: false, bubbles: true, cancelable: true });
};

const shareName = `Share ${resourceTitle(item)}`;
const trigger = () => screen.getByRole('button', { name: shareName });
const menu = () => screen.queryByRole('menu');

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.history.replaceState({}, '', '/'); });

describe('Share menu opening and closing', () => {
  it('opens when the Share button is pressed', () => {
    render(<DocumentShare item={item} />);
    press(trigger());
    expect(menu()).toBeInTheDocument();
  });

  it('closes when the same Share button is pressed again', () => {
    render(<DocumentShare item={item} />);
    press(trigger());
    expect(menu()).toBeInTheDocument();
    press(trigger());
    expect(menu()).not.toBeInTheDocument();
  });

  it('closes with the close button inside the menu', () => {
    render(<DocumentShare item={item} />);
    press(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'Close share menu' }));
    expect(menu()).not.toBeInTheDocument();
  });

  it('closes when something outside the menu is pressed', async () => {
    render(
      <><div data-testid="page">Lesson notes</div><DocumentShare item={item} /></>,
    );
    press(trigger());
    expect(menu()).toBeInTheDocument();
    // Radix installs its document-level outside-press listener on the next tick.
    await new Promise(resolve => setTimeout(resolve, 10));
    press(screen.getByTestId('page'));
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
  });
});

describe('Document sharing destinations', () => {
  const introduction = `Hello, I have discovered this useful resource from Fresh Teacher’s Library.\n\n${resourceTitle(item)}\n\nFollow this link to check it out:`;
  const detailUrl = () => `${window.location.origin}/doc/${documentSlug(item)}`;

  it('copies the introduction and details link instead of the original file', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', Object.create(navigator, { clipboard: { value: { writeText } } }));
    render(<DocumentShare item={item} />);
    press(trigger());
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share link' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${introduction}\n${detailUrl()}`));
    expect(writeText.mock.calls[0]?.[0]).not.toContain(item.pdfUrl);
  });

  it.each([
    ['WhatsApp', 'https://wa.me/', 'text', undefined],
    ['X', 'https://x.com/intent/post', 'text', 'url'],
    ['Telegram', 'https://t.me/share/url', 'text', 'url'],
    ['Facebook', 'https://www.facebook.com/sharer/sharer.php', undefined, 'u'],
  ])('%s shares the document details page', (channel, endpoint, textKey, urlKey) => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<DocumentShare item={item} />);
    press(trigger());
    fireEvent.click(screen.getByRole('menuitem', { name: channel }));
    const shared = new URL(String(open.mock.calls[0]?.[0]));
    expect(`${shared.origin}${shared.pathname}`).toBe(endpoint);
    if (urlKey) expect(shared.searchParams.get(urlKey)).toBe(detailUrl());
    if (textKey) expect(shared.searchParams.get(textKey)).toBe(urlKey ? introduction : `${introduction}\n${detailUrl()}`);
    expect(shared.href).not.toContain(encodeURIComponent(item.pdfUrl));
  });

  it('preserves the repository context on a shared details link', () => {
    window.history.replaceState({}, '', '/more/primary');
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<DocumentShare item={item} />);
    press(trigger());
    fireEvent.click(screen.getByRole('menuitem', { name: 'Telegram' }));
    const shared = new URL(String(open.mock.calls[0]?.[0]));
    expect(shared.searchParams.get('url')).toBe(`${detailUrl()}?source=more%2Fprimary`);
  });
});
