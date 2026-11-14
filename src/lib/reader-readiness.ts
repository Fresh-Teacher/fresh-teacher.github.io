// Shared by the iframe and parent; standalone so it can also be embedded in srcDoc.
export function readerIsReady(doc: Document) {
  const status = doc.getElementById('reader-status');
  if (status && !status.hidden && /unavailable/i.test(status.textContent ?? '')) return true;
  if (doc.querySelector('[data-rendered="true"]')) return true;
  const preloaders = Array.from(doc.querySelectorAll<HTMLElement>('.flipbook-preloader'));
  // The plugin hides its preloader after the initial page textures have loaded.
  // An arbitrary canvas is not enough: WebGL creates an empty canvas first.
  return preloaders.length > 0 && preloaders.every(el => el.style.display === 'none') &&
    Array.from(doc.querySelectorAll<HTMLCanvasElement>('.flipbook-bookLayer canvas')).some(canvas => canvas.width > 0 && canvas.height > 0);
}

export const readerReadyScript = `<script>(function(){var ready=${readerIsReady.toString()};var scheduled=false;function check(){if(scheduled||!ready(document))return;scheduled=true;requestAnimationFrame(function(){requestAnimationFrame(function(){window.__readerReady=true;parent.postMessage({type:'sharebility:ready'},'*')})})}var observer=new MutationObserver(check);observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true});check();window.addEventListener('pagehide',function(){observer.disconnect()},{once:true})})();</script>`;