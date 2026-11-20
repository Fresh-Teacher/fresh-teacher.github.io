import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ClassHub } from '@/components/class-hub';
import { addClassResourceMenus } from '@/lib/class-resource-menus';
import { MORE_DOCUMENTS, examsHrefForClass, moreDocumentsClass, moreDocumentsHref, packagesHrefForClass } from '@/data/more-documents';
import type { ClassHubData } from '@/lib/class-hubs';
import manifest from '@/data/legacy/manifest.json';
import p7 from '@/data/class-hubs/p7.html.json';

const catalogs = import.meta.glob<{ default: ClassHubData }>('../data/class-hubs/*.json', { eager: true });
const pages = import.meta.glob<{ default: { template: string } }>('../data/catalog/pages/legacy/*.json', { eager: true });
const fragments = import.meta.glob<{ default: string }>('../data/legacy/fragments/*.json', { eager: true });
afterEach(cleanup);

describe('Direct class hub catalogs', () => {
  it.skip('preserves every audited resource destination on all 17 hubs', () => {
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
        const hrefs = menu.items.flatMap(item => 'href' in item ? [item.href] : []);
        const exams = menu.label === 'EXAMINATIONS' && key ? examsHrefForClass(key) : menu.label === 'HOLIDAY PACKAGES' && key ? packagesHrefForClass(key) : null;
        if (exams) {
          // Classes with their own exam collection open that page directly as a plain button instead of the audited past-paper list.
          expect(menu.href, path).toBe(exams);
          expect(hrefs, path).toEqual([]);
        } else {
          const expected = menu.label === 'MORE ITEMS' && key ? (MORE_DOCUMENTS[key] ?? []).map(item => moreDocumentsHref(item.repo)) : originalLinks;
          expect(hrefs, path).toEqual(expected);
        }
      });
    }
  });
});

describe('Native class hub interactions', () => {
  const disclosure = (trigger: HTMLElement) => {
    const group = trigger.closest('details');
    if (!(group instanceof HTMLDetailsElement)) throw new Error('Missing native menu');
    return group;
  };
  it('opens with ArrowDown, cycles items, and restores focus on Escape', () => {
    render(<ClassHub data={p7 as ClassHubData} />);
    const trigger = screen.getByText('SCHEMES OF WORK').closest('summary');
    if (!trigger) throw new Error('Missing trigger');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const items = Array.from(disclosure(trigger).querySelectorAll<HTMLAnchorElement>('[role="menuitem"]'));
    expect(disclosure(trigger).open).toBe(true);
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0] ?? trigger, { key: 'ArrowUp' });
    expect(items.at(-1)).toHaveFocus();
    fireEvent.keyDown(items.at(-1) ?? trigger, { key: 'ArrowDown' });
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(disclosure(trigger).open).toBe(false);
    expect(trigger).toHaveFocus();
  });
  it('toggles on repeated taps and dismisses outside', () => {
    render(<ClassHub data={p7 as ClassHubData} />);
    const trigger = screen.getByText('LESSON NOTES').closest('summary');
    if (!trigger) throw new Error('Missing trigger');
    fireEvent.click(trigger);
    expect(disclosure(trigger).open).toBe(true);
    fireEvent.click(trigger);
    expect(disclosure(trigger).open).toBe(false);
    fireEvent.click(trigger);
    fireEvent.click(document.body);
    expect(disclosure(trigger).open).toBe(false);
  });
});
