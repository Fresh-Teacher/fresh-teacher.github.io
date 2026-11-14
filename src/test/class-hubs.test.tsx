import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ClassHub } from '@/components/class-hub';
import { addClassResourceMenus } from '@/lib/class-resource-menus';
import { MORE_DOCUMENTS, moreDocumentsClass, moreDocumentsHref } from '@/data/more-documents';
import type { ClassHubData } from '@/lib/class-hubs';
import manifest from '@/data/legacy/manifest.json';
import p7 from '@/data/class-hubs/p7.html.json';

const catalogs = import.meta.glob<{ default: ClassHubData }>('../data/class-hubs/*.json', { eager: true });
const pages = import.meta.glob<{ default: { template: string } }>('../data/catalog/pages/legacy/*.json', { eager: true });
const fragments = import.meta.glob<{ default: string }>('../data/legacy/fragments/*.json', { eager: true });
afterEach(cleanup);

describe('Direct class hub catalogs', () => {
  it('preserves every audited resource destination on all 17 hubs', () => {
    expect(Object.keys(catalogs)).toHaveLength(17);
    for (const [file, module] of Object.entries(catalogs)) {
      const path = file.split('/').at(-1)?.replace(/\.json$/, '') ?? '';
      const entry = manifest[path as keyof typeof manifest];
      const page = pages[`../data/catalog/pages/legacy/${entry.data}`]?.default;
      if (!page) throw new Error(`Missing original catalog: ${path}`);
      const fragment = fragments[`../data/legacy/fragments/${page.template}.json`]?.default;
      if (!fragment) throw new Error(`Missing original fragment: ${path}`);
      const source = addClassResourceMenus(fragment);
      const container = document.createElement('div');
      container.innerHTML = source;
      const groups = Array.from(container.querySelectorAll('#page-wrapper .btn-group'));
      expect(module.default.menus).toHaveLength(groups.length);
      groups.forEach((group, index) => {
        const menu = module.default.menus[index];
        if (!menu) throw new Error(`Missing menu ${index}: ${path}`);
        const key = moreDocumentsClass(path);
        const originalLinks = Array.from(group.querySelectorAll('ul a')).map(a => a.getAttribute('href'));
        const expected = menu.label === 'MORE ITEMS' && key ? (MORE_DOCUMENTS[key] ?? []).map(item => moreDocumentsHref(item.repo)) : originalLinks;
        expect(menu.items.flatMap(item => 'href' in item ? [item.href] : [])).toEqual(expected);
      });
    }
  });
});

describe('Class hub keyboard navigation', () => {
  it('opens with ArrowDown, cycles items, and restores trigger focus on Escape', () => {
    render(<ClassHub data={p7 as ClassHubData} />);
    const trigger = screen.getByRole('button', { name: 'SCHEMES OF WORK' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const items = screen.getAllByRole('menuitem');
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0] ?? trigger, { key: 'ArrowUp' });
    expect(items.at(-1)).toHaveFocus();
    fireEvent.keyDown(items.at(-1) ?? trigger, { key: 'ArrowDown' });
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });
  it('opens with Enter and Space, switches on one tap, and dismisses outside', () => {
    render(<ClassHub data={p7 as ClassHubData} />);
    const notes = screen.getByRole('button', { name: 'LESSON NOTES' });
    fireEvent.keyDown(notes, { key: 'Enter' });
    expect(screen.getAllByRole('menuitem')[0]).toHaveFocus();
    fireEvent.keyDown(notes, { key: 'Escape' });
    fireEvent.keyDown(notes, { key: ' ' });
    expect(notes).toHaveAttribute('aria-expanded', 'true');
    const papers = screen.getByRole('button', { name: 'PAST PAPERS' });
    fireEvent.pointerDown(papers);
    expect(notes).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(papers);
    expect(notes).toHaveAttribute('aria-expanded', 'false');
    expect(papers).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(document.body);
    expect(papers).toHaveAttribute('aria-expanded', 'false');
  });
});