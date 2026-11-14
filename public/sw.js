// Retires the old offline worker for browsers that installed it. Deletes only its own
// Workbox caches, then unregisters itself. Safe to delete after one release cycle.
function isOwnWorkboxCache(name) {
  return /(^|-)precache-v\d+-|(^|-)runtime-/.test(name) && name.endsWith(self.registration.scope);
}
const oldRuntimeCaches = ["pages", "library-data", "media", "documents"];
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      await Promise.allSettled(names.filter((n) => isOwnWorkboxCache(n) || oldRuntimeCaches.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: "window" });
      await Promise.allSettled(clients.map((c) => c.navigate(c.url)));
    } finally {
      await self.registration.unregister();
    }
  })()),
);
