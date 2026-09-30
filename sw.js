// オフライン用：つながる時は最新版を取得し、つながらない時は保存済みの版を使う
const CACHE = 'duo-app-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./Duo.html'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = (await cache.match(req, {ignoreSearch: true})) || (req.mode === 'navigate' ? await cache.match('./Duo.html') : undefined);
    const net = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; });
    if (!cached) return net;
    return Promise.race([net.catch(() => cached), new Promise(res => setTimeout(() => res(cached), 3000))]);
  })());
});
