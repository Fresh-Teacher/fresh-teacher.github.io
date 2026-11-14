// Continuous reading uses the PDF.js engine shipped with the source flipbook.
(async function () {
  const reader = document.getElementById('reader');
  const status = document.getElementById('reader-status');
  const url = document.body.dataset.pdfUrl;
  if (!reader || !status || !url) return;
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/resource-source/js/pdf.worker.min.js';
    const loading = pdfjsLib.getDocument({ url });
    window.addEventListener('pagehide', () => loading.destroy());
    const pdf = await loading.promise;
    const first = await pdf.getPage(1);
    const base = first.getViewport({ scale: 1 });
    const pages = [];
    let queue = Promise.resolve();
    const render = async (element) => {
      if (element.dataset.rendered) return;
      element.dataset.rendered = 'pending';
      try {
        const page = await pdf.getPage(Number(element.dataset.page));
        const size = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(window.devicePixelRatio || 1, 2) * element.clientWidth / size.width });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Page ' + element.dataset.page);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        await page.render({ canvasContext: context, viewport }).promise;
        element.replaceChildren(canvas);
        element.style.aspectRatio = size.width + ' / ' + size.height;
        element.dataset.rendered = 'true';
      } catch {
        element.dataset.rendered = '';
        element.textContent = 'Page ' + element.dataset.page + ' could not load.';
      }
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) queue = queue.then(() => render(entry.target));
      });
    }, { rootMargin: '700px 0px' });
    for (let number = 1; number <= pdf.numPages; number++) {
      const element = document.createElement('section');
      element.className = 'vertical-reader-page';
      element.dataset.page = String(number);
      element.setAttribute('aria-label', 'Page ' + number + ' of ' + pdf.numPages);
      element.style.aspectRatio = base.width + ' / ' + base.height;
      element.textContent = 'Page ' + number;
      reader.appendChild(element);
      pages.push(element);
      observer.observe(element);
    }
    status.hidden = true;
    if (pages[0]) await render(pages[0]);
    let width = reader.clientWidth;
    const resize = new ResizeObserver(() => {
      if (width === reader.clientWidth) return;
      width = reader.clientWidth;
      queue = queue.then(() => {
        pages.forEach(element => {
          element.dataset.rendered = '';
          observer.unobserve(element);
          observer.observe(element);
        });
      });
    });
    resize.observe(reader);
    window.addEventListener('pagehide', () => { observer.disconnect(); resize.disconnect(); });
  } catch {
    status.textContent = 'Preview unavailable. Please open the original file.';
  }
})();