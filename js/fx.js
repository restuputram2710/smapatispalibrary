/* ==========================================================================
   EFEK & MASKOT
   - Lito: maskot burung hantu perpustakaan (SVG orisinal, ikut warna tema)
   - Pengikut kursor + percikan + parallax: HANYA di Beranda (perangkat mouse)
   - Kartu buku miring 3D, riak tombol, muncul-saat-gulir, konfeti selesai baca
   Semua efek mati otomatis bila pengguna memilih "kurangi animasi".
   ========================================================================== */
(function () {
'use strict';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const mm = q => window.matchMedia ? matchMedia(q).matches : false;
const reduced = () => mm('(prefers-reduced-motion: reduce)') || document.documentElement.classList.contains('reduce-motion');
const finePointer = () => mm('(hover: hover) and (pointer: fine)');

/* ---------------------------------------------------------------- MASKOT */
const LITO_SVG = '<svg viewBox="0 0 200 222" aria-hidden="true" focusable="false">' +
  '<ellipse class="l-shadow" cx="100" cy="214" rx="54" ry="6"/>' +
  '<g class="l-all">' +
  '<g class="l-wing l-wing-l"><path d="M42 108C18 120 10 160 32 184c9-18 15-46 16-74z"/><path class="l-dk" d="M42 108C18 120 10 160 32 184c3-6 5-12 7-20-12-16-11-38 3-56z"/></g>' +
  '<g class="l-wing l-wing-r"><path d="M158 108c24 12 32 52 10 76-9-18-15-46-16-74z"/><path class="l-dk" d="M158 108c24 12 32 52 10 76-3-6-5-12-7-20 12-16 11-38-3-56z"/></g>' +
  '<path class="l-tuft" d="M56 64 44 22l36 26z"/><path class="l-tuft" d="M144 64l12-42-36 26z"/>' +
  '<path class="l-body" d="M100 38c48 0 70 40 70 90 0 52-32 80-70 80s-70-28-70-80c0-50 22-90 70-90z"/>' +
  '<ellipse class="l-belly" cx="100" cy="154" rx="46" ry="44"/>' +
  '<path class="l-scal" d="M76 142q6 7 12 0M94 142q6 7 12 0M112 142q6 7 12 0M85 157q6 7 12 0M103 157q6 7 12 0"/>' +
  '<circle class="l-face" cx="74" cy="94" r="31"/><circle class="l-face" cx="126" cy="94" r="31"/>' +
  '<circle class="l-eye" cx="74" cy="94" r="20"/><circle class="l-eye" cx="126" cy="94" r="20"/>' +
  '<g class="l-pupils"><circle cx="74" cy="96" r="9.5"/><circle cx="126" cy="96" r="9.5"/><circle class="l-hl" cx="77.5" cy="92" r="3"/><circle class="l-hl" cx="129.5" cy="92" r="3"/></g>' +
  '<circle class="l-lid" cx="74" cy="94" r="21.5"/><circle class="l-lid" cx="126" cy="94" r="21.5"/>' +
  '<g class="l-glass"><circle cx="74" cy="94" r="24"/><circle cx="126" cy="94" r="24"/><path d="M97 90q3-5 6 0"/></g>' +
  '<path class="l-beak" d="M100 106l-8 8 8 12 8-12z"/><path class="l-beak2" d="M92 114l8 12 8-12z"/>' +
  '<ellipse class="l-cheek" cx="52" cy="120" rx="8" ry="5"/><ellipse class="l-cheek" cx="148" cy="120" rx="8" ry="5"/>' +
  '<g class="l-cap"><path class="l-cap-b" d="M78 44v13c15 8 29 8 44 0V44l-22 9z"/><path class="l-cap-t" d="M54 40 100 21l46 19-46 19z"/><circle class="l-cap-k" cx="100" cy="40" r="3.2"/>' +
  '<g class="l-tassel"><path d="M100 40l34 6v17" fill="none"/><rect x="130.5" y="60" width="7" height="12" rx="2"/></g></g>' +
  '<g class="l-book"><path class="l-bk" d="M52 172l48 7 48-7v32l-48 7-48-7z"/><path class="l-pg" d="M57 167q23-7 43 7v30q-20-11-43-4z"/><path class="l-pg" d="M143 167q-23-7-43 7v30q20-11 43-4z"/>' +
  '<path class="l-ln" d="M65 178q14-3 27 3M65 187q14-3 27 3M108 181q13-6 27-3M108 190q13-6 27-3"/><ellipse class="l-grip" cx="52" cy="188" rx="9" ry="12"/><ellipse class="l-grip" cx="148" cy="188" rx="9" ry="12"/></g>' +
  '<ellipse class="l-foot" cx="84" cy="208" rx="9" ry="4"/><ellipse class="l-foot" cx="116" cy="208" rx="9" ry="4"/>' +
  '<g class="l-hands"><g class="l-hand l-hand-l"><path d="M42 114c-4-30 22-48 56-38 6 15 1 31-9 39-15 7-33 7-47-1z"/><path class="l-ft" d="M54 104l12 6M60 94l14 8M70 86l12 8"/></g>' +
  '<g class="l-hand l-hand-r"><path d="M158 114c4-30-22-48-56-38-6 15-1 31 9 39 15 7 33 7 47-1z"/><path class="l-ft" d="M146 104l-12 6M140 94l-14 8M130 86l-12 8"/></g></g>' +
  '</g></svg>';

/** Kembalikan HTML maskot. o: { size, pose: idle|wave|read|cover|peek|sad|cheer, track, label, cls } */
function mascot(o) {
  o = o || {};
  return '<span class="lito lito-' + esc(o.pose || 'idle') + (o.cls ? ' ' + esc(o.cls) : '') + '"' + (o.track ? ' data-track' : '') +
    ' style="--sz:' + (o.size || 120) + 'px" role="img" aria-label="' + esc(o.label || 'Lito, maskot perpustakaan') + '">' + LITO_SVG + '</span>';
}
function pose(el, p) {
  if (!el) return;
  el.className = el.className.replace(/\blito-[a-z]+\b/g, '').trim() + ' lito-' + p;
}
function look(el, dx, dy) { const p = el && el.querySelector('.l-pupils'); if (p) p.style.transform = 'translate(' + (dx || 0).toFixed(2) + 'px,' + (dy || 0).toFixed(2) + 'px)'; }
function jump(el) {
  if (!el || reduced()) return;
  el.classList.remove('l-jump'); void el.offsetWidth; el.classList.add('l-jump');
  setTimeout(() => el.classList.remove('l-jump'), 700);
}

/* Tips bergilir di gelembung bicara maskot */
const TIPS = [
  'Halo! Aku Lito, teman membacamu di perpustakaan digital.',
  'Tekan Ctrl + K untuk mencari buku dengan cepat.',
  'Buku pelajaran kelasmu ada di menu Buku Pelajaran.',
  'Membaca 15 menit sehari bisa menyelesaikan 1 buku tiap bulan!',
  'Halaman terakhirmu tersimpan otomatis. Lanjutkan kapan saja.',
  'Ketuk ikon hati untuk menyimpan buku ke Koleksi Saya.',
  'Buku yang pernah dibuka akan lebih cepat terbuka berikutnya.'
];
function typeText(node, text) {
  if (!node) return;
  clearInterval(node._tt);
  if (reduced()) { node.textContent = text; return; }
  let i = 0; node.textContent = '';
  node._tt = setInterval(() => { i += 2; node.textContent = text.slice(0, i); if (i >= text.length) clearInterval(node._tt); }, 24);
}
function bindBubble(root) {
  root.querySelectorAll('[data-mascot]').forEach(btn => {
    if (btn._fx) return; btn._fx = 1;
    const tip = root.querySelector(btn.dataset.mascot || '[data-tip]'), m = btn.querySelector('.lito');
    let k = Math.floor(Math.random() * TIPS.length);
    const nextTip = () => { k = (k + 1) % TIPS.length; typeText(tip, TIPS[k]); };
    if (tip && !tip.textContent) typeText(tip, TIPS[0]);
    btn.addEventListener('click', () => { jump(m); nextTip(); burst(btn, 10); });
    btn.addEventListener('mouseenter', () => pose(m, 'wave'));
    btn.addEventListener('mouseleave', () => pose(m, btn.dataset.pose || 'idle'));
    const iv = setInterval(() => { if (!document.body.contains(btn)) { clearInterval(iv); return; } if (document.visibilityState === 'visible') nextTip(); }, 8000);
  });
}

/* ------------------------------------------------- PENGIKUT KURSOR (beranda) */
const C = { on: false, root: null, ring: null, lbl: null, x: -100, y: -100, rx: -100, ry: -100, raf: 0, lastEmit: 0, ex: 0, ey: 0, mode: '', hero: null, seen: false, pool: [], pi: 0 };
const COLORS = ['var(--c-primary)', 'var(--c-accent)', '#F2B23A', '#E87BA4', '#2a78d6'];
function cursorEnable() {
  if (C.on || !finePointer() || reduced()) return;
  C.on = true;
  C.root = document.createElement('div'); C.root.className = 'fx-cursor'; C.root.setAttribute('aria-hidden', 'true');
  C.root.innerHTML = '<div class="fx-ring"></div><div class="fx-lbl">Lihat</div><div class="fx-dot"></div>';
  for (let i = 0; i < 22; i++) { const s = document.createElement('i'); s.className = 'fx-spark'; C.root.appendChild(s); C.pool.push(s); }
  document.body.appendChild(C.root);
  C.ring = C.root.children[0]; C.lbl = C.root.children[1]; C.dot = C.root.children[2];
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerdown', onDown, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  window.addEventListener('blur', onLeave);
}
function cursorDisable() {
  if (!C.on) return;
  C.on = false; cancelAnimationFrame(C.raf); C.raf = 0;
  document.removeEventListener('pointermove', onMove);
  document.removeEventListener('pointerdown', onDown);
  document.documentElement.removeEventListener('mouseleave', onLeave);
  window.removeEventListener('blur', onLeave);
  if (C.root) C.root.remove(); C.root = null; C.pool = []; C.seen = false;
  if (C.hero) C.hero.classList.remove('lit'); C.hero = null;
}
function onLeave() { if (C.root) C.root.classList.add('out'); }
function onMove(e) {
  if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
  C.x = e.clientX; C.y = e.clientY;
  if (!C.seen) { C.rx = C.x; C.ry = C.y; C.seen = true; C.root.classList.add('seen'); }
  C.root.classList.remove('out');
  const t = e.target instanceof Element ? e.target : null;
  let mode = '';
  if (t) {
    if (t.closest('input, textarea, select, [contenteditable]')) mode = 'text';
    else if (t.closest('.mini, .bcard .cv-wrap, .hcard, .nb, .continue .cover')) mode = 'book';
    else if (t.closest('a, button, [role=button], label, .chip, [data-mascot]')) mode = 'link';
  }
  if (mode !== C.mode) { C.root.dataset.m = mode; C.mode = mode; }
  const hero = t && t.closest('.hero');
  if (hero !== C.hero) { if (C.hero) C.hero.classList.remove('lit'); C.hero = hero; if (hero) hero.classList.add('lit'); }
  const now = performance.now(), dist = Math.hypot(C.x - C.ex, C.y - C.ey);
  if (mode !== 'text' && now - C.lastEmit > (hero ? 34 : 60) && dist > 14) { C.lastEmit = now; C.ex = C.x; C.ey = C.y; spark(C.x, C.y, 1); }
  if (!C.raf) C.raf = requestAnimationFrame(loop);
}
function onDown(e) { if (C.mode === 'text') return; burstAt(e.clientX, e.clientY, 9); if (C.ring) { C.ring.classList.remove('pulse'); void C.ring.offsetWidth; C.ring.classList.add('pulse'); } }
function loop() {
  C.raf = 0; if (!C.on) return;
  C.rx += (C.x - C.rx) * .2; C.ry += (C.y - C.ry) * .2;
  C.ring.style.transform = 'translate3d(' + C.rx.toFixed(1) + 'px,' + C.ry.toFixed(1) + 'px,0)';
  C.lbl.style.transform = C.ring.style.transform;
  C.dot.style.transform = 'translate3d(' + C.x + 'px,' + C.y + 'px,0)';
  // Sorotan & parallax hero
  if (C.hero) {
    const r = C.hero.getBoundingClientRect(), nx = (C.x - r.left) / r.width - .5, ny = (C.y - r.top) / r.height - .5;
    C.hero.style.setProperty('--mx', (C.x - r.left).toFixed(0) + 'px'); C.hero.style.setProperty('--my', (C.y - r.top).toFixed(0) + 'px');
    C.hero.querySelectorAll('[data-depth]').forEach(n => { const d = Number(n.dataset.depth) || 0; n.style.transform = 'translate3d(' + (nx * d).toFixed(1) + 'px,' + (ny * d).toFixed(1) + 'px,0)'; });
  }
  trackEyes(C.x, C.y);
  if (Math.abs(C.x - C.rx) > .3 || Math.abs(C.y - C.ry) > .3) C.raf = requestAnimationFrame(loop);
}
function trackEyes(x, y) {
  document.querySelectorAll('.lito[data-track]').forEach(m => {
    const r = m.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
    const cx = r.left + r.width * .5, cy = r.top + r.height * .43, dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
    look(m, dx / d * 6.5 * k, dy / d * 5.5 * k);
  });
}
function spark(x, y, n) {
  if (!C.on || !C.pool.length) return;
  for (let j = 0; j < n; j++) {
    const s = C.pool[C.pi = (C.pi + 1) % C.pool.length];
    const kind = Math.random(), size = 5 + Math.random() * 7, col = COLORS[Math.floor(Math.random() * COLORS.length)];
    s.className = 'fx-spark ' + (kind < .55 ? 's-star' : kind < .85 ? 's-dot' : 's-book');
    s.style.width = s.style.height = size.toFixed(1) + 'px'; s.style.background = col;
    const ang = Math.random() * Math.PI * 2, dist = 16 + Math.random() * 26;
    if (s._a) s._a.cancel();
    s._a = s.animate([
      { transform: 'translate3d(' + x + 'px,' + y + 'px,0) scale(1) rotate(0deg)', opacity: .95 },
      { transform: 'translate3d(' + (x + Math.cos(ang) * dist).toFixed(1) + 'px,' + (y + Math.sin(ang) * dist - 18).toFixed(1) + 'px,0) scale(0) rotate(' + (Math.random() * 180 - 90).toFixed(0) + 'deg)', opacity: 0 }
    ], { duration: 650 + Math.random() * 350, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
  }
}
function burstAt(x, y, n) { if (C.on) spark(x, y, n); }

/* Ledakan kecil di sekitar elemen (dipakai juga tanpa kursor aktif) */
function burst(el, n) {
  if (reduced() || !el) return;
  const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 3;
  if (C.on) { spark(x, y, n || 10); return; }
  confetti({ x, y, n: n || 10, spread: 70, power: 4, life: 700 });
}

/* ------------------------------------------------------------- KONFETI */
function confetti(o) {
  o = o || {};
  if (reduced()) return;
  const n = o.n || 70, layer = document.createElement('div');
  layer.className = 'fx-confetti'; layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  const x0 = o.x != null ? o.x : innerWidth / 2, y0 = o.y != null ? o.y : innerHeight * .32, cols = ['#6B3FA0', '#5E9E34', '#F2B23A', '#E87BA4', '#2a78d6', '#B8F28F'];
  let left = n;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'); p.style.background = cols[i % cols.length];
    if (i % 3 === 0) p.style.borderRadius = '50%';
    layer.appendChild(p);
    const ang = (-90 + (Math.random() - .5) * (o.spread || 140)) * Math.PI / 180, v = (o.power || 9) * (24 + Math.random() * 26);
    const dx = Math.cos(ang) * v, dy = Math.sin(ang) * v, life = (o.life || 1500) + Math.random() * 500;
    p.animate([
      { transform: 'translate3d(' + x0 + 'px,' + y0 + 'px,0) rotate(0)', opacity: 1 },
      { transform: 'translate3d(' + (x0 + dx).toFixed(0) + 'px,' + (y0 + dy).toFixed(0) + 'px,0) rotate(' + (Math.random() * 540).toFixed(0) + 'deg)', opacity: 1, offset: .45 },
      { transform: 'translate3d(' + (x0 + dx * 1.3).toFixed(0) + 'px,' + (y0 + dy + innerHeight * .5).toFixed(0) + 'px,0) rotate(' + (Math.random() * 900).toFixed(0) + 'deg)', opacity: 0 }
    ], { duration: life, easing: 'cubic-bezier(.15,.6,.35,1)', fill: 'forwards' }).onfinish = () => { if (--left <= 0) layer.remove(); };
  }
}

/* ----------------------------------------------- KARTU MIRING 3D (mouse) */
let tiltEl = null, tiltRaf = 0, tiltEv = null;
function tiltMove(e) {
  if (e.pointerType !== 'mouse' || reduced()) return;
  tiltEv = e; if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltApply);
}
function tiltApply() {
  tiltRaf = 0; const e = tiltEv; if (!e) return;
  const card = e.target instanceof Element ? e.target.closest('.bcard, .mini, .hcard') : null;
  if (card !== tiltEl) { if (tiltEl) tiltReset(tiltEl); tiltEl = card; }
  if (!card) return;
  const r = card.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
  card.classList.add('tilting');
  card.style.setProperty('--rx', ((nx - .5) * 12).toFixed(2) + 'deg');
  card.style.setProperty('--ry', ((.5 - ny) * 10).toFixed(2) + 'deg');
  card.style.setProperty('--gx', (nx * 100).toFixed(0) + '%'); card.style.setProperty('--gy', (ny * 100).toFixed(0) + '%');
}
function tiltReset(c) { c.classList.remove('tilting'); c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); }

/* ------------------------------------------------------------ RIAK TOMBOL */
function ripple(e) {
  const b = e.target instanceof Element ? e.target.closest('.btn, .btn-icon, .chip, .seg button, .view-toggle button, .nav a, .tier, .kel-chip') : null;
  if (!b || b.disabled || reduced()) return;
  if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
  const r = b.getBoundingClientRect(), w = document.createElement('span'), s = document.createElement('span'), size = Math.max(r.width, r.height) * 2.2;
  w.className = 'fx-rpl'; s.style.width = s.style.height = size + 'px';
  s.style.left = (e.clientX - r.left - size / 2) + 'px'; s.style.top = (e.clientY - r.top - size / 2) + 'px';
  w.appendChild(s); b.appendChild(w);
  setTimeout(() => w.remove(), 650);
}

/* ------------------------------------------------- MUNCUL SAAT DIGULIR */
const REVEAL = '.section, .stats > .stat, .grid3 > .stat2, .rp-sec, .subj, .lesson, .kpi, .chart-card, .tier, .detail-side, .layout-split > *';
let io = null;
function reveal(root) {
  if (reduced() || !('IntersectionObserver' in window)) return;
  if (!io) io = new IntersectionObserver(ents => {
    let k = 0;
    ents.forEach(en => { if (!en.isIntersecting) return; const n = en.target; n.style.setProperty('--rv', Math.min(k++, 8) * 60 + 'ms'); n.classList.add('rv-in'); io.unobserve(n); });
  }, { rootMargin: '0px 0px -6% 0px', threshold: .06 });
  (root || document).querySelectorAll(REVEAL).forEach(n => { if (n.classList.contains('rv')) return; n.classList.add('rv'); io.observe(n); });
}

/* ------------------------------------------------------------ RUTE */
function onRoute(path) {
  if (path === '/') cursorEnable(); else cursorDisable();
}
function decorate(root) {
  root = root || document;
  bindBubble(root);
  reveal(root);
  if (!finePointer() || !C.on) root.querySelectorAll('.lito[data-track]').forEach(m => m.classList.add('l-roam'));
}

/* Global sekali pasang */
document.addEventListener('pointermove', tiltMove, { passive: true });
document.addEventListener('pointerdown', ripple, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden && C.raf) { cancelAnimationFrame(C.raf); C.raf = 0; } });

window.FX = { mascot, pose, look, jump, confetti, burst, reveal, decorate, onRoute, cursorEnable, cursorDisable, typeText, TIPS, reduced, get cursorOn() { return C.on; } };
})();
