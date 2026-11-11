/* ==========================================================================
   APLIKASI: kerangka (sidebar, topbar, navigasi bawah), boot, rute, event global
   ========================================================================== */
(function () {
'use strict';
const { ic, esc, $, $$, fmtN, Session, api, Router, LS } = SP;

const App = window.App = {
  settings: {}, me: null, ref: { kategori: [], mapel: [], kelas: [], tingkat: ['X', 'XI', 'XII'], tipe: [] }, home: null, pengumuman: [], booted: false,
  page(pattern, fn, opts) { Router.add(pattern, fn, opts); },
  can: k => Session.can(k),
  root: () => $('#page'),
  bootKey: () => 'boot_' + (Session.me ? Session.me.id : 'tamu'),
  refresh: null
};

/* ---------- BOOT ---------- */
function setBoot(d, fresh) {
  if (!d) return;
  App.settings = d.settings || {};
  App.ref = d.ref || App.ref;
  App.home = d.home; App.pengumuman = d.pengumuman || [];
  SP.applyTheme(App.settings);
  if (fresh) { App.me = d.me; if (d.me) Session.set(Session.token, d.me); }
  else App.me = Session.me;
  document.title = (App.settings.APP_NAME || 'Smapatispa') + ' — ' + (App.settings.APP_TAGLINE || 'Perpustakaan Digital');
  App.booted = true;
}
async function loadBoot(force) {
  const key = App.bootKey(), c = SP.cacheGet(key);
  if (c && !force && Date.now() - c.t < 60000) return c.d;
  const r = await api('boot', {});
  if (!r.success) {
    if (r.code === 'CONFIG') showConfigError();
    else if (!c) UI.toast(r.message, 'err');
    return null;
  }
  if (!r.data.me && Session.token) Session.clear();
  const prevH = c ? c.h : null, v = SP.cachePut(App.bootKey(), r.data);
  setBoot(r.data, true);
  if (v.h !== prevH) { renderShell(); App.emit('boot'); }
  return r.data;
}
App.reloadBoot = () => loadBoot(true);
const listeners = {};
App.on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); };
App.emit = ev => { (listeners[ev] || []).forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); listeners[ev] = []; };
function showConfigError() {
  $('#app').innerHTML = '<div class="auth-page"><div class="auth-main"><div class="auth-card"><div class="auth-logo">' + ic('settings', 'xl') + '</div><h1>Konfigurasi belum lengkap</h1>' +
    '<p class="sub">Isi alamat Web App Apps Script (berakhiran <code>/exec</code>) pada berkas <code>js/config.js</code>, lalu unggah ulang ke GitHub.</p>' +
    '<div class="alert mt24">' + ic('info') + '<div>Lihat <b>PANDUAN-INSTALASI.md</b> bagian "Hubungkan frontend ke backend".</div></div></div></div></div>';
}

/* ---------- KERANGKA ---------- */
const NAV_ANGGOTA = [
  { h: '/', i: 'home', t: 'Beranda' }, { h: '/katalog', i: 'grid', t: 'Katalog', cnt: () => App.ref.kategori.reduce((s, k) => s + (k.jumlah || 0), 0) },
  { h: '/pelajaran', i: 'cap', t: 'Buku Pelajaran' }, { h: '/rak?tab=favorit', i: 'heart', t: 'Favorit', auth: 1, cnt: () => App.home && App.home.stat && App.home.stat.favorit },
  { h: '/rak', i: 'koleksi', t: 'Koleksi Saya', auth: 1, cnt: () => App.home && App.home.stat && App.home.stat.sedang ? App.home.stat.sedang : '' },
  { h: '/riwayat', i: 'history', t: 'Riwayat Bacaan', auth: 1, hideGuest: 1 }, { h: '/rekomendasi', i: 'sparkles', t: 'Rekomendasi', auth: 1, hideGuest: 1 },
  { h: '/pengaturan', i: 'settings', t: 'Pengaturan', auth: 1, hideGuest: 1 }
];
const NAV_ADMIN = [
  { g: 'Ringkasan' }, { h: '/admin', i: 'chart', t: 'Dashboard', izin: 'dashboard.lihat' }, { h: '/admin/laporan', i: 'bars', t: 'Laporan', izin: 'laporan.lihat' },
  { g: 'Koleksi' }, { h: '/admin/buku', i: 'book', t: 'Kelola Buku', izin: 'buku.lihat' }, { h: '/admin/kategori', i: 'layers', t: 'Kategori & Penulis', izin: 'kategori.kelola' },
  { h: '/admin/pelajaran', i: 'cap', t: 'Mapel & Kelas', izin: 'pelajaran.kelola' },
  { g: 'Pengguna' }, { h: '/admin/pengguna', i: 'users', t: 'Pengguna', izin: 'pengguna.lihat' }, { h: '/admin/peran', i: 'shield', t: 'Peran & Izin', izin: 'peran.kelola' },
  { h: '/admin/impor', i: 'upload', t: 'Impor Data', izin: 'impor.jalankan' },
  { g: 'Komunikasi' }, { h: '/admin/pengumuman', i: 'megaphone', t: 'Pengumuman', izin: 'pengumuman.kelola' }, { h: '/admin/notifikasi', i: 'mail', t: 'Notifikasi Email', izin: 'notifikasi.kelola' },
  { g: 'Sistem' }, { h: '/admin/identitas', i: 'palette', t: 'Identitas Aplikasi', izin: 'identitas.kelola' }, { h: '/admin/log', i: 'activity', t: 'Log Aktivitas', izin: 'log.lihat' },
  { h: '/admin/sistem', i: 'database', t: 'Status Sistem', izin: 'sistem.kelola' }
];
const ADMIN_IZIN = NAV_ADMIN.filter(n => n.izin).map(n => n.izin);
App.adminHome = () => { const f = NAV_ADMIN.find(n => n.izin && App.can(n.izin)); return f ? f.h : '/'; };

function brandHtml() {
  const s = App.settings;
  return '<a class="brand" href="#/"><span class="brand-logo">' + (s.LOGO_URL ? '<img src="' + esc(s.LOGO_URL) + '" alt="">' : ic('logo', 'xl')) + '</span>' +
    '<span style="min-width:0"><span class="brand-name trunc" style="display:block">' + esc(s.APP_NAME || 'Smapatispa') + '</span><span class="brand-sub trunc" style="display:block">' + esc(s.APP_TAGLINE || 'Perpustakaan Digital') + '</span></span></a>';
}
function navHtml(admin) {
  const me = Session.me, cur = Router.parse(), curFull = cur.path + (cur.query.tab ? '?tab=' + cur.query.tab : '');
  const isOn = h => { if (h === '/') return cur.path === '/'; if (h === '/admin') return cur.path === '/admin'; if (h.indexOf('?') > -1) return curFull === h; if (h === '/rak') return cur.path === '/rak' && cur.query.tab !== 'favorit'; return cur.path === h || cur.path.indexOf(h + '/') === 0 || (h === '/katalog' && /^\/buku\//.test(cur.path)); };
  let s = '';
  if (admin) {
    s += '<a href="#/">' + ic('arrowl') + 'Ke Perpustakaan</a>';
    NAV_ADMIN.forEach(n => { if (n.g) s += '<div class="nav-group" data-g>' + n.g + '</div>'; else if (App.can(n.izin)) s += '<a href="#' + n.h + '" class="' + (isOn(n.h) ? 'on' : '') + '">' + ic(n.i) + n.t + '</a>'; });
    s = s.replace(/<div class="nav-group" data-g>[^<]*<\/div>(?=<div class="nav-group"|$)/g, '');
  } else {
    NAV_ANGGOTA.forEach(n => {
      if (!me && n.hideGuest) return;
      const c = me && n.cnt ? n.cnt() : (!me && n.h === '/katalog' && n.cnt ? n.cnt() : '');
      s += '<a href="#' + (n.auth && !me ? '/masuk?next=' + encodeURIComponent(n.h) : n.h) + '" class="' + (isOn(n.h) ? 'on' : '') + '">' + ic(n.i) + n.t +
        (n.auth && !me ? '<span class="lock">' + ic('lock', 'sm') + '</span>' : c ? '<span class="cnt">' + esc(typeof c === 'number' ? fmtN(c) : c) + '</span>' : '') + '</a>';
    });
    if (me && me.staf) s += '<div class="nav-group">Pengelola</div><a href="#' + App.adminHome() + '">' + ic('shield') + 'Panel Admin</a>';
  }
  return s;
}
function sideFootHtml() {
  const me = Session.me;
  if (!me) return '<div class="member-card"><div style="font-weight:700;display:flex;gap:8px;align-items:center">' + ic('login') + 'Masuk ke akun</div><p class="small muted mt8">Simpan favorit, lanjutkan bacaan, dan akses koleksi khusus warga sekolah.</p>' +
    '<a class="btn btn-outline-p btn-sm btn-block mt12" href="#/masuk">Masuk dengan NISN / Email</a></div>';
  return '<div class="member-card"><div class="lbl-mono">Kartu Anggota <span class="online-dot"></span></div><div class="nm trunc">' + esc(me.nama) + '</div>' +
    '<div class="id">' + (me.nisn ? 'NISN: ' + esc(me.nisn) : esc(me.email || me.username || '')) + '</div><div class="kl">' + esc(me.kelas ? 'Kelas ' + me.kelas : me.peranNama) + '</div></div>' +
    '<button class="logout" data-logout>' + ic('logout') + 'Keluar</button>';
}
function topbarHtml() {
  const me = Session.me, s = App.settings, unread = unreadCount();
  return '<button class="btn-icon menu-btn" data-menu aria-label="Buka menu">' + ic('menu') + '</button>' +
    '<form class="search" data-search role="search">' + ic('search') + '<input class="inp" name="q" placeholder="Cari judul buku, penulis, ISBN, atau materi pelajaran…" autocomplete="off" aria-label="Cari buku"><span class="kbd">⌘K</span></form>' +
    '<span class="top-chip" title="Tahun ajaran">' + ic('checkc', 'sm') + esc(s.KURIKULUM || 'Kurikulum Merdeka') + ' ' + esc(s.TAHUN_AJARAN || '') + '</span>' +
    '<button class="btn-icon" data-notif aria-label="Pengumuman">' + ic('bell') + (unread ? '<span class="notif-dot">' + unread + '</span>' : '') + '</button>' +
    (me ? '<button class="user-btn" data-user aria-label="Menu akun">' + UI.avatar(me) + '<span class="txt"><span class="nm" style="display:block">' + esc(me.nama) + '</span><span class="sb">' + esc(me.kelas ? 'Siswa Kelas ' + me.kelas : me.peranNama) + '</span></span>' + ic('down', 'sm') + '</button>'
      : '<a class="btn btn-accent" href="#/masuk">' + ic('login', 'sm') + '<span class="hide-m">Masuk NISN / Email</span><span class="show-m">Masuk</span></a>');
}
function bottomNavHtml() {
  const p = Router.parse().path, me = Session.me;
  const items = [['/', 'home', 'Beranda'], ['/katalog', 'grid', 'Katalog'], ['/pelajaran', 'cap', 'Pelajaran'], [me ? '/rak' : '/masuk', 'koleksi', 'Koleksi'], [me ? '/pengaturan' : '/masuk', 'user', me ? 'Profil' : 'Masuk']];
  return items.map(i => '<a href="#' + i[0] + '" class="' + ((i[0] === '/' ? p === '/' : p.indexOf(i[0]) === 0) ? 'on' : '') + '">' + ic(i[1]) + i[2] + '</a>').join('');
}
function renderShell() {
  const root = $('#app');
  if (!$('.sidebar', root)) {
    root.innerHTML = '<aside class="sidebar" aria-label="Navigasi utama"><div data-brand></div><nav class="nav" data-nav></nav><div class="side-foot" data-foot></div></aside>' +
      '<div class="scrim" data-scrim></div><div class="main"><header class="topbar" data-top></header><main id="page" class="page" tabindex="-1"></main></div><nav class="bottom-nav" data-bnav aria-label="Navigasi bawah"></nav>';
    bindShell();
  }
  const admin = /^\/admin/.test(Router.parse().path);
  $('[data-brand]').innerHTML = brandHtml();
  $('[data-nav]').innerHTML = navHtml(admin);
  $('[data-foot]').innerHTML = sideFootHtml();
  const q = $('[data-search] input'), val = q ? q.value : '';
  $('[data-top]').innerHTML = topbarHtml();
  if (val) $('[data-search] input').value = val;
  bindSearch();
  $('[data-bnav]').innerHTML = bottomNavHtml();
}
App.renderShell = renderShell;
function closeMenu() { $('.sidebar').classList.remove('open'); $('[data-scrim]').classList.remove('on'); }
function bindShell() {
  document.addEventListener('click', e => {
    if (e.target.closest('[data-menu]')) { $('.sidebar').classList.add('open'); $('[data-scrim]').classList.add('on'); return; }
    if (e.target.closest('[data-scrim]') || e.target.closest('.sidebar a')) closeMenu();
    const nb = e.target.closest('[data-notif]'); if (nb) { e.stopPropagation(); notifDropdown(nb); return; }
    const ub = e.target.closest('[data-user]'); if (ub) { e.stopPropagation(); userDropdown(ub); return; }
    if (e.target.closest('[data-logout]')) { e.preventDefault(); logout(); }
  });
}
function unreadCount() { const seen = LS.get('seen_ann', []); return (App.pengumuman || []).filter(p => seen.indexOf(p.id) === -1).length; }
function notifDropdown(btn) {
  const seen = LS.get('seen_ann', []), list = App.pengumuman || [];
  const d = UI.dropdown(btn, '<div style="padding:14px 16px;border-bottom:1px solid var(--c-border-s)"><b>Pengumuman</b></div>' + (list.length ? list.map(p =>
    '<div class="it ' + (seen.indexOf(p.id) === -1 ? 'new' : '') + '"><div class="row between"><span class="badge ' + (p.prioritas === 'PENTING' ? 'b-red' : p.sematkan ? 'b-solid' : 'b-purple') + '">' + (p.prioritas === 'PENTING' ? 'Penting' : p.sematkan ? 'Disematkan' : 'Info') + '</span><span class="mono xs muted">' + SP.fmtRel(p.waktu) + '</span></div>' +
    '<div style="font-weight:600;margin-top:6px">' + esc(p.judul) + '</div><div class="small muted clamp3" style="white-space:pre-line">' + esc(p.isi) + '</div></div>').join('') : '<div class="empty" style="padding:28px">Belum ada pengumuman.</div>'), 'dd-notif');
  d.addEventListener('click', e => e.stopPropagation());
  LS.set('seen_ann', uniqIds(seen.concat(list.map(p => p.id))));
  const dot = $('.notif-dot', btn); if (dot) dot.remove();
}
function uniqIds(a) { return a.filter((x, i) => a.indexOf(x) === i).slice(-100); }
function userDropdown(btn) {
  const me = Session.me;
  UI.dropdown(btn, '<div style="padding:10px 12px 8px"><b>' + esc(me.nama) + '</b><div class="mono xs muted">' + esc(me.peranNama) + '</div></div>' +
    '<a href="#/pengaturan">' + ic('user', 'sm') + 'Profil & Pengaturan</a><a href="#/rak">' + ic('koleksi', 'sm') + 'Koleksi Saya</a>' +
    (me.staf ? '<a href="#' + App.adminHome() + '">' + ic('shield', 'sm') + 'Panel Admin</a>' : '') + '<button data-logout style="color:var(--c-danger)">' + ic('logout', 'sm') + 'Keluar</button>');
}
async function logout() {
  if (!(await UI.confirmDlg('Keluar dari akun ' + esc(Session.me ? Session.me.nama : '') + '?', { ok: 'Keluar' }))) return;
  api('auth.keluar', {});
  Session.clear(); App.me = null;
  UI.toast('Anda telah keluar.');
  Router.go('/'); renderShell(); loadBoot(true).then(() => route());
}
App.logout = logout;

/* ---------- Pencarian dengan saran ---------- */
function bindSearch() {
  const form = $('[data-search]'); if (!form) return;
  const inp = $('input', form);
  let box = null, sel = -1, items = [];
  const hide = () => { if (box) { box.remove(); box = null; } sel = -1; };
  const show = async q => {
    if (q.length < 2) return hide();
    const r = await api('katalog', { q, per: 5 });
    if (inp.value.trim() !== q || !r.success) return;
    items = r.data.items;
    if (!box) { box = document.createElement('div'); box.className = 'suggest'; form.appendChild(box); }
    box.innerHTML = (items.length ? items.map((b, i) => '<a href="#/buku/' + esc(b.id) + '" data-i="' + i + '"><div style="width:30px">' + UI.cover(b, 6) + '</div><div class="grow"><div class="trunc" style="font-weight:600">' + esc(b.judul) + '</div><div class="small muted trunc">' + esc(b.penulis || b.mapelNama || '') + '</div></div>' + UI.formatTag(b.format) + '</a>').join('')
      : '<div class="muted small" style="padding:14px">Tidak ada hasil untuk "' + esc(q) + '".</div>') + '<a class="all" href="#/katalog?q=' + encodeURIComponent(q) + '">Lihat semua hasil (' + fmtN(r.data.total) + ')</a>';
  };
  const deb = SP.debounce(() => show(inp.value.trim()), 300);
  inp.addEventListener('input', deb);
  inp.addEventListener('keydown', e => {
    if (!box) return;
    const links = $$('a', box);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length; links.forEach((a, i) => a.classList.toggle('on', i === sel)); }
    else if (e.key === 'Enter' && sel > -1) { e.preventDefault(); links[sel].click(); hide(); inp.blur(); }
    else if (e.key === 'Escape') hide();
  });
  inp.addEventListener('blur', () => setTimeout(hide, 200));
  form.addEventListener('submit', e => { e.preventDefault(); hide(); const q = inp.value.trim(); Router.go('/katalog' + SP.qsBuild({ q })); inp.blur(); });
}

/* ---------- Rute ---------- */
let lastPath = '';
async function route() {
  const m = Router.resolve(), navId = ++Router.navId;
  if (window.Reader && Reader.isOpen() && (!m || m.route.pattern !== '/baca/:id')) Reader.close(true);
  UI.closeDropdowns();
  if (!m) { Router.go('/', true); return; }
  const o = m.route.opts;
  if (o.auth && !Session.me) { Router.go('/masuk?next=' + encodeURIComponent(m.path + SP.qsBuild(m.query)), true); return; }
  if (o.guestOnly && Session.me) { Router.go(m.query.next || '/', true); return; }
  if (window.FX) FX.onRoute(m.path);
  if (o.bare) {
    $('#app').innerHTML = '';
    m.route.handler({ el: $('#app'), params: m.params, query: m.query, navId });
    if (window.FX) FX.decorate($('#app'));
    lastPath = m.path; return;
  }
  renderShell();
  const page = $('#page');
  if (o.izin && !App.can(o.izin)) {
    page.className = 'page page-enter';
    page.innerHTML = UI.empty('lock', 'Akses ditolak', 'Peran Anda tidak memiliki izin untuk membuka halaman ini.', '<a class="btn btn-primary" href="#/">Ke Beranda</a>');
    return;
  }
  if (/^\/admin/.test(m.path)) SP.warmUp('admin');
  page.className = 'page' + (o.right ? ' with-right' : '');
  const samePage = lastPath === m.path && o.keepScroll;
  if (!samePage) { page.classList.add('page-enter'); window.scrollTo(0, 0); }
  lastPath = m.path;
  try { await m.route.handler({ el: page, params: m.params, query: m.query, navId, alive: () => navId === Router.navId }); }
  catch (e) { console.error(e); page.innerHTML = UI.errorBox('Terjadi kesalahan saat menampilkan halaman: ' + e.message); }
  if (window.FX && navId === Router.navId) FX.decorate(page);
  if (!samePage) setTimeout(() => page.classList.remove('page-enter'), 400);
}
App.route = route;

/* ---------- Event global: favorit & buka tautan ---------- */
document.addEventListener('click', async e => {
  const f = e.target.closest('[data-fav]');
  if (f) {
    e.preventDefault(); e.stopPropagation();
    if (!Session.me) { Router.go('/masuk'); return; }
    const on = !f.classList.contains('on');
    $$('[data-fav="' + f.dataset.fav + '"]').forEach(x => { x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    const r = await api('favorit.toggle', { id: f.dataset.fav, nilai: on });
    if (!r.success) { $$('[data-fav="' + f.dataset.fav + '"]').forEach(x => x.classList.toggle('on', !on)); UI.toast(r.message, 'err'); return; }
    UI.toast(r.message); SP.cacheDrop('rak'); SP.cacheDrop('kat'); SP.cacheDrop('bd_');
    if (App.home && App.home.stat) { App.home.stat.favorit = Math.max(0, (App.home.stat.favorit || 0) + (on ? 1 : -1)); $('[data-nav]').innerHTML = navHtml(/^\/admin/.test(Router.parse().path)); }
    return;
  }
  const rd = e.target.closest('[data-read]');
  if (rd) {
    e.preventDefault();
    const w = window.open('', '_blank');
    const r = await api('buku.buka', { id: rd.dataset.read });
    if (!r.success) { if (w) w.close(); UI.toast(r.message, 'err'); return; }
    if (r.data.format === 'LINK') { if (w) { w.opener = null; w.location.href = r.data.url; } else location.href = r.data.url; SP.cacheDrop('rak'); }
    else { if (w) w.close(); Router.go('/baca/' + rd.dataset.read); }
  }
});
window.addEventListener('sp:auth-expired', e => {
  App.me = null; UI.toast((e.detail || 'Sesi Anda berakhir.') + ' Silakan masuk kembali.', 'warn');
  const m = Router.resolve();
  if (m && (m.route.opts.auth || m.route.opts.izin)) Router.go('/masuk?next=' + encodeURIComponent(m.path));
  else { renderShell(); loadBoot(true); }
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { const i = $('[data-search] input'); if (i) { e.preventDefault(); i.focus(); } }
});
window.addEventListener('online', () => UI.toast('Koneksi kembali tersambung.'));
window.addEventListener('offline', () => UI.toast('Anda sedang luring.', 'warn'));

/* ---------- Mulai ---------- */
/* Service worker: simpan kerangka aplikasi & pdf.js di perangkat agar kunjungan berikutnya instan */
function registerSW() {
  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost') || LS.get('no_sw', false)) return;
  const go = () => navigator.serviceWorker.register('sw.js').catch(() => {});
  if (document.readyState === 'complete') setTimeout(go, 1500); else window.addEventListener('load', () => setTimeout(go, 1500), { once: true });
}
App.start = async function () {
  registerSW();
  if (!SP.configured()) { showConfigError(); return; }
  if (LS.get('reduce_motion', false)) document.documentElement.classList.add('reduce-motion');
  const c = SP.cacheGet(App.bootKey());
  if (c) setBoot(c.d, false); else { App.me = Session.me; SP.applyTheme(App.settings); }
  if (!Session.token) SP.warmUp('pub');
  window.addEventListener('hashchange', route);
  if (c) { route(); loadBoot(); }
  else { const p = Router.parse().path; if (!/^\/(masuk|lupa-sandi|reset-sandi)/.test(p)) { renderShell(); $('#page').innerHTML = UI.skBlock(300) + '<div class="mt24">' + UI.skCards(5) + '</div>'; } await loadBoot(true); route(); }
};
})();
