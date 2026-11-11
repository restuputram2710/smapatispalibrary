/* ==========================================================================
   PEMBACA ONLINE — PDF (pdf.js) & EPUB (pembaca bawaan, tanpa pustaka)
   Berkas diambil per potongan dari server (akses diperiksa di server),
   disimpan sementara di IndexedDB agar membuka ulang terasa instan.
   ========================================================================== */
(function () {
'use strict';
const { ic, esc, $, $$, fmtN, fmtSize, api, rawCall, beacon, Session, LS } = SP;
const PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/';
const PDFJS = PDFJS_BASE + 'build/pdf.min.mjs';
const PDFJS_WORKER = PDFJS_BASE + 'build/pdf.worker.min.mjs';

/* ---------- IndexedDB: buku yang pernah dibuka (maks. 8 judul / 200 MB, LRU) ---------- */
const IDX_KEY = 'rd_idx';
const IDB = {
  _p: null,
  db() {
    return this._p || (this._p = new Promise((res, rej) => {
      try { const r = indexedDB.open('smapatispa', 1); r.onupgradeneeded = () => r.result.createObjectStore('buku', { keyPath: 'k' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); }
    }).catch(e => { this._p = null; throw e; }));
  },
  touch(k, z) { const idx = LS.get(IDX_KEY, []).filter(x => x.k !== k); idx.unshift({ k, t: Date.now(), z: z || 0 }); LS.set(IDX_KEY, idx.slice(0, 40)); return idx; },
  async get(k) {
    if (!k) return null;
    try {
      const db = await this.db();
      const d = await new Promise(res => { const q = db.transaction('buku').objectStore('buku').get(k); q.onsuccess = () => res(q.result ? q.result.data : null); q.onerror = () => res(null); });
      if (d && d.byteLength) { this.touch(k, d.byteLength); return d; }
      return null;
    } catch (e) { return null; }
  },
  async put(k, data) {
    try {
      const db = await this.db(), st = db.transaction('buku', 'readwrite').objectStore('buku');
      st.put({ k, t: Date.now(), data });
      let tot = 0; const keep = [];
      this.touch(k, data.byteLength).forEach((x, i) => { tot += x.z; if (i === 0 || (i < 8 && tot <= 200 * 1048576)) keep.push(x); else st.delete(x.k); });
      LS.set(IDX_KEY, keep);
    } catch (e) { /* penyimpanan penuh / diblokir — abaikan */ }
  }
};

/* ---------- pdf.js: dimuat sekali, worker dipakai ulang ---------- */
let pdfP = null, pdfWorker = null;
function loadPdfJs() {
  return pdfP || (pdfP = import(PDFJS).then(lib => { lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; return lib; }).catch(e => { pdfP = null; throw e; }));
}
function getWorker(lib) { try { if (!pdfWorker || pdfWorker.destroyed) pdfWorker = new lib.PDFWorker(); } catch (e) { pdfWorker = null; } return pdfWorker; }
/** Panaskan mesin PDF (dipanggil saat detail buku dibuka / tombol Baca disorot) */
function warm() { loadPdfJs().then(getWorker).catch(() => {}); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function b64ToU8(b64) {
  try { const r = await fetch('data:application/octet-stream;base64,' + b64); return new Uint8Array(await r.arrayBuffer()); }
  catch (e) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
}

/* ---------- Pengunduh potongan: paralel, tanpa duplikat, bisa diminta per rentang ---------- */
/* Ukuran potongan menyesuaikan koneksi: 1 MB di jaringan lambat/hemat data (halaman pertama lebih cepat), 2 MB selain itu */
function chunkSize() {
  const c = navigator.connection;
  return c && (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || '') || (c.downlink && c.downlink < 5)) ? 1048576 : 2 * 1048576;
}
function makeLoader(info, CH) {
  const n = Math.max(1, Math.ceil(info.ukuran / CH)), parts = new Array(n), inflight = new Array(n);
  const L = { n, ch: CH, parts, done: 0, onprog: null };
  L.put = (k, u) => { if (!parts[k]) { parts[k] = u; L.done++; if (L.onprog) L.onprog(L.done, n); } };
  L.get = k => {
    if (parts[k]) return Promise.resolve(parts[k]);
    if (inflight[k]) return inflight[k];
    return (inflight[k] = (async () => {
      let r = null;
      for (let t = 0; t < 3; t++) {
        if (L.stop) throw new Error('Dibatalkan');
        r = await rawCall('buku.potong', info.rentang ? { rt: info.rt, a: k * CH, n: CH } : { rt: info.rt, i: k });
        if (r.success || r.code === 'RT') break;
        await sleep(700 * (t + 1));
      }
      inflight[k] = null;
      if (!r || !r.success) throw new Error(r ? r.message : 'Gagal mengunduh');
      const u = await b64ToU8(r.data.data);
      L.put(k, u);
      return u;
    })());
  };
  L.range = async (begin, end) => {
    const k0 = Math.floor(begin / CH), k1 = Math.floor((end - 1) / CH), ks = [];
    for (let k = k0; k <= k1; k++) ks.push(k);
    const bufs = await Promise.all(ks.map(L.get)), out = new Uint8Array(end - begin);
    let off = 0;
    ks.forEach((k, j) => { const p = bufs[j], s0 = Math.max(0, begin - k * CH), e0 = Math.min(p.length, end - k * CH); if (e0 > s0) { out.set(p.subarray(s0, e0), off); off += e0 - s0; } });
    return off === out.length ? out : out.subarray(0, off);
  };
  L.all = async workers => {
    let i = 0;
    const w = async () => { while (i < n && !L.stop) { const k = i++; if (!parts[k]) await L.get(k); } };
    await Promise.all(Array.from({ length: Math.min(workers, n) }, w));
    if (L.stop) throw new Error('Dibatalkan');
    return L.join();
  };
  L.join = () => { const tot = parts.reduce((a, p) => a + p.length, 0), out = new Uint8Array(tot); let off = 0; parts.forEach(p => { out.set(p, off); off += p.length; }); return out.buffer; };
  return L;
}

/* ===================================================================== */
const R = { el: null, st: null };

async function open(id, onClose) {
  close(true);
  const st = R.st = { id, page: 1, total: 0, zoom: LS.get('rd_zoom', 'fit'), double: LS.get('rd_double', false) && innerWidth > 1100,
    theme: LS.get('rd_theme', 'light'), side: innerWidth > 1100 && LS.get('rd_side', true), secs: 0, lastSave: 0, saving: false, dirty: false,
    tasks: [], destroyed: false, onClose, kind: '', toc: [], bm: [] };
  const el = R.el = document.createElement('div');
  el.className = 'reader t-' + st.theme;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Pembaca buku');
  el.innerHTML = '<div class="r-top"><button class="btn-icon" data-x aria-label="Kembali">' + ic('arrowl') + '</button><div class="ttl"><b class="trunc" data-title>Memuat…</b><span class="muted small trunc" data-chap></span></div>' +
    '<div class="r-grp hide-m"><button data-prev aria-label="Halaman sebelumnya">' + ic('left', 'sm') + '</button><span class="mono small muted" style="padding:0 4px" data-pglbl>Hal</span><input data-pg aria-label="Nomor halaman" inputmode="numeric"><span class="mono small muted" data-of>/ –</span><button data-next aria-label="Halaman berikutnya">' + ic('right', 'sm') + '</button></div>' +
    '<div class="r-grp hide-m" data-zoomgrp><button data-zout aria-label="Perkecil">' + ic('zout', 'sm') + '</button><span class="mono small" data-zv style="min-width:44px;text-align:center">Auto</span><button data-zin aria-label="Perbesar">' + ic('zin', 'sm') + '</button><button data-fit aria-label="Sesuaikan dengan lebar layar">Pas lebar</button></div>' +
    '<div class="r-grp hide-m" data-modegrp><button data-mode="1" aria-label="Satu halaman">' + ic('page1', 'sm') + '</button><button data-mode="2" aria-label="Dua halaman">' + ic('page2', 'sm') + '</button></div>' +
    '<div class="r-grp"><button data-th="light" aria-label="Tema terang">' + ic('sun', 'sm') + '</button><button data-th="sepia" aria-label="Tema sepia">' + ic('sepia', 'sm') + '</button><button data-th="dark" aria-label="Tema gelap">' + ic('moon', 'sm') + '</button></div>' +
    '<button class="btn btn-soft btn-sm" data-side>' + ic('list', 'sm') + '<span class="hide-m">Daftar Isi</span></button><button class="btn-icon hide-m" data-fs aria-label="Layar penuh">' + ic('max') + '</button></div>' +
    '<div class="r-bar"><i data-bar style="width:0"></i></div>' +
    '<div class="r-body"><div class="r-stage" data-stage tabindex="0"><div class="r-loading" data-loading><div class="box">' + (window.FX ? FX.mascot({ size: 96, pose: 'read', label: 'Lito sedang membuka buku' }) : '<div class="spin" style="margin:0 auto 12px;width:28px;height:28px;color:var(--c-primary)"></div>') + '<b>Memuat buku…</b><div class="muted small mt8" data-ld>Memeriksa akses</div><div class="progress mt12"><i data-lp style="width:5%"></i></div></div></div></div>' +
    '<span class="r-pageload" data-pl><span class="spin" style="width:12px;height:12px"></span>Memuat halaman…</span>' +
    '<button class="r-nav prev" data-prev aria-label="Sebelumnya">' + ic('left') + '</button><button class="r-nav next" data-next aria-label="Berikutnya">' + ic('right') + '</button>' +
    '<aside class="r-side ' + (st.side ? '' : 'closed') + '"><div class="row between" style="padding:16px 16px 8px"><b style="font-size:17px">' + ic('reader') + ' Navigasi Buku</b><button class="btn-icon sm" data-side aria-label="Tutup panel">' + ic('right', 'sm') + '</button></div>' +
    '<div style="padding:0 12px"><div class="seg full" data-sidetab><button class="on" data-v="toc">Bab</button><button data-v="bm">Penanda <span data-bmn></span></button></div></div><div class="toc" data-toc></div></aside></div>' +
    '<div class="r-bottom"><span class="small muted nowrap hide-m">' + ic('clock', 'sm') + ' Sesi ini: <b data-time>0 menit</b></span><span class="mono small" data-p1>1</span><input type="range" min="1" max="1" value="1" data-slide aria-label="Geser halaman"><span class="mono small" data-pn>1</span>' +
    '<span class="r-dl hide-m" data-dl></span><button class="btn btn-outline btn-sm" data-bm>' + ic('bookmark', 'sm') + '<span class="hide-m">Tandai Halaman</span></button></div>';
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  UI.segInit($('[data-sidetab]', el), v => { st.sideTab = v; renderSide(); });
  bind();
  setTheme(st.theme);
  timer();
  // 1) cek salinan di perangkat, lalu buka (akses diperiksa di server; potongan pertama ikut terkirim)
  const vKey = 'rv_' + id, vLocal = LS.get(vKey, '');
  const cached = vLocal ? await IDB.get(vLocal) : null;
  if (st.destroyed) return;
  const CH = st.ch = chunkSize();
  const r = await rawCall('buku.buka', { id, awal: 1, n0: CH, punya: cached ? vLocal : '' });
  if (st.destroyed) return;
  if (!r.success) { loadingMsg(r.message || 'Buku tidak dapat dibuka.', true); return; }
  const info = st.info = r.data;
  $('[data-title]', el).textContent = info.judul;
  if (info.format === 'LINK') { window.open(info.url, '_blank', 'noopener'); close(); UI.toast('Modul dibuka di tab baru.'); return; }
  if (info.format !== 'EPUB') warm();                       // pdf.js diunduh bersamaan dengan berkas buku
  st.bm = LS.get('bm_' + (Session.me ? Session.me.id : 'tamu') + '_' + id, []);
  // 2) tampilkan secepatnya: dari perangkat, atau progresif (PDF besar), atau unduh penuh (EPUB / berkas kecil)
  try {
    if (cached && info.versi === vLocal) {
      $('[data-ld]', el).textContent = 'Dari penyimpanan perangkat';
      $('[data-lp]', el).style.width = '100%';
      dlState('Tersimpan di perangkat', true);
      if (info.format === 'EPUB') await openEpub(cached); else await openPdf({ data: new Uint8Array(cached.slice(0)) });
    } else {
      const L = st.loader = makeLoader(info, info.rentang ? CH : 3 * 1048576);   // backend lama: potongan tetap 3 MB
      L.onprog = (d, n) => {
        const pc = Math.round(d / n * 100), lp = $('[data-lp]', el), ld = $('[data-ld]', el);
        if (lp) lp.style.width = Math.max(5, pc) + '%';
        if (ld) ld.textContent = 'Mengunduh ' + pc + '% dari ' + fmtSize(info.ukuran);
        if (!$('[data-loading]', el)) dlState(d < n ? 'Mengunduh ' + pc + '%' : 'Tersimpan di perangkat', d >= n);
      };
      if (info.d0) L.put(0, await b64ToU8(info.d0));
      const keep = buf => { IDB.put(info.versi, buf); LS.set(vKey, info.versi); dlState('Tersimpan di perangkat', true); };
      if (info.format !== 'EPUB' && L.n > 1) {
        await openPdfProgressive(L, info);
        L.all(3).then(keep).catch(() => {});                // sisa berkas diunduh di latar belakang
      } else {
        const buf = await L.all(3);
        if (st.destroyed) return;
        keep(buf);
        if (info.format === 'EPUB') await openEpub(buf); else await openPdf({ data: new Uint8Array(buf.slice(0)) });
      }
    }
  } catch (e) {
    if (st.destroyed) return;
    console.error(e); loadingMsg((e && e.message) || 'Berkas tidak dapat ditampilkan.', true); return;
  }
  if (st.destroyed) return;
  $('[data-loading]', el).remove();
  // 3) lanjutkan dari halaman terakhir
  const start = info.hal > 1 && info.hal <= st.total && info.st !== 'SELESAI' ? info.hal : 1;
  await go(start, true);
  if (start > 1) resumeToast(start, info.terakhir);
  $('[data-stage]', el).focus();
}

function dlState(txt, ok) {
  const d = R.el && $('[data-dl]', R.el); if (!d) return;
  d.innerHTML = txt ? (ok ? ic('checkc', 'sm') + ' ' : '') + esc(txt) : '';
  d.style.color = ok ? 'var(--c-accent-ink)' : '';
}
function pageLoading(delta) {
  const st = R.st; if (!st || !R.el) return;
  st.pending = Math.max(0, (st.pending || 0) + delta);
  clearTimeout(st.plT);
  const pl = $('[data-pl]', R.el);
  if (st.pending > 0) st.plT = setTimeout(() => pl && pl.classList.add('on'), 250); else if (pl) pl.classList.remove('on');
}
/* PDF progresif: halaman pertama tampil tanpa menunggu seluruh berkas */
async function openPdfProgressive(L, info) {
  const st = R.st, ld = $('[data-ld]', R.el);
  if (ld) ld.textContent = 'Menyiapkan halaman pertama…';
  const pLast = L.get(L.n - 1).catch(() => null);           // daftar isi PDF biasanya di akhir berkas
  const lib = await loadPdfJs(), first = await L.get(0);
  const tr = new lib.PDFDataRangeTransport(info.ukuran, first.slice());
  tr.requestDataRange = (begin, end) => {
    pageLoading(1);
    L.range(begin, end).then(u => { if (!st.destroyed) tr.onDataRange(begin, u); })
      .catch(e => { if (!st.destroyed) UI.toast('Gagal memuat sebagian buku: ' + e.message, 'err'); })
      .finally(() => pageLoading(-1));
  };
  await pLast;
  await openPdf({ range: tr, rangeChunkSize: L.ch, length: info.ukuran, disableAutoFetch: true, disableStream: true });
}
function loadingMsg(msg, err) {
  const box = $('[data-loading] .box', R.el); if (!box) return;
  box.innerHTML = '<div class="ei" style="margin:0 auto 12px;width:56px;height:56px;border-radius:14px;display:grid;place-items:center;background:var(--c-danger-soft);color:var(--c-danger)">' + ic('alert', 'lg') + '</div><b>' + esc(msg) + '</b><div class="row mt16" style="justify-content:center"><button class="btn btn-outline" data-x2>Kembali</button>' + (err ? '<button class="btn btn-primary" data-retry>' + ic('refresh', 'sm') + 'Coba lagi</button>' : '') + '</div>';
  $('[data-x2]', box).onclick = () => close();
  const rb = $('[data-retry]', box); if (rb) rb.onclick = () => open(R.st.id, R.st.onClose);
}

/* ---------- PDF ---------- */
async function openPdf(src) {
  const st = R.st;
  const ld = $('[data-ld]', R.el); if (ld && !/halaman pertama/.test(ld.textContent)) ld.textContent = 'Menyiapkan halaman…';
  const lib = await loadPdfJs();
  st.kind = 'pdf'; st.pc = new Map();
  st.pdf = await lib.getDocument(Object.assign({ worker: getWorker(lib) || undefined, isEvalSupported: false,
    standardFontDataUrl: PDFJS_BASE + 'standard_fonts/', cMapUrl: PDFJS_BASE + 'cmaps/', cMapPacked: true }, src)).promise;
  if (st.destroyed) return;
  st.total = st.pdf.numPages;
  try {
    const outline = await st.pdf.getOutline();
    if (outline && outline.length) {
      const flat = [];
      const walk = async (items, lvl) => { for (const it of items) { flat.push({ title: it.title, lvl, dest: it.dest }); if (it.items && it.items.length && lvl < 2) await walk(it.items, lvl + 1); } };
      await walk(outline, 1);
      for (const t of flat) {
        try { let d = t.dest; if (typeof d === 'string') d = await st.pdf.getDestination(d); if (d && d[0]) t.page = (await st.pdf.getPageIndex(d[0])) + 1; } catch (e) { /* */ }
      }
      st.toc = flat.filter(t => t.page);
    }
  } catch (e) { st.toc = []; }
  if (!st.toc.length) { const n = st.total, step = Math.max(1, Math.ceil(n / 12)); for (let p = 1; p <= n; p += step) st.toc.push({ title: 'Halaman ' + p, lvl: 1, page: p }); }
  prepNav();
}
function pdfBox() {
  const st = R.st, stage = $('[data-stage]', R.el), cnt = st.double && st.page + 1 <= st.total ? 2 : 1;
  return { cnt, dpr: Math.min(window.devicePixelRatio || 1, 2), w: stage.clientWidth - (innerWidth > 1023 ? 140 : 16), h: stage.clientHeight - 56 };
}
/* Gambar satu halaman ke kanvas (disimpan di cache kecil agar bolak-balik halaman instan) */
async function pageCanvas(n, box, visible) {
  const st = R.st, key = n + '|' + box.cnt + '|' + box.w + '|' + box.h + '|' + st.zoom + '|' + box.dpr;
  const hit = st.pc.get(key);
  if (hit) { st.pc.delete(key); st.pc.set(key, hit); return hit; }
  st.pcw = st.pcw || new Map();
  if (st.pcw.has(key)) return st.pcw.get(key);              // sedang disiapkan di latar belakang
  const job = drawCanvas(n, box, visible, key);
  st.pcw.set(key, job);
  try { return await job; } finally { st.pcw.delete(key); }
}
async function drawCanvas(n, box, visible, key) {
  const st = R.st, page = await st.pdf.getPage(n), v1 = page.getViewport({ scale: 1 });
  let scale = st.zoom === 'fit' ? Math.min(box.w / box.cnt / v1.width, (innerWidth > 1023 ? Math.max(box.h, 500) : 9e9) / v1.height) : st.zoom;
  scale = Math.max(.3, scale);
  const vp = page.getViewport({ scale: scale * box.dpr }), c = document.createElement('canvas');
  c.width = Math.floor(vp.width); c.height = Math.floor(vp.height); c.style.width = Math.floor(vp.width / box.dpr) + 'px'; c.style.height = Math.floor(vp.height / box.dpr) + 'px';
  c.setAttribute('aria-label', 'Halaman ' + n); c._scale = scale;
  const task = page.render({ canvasContext: c.getContext('2d', { alpha: false }), viewport: vp, canvas: c });
  if (visible) st.tasks.push(task);
  await task.promise;                                       // dibatalkan → melempar galat
  st.pc.set(key, c);
  while (st.pc.size > 6) st.pc.delete(st.pc.keys().next().value);
  return c;
}
async function renderPdf() {
  const st = R.st, stage = $('[data-stage]', R.el);
  st.tasks.forEach(t => { try { t.cancel(); } catch (e) { /* */ } }); st.tasks = [];
  const box = pdfBox(), pages = [st.page]; if (box.cnt === 2) pages.push(st.page + 1);
  let wrap = $('.r-pages', stage);
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'r-pages'; stage.appendChild(wrap); }
  const want = st.page;
  let canvases;
  try { canvases = await Promise.all(pages.map(n => pageCanvas(n, box, true))); }
  catch (e) { return; }                                     // dibatalkan oleh pindah halaman
  if (st.destroyed || want !== st.page) return;
  st.scaleNow = canvases[0]._scale;
  wrap.replaceChildren.apply(wrap, canvases);
  $('[data-zv]', R.el).textContent = st.zoom === 'fit' ? 'Auto' : Math.round(st.zoom * 100) + '%';
  // siapkan halaman berikutnya di latar belakang
  const nx = st.page + box.cnt;
  clearTimeout(st.preT);
  st.preT = setTimeout(() => { if (!st.destroyed && nx <= st.total) for (let k = 0; k < box.cnt && nx + k <= st.total; k++) pageCanvas(nx + k, box, false).catch(() => {}); }, 180);
}

/* ---------- EPUB (bab = halaman) ---------- */
async function openEpub(buf) {
  const st = R.st;
  $('[data-ld]', R.el).textContent = 'Membuka EPUB…';
  const z = await Zip.read(buf), P = new DOMParser();
  const cont = P.parseFromString(await z.text('META-INF/container.xml'), 'application/xml');
  const opfPath = cont.querySelector('rootfile').getAttribute('full-path'), base = opfPath.replace(/[^/]*$/, '');
  const opf = P.parseFromString(await z.text(opfPath), 'application/xml');
  const man = {}; opf.querySelectorAll('manifest > item').forEach(it => { man[it.getAttribute('id')] = { href: base + it.getAttribute('href'), type: it.getAttribute('media-type') }; });
  st.spine = Array.from(opf.querySelectorAll('spine > itemref')).map(r => man[r.getAttribute('idref')]).filter(Boolean).map(m => m.href);
  st.zip = z; st.kind = 'epub'; st.total = st.spine.length; $('[data-pglbl]', R.el).textContent = 'Bab';
  st.toc = [];
  const ncxItem = Object.values(man).find(m => m.type === 'application/x-dtbncx+xml');
  if (ncxItem) {
    const ncx = P.parseFromString(await z.text(ncxItem.href), 'application/xml'), nb = ncxItem.href.replace(/[^/]*$/, '');
    ncx.querySelectorAll('navPoint').forEach(np => {
      const src = (nb + np.querySelector('content').getAttribute('src')).split('#')[0], i = st.spine.indexOf(normPath(src));
      if (i > -1) st.toc.push({ title: np.querySelector('navLabel').textContent.trim(), lvl: np.parentElement.tagName === 'navPoint' ? 2 : 1, page: i + 1 });
    });
  }
  if (!st.toc.length) st.spine.forEach((s, i) => st.toc.push({ title: 'Bagian ' + (i + 1), lvl: 1, page: i + 1 }));
  $('[data-zoomgrp]', R.el).querySelector('[data-fit]').textContent = 'A';
  $('[data-modegrp]', R.el).style.display = 'none';
  st.zoom = typeof st.zoom === 'number' ? st.zoom : 1;
  prepNav();
}
function normPath(p) { const out = []; p.split('/').forEach(s => { if (s === '..') out.pop(); else if (s && s !== '.') out.push(s); }); return out.join('/'); }
async function renderEpub() {
  const st = R.st, stage = $('[data-stage]', R.el), href = st.spine[st.page - 1], dir = href.replace(/[^/]*$/, '');
  let html = await st.zip.text(href);
  const doc = new DOMParser().parseFromString(html, 'application/xhtml+xml').documentElement.tagName === 'parsererror' ? new DOMParser().parseFromString(html, 'text/html') : new DOMParser().parseFromString(html, 'application/xhtml+xml');
  doc.querySelectorAll('script, iframe, object, embed').forEach(n => n.remove());
  doc.querySelectorAll('*').forEach(n => Array.from(n.attributes).forEach(a => { if (/^on/i.test(a.name)) n.removeAttribute(a.name); }));
  for (const img of Array.from(doc.querySelectorAll('img, image'))) {
    const attr = img.hasAttribute('src') ? 'src' : (img.getAttribute('xlink:href') !== null ? 'xlink:href' : 'href');
    const src = img.getAttribute(attr); if (!src || /^data:/.test(src)) continue;
    const d = await st.zip.data(normPath(dir + src));
    if (d) img.setAttribute(attr, 'data:' + (/\.png$/i.test(src) ? 'image/png' : /\.svg$/i.test(src) ? 'image/svg+xml' : /\.gif$/i.test(src) ? 'image/gif' : 'image/jpeg') + ';base64,' + UI.bufB64(d));
  }
  let css = '';
  for (const l of Array.from(doc.querySelectorAll('link[rel~="stylesheet"]'))) { const t = await st.zip.text(normPath(dir + l.getAttribute('href'))); if (t) css += t.replace(/@import[^;]+;/g, ''); l.remove(); }
  const dark = st.theme === 'dark', sepia = st.theme === 'sepia';
  const body = doc.body ? doc.body.innerHTML : doc.documentElement.innerHTML;
  const page = '<!doctype html><html><head><meta charset="utf-8"><style>' + css + '</style><style>html{font-size:' + Math.round(17 * (st.zoom || 1)) + 'px}body{margin:0;padding:40px 48px;font-family:Georgia,"Times New Roman",serif;line-height:1.75;' +
    'color:' + (dark ? '#E9E5F1' : sepia ? '#3B2F1E' : '#1E1A29') + ';background:' + (dark ? '#1E1A29' : sepia ? '#F6EEDD' : '#fff') + ';word-wrap:break-word}img,svg{max-width:100%;height:auto}a{color:inherit}@media(max-width:600px){body{padding:24px 18px}}</style></head><body>' + body + '</body></html>';
  let fr = $('iframe', stage);
  if (!fr) { fr = document.createElement('iframe'); fr.className = 'epub-frame'; fr.setAttribute('sandbox', 'allow-same-origin'); fr.title = 'Isi buku'; stage.appendChild(fr); }
  fr.srcdoc = page;
  fr.onload = () => { try { fr.style.height = Math.max(stage.clientHeight - 56, fr.contentDocument.documentElement.scrollHeight + 8) + 'px'; } catch (e) { /* */ } };
  stage.scrollTop = 0;
  $('[data-zv]', R.el).textContent = Math.round((st.zoom || 1) * 100) + '%';
}

/* ---------- Navigasi umum ---------- */
function prepNav() {
  const st = R.st, s = $('[data-slide]', R.el);
  s.max = st.total; $('[data-pn]', R.el).textContent = st.total; $('[data-of]', R.el).textContent = '/ ' + st.total;
  renderSide();
}
async function go(n, silent) {
  const st = R.st; if (!st || !st.total) return;
  const step = st.double && st.kind === 'pdf' ? 2 : 1;
  n = Math.max(1, Math.min(st.total, Math.floor(n) || 1));
  if (st.double && st.kind === 'pdf' && n > 1 && n % 2 === 1 && false) n--; // ruang untuk sampul ganda (dinonaktifkan)
  const changed = n !== st.page; st.page = n;
  $('[data-pg]', R.el).value = n; $('[data-slide]', R.el).value = n; $('[data-p1]', R.el).textContent = n;
  const last = Math.min(st.total, n + step - 1);
  $('[data-bar]', R.el).style.width = Math.round(last / st.total * 100) + '%';
  const cur = st.toc.filter(t => t.page <= n).pop();
  $('[data-chap]', R.el).textContent = cur ? cur.title : '';
  $$('[data-toc] a', R.el).forEach(a => a.classList.toggle('on', cur && Number(a.dataset.p) === cur.page && a.textContent.indexOf(cur.title) > -1));
  if (st.kind === 'pdf') await renderPdf(); else await renderEpub();
  if (!silent && changed) { st.dirty = true; saveSoon(); if (last >= st.total) { save(true); UI.toast('Selamat! Anda telah menyelesaikan buku ini.'); if (window.FX) FX.confetti(); } }
  updateBmBtn();
}
function next() { const st = R.st; go(st.page + (st.double && st.kind === 'pdf' ? 2 : 1)); }
function prev() { const st = R.st; go(st.page - (st.double && st.kind === 'pdf' ? 2 : 1)); }
function renderSide() {
  const st = R.st, box = $('[data-toc]', R.el); if (!box) return;
  $('[data-bmn]', R.el).textContent = st.bm.length ? '(' + st.bm.length + ')' : '';
  if (st.sideTab === 'bm') {
    box.innerHTML = st.bm.length ? st.bm.slice().sort((a, b) => a - b).map(p => '<a href="#" data-p="' + p + '"><span>' + ic('bookmark', 'sm') + ' Halaman ' + p + '</span><span class="p">' + Math.round(p / (st.total || 1) * 100) + '%</span></a>').join('')
      : '<div class="empty" style="padding:28px 8px">' + ic('bookmark', 'lg') + '<p class="mt8">Belum ada penanda. Tekan <b>Tandai Halaman</b> untuk menyimpan halaman penting.</p></div>';
  } else {
    box.innerHTML = '<div class="inp-wrap" style="margin:8px 0 10px">' + ic('search', 'sm') + '<input class="inp" placeholder="Cari bab…" data-tocq></div>' +
      st.toc.map(t => '<a href="#" data-p="' + t.page + '" class="' + (t.lvl > 1 ? 'lvl2' : '') + '"><span>' + esc(t.title) + '</span><span class="p">' + (st.kind === 'pdf' ? 'Hal ' + t.page : '') + '</span></a>').join('');
    const q = $('[data-tocq]', box);
    q.addEventListener('input', () => { const v = q.value.toLowerCase(); $$('a', box).forEach(a => { a.style.display = a.textContent.toLowerCase().indexOf(v) > -1 ? '' : 'none'; }); });
  }
  $$('a[data-p]', box).forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(Number(a.dataset.p)); if (innerWidth <= 1100) toggleSide(false); }));
}
function toggleSide(v) { const st = R.st; st.side = v === undefined ? !st.side : v; LS.set('rd_side', st.side); $('.r-side', R.el).classList.toggle('closed', !st.side); if (st.kind === 'pdf' && st.zoom === 'fit') setTimeout(() => renderPdf(), 320); }
function setTheme(t) {
  const st = R.st; st.theme = t; LS.set('rd_theme', t);
  R.el.className = 'reader t-' + t;
  $$('[data-th]', R.el).forEach(b => b.classList.toggle('on', b.dataset.th === t));
  if (st.kind === 'epub') renderEpub();
}
function updateBmBtn() { const st = R.st, b = $('[data-bm]', R.el); if (b) b.classList.toggle('btn-soft', st.bm.indexOf(st.page) > -1); }
function resumeToast(p, t) {
  const box = document.createElement('div'); box.className = 'r-toast';
  box.innerHTML = '<span style="width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--c-accent-soft);color:var(--c-accent-ink)">' + ic('history') + '</span><div><b>Melanjutkan dari halaman ' + p + '</b><div class="muted small">' + (t ? 'Terakhir dibaca ' + SP.fmtRel(t) : '') + '</div></div>' +
    '<button class="btn btn-outline btn-sm" data-restart>Mulai dari awal</button><button class="btn-icon sm" data-cls aria-label="Tutup">' + ic('x', 'sm') + '</button>';
  $('.r-body', R.el).appendChild(box);
  $('[data-restart]', box).onclick = () => { box.remove(); go(1); };
  $('[data-cls]', box).onclick = () => box.remove();
  setTimeout(() => box.remove(), 9000);
}

