import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { ClassHub } from '@/components/class-hub';
import { LegacyPage } from '@/components/legacy-page';
import { earlyTapQueueScript } from '@/lib/early-tap-queue';
import type { ClassHubData } from '@/lib/class-hubs';
import type { LegacyPageData } from '@/lib/legacy-pages';

describe('Inline dropdown handoff', () => {
  it('keeps class and legacy menus open through hydration, then closes on the next tap', async () => {
    vi.useFakeTimers();
    // Exercise the exact raw script shipped in the HTML, not only its typed counterpart.
    new Function('window', 'document', earlyTapQueueScript)(window, document);
    const hub: ClassHubData = { title: 'Test class', description: 'Test resources', heading: 'Test class', menus: [{ label: 'NOTES', featured: false, items: [{ label: 'Notes', href: '/notes.html' }] }] };
    const legacy: LegacyPageData = { title: 'Test class', description: '', template: 'menu', styles: 'css', items: [], mode: 'static', missingData: null, links: [] };
    const fragments = { css: '', menu: '<div class="btn-group"><button data-toggle="dropdown">NOTES</button><ul class="dropdown-menu"><li><a href="/notes.html">Notes</a></li></ul></div>' };
    for (const page of [<ClassHub data={hub} />, <LegacyPage data={legacy} fragments={fragments} />]) {
      const container = document.createElement('div');
      document.body.appendChild(container);
      container.innerHTML = renderToString(page);
      const button = container.querySelector<HTMLButtonElement>('[data-toggle="dropdown"]');
      if (!button) throw new Error('Missing trigger');
      button.click();
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(container.querySelector('[data-early-open]')).not.toBeNull();
      let root: ReturnType<typeof hydrateRoot> | undefined;
      await act(async () => { root = hydrateRoot(container, page); });
      await act(async () => { vi.advanceTimersByTime(200); });
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(container.querySelector('[data-early-open]')).toBeNull();
      expect(container.querySelector('ul.dropdown-menu')?.hasAttribute('hidden')).toBe(false);
      await act(async () => { button.click(); });
      expect(button.getAttribute('aria-expanded')).toBe('false');
      await act(async () => { root?.unmount(); });
      container.remove();
    }
    vi.useRealTimers();
  });
});