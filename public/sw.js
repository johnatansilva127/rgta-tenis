const CACHE = 'rgta-v2'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone()
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
      return res
    }).catch(() => caches.match(req))
  )
})
self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data.json() } catch (_e) { d = { title: 'RGTA', body: e.data ? e.data.text() : '' } }
  e.waitUntil(self.registration.showNotification(d.title || 'RGTA', {
    body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png',
    data: { url: d.url || '/' }, vibrate: [80, 40, 80]
  }))
})
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || '/'
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cl) => {
    for (const c of cl) { if ('focus' in c) return c.focus() }
    if (self.clients.openWindow) return self.clients.openWindow(url)
  }))
})