/* ---------- Simpan progres ---------- */
let saveTimer = null;
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(() => save(), Math.max(1500, 20000 - (Date.now() - R.st.lastSave))); }
async function save(force) {
  const st = R.st; if (!st || !Session.me || !st.total || (!st.dirty && !force)) return;
  if (st.saving) return;
  const secs = st.secs; st.secs = 0; st.dirty = false; st.saving = true; st.lastSave = Date.now();
  const last = Math.min(st.total, st.page + (st.double && st.kind === 'pdf' ? 1 : 0));
  const r = await rawCall('progres.simpan', { id: st.id, hal: last, total: st.total, detik: secs });
  st.saving = false;
  if (!r.success) { st.secs += secs; st.dirty = true; } else { SP.cacheDrop('rak'); SP.cacheDrop('boot'); SP.cacheDrop('bd_' + st.id); }
}
function saveBeacon() {
  const st = R.st; if (!st || !Session.me || !st.total) return;
  if (!st.dirty && st.secs < 20) return;
  const last = Math.min(st.total, st.page + (st.double && st.kind === 'pdf' ? 1 : 0));
  beacon('progres.simpan', { id: st.id, hal: last, total: st.total, detik: st.secs });
  st.secs = 0; st.dirty = false;
}
function timer() {
  const st = R.st;
  st.tick = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    st.secs++; st.totalSecs = (st.totalSecs || 0) + 1;
    if (st.totalSecs % 30 === 0) { const m = Math.floor(st.totalSecs / 60); const t = $('[data-time]', R.el); if (t) t.textContent = m + ' menit'; }
    if (st.secs >= 180 && st.total) { st.dirty = true; save(); }
  }, 1000);
}

/* ---------- Event ---------- */
function bind() {
  const el = R.el, st = R.st;
  $$('[data-x]', el).forEach(b => b.onclick = () => close());
  $$('[data-next]', el).forEach(b => b.onclick = next);
  $$('[data-prev]', el).forEach(b => b.onclick = prev);
  $('[data-pg]', el).addEventListener('change', e => go(Number(e.target.value)));
  const sl = $('[data-slide]', el);
  sl.addEventListener('input', () => { $('[data-p1]', el).textContent = sl.value; });
  sl.addEventListener('change', () => go(Number(sl.value)));
  $('[data-zin]', el).onclick = () => { st.zoom = Math.min(3, (st.zoom === 'fit' ? (st.scaleNow || 1) : st.zoom) + .2); LS.set('rd_zoom', st.zoom); st.kind === 'epub' ? renderEpub() : renderPdf(); };
  $('[data-zout]', el).onclick = () => { st.zoom = Math.max(.5, (st.zoom === 'fit' ? (st.scaleNow || 1) : st.zoom) - .2); LS.set('rd_zoom', st.zoom); st.kind === 'epub' ? renderEpub() : renderPdf(); };
  $('[data-fit]', el).onclick = () => { st.zoom = st.kind === 'epub' ? 1 : 'fit'; LS.set('rd_zoom', st.zoom); st.kind === 'epub' ? renderEpub() : renderPdf(); };
  $$('[data-mode]', el).forEach(b => { b.classList.toggle('on', (b.dataset.mode === '2') === st.double); b.onclick = () => { st.double = b.dataset.mode === '2'; LS.set('rd_double', st.double); $$('[data-mode]', el).forEach(x => x.classList.toggle('on', x === b)); go(st.page, true); }; });
  $$('[data-th]', el).forEach(b => b.onclick = () => setTheme(b.dataset.th));
  $$('[data-side]', el).forEach(b => b.onclick = () => toggleSide());
  $('[data-fs]', el).onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen && el.requestFullscreen().catch(() => {}); };
  $('[data-bm]', el).onclick = () => {
    const i = st.bm.indexOf(st.page);
    if (i > -1) st.bm.splice(i, 1); else st.bm.push(st.page);
    LS.set('bm_' + (Session.me ? Session.me.id : 'tamu') + '_' + st.id, st.bm);
    UI.toast(i > -1 ? 'Penanda dihapus.' : 'Halaman ' + st.page + ' ditandai.');
    updateBmBtn(); renderSide();
  };
  R.onKey = e => {
    if (!R.el || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Escape' && !document.fullscreenElement) close();
    else if (e.key === '+' || e.key === '=') $('[data-zin]', el).click();
    else if (e.key === '-') $('[data-zout]', el).click();
  };
  document.addEventListener('keydown', R.onKey);
  let tx = 0, ty = 0;
  const stage = $('[data-stage]', el);
  stage.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; if (Math.abs(dx) > 60 && Math.abs(dy) < 50 && (st.zoom === 'fit' || st.kind === 'epub')) dx < 0 ? next() : prev(); }, { passive: true });
  R.onHide = () => { if (document.visibilityState === 'hidden') saveBeacon(); };
  R.onPageHide = () => saveBeacon();
  document.addEventListener('visibilitychange', R.onHide);
  window.addEventListener('pagehide', R.onPageHide);
  R.onResize = SP.debounce(() => { if (st.kind === 'pdf' && st.zoom === 'fit') renderPdf(); }, 200);
  window.addEventListener('resize', R.onResize);
}
function close(silent) {
  const st = R.st; if (!R.el) return;
  if (st) { st.destroyed = true; if (st.loader) st.loader.stop = true; if (st.pc) st.pc.clear(); clearTimeout(st.preT); clearInterval(st.tick); clearTimeout(saveTimer); if (st.dirty || st.secs > 20) { st.dirty = true; save(true); } if (st.pdf) { try { st.pdf.destroy(); } catch (e) { /* */ } } }
  document.removeEventListener('keydown', R.onKey);
  document.removeEventListener('visibilitychange', R.onHide);
  window.removeEventListener('pagehide', R.onPageHide);
  window.removeEventListener('resize', R.onResize);
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  R.el.remove(); R.el = null;
  document.body.style.overflow = '';
  const cb = st && st.onClose; R.st = null;
  if (!silent && cb) cb();
}
/* Panaskan pdf.js saat pengguna mengarah ke tombol baca */
document.addEventListener('pointerover', e => { const a = e.target instanceof Element && e.target.closest('a[href^="#/baca/"]'); if (a) warm(); }, { passive: true });
window.Reader = { open, close, warm, chunkSize, isOpen: () => !!R.el };
})();
