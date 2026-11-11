/* ==========================================================================
   SERVICE WORKER — Smapatispa Digital Library
   Menyimpan kerangka aplikasi (HTML/CSS/JS), pdf.js, dan huruf di perangkat
   sehingga kunjungan berikutnya terbuka instan, bahkan di jaringan lambat.
   - Halaman (index.html) & js/config.js: jaringan dulu, cadangan dari cache
   - Berkas ber-versi (?v=…) & pdf.js dari CDN: cache dulu (tidak berubah)
   - Huruf Google: cache, diperbarui diam-diam
   - Panggilan API Apps Script TIDAK pernah disimpan di sini.
   Saat memperbarui tampilan, naikkan VERSI di bawah ini dan ?v= di index.html.
   ========================================================================== */
const VERSI = '1.1.0';
const CACHE = 'smapatispa-' + VERSI;
const INTI = ['./', 'index.html', 'css/style.css?v=' + VERSI].concat(
  ['config', 'core', 'fx', 'ui', 'charts', 'zip', 'reader', 'app', 'pages-anggota', 'pages-admin'].map(f => 'js/' + f + '.js?v=' + VERSI));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(INTI.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('smapatispa-') === 0 && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function simpan(req, res) {
  if (res && (res.ok || res.type === 'opaque')) { const salin = res.clone(); caches.open(CACHE).then(c => c.put(req, salin)).catch(() => {}); }
  return res;
}
function jaringanDulu(req, cadangan) {
  return fetch(req).then(res => simpan(req, res)).catch(() => caches.match(req, { ignoreSearch: !!cadangan }).then(r => r || (cadangan ? caches.match(cadangan) : undefined)).then(r => r || Response.error()));
}
function cacheDulu(req) {
  return caches.match(req).then(hit => hit || fetch(req).then(res => simpan(req, res)));
}
function basiSambilPerbarui(req) {
  return caches.match(req).then(hit => {
    const baru = fetch(req).then(res => simpan(req, res)).catch(() => hit || Response.error());
    return hit || baru;
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin) {
    if (req.mode === 'navigate') { e.respondWith(jaringanDulu(req, 'index.html')); return; }
    if (/\/js\/config\.js$/.test(u.pathname)) { e.respondWith(jaringanDulu(req)); return; }
    if (u.searchParams.has('v')) { e.respondWith(cacheDulu(req)); return; }
    e.respondWith(jaringanDulu(req));
    return;
  }
  if (u.hostname === 'cdn.jsdelivr.net' && /\/pdfjs-dist@[\d.]+\//.test(u.pathname)) { e.respondWith(cacheDulu(req)); return; }
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') { e.respondWith(basiSambilPerbarui(req)); return; }
  // selain itu (API Apps Script, sampul Drive): biarkan browser menangani langsung
});
