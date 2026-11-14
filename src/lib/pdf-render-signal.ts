/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// Marks window.__pdfPageRendered once PDF.js finishes drawing any page, so loaders
// can wait for real document pixels instead of the flipbook's empty WebGL canvas.
export function installPdfRenderSignal() {
  const w = window as unknown as Record<string, any>;
  if (w.__pdfRenderSignal) return;
  w.__pdfRenderSignal = true;
  const mark = () => { w.__pdfPageRendered = true; };
  const wrapPage = (page: Record<string, any>) => {
    if (!page || page.__wrapped || typeof page.render !== 'function') return page;
    const render = page.render as (...a: unknown[]) => { promise?: Promise<unknown> };
    page.render = function (this: unknown, ...args: unknown[]) {
      const task = render.apply(this, args);
      task?.promise?.then(mark, () => undefined);
      return task;
    };
    page.__wrapped = true;
    return page;
  };
  const wrapDoc = (doc: Record<string, any>) => {
    if (!doc || doc.__wrapped || typeof doc.getPage !== 'function') return doc;
    const getPage = doc.getPage as (...a: unknown[]) => Promise<Record<string, any>>;
    doc.getPage = function (this: unknown, ...args: unknown[]) { return getPage.apply(this, args).then(wrapPage); };
    doc.__wrapped = true;
    return doc;
  };
  const wrapLib = (lib: Record<string, any>) => {
    if (!lib || lib.__wrapped || typeof lib.getDocument !== 'function') return lib;
    const getDocument = lib.getDocument as (...a: unknown[]) => { promise: Promise<Record<string, any>> };
    try {
      lib.getDocument = function (this: unknown, ...args: unknown[]) {
        const task = getDocument.apply(this, args);
        const original = task.promise;
        try { Object.defineProperty(task, 'promise', { configurable: true, value: original.then(wrapDoc) }); } catch { /* keep original */ }
        return task;
      };
      lib.__wrapped = true;
    } catch { /* frozen module namespace: fall back to timeout */ }
    return lib;
  };
  let current = w.pdfjsLib as Record<string, any> | undefined;
  if (current) wrapLib(current);
  try {
    Object.defineProperty(window, 'pdfjsLib', {
      configurable: true,
      get: () => current,
      set: (value) => { current = wrapLib(value as Record<string, any>); },
    });
  } catch { /* already non-configurable */ }
}

export const pdfRenderSignalScript = `<script>(${installPdfRenderSignal.toString()})();</script>`;
