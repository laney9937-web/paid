self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const privatePath =
    url.pathname.startsWith('/creator') ||
    url.pathname.startsWith('/guest') ||
    url.pathname.startsWith('/transaction') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/checkout');
  if (privatePath || event.request.headers.has('cookie')) {
    return;
  }
});
