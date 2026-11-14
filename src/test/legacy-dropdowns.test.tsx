import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LegacyPage } from '@/components/legacy-page';
import type { LegacyPageData } from '@/lib/legacy-pages';

const labels = ['LESSON NOTES', 'PAST PAPERS', 'SCHEMES OF WORK', 'HOLIDAY PACKAGES'] as const;
const data: LegacyPageData = { title: 'Class resources', description: '', template: 'menu', styles: 'css', items: [], mode: 'static', missingData: null, links: [] };
const fragments = { css: '', menu: `<div class="necta1">${labels.map((label, index) => `<div class="btn-group"><button class="btn dropdown-toggle" data-toggle="dropdown" type="button">${label}</button><ul class="dropdown-menu" role="menu"><li><a href="/resource${index}.html">Resource ${index}</a></li></ul></div>`).join('')}</div>` };

afterEach(cleanup);
describe('Shelf resource dropdown interactions', () => {
  it('replaces each previous resource menu on a single click', () => {
    render(<LegacyPage data={data} fragments={fragments} />);
    for (const label of [...labels, ...labels]) {
      const trigger = screen.getByRole('button', { name: label });
      fireEvent.pointerDown(trigger);
      fireEvent.click(trigger);
      for (const other of labels) expect(screen.getByRole('button', { name: other })).toHaveAttribute('aria-expanded', String(other === label));
    }
  });
  it('does not collapse and move a sibling between pointer press and click', () => {
    render(<LegacyPage data={data} fragments={fragments} />);
    const notes = screen.getByRole('button', { name: labels[0] });
    const papers = screen.getByRole('button', { name: labels[1] });
    fireEvent.click(notes);
    fireEvent.pointerDown(papers);
    expect(notes).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(papers);
    expect(notes).toHaveAttribute('aria-expanded', 'false');
    expect(papers).toHaveAttribute('aria-expanded', 'true');
  });
  it('closes on an outside click and reopens on the first click', () => {
    render(<LegacyPage data={data} fragments={fragments} />);
    const button = screen.getByRole('button', { name: labels[0] });
    fireEvent.click(button);
    fireEvent.click(document.body);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
  it('dismisses immediately after selecting a resource', () => {
    render(<LegacyPage data={data} fragments={fragments} />);
    const button = screen.getByRole('button', { name: labels[0] });
    fireEvent.click(button);
    const link = screen.getByRole('link', { name: 'Resource 0' });
    link.addEventListener('click', event => event.preventDefault());
    fireEvent.click(link);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
  it('closes on Escape and restores focus to the open trigger', () => {
    render(<LegacyPage data={data} fragments={fragments} />);
    const button = screen.getByRole('button', { name: labels[0] });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });
});