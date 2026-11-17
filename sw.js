// Rihlah Ilmu — service worker: membuat aplikasi bisa dipasang dan dibuka tanpa internet.
const VERSI = 'rihlah-v1';
const INTI = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(INTI)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // data soal & hasil lewat Apps Script: biarkan aplikasi yang mengatur (sudah ada cadangan di HP)
  if (/script\.google(usercontent)?\.com$/.test(url.hostname) || url.hostname.endsWith('everyayah.com')) return;
  // huruf (Google Fonts): ambil dari simpanan dulu
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(VERSI).then(x => x.put(req, c)); return res; })));
    return;
  }
  if (url.origin !== location.origin) return;
  // file aplikasi: utamakan versi terbaru dari internet, pakai simpanan jika offline
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(VERSI).then(x => x.put(req, c)); }
    return res;
  }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('./index.html'))));
});
