import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

describe('Continuous vertical PDF reading', () => {
  it('keeps pages in document order and renders the first without waiting for scrolling', async () => {
    const elements: Array<Record<string, any>> = [];
    const requested: number[] = [];
    const reader = { clientWidth: 300, appendChild: (element: Record<string, any>) => elements.push(element) };
    const status = { hidden: false, textContent: '' };
    let observeVisible: ((entries: any[]) => void) | undefined;
    const page = { getViewport: () => ({ width: 300, height: 400 }), render: () => ({ promise: Promise.resolve() }) };
    runInNewContext(readFileSync('public/reader-vertical.js', 'utf8'), {
      document: {
        body: { dataset: { pdfUrl: 'https://fresh-teacher.github.io/lesson.pdf' } },
        getElementById: (id: string) => id === 'reader' ? reader : status,
        createElement: () => ({ dataset: {}, style: {}, clientWidth: 300, setAttribute: () => {}, replaceChildren: () => {}, getContext: () => ({}) }),
      },
      window: { devicePixelRatio: 1, addEventListener: () => {} },
      pdfjsLib: { GlobalWorkerOptions: {}, getDocument: () => ({ destroy: () => {}, promise: Promise.resolve({ numPages: 3, getPage: async (number: number) => { requested.push(number); return page; } }) }) },
      IntersectionObserver: class { constructor(callback: (entries: any[]) => void) { observeVisible = callback; } observe() {} unobserve() {} disconnect() {} },
      ResizeObserver: class { observe() {} disconnect() {} },
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(elements.map(element => element['dataset'].page)).toEqual(['1', '2', '3']);
    expect(elements[0]?.['dataset'].rendered).toBe('true');
    expect(requested).not.toContain(3);
    observeVisible?.([{ isIntersecting: true, target: elements[2] }]);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(elements[2]?.['dataset'].rendered).toBe('true');
    expect(requested).toContain(3);
  });
});