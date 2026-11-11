/* ==========================================================================
   KOMPONEN UI: notifikasi, modal, laci, sampul, kartu buku, paginasi, dll.
   ========================================================================== */
(function () {
'use strict';
const { ic, esc, $, $$, fmtN, fmtRel, hashStr, avColor, initials } = SP;

/* ---------- Toast ---------- */
function toast(msg, type) {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'ok');
  el.innerHTML = ic(type === 'err' ? 'alert' : type === 'warn' ? 'info' : 'checkc') + '<div>' + esc(msg) + '</div>';
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 220); }, type === 'err' ? 5200 : 3200);
}
const toastRes = (r, okMsg) => { if (r && r.success) toast(okMsg || r.message || 'Berhasil.'); else toast((r && r.message) || 'Terjadi kesalahan.', 'err'); return r && r.success; };

/* ---------- Modal & laci ---------- */
let openCount = 0;
function overlay(cls, inner, onClose) {
  const o = document.createElement('div');
  o.className = 'overlay ' + (cls || '');
  o.innerHTML = inner;
  document.body.appendChild(o);
  openCount++; document.body.style.overflow = 'hidden';
  const prevFocus = document.activeElement;
  const close = () => {
    if (!o.isConnected) return;
    o.remove(); openCount--; if (!openCount) document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    if (onClose) onClose();
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  o.addEventListener('mousedown', e => { if (e.target === o) close(); });
  $$('[data-close]', o).forEach(b => b.addEventListener('click', close));
  setTimeout(() => { const f = $('[autofocus], input:not([type=hidden]), select, textarea, button.btn-primary, button.btn-accent', o); if (f) f.focus(); }, 60);
  return { el: o, close };
}
function modal(o) {
  return overlay('', '<div class="modal ' + (o.wide ? 'wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '">' +
    '<div class="modal-h"><div><h3>' + esc(o.title) + '</h3>' + (o.sub ? '<div class="muted small mt8">' + o.sub + '</div>' : '') + '</div><button class="btn-icon sm" data-close aria-label="Tutup">' + ic('x') + '</button></div>' +
    '<div class="modal-b">' + (o.body || '') + '</div>' + (o.foot ? '<div class="modal-f">' + o.foot + '</div>' : '') + '</div>', o.onClose);
}
function drawer(o) {
  return overlay('drawer-o', '<aside class="drawer" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '">' +
    '<div class="drawer-h"><div><h3>' + esc(o.title) + '</h3>' + (o.sub ? '<div class="muted small mt8">' + o.sub + '</div>' : '') + '</div><button class="btn-icon sm" data-close aria-label="Tutup">' + ic('x') + '</button></div>' +
    '<div class="drawer-b">' + (o.body || '') + '</div>' + (o.foot ? '<div class="drawer-f">' + o.foot + '</div>' : '') + '</aside>', o.onClose);
}
function confirmDlg(msg, o) {
  o = o || {};
  return new Promise(res => {
    let done = false;
    const m = modal({ title: o.title || 'Konfirmasi', body: '<p style="font-size:15px">' + msg + '</p>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + esc(o.ok || 'Ya, lanjutkan') + '</button>',
      onClose: () => { if (!done) res(false); } });
    $('[data-ok]', m.el).addEventListener('click', () => { done = true; m.close(); res(true); });
  });
}
function btnBusy(btn, on, label) {
  if (!btn) return;
  if (on) { btn._html = btn.innerHTML; btn.classList.add('is-loading'); btn.innerHTML = '<span class="spin"></span>' + (label ? ' ' + esc(label) : ''); }
  else { btn.classList.remove('is-loading'); if (btn._html) btn.innerHTML = btn._html; }
}

/* ---------- Sampul ---------- */
const COVER_COLORS = ['#6B3FA0', '#2F6B10', '#2F7D9A', '#8A4B12', '#A83C5E', '#3D4FB8', '#0E6E5B', '#7A3EB1', '#5B5F1E', '#1F4E79'];
function genCover(b, fs) {
  const c = b.mapelWarna || b.katWarna || COVER_COLORS[hashStr(b.id || b.judul) % COVER_COLORS.length];
  return '<div class="gen-cover" style="--cv:' + esc(c) + ';--gfs:' + (fs || 15) + 'px" aria-hidden="true"><div class="gk">' + esc(b.mapelNama || b.katNama || 'Perpustakaan') + '</div>' +
    '<div class="gt">' + esc(b.judul) + '</div><div class="ga">' + esc(b.penulis || '') + '</div></div>';
}
function cover(b, fs) {
  const g = genCover(b, fs);
  if (!b.cover) return '<div class="cover">' + g + '</div>';
  return '<div class="cover">' + g + '<img src="' + esc(b.cover) + '" alt="Sampul ' + esc(b.judul) + '" loading="lazy" style="position:relative" onerror="this.remove()"></div>';
}
const AKSES_LABEL = { PUBLIK: 'Publik', TERDAFTAR: 'Pengguna Terdaftar', SEKOLAH: 'Khusus Warga Sekolah', TERBATAS: 'Akses Terbatas' };
function accessBadge(a, short) {
  const lbl = short ? { PUBLIK: 'Publik', TERDAFTAR: 'Terdaftar', SEKOLAH: 'Khusus Sekolah', TERBATAS: 'Terbatas' }[a] : AKSES_LABEL[a];
  if (a === 'TERBATAS') return '<span class="badge b-red">' + ic('lock', 'sm') + esc(lbl) + '</span>';
  if (a === 'SEKOLAH') return '<span class="badge b-white"><span class="dot" style="color:var(--c-accent)"></span>' + esc(lbl) + '</span>';
  if (a === 'TERDAFTAR') return '<span class="badge b-white"><span class="dot" style="color:var(--c-primary)"></span>' + esc(lbl) + '</span>';
  return '<span class="badge b-white"><span class="dot" style="color:var(--c-accent)"></span>' + esc(lbl || 'Publik') + '</span>';
}
function formatTag(f) { return '<span class="badge b-dark b-mono">' + (f === 'LINK' ? 'WEB LINK' : esc(f || 'PDF')) + '</span>'; }
function readState(b) {
  if (b.st === 'SELESAI') return '<span class="badge b-gray">' + ic('check', 'sm') + 'Selesai</span>';
  if (b.st === 'BACA') return '<span class="badge b-purple">Sedang Dibaca ' + (b.prog || 0) + '%</span>';
  if (!b.baca) return '<span class="badge b-amber">' + ic('lock', 'sm') + (b.alasan === 'MASUK' ? 'Perlu Masuk' : 'Khusus Sekolah') + '</span>';
  return '<span class="badge b-green">Tersedia</span>';
}
function readBtn(b, cls) {
  cls = cls || '';
  if (!b.baca) return SP.Session.me ? '<button class="btn btn-outline ' + cls + '" disabled>' + ic('lock', 'sm') + 'Khusus warga sekolah</button>'
    : '<a class="btn btn-outline ' + cls + '" href="#/masuk?next=' + encodeURIComponent('/buku/' + b.id) + '">' + ic('lock', 'sm') + 'Masuk untuk membaca</a>';
  if (!b.ada) return '<button class="btn btn-outline ' + cls + '" disabled>Berkas belum tersedia</button>';
  if (b.format === 'LINK') return '<button class="btn btn-accent ' + cls + '" data-read="' + esc(b.id) + '">' + ic('external', 'sm') + 'Buka Modul</button>';
  if (b.st === 'BACA') return '<a class="btn btn-primary ' + cls + '" href="#/baca/' + esc(b.id) + '">' + ic('right', 'sm') + 'Lanjutkan</a>';
  return '<a class="btn btn-accent ' + cls + '" href="#/baca/' + esc(b.id) + '">' + ic('open', 'sm') + 'Baca Sekarang</a>';
}
function favBtn(b) {
  if (!SP.Session.me) return '';
  return '<button class="fav-btn ' + (b.fav ? 'on' : '') + '" data-fav="' + esc(b.id) + '" aria-pressed="' + !!b.fav + '" aria-label="' + (b.fav ? 'Hapus dari favorit' : 'Tambah ke favorit') + '">' + ic('heart', 'sm') + '</button>';
}

/* ---------- Kartu buku (katalog) ---------- */
function bookCard(b, i) {
  const tag = b.jenis === 'PELAJARAN' && b.mapelNama ? b.mapelNama.split(' ')[0] : (b.katNama || '').split(' ')[0];
  return '<article class="bcard" style="animation:pageIn .35s ' + Math.min((i || 0) * 30, 300) + 'ms both">' +
    '<div class="cv-wrap"><a href="#/buku/' + esc(b.id) + '" aria-label="' + esc(b.judul) + '">' + cover(b, 17) + '</a>' +
    (tag ? '<div class="tl"><span class="tag" style="background:' + esc(b.mapelWarna || b.katWarna || 'var(--c-primary)') + '">' + esc(tag) + '</span></div>' : '') +
    '<div class="tr">' + accessBadge(b.akses, true) + '</div><div class="bl">' + formatTag(b.format) + '</div><div class="br">' + favBtn(b) + '</div></div>' +
    '<div class="body"><div class="meta1">' + readState(b) + '<span class="readers" title="Pembaca">' + ic('eye', 'sm') + fmtN(b.pembaca) + '</span></div>' +
    '<a class="ttl clamp2" href="#/buku/' + esc(b.id) + '">' + esc(b.judul) + '</a><div class="au trunc">' + esc(b.penulis || '—') + '</div>' +
    '<div class="pub"><span class="trunc">' + esc(b.jenis === 'PELAJARAN' ? (b.tipe || 'Pelajaran') + (b.tingkat && b.tingkat.length ? ' · ' + b.tingkat.join('/') : '') : (b.penerbit || '')) + '</span><span>' + esc(b.tahun || '') + '</span></div></div>' +
    '<div class="acts">' + readBtn(b, 'btn-sm') + '<a class="btn-icon sm btn" href="#/buku/' + esc(b.id) + '" aria-label="Detail buku">' + ic('info', 'sm') + '</a></div></article>';
}
/* ---------- Kartu kecil (rak horizontal) ---------- */
function miniCard(b, i) {
  const locked = !b.baca;
  return '<a class="mini" href="#/buku/' + esc(b.id) + '" style="animation:pageIn .35s ' + Math.min((i || 0) * 40, 320) + 'ms both">' +
    '<div style="position:relative">' + cover(b, 14) + (locked ? '<div class="lock-over">' + ic('lock') + '<span>' + (b.alasan === 'MASUK' ? 'Masuk' : 'Akses') + '</span><b>' + (b.alasan === 'MASUK' ? 'NISN' : 'Terbatas') + '</b></div>' : '') + '</div>' +
    (b.st === 'BACA' ? '<span class="badge b-purple">' + b.prog + '%</span>' : b.akses === 'SEKOLAH' && !locked ? '<span class="badge b-purple">Warga Sekolah</span>' : !locked ? '<span class="badge b-green">Tersedia</span>' : '') +
    '<div class="ttl trunc">' + esc(b.judul) + '</div><div class="au trunc">' + esc(b.penulis || '—') + '</div>' +
    '<div class="row"><span class="readers">' + SP.ic('eye', 'sm') + fmtN(b.pembaca) + '</span><span class="trunc">' + esc(b.mapelNama || b.katNama || '') + '</span></div></a>';
}
/* ---------- Kartu horizontal (rekomendasi / baru) ---------- */
function hCard(b) {
  return '<a class="hcard" href="#/buku/' + esc(b.id) + '"><div>' + cover(b, 10) + '</div><div class="stack" style="gap:4px;min-width:0">' +
    '<div class="row wrap">' + formatTag(b.format) + (b.guruNama ? '<span class="badge b-purple">' + esc(b.guruNama) + '</span>' : '') + '</div>' +
    '<div style="font-weight:700;font-size:15px" class="clamp2">' + esc(b.judul) + '</div><div class="muted small trunc">' + esc(b.penulis || b.penerbit || '') + '</div>' +
    '<div class="mono xs" style="color:var(--c-primary-ink);margin-top:auto">' + (b.baca ? 'Tersedia Digital' : 'Perlu Masuk') + '</div></div></a>';
}
function authorItem(a) {
  return '<a class="author" href="#/katalog?penulis=' + esc(a.id) + '"><div class="av" style="background:' + avColor(a.nama) + '">' +
    (a.foto ? '<img src="' + esc(a.foto) + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover" onerror="this.remove()">' : esc(initials(a.nama))) +
    '</div><div class="nm clamp2">' + esc(a.nama) + '</div><div class="mono xs muted">' + fmtN(a.karya) + ' Karya</div></a>';
}
function avatar(u, cls) {
  return '<span class="avatar ' + (cls || '') + '" style="background:' + avColor(u && u.nama) + '">' +
    (u && u.foto ? '<img src="' + esc(u.foto) + '" alt="" onerror="this.remove()">' : '') + '<span style="position:absolute">' + (u && u.foto ? '' : esc(initials(u && u.nama))) + '</span></span>';
}

/* ---------- Kerangka & kosong ---------- */
function skCards(n) {
  let s = '<div class="book-grid">';
  for (let i = 0; i < (n || 8); i++) s += '<div class="bcard"><div class="cv-wrap"><div class="sk" style="aspect-ratio:2/3"></div></div><div class="body"><div class="sk sk-line" style="width:40%"></div><div class="sk sk-title"></div><div class="sk sk-line" style="width:60%"></div></div></div>';
  return s + '</div>';
}
function skRows(n) { let s = '<div class="panel">'; for (let i = 0; i < (n || 6); i++) s += '<div class="row" style="padding:10px 0"><div class="sk" style="width:40px;height:56px"></div><div class="grow"><div class="sk sk-title"></div><div class="sk sk-line" style="width:40%"></div></div></div>'; return s + '</div>'; }
function skBlock(h) { return '<div class="sk" style="height:' + (h || 120) + 'px;border-radius:8px"></div>'; }
function empty(icon, title, text, action) {
  return '<div class="empty"><div class="ei">' + ic(icon || 'book', 'xl') + '</div><h3>' + esc(title) + '</h3>' + (text ? '<p>' + text + '</p>' : '') + (action ? '<div class="mt16">' + action + '</div>' : '') + '</div>';
}
function errorBox(msg, retryAttr) {
  return '<div class="alert red">' + ic('alert') + '<div class="grow">' + esc(msg || 'Gagal memuat data.') + '</div>' + (retryAttr ? '<button class="btn btn-sm btn-outline" ' + retryAttr + '>' + ic('refresh', 'sm') + 'Coba lagi</button>' : '') + '</div>';
}

/* ---------- Paginasi ---------- */
function pager(o) {
  const hal = o.hal, n = o.halaman;
  if (!o.total) return '';
  const nums = [];
  for (let i = 1; i <= n; i++) if (i === 1 || i === n || Math.abs(i - hal) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
  const from = (hal - 1) * o.per + 1, to = Math.min(o.total, hal * o.per);
  return '<div class="pager"><div class="muted small">' + ic('list', 'sm') + ' Menampilkan <b>' + fmtN(from) + '–' + fmtN(to) + '</b> dari <b>' + fmtN(o.total) + '</b> ' + esc(o.unit || 'data') +
    (o.perOpts ? ' · Baris per halaman <select class="sel" data-per style="width:auto;min-height:32px;display:inline-block;padding:2px 30px 2px 8px">' + o.perOpts.map(p => '<option ' + (p === o.per ? 'selected' : '') + '>' + p + '</option>').join('') + '</select>' : '') +
    '</div><div class="pages"><button data-pg="' + (hal - 1) + '" ' + (hal <= 1 ? 'disabled' : '') + ' aria-label="Sebelumnya">' + ic('left', 'sm') + '</button>' +
    nums.map(x => x === '…' ? '<span class="muted">…</span>' : '<button data-pg="' + x + '" class="' + (x === hal ? 'on' : '') + '">' + x + '</button>').join('') +
    '<button data-pg="' + (hal + 1) + '" ' + (hal >= n ? 'disabled' : '') + ' aria-label="Berikutnya">' + ic('right', 'sm') + '</button></div></div>';
}
function bindPager(root, onGo, onPer) {
  $$('[data-pg]', root).forEach(b => b.addEventListener('click', () => { onGo(Number(b.dataset.pg)); }));
  const s = $('[data-per]', root); if (s && onPer) s.addEventListener('change', () => onPer(Number(s.value)));
}

/* ---------- Animasi angka ---------- */
function countUp(root) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
  $$('[data-count]', root).forEach(el => {
    const target = Number(el.dataset.count) || 0, dec = String(el.dataset.count).indexOf('.') > -1 ? 1 : 0, suf = el.dataset.suf || '';
    if (reduce || !target) { el.textContent = (dec ? target.toFixed(1).replace('.', ',') : fmtN(target)) + suf; return; }
    const t0 = performance.now(), dur = 900;
    const step = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = target * e;
      el.textContent = (dec ? v.toFixed(1).replace('.', ',') : fmtN(v)) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
/* ---------- Segmented control dengan indikator bergeser ---------- */
function segInit(seg, onChange) {
  let ind = $('.ind', seg);
  if (!ind) { ind = document.createElement('span'); ind.className = 'ind'; seg.prepend(ind); }
  const place = () => { const on = $('button.on', seg); if (!on) return; ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px'; };
  $$('button', seg).forEach(b => b.addEventListener('click', () => {
    $$('button', seg).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    place(); if (onChange) onChange(b.dataset.v, b);
  }));
  requestAnimationFrame(place); setTimeout(place, 200);
  window.addEventListener('resize', place);
}

/* ---------- Berkas ---------- */
function fileB64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); }); }
function bufB64(buf) { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
/** Perkecil gambar di browser (hemat kuota & cepat dimuat) */
function resizeImage(file, maxW, maxH, quality) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight; const k = Math.min(1, maxW / w, (maxH || maxW * 10) / h);
      w = Math.round(w * k); h = Math.round(h * k);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const d = c.toDataURL('image/jpeg', quality || .82);
      res({ data: d.split(',')[1], mime: 'image/jpeg', preview: d, w, h });
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar tidak dapat dibaca.')); };
    img.src = url;
  });
}
function downloadBlob(name, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function downloadB64(name, b64, mime) {
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  downloadBlob(name, new Blob([u], { type: mime }));
}
async function copyText(t) { try { await navigator.clipboard.writeText(t); toast('Disalin ke papan klip.'); } catch (e) { toast('Tidak dapat menyalin otomatis.', 'warn'); } }

/* ---------- Dropdown sederhana ---------- */
function dropdown(anchor, html, cls) {
  closeDropdowns();
  const d = document.createElement('div');
  d.className = 'dropdown ' + (cls || ''); d.innerHTML = html;
  document.body.appendChild(d);
  const r = anchor.getBoundingClientRect(), w = d.offsetWidth;
  d.style.top = (r.bottom + window.scrollY + 8) + 'px';
  d.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px';
  setTimeout(() => document.addEventListener('click', closeDropdowns, { once: true }), 0);
  return d;
}
function closeDropdowns() { $$('.dropdown').forEach(d => d.remove()); }

window.UI = { toast, toastRes, modal, drawer, confirmDlg, btnBusy, cover, genCover, accessBadge, formatTag, readState, readBtn, favBtn, bookCard, miniCard, hCard,
  authorItem, avatar, skCards, skRows, skBlock, empty, errorBox, pager, bindPager, countUp, segInit, fileB64, bufB64, resizeImage, downloadBlob, downloadB64,
  copyText, dropdown, closeDropdowns, AKSES_LABEL };
})();
