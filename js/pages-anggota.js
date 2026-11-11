/* ==========================================================================
   HALAMAN ANGGOTA & PUBLIK
   Masuk · Lupa/Reset sandi · Beranda · Katalog · Detail · Pembaca · Buku Pelajaran
   Koleksi Saya · Riwayat · Rekomendasi · Pengaturan
   ========================================================================== */
(function () {
'use strict';
const { ic, esc, $, $$, fmtN, fmtDate, fmtRel, fmtSize, api, swr, Session, Router, LS, qsBuild } = SP;
const page = App.page;

/* ---------- Adegan hero interaktif (orisinal): maskot Lito di atas tumpukan buku ---------- */
const HS_STACK = '<svg viewBox="0 0 220 74" aria-hidden="true"><rect x="6" y="50" width="208" height="22" rx="4" fill="#4F862B"/><rect x="14" y="55" width="192" height="4" rx="2" fill="#fff" opacity=".75"/><rect x="14" y="63" width="192" height="3" rx="1.5" fill="#fff" opacity=".4"/>' +
  '<rect x="18" y="28" width="186" height="22" rx="4" fill="#E87BA4"/><rect x="26" y="33" width="170" height="4" rx="2" fill="#fff" opacity=".75"/><rect x="40" y="41" width="40" height="4" rx="2" fill="#fff" opacity=".45"/>' +
  '<rect x="30" y="6" width="166" height="22" rx="4" fill="#F2B23A"/><rect x="38" y="11" width="150" height="4" rx="2" fill="#fff" opacity=".75"/><rect x="150" y="19" width="30" height="4" rx="2" fill="#fff" opacity=".45"/></svg>';
const HS_BOOK = '<svg width="54" height="40" viewBox="0 0 54 40" aria-hidden="true"><path d="M3 8q12-6 24 2v28q-12-7-24-2z" fill="#fff"/><path d="M51 8q-12-6-24 2v28q12-7 24-2z" fill="#F3ECFB"/><path d="M8 15q8-3 15 1M8 21q8-3 15 1M31 16q8-4 15-1M31 22q8-4 15-1" stroke="#C9B7E3" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';
const HS_STAR = '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 1l3.6 10.4L29 15l-10.4 3.6L15 29l-3.6-10.4L1 15l10.4-3.6z" fill="#fff"/></svg>';
const HS_LEAF = '<svg width="44" height="48" viewBox="0 0 44 48" aria-hidden="true"><path d="M22 46c0-18 6-30 18-38-3 16-1 28 4 38z" fill="#7DBE55"/><path d="M22 46C17 32 8 26 0 25c7 7 10 14 10 21z" fill="#5E9E34"/></svg>';
function heroScene() {
  return '<div class="hero-art hero-scene">' +
    '<div class="hs-l" data-depth="-10" style="inset:7% 3% 9% 9%"><div class="hs-panel"></div></div>' +
    '<div class="hs-l" data-depth="-20" style="right:6%;top:4%"><span class="hs-sun"></span></div>' +
    '<div class="hs-l" data-depth="30" style="left:3%;top:46%"><span class="hs-float">' + HS_BOOK + '</span></div>' +
    '<div class="hs-l" data-depth="38" style="right:4%;top:44%"><span class="hs-float f2 hs-tile">A</span></div>' +
    '<div class="hs-l" data-depth="22" style="left:58%;top:14%"><span class="hs-float f3">' + HS_STAR + '</span></div>' +
    '<div class="hs-l" data-depth="44" style="right:2%;bottom:6%"><span class="hs-float f4">' + HS_LEAF + '</span></div>' +
    '<div class="hs-l" data-depth="12" style="left:27%;bottom:5%;width:56%"><div class="hs-stack">' + HS_STACK + '</div></div>' +
    '<div class="hs-l" data-depth="8" style="left:30%;bottom:21%"><button class="hs-mascot" type="button" data-mascot data-pose="idle" aria-label="Lito, maskot perpustakaan. Ketuk untuk tips membaca">' + FX.mascot({ size: 158, track: true }) + '</button></div>' +
    '<div class="hs-l" data-depth="5" style="left:1%;top:-5%"><div class="lito-bubble" aria-hidden="true"><span data-tip></span><i class="caret"></i></div></div></div>';
}

/* ============================== MASUK ============================== */
function authTop(right) {
  const s = App.settings;
  return '<header class="auth-top"><a class="brand" href="#/"><span class="brand-logo" style="width:44px;height:44px">' + (s.LOGO_URL ? '<img src="' + esc(s.LOGO_URL) + '" alt="">' : ic('cap', 'lg')) + '</span>' +
    '<span><span class="brand-name">' + esc(s.APP_NAME || 'Smapatispa') + '</span><span class="brand-sub mono" style="display:block;font-size:11.5px">' + esc(s.APP_TAGLINE || 'Perpustakaan Digital') + (s.SCHOOL_NAME ? ' · ' + esc(s.SCHOOL_NAME) : '') + '</span></span></a>' + right + '</header>';
}
function authFoot() {
  const s = App.settings;
  return '<footer class="auth-foot"><span>© ' + new Date().getFullYear() + ' ' + esc(s.SCHOOL_NAME || s.APP_NAME || 'Perpustakaan Digital') + '. Hak cipta dilindungi.</span><a href="#" data-help>Panduan & Bantuan</a><a href="#/katalog">Katalog Publik</a></footer>';
}
function helpModal() {
  const s = App.settings;
  UI.modal({ title: 'Bantuan masuk', body: '<div class="stack gap12"><div class="alert">' + ic('cap') + '<div><b>Siswa</b> masuk dengan NISN 10 digit yang terdaftar di data sekolah, tanpa kata sandi.</div></div>' +
    '<div class="alert green">' + ic('user') + '<div><b>Guru & staf</b> masuk dengan email atau username dan kata sandi dari admin. Lupa sandi? Pakai tautan "Lupa kata sandi".</div></div>' +
    '<p class="muted">NISN belum terdaftar atau akun bermasalah? Hubungi pustakawan' + (s.KONTAK_BANTUAN ? ': <b>' + esc(s.KONTAK_BANTUAN) + '</b>' : ' di ruang perpustakaan') + '.</p></div>',
    foot: '<button class="btn btn-primary" data-close>Mengerti</button>' });
}
page('/masuk', ctx => {
  const s = App.settings, tgl = s.LOGIN_SISWA_TGL_LAHIR === 'on', q = ctx.query;
  SP.warmUp('pub');
  const total = (App.ref.kategori || []).reduce((a, k) => a + (k.jumlah || 0), 0);
  ctx.el.innerHTML = '<div class="auth-page"><div class="auth-deco" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' + authTop('<div class="row"><span class="top-chip hide-m" style="background:#fff">' + ic('shield', 'sm') + 'Akses aman warga sekolah</span><a href="#" class="btn btn-ghost" data-help>' + ic('help') + '<span class="hide-m">Bantuan</span></a></div>') +
    '<main class="auth-main"><div style="width:min(560px,100%)"><div class="auth-card" data-card><div class="auth-mascot">' + FX.mascot({ size: 72, label: 'Lito, maskot perpustakaan' }) + '</div><div class="auth-logo">' + (s.LOGO_URL ? '<img src="' + esc(s.LOGO_URL) + '" alt="">' : ic('logo', 'xl')) + '</div>' +
    '<h1>Masuk ke Perpustakaan Digital</h1><p class="sub">' + esc(s.SCHOOL_NAME ? s.SCHOOL_NAME + ' (' + s.APP_NAME + ')' : s.APP_NAME + ' — ' + s.APP_TAGLINE) + '</p>' +
    '<div class="seg full mt24" data-seg role="tablist"><button type="button" class="' + (q.mode !== 'staf' ? 'on' : '') + '" data-v="siswa" role="tab">' + ic('idcard', 'sm') + 'Siswa (NISN)</button><button type="button" class="' + (q.mode === 'staf' ? 'on' : '') + '" data-v="staf" role="tab">' + ic('cap', 'sm') + 'Staf / Guru (Email)</button></div>' +
    '<form data-f="siswa" class="stack gap16 mt24 ' + (q.mode === 'staf' ? 'hide' : '') + '" novalidate><div class="field"><label for="nisn">Nomor Induk Siswa Nasional (NISN)</label>' +
    '<div class="inp-wrap">' + ic('keypad') + '<input id="nisn" class="inp mono" inputmode="numeric" maxlength="10" autocomplete="username" placeholder="Contoh: 0071234567" style="height:52px;font-size:16px;padding-right:56px"><span class="suffix mono small muted" data-cnt>0/10</span></div></div>' +
    (tgl ? '<div class="field"><label for="tgl">Tanggal lahir</label><input id="tgl" class="inp" type="date" required></div>' : '') +
    '<div class="alert green">' + ic('checkc') + '<div><b style="color:var(--c-accent-ink)">Tanpa kata sandi.</b> Cukup NISN yang terdaftar di data sekolah' + (tgl ? ' dan tanggal lahir Anda' : '') + '.</div></div>' +
    '<div class="err-text" data-err role="alert"></div><button class="btn btn-primary btn-lg btn-block">Masuk dengan NISN ' + ic('arrowr', 'sm') + '</button></form>' +
    '<form data-f="staf" class="stack gap16 mt24 ' + (q.mode === 'staf' ? '' : 'hide') + '" novalidate><div class="field"><label for="sid">Email atau username</label><div class="inp-wrap">' + ic('mail') + '<input id="sid" class="inp" autocomplete="username" placeholder="nama@sekolah.sch.id" style="height:48px"></div></div>' +
    '<div class="field"><label for="spw">Kata sandi</label><div class="inp-wrap">' + ic('lock') + '<input id="spw" class="inp" type="password" autocomplete="current-password" style="height:48px;padding-right:48px"><button type="button" class="btn-icon sm suffix" data-eye aria-label="Tampilkan kata sandi">' + ic('eye', 'sm') + '</button></div>' +
    '<a href="#/lupa-sandi" class="small" style="align-self:flex-end;margin-top:4px">Lupa kata sandi?</a></div><div class="err-text" data-err role="alert"></div>' +
    '<button class="btn btn-primary btn-lg btn-block">Masuk ' + ic('arrowr', 'sm') + '</button></form>' +
    '<div class="or">ATAU</div><a class="btn btn-outline-p btn-lg btn-block" href="#/">' + ic('compass', 'sm') + 'Lanjutkan sebagai Tamu (Jelajah Katalog Publik)</a>' +
    '<hr class="divider" style="margin:24px 0 16px"><p class="small muted row top">' + ic('headset', 'sm') + '<span>Butuh bantuan akun atau NISN tidak terdaftar? Hubungi <b style="color:var(--c-text)">Pustakawan ' + esc(s.APP_NAME) + '</b>' + (s.KONTAK_BANTUAN ? ' — <b style="color:var(--c-primary-ink)">' + esc(s.KONTAK_BANTUAN) + '</b>' : ' di ruang perpustakaan') + '.</span></p></div>' +
    '<div class="auth-meta"><span><span class="online-dot" style="display:inline-block;margin-right:6px"></span>Katalog: ' + fmtN(total) + ' judul</span><span>Versi ' + SP.VERSION + ' · TA ' + esc(s.TAHUN_AJARAN || '') + '</span></div></div></main>' + authFoot() + '</div>';
  const el = ctx.el;
  $$('[data-help]', el).forEach(a => a.addEventListener('click', e => { e.preventDefault(); helpModal(); }));
  UI.segInit($('[data-seg]', el), v => { $$('[data-f]', el).forEach(f => f.classList.toggle('hide', f.dataset.f !== v)); setTimeout(() => $(v === 'siswa' ? '#nisn' : '#sid', el).focus(), 50); });
  const nisn = $('#nisn', el);
  nisn.addEventListener('input', () => { nisn.value = nisn.value.replace(/\D/g, '').slice(0, 10); $('[data-cnt]', el).textContent = nisn.value.length + '/10'; });
  // Maskot: mata mengikuti isian, menutup mata saat kata sandi diketik
  const lito = $('.auth-mascot .lito', el), card = $('[data-card]', el), spw = $('#spw', el);
  const peekAt = (inp, max) => { if (/lito-(cover|peek)/.test(lito.className)) FX.pose(lito, 'idle'); FX.look(lito, -6 + 12 * Math.min(1, inp.value.length / max), 5); };
  [[nisn, 10], [$('#sid', el), 24]].forEach(x => { ['focus', 'input'].forEach(ev => x[0].addEventListener(ev, () => peekAt(x[0], x[1]))); x[0].addEventListener('blur', () => FX.look(lito, 0, 0)); });
  spw.addEventListener('focus', () => { FX.look(lito, 0, 0); FX.pose(lito, spw.type === 'password' ? 'cover' : 'peek'); });
  spw.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== spw) FX.pose(lito, 'idle'); }, 120));
  const fail = () => { FX.pose(lito, 'sad'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); setTimeout(() => FX.pose(lito, document.activeElement === spw ? 'cover' : 'idle'), 1600); };
  $('[data-eye]', el).addEventListener('click', () => { spw.type = spw.type === 'password' ? 'text' : 'password'; FX.pose(lito, spw.type === 'password' ? 'cover' : 'peek'); spw.focus(); });
  const done = r => {
    FX.pose(lito, 'cheer'); FX.jump(lito); FX.burst(lito, 14);
    Session.set(r.data.token, r.data.me); App.me = r.data.me; SP.cacheDrop('boot_tamu');
    UI.toast('Selamat datang, ' + r.data.me.nama.split(' ')[0] + '!');
    const next = q.next && /^\/[\w\-/?=&%.]*$/.test(q.next) ? q.next : (r.data.me.staf && !r.data.me.izin.includes('baca') ? App.adminHome() : '/');
    App.reloadBoot().then(() => Router.go(next));
  };
  $('[data-f=siswa]', el).addEventListener('submit', async e => {
    e.preventDefault(); const err = $('[data-err]', e.target); err.textContent = '';
    if (nisn.value.length !== 10) { err.textContent = 'NISN harus 10 digit angka.'; fail(); nisn.focus(); return; }
    const b = $('button.btn-primary', e.target); UI.btnBusy(b, true, 'Memeriksa NISN…');
    const r = await api('auth.siswa', { nisn: nisn.value, tgl: tgl ? $('#tgl', el).value : '' });
    UI.btnBusy(b, false);
    if (!r.success) { err.textContent = r.message; fail(); nisn.focus(); return; }
    done(r);
  });
  $('[data-f=staf]', el).addEventListener('submit', async e => {
    e.preventDefault(); const err = $('[data-err]', e.target); err.textContent = '';
    const id = $('#sid', el).value.trim(), pw = $('#spw', el).value;
    if (!id || !pw) { err.textContent = 'Isi email/username dan kata sandi.'; return; }
    const b = $('button.btn-primary', e.target); UI.btnBusy(b, true, 'Masuk…');
    const r = await api('auth.staf', { id, sandi: pw, origin: location.origin + location.pathname });
    UI.btnBusy(b, false);
    if (!r.success) { err.textContent = r.message; fail(); $('#spw', el).select(); return; }
    done(r);
  });
  setTimeout(() => (q.mode === 'staf' ? $('#sid', el) : nisn).focus(), 400);
}, { bare: true, guestOnly: true });

page('/lupa-sandi', ctx => {
  ctx.el.innerHTML = '<div class="auth-page"><div class="auth-deco" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' + authTop('<a class="btn btn-outline" href="#/masuk?mode=staf">' + ic('arrowl', 'sm') + 'Kembali ke Login</a>') +
    '<main class="auth-main"><div style="width:min(560px,100%)"><div class="auth-card" data-card><div class="auth-logo">' + ic('reset', 'xl') + '</div><h1>Pemulihan Kata Sandi</h1>' +
    '<p class="sub">Khusus Guru, Pustakawan, dan Tenaga Kependidikan</p><div class="alert mt24">' + ic('info') + '<div><b>Perhatian untuk Siswa:</b> akun siswa masuk menggunakan NISN tanpa kata sandi. Jika ada kendala NISN, hubungi pustakawan.</div></div>' +
    '<form class="stack gap12 mt24" novalidate><div class="field"><label for="em">Alamat email terdaftar</label><div class="inp-wrap">' + ic('mail') + '<input id="em" class="inp" type="email" autocomplete="email" placeholder="nama.guru@sekolah.sch.id" style="height:50px"></div>' +
    '<span class="help mono">' + ic('checkc', 'sm') + ' Masukkan email yang terdaftar pada sistem sekolah</span></div><div class="err-text" data-err role="alert"></div>' +
    '<button class="btn btn-primary btn-lg btn-block">' + ic('send', 'sm') + 'Kirim Tautan Reset</button></form>' +
    '<hr class="divider" style="margin:24px 0 16px"><p class="small muted row top">' + ic('headset', 'sm') + '<span>Tidak menerima email? Periksa folder spam atau hubungi admin perpustakaan.</span></p></div>' +
    '<div class="auth-cards"><div class="info-card row">' + ic('shield', 'lg') + '<div><b>Autentikasi aman</b><div class="mono xs muted">Sandi disimpan ter-hash</div></div></div>' +
    '<div class="info-card row">' + ic('clock', 'lg') + '<div><b>Batas waktu</b><div class="mono xs muted">Tautan kedaluwarsa 15 menit</div></div></div></div></div></main>' + authFoot() + '</div>';
  $$('[data-help]', ctx.el).forEach(a => a.addEventListener('click', e => { e.preventDefault(); helpModal(); }));
  $('form', ctx.el).addEventListener('submit', async e => {
    e.preventDefault(); const em = $('#em', ctx.el).value.trim(), err = $('[data-err]', ctx.el);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { err.textContent = 'Masukkan alamat email yang valid.'; return; }
    const b = $('button.btn-primary', ctx.el); UI.btnBusy(b, true, 'Mengirim…');
    const r = await api('auth.lupa', { email: em }); UI.btnBusy(b, false);
    if (!r.success) { err.textContent = r.message; return; }
    $('[data-card]', ctx.el).innerHTML = '<div class="auth-logo" style="background:var(--c-accent-soft);color:var(--c-accent-ink)">' + ic('mail', 'xl') + '</div><h1>Periksa Email Anda</h1><p class="sub">' + esc(r.message) + '</p>' +
      '<div class="alert mt24">' + ic('clock') + '<div>Tautan berlaku <b>15 menit</b> dan hanya dapat dipakai sekali.</div></div><a class="btn btn-primary btn-lg btn-block mt24" href="#/masuk?mode=staf">Kembali ke Login</a>';
  });
}, { bare: true });

page('/reset-sandi', ctx => {
  const t = ctx.query.t || '';
  ctx.el.innerHTML = '<div class="auth-page"><div class="auth-deco" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' + authTop('<a class="btn btn-outline" href="#/masuk?mode=staf">' + ic('arrowl', 'sm') + 'Ke Login</a>') +
    '<main class="auth-main"><div class="auth-card" data-card><div class="auth-logo">' + ic('key', 'xl') + '</div><h1>Buat Kata Sandi Baru</h1><p class="sub">Minimal 8 karakter, berisi huruf dan angka.</p>' +
    (t ? '<form class="stack gap16 mt24" novalidate><div class="field"><label for="p1">Kata sandi baru</label><input id="p1" class="inp" type="password" autocomplete="new-password" style="height:48px"></div>' +
      '<div class="field"><label for="p2">Ulangi kata sandi</label><input id="p2" class="inp" type="password" autocomplete="new-password" style="height:48px"></div><div class="err-text" data-err role="alert"></div>' +
      '<button class="btn btn-primary btn-lg btn-block">Simpan Kata Sandi</button></form>' : '<div class="alert red mt24">' + ic('alert') + '<div>Tautan tidak lengkap. Minta tautan pemulihan baru.</div></div>') + '</div></main>' + authFoot() + '</div>';
  const f = $('form', ctx.el); if (!f) return;
  f.addEventListener('submit', async e => {
    e.preventDefault(); const a = $('#p1', ctx.el).value, b2 = $('#p2', ctx.el).value, err = $('[data-err]', ctx.el);
    if (a.length < 8 || !/[A-Za-z]/.test(a) || !/\d/.test(a)) { err.textContent = 'Kata sandi minimal 8 karakter dan memuat huruf serta angka.'; return; }
    if (a !== b2) { err.textContent = 'Kedua kata sandi tidak sama.'; return; }
    const btn = $('button', f); UI.btnBusy(btn, true, 'Menyimpan…');
    const r = await api('auth.reset', { t, sandi: a }); UI.btnBusy(btn, false);
    if (!r.success) { err.textContent = r.message; return; }
    UI.toast(r.message); Router.go('/masuk?mode=staf');
  });
}, { bare: true });

/* ============================== BERANDA ============================== */
function annHtml(list) {
  if (!list || !list.length) return '<p class="muted small">Belum ada pengumuman.</p>';
  return list.slice(0, 3).map(p => '<div class="ann"><div class="row between"><span class="badge ' + (p.prioritas === 'PENTING' ? 'b-red' : 'b-solid') + '" style="border-radius:3px">' + (p.prioritas === 'PENTING' ? 'Penting' : p.sematkan ? 'Agenda Sekolah' : 'Info') + '</span><span class="mono xs muted">' + fmtDate(p.waktu) + '</span></div>' +
    '<h4>' + esc(p.judul) + '</h4><p class="clamp3">' + esc(p.isi) + '</p></div>').join('');
}
function bookRowSmall(b, label) {
  return '<a class="nb" href="#/buku/' + esc(b.id) + '"><div>' + UI.cover(b, 6) + '</div><div style="min-width:0"><div class="k">' + esc(label || b.alasan2 || '') + '</div><div class="t clamp2">' + esc(b.judul) + '</div>' +
    '<div class="m">' + (b.st === 'BACA' ? b.prog + '% · Hal ' + (b.halBaca || 0) + (b.totalHal ? '/' + b.totalHal : '') : esc(b.penulis || b.mapelNama || '')) + '</div></div></a>';
}
function shelf(items, kind) { return '<div class="shelf">' + items.map((b, i) => kind === 'h' ? UI.hCard(b) : UI.miniCard(b, i)).join('') + '</div>'; }
function heroHtml() {
  const s = App.settings, words = String(s.BANNER_JUDUL || 'Buku Terpopuler Bulan Ini').split(/\s+/).map((w, i) => '<span class="w" style="--i:' + i + '">' + esc(w) + '</span>').join(' ');
  return '<section class="hero"><span class="hero-glow" aria-hidden="true"></span><span class="blob b1" aria-hidden="true"></span><span class="blob b2" aria-hidden="true"></span>' +
    '<div class="hero-copy"><span class="eyebrow">' + ic('sparkles', 'sm') + 'Rekomendasi ' + esc(s.KURIKULUM || '') + '</span><h1 class="hero-title">' + words + '</h1>' +
    '<p>' + esc(s.BANNER_TEKS || '') + '</p><div class="row wrap mt24" style="gap:12px"><a class="btn btn-accent btn-lg btn-shine" href="#/katalog?urut=bulan">Lihat Sekarang ' + ic('arrowr', 'sm') + '</a>' +
    '<button class="btn btn-lg btn-outline-w" data-guide>Panduan Membaca</button></div></div>' + heroScene() +
    '<span class="hero-mini" aria-hidden="true">' + FX.mascot({ size: 84, pose: 'wave' }) + '</span></section>';
}
function guideModal() {
  UI.modal({ title: 'Panduan membaca', wide: true, body: '<div class="grid2">' + [['search', 'Cari buku', 'Ketik judul, penulis, ISBN, atau materi di kolom pencarian. Saring katalog berdasarkan kategori, format, dan akses.'],
    ['cap', 'Buku Pelajaran', 'Pilih tingkat (X, XI, XII), kelas, dan mata pelajaran untuk menemukan buku siswa, modul, dan lembar kerja.'],
    ['open', 'Baca & lanjutkan', 'Tekan Baca Sekarang. Halaman terakhir tersimpan otomatis sehingga Anda bisa melanjutkan di perangkat lain.'],
    ['heart', 'Simpan favorit', 'Ketuk ikon hati untuk menyimpan buku ke Koleksi Saya agar mudah ditemukan lagi.'],
    ['bookmark', 'Tandai halaman', 'Di pembaca, gunakan Tandai Halaman dan Daftar Isi untuk berpindah bab dengan cepat.'],
    ['lock', 'Akses buku', 'Publik: semua orang. Terdaftar: setelah masuk. Khusus Sekolah: warga sekolah. Terbatas: kelompok tertentu.']]
    .map(x => '<div class="row top gap12"><span class="stat" style="padding:0;border:0"><span class="ico" style="width:44px;height:44px">' + ic(x[0]) + '</span></span><div><b>' + x[1] + '</b><p class="muted small mt8">' + x[2] + '</p></div></div>').join('') + '</div>',
    foot: '<button class="btn btn-primary" data-close>Mulai Menjelajah</button>' });
}
function renderBeranda(ctx) {
  const el = ctx.el, me = Session.me, h = App.home;
  if (!h) { el.innerHTML = UI.skBlock(300); return; }
  let main = '', right = '';
  if (!me) {
    main = heroHtml() +
      '<div class="stats"><div class="stat"><span class="ico">' + ic('book', 'lg') + '</span><div><div class="v" data-count="' + h.stat.koleksi + '">0</div><div class="l">Koleksi Buku Digital</div><div class="m">● Diperbarui berkala</div></div></div>' +
      '<div class="stat"><span class="ico g">' + ic('users', 'lg') + '</span><div><div class="v" data-count="' + h.stat.penulis + '">0</div><div class="l">Penulis Terdaftar</div><div class="m" style="color:var(--c-muted)">Karya siswa & guru</div></div></div>' +
      '<div class="stat"><span class="ico">' + ic('open', 'lg') + '</span><div><div class="v" data-count="' + h.stat.hariIni + '" data-suf="">0</div><div class="l">Sesi Baca Hari Ini</div><div class="m">Aktif di seluruh kelas</div></div></div></div>' +
      '<section class="panel section"><div class="sec-head"><div class="sec-title"><span class="bar"></span>Populer <span class="badge b-white b-mono">' + h.populer.length + ' Buku Tren</span></div><a class="link-more" href="#/katalog?urut=bulan">Lihat semua ' + ic('right', 'sm') + '</a></div>' +
      (h.populer.length ? shelf(h.populer) : UI.empty('book', 'Koleksi masih kosong', 'Buku yang diterbitkan pustakawan akan tampil di sini.')) + '</section>' +
      (h.penulis.length ? '<section class="panel section"><div class="sec-head"><div class="sec-title"><span class="bar"></span>Penulis Teratas</div><span class="muted small hide-m">Penulis yang karyanya paling banyak dibaca</span></div><div class="authors">' + h.penulis.map(UI.authorItem).join('') + '</div></section>' : '');
    right = '<div class="rp-sec"><div class="rp-head"><h3>Warta Perpustakaan</h3><span class="btn-icon sm" style="border-color:var(--c-primary-line);background:var(--c-primary-soft);color:var(--c-primary)">' + ic('megaphone', 'sm') + '</span></div>' + annHtml(App.pengumuman) + '</div>' +
      '<div class="rp-sec"><div class="hero" style="display:block;min-height:0;padding:22px"><div class="mono xs" style="letter-spacing:.12em;color:#EADDFB">AKSES PENUH</div><h3 style="font-size:20px;margin:10px 0 8px">Masuk untuk koleksi warga sekolah</h3>' +
      '<p style="font-size:14px;padding-right:46px">Lanjutkan bacaan, simpan favorit, dan akses buku pelajaran kelasmu.</p><a class="btn btn-accent btn-block mt16 btn-shine" href="#/masuk">Masuk Sekarang</a><span class="peek-m" style="bottom:62px;right:6px">' + FX.mascot({ size: 58, pose: 'wave', label: 'Lito melambai' }) + '</span></div></div>' +
      (h.rekomendasi.length ? '<div class="rp-sec"><div class="rp-head"><h3>' + ic('open') + 'Buku Rekomendasi</h3><span class="mono xs muted">Kurasi Guru</span></div>' + h.rekomendasi.map(b => bookRowSmall(b, b.guruNama ? 'Rek. ' + b.guruNama : b.katNama)).join('') + '</div>' : '') +
      '<div class="rp-sec"><div class="info-card"><b class="row">' + ic('shield', 'sm') + 'Layanan Digital 24/7</b><p class="small muted mt8">Katalog terbuka untuk semua pengunjung. Siswa memakai NISN terdaftar untuk akses penuh dari rumah.</p>' +
      '<div class="mono xs muted mt12">TA ' + esc(App.settings.TAHUN_AJARAN) + ' · Versi ' + SP.VERSION + '</div></div></div>';
  } else {
    const L = h.lanjut[0];
    main = (L ? '<section class="continue"><div style="max-width:150px;position:relative">' + UI.cover(L, 15) + '<span class="badge b-dark b-mono" style="position:absolute;right:6px;bottom:6px">' + esc(L.format) + '</span></div>' +
      '<div style="min-width:0"><div class="row wrap"><span class="badge b-green" style="font-size:13px">Sedang Dibaca</span><span class="muted small mono">• ' + esc(L.jenis === 'PELAJARAN' ? (L.tipe || 'Buku Pelajaran') : (L.katNama || 'Bacaan')) + '</span></div>' +
      '<h2 class="clamp2">' + esc(L.judul) + '</h2><p class="muted">' + esc(L.penulis || '') + (L.tahun ? ' • ' + esc(L.tahun) : '') + '</p>' +
      '<div class="row between mt16 mono small"><span>Progres ' + L.prog + '%</span><span class="muted">Halaman ' + (L.halBaca || 0) + (L.totalHal ? ' dari ' + L.totalHal : '') + '</span></div><div class="progress mt8"><i style="width:' + L.prog + '%"></i></div>' +
      '<div class="mono xs muted mt8">Terakhir dibaca ' + fmtRel(L.terakhir) + '</div></div>' +
      '<div class="acts"><a class="btn btn-accent btn-lg" href="#/baca/' + esc(L.id) + '">Lanjutkan Membaca ' + ic('arrowr', 'sm') + '</a><a class="btn btn-outline btn-lg" href="#/buku/' + esc(L.id) + '">' + ic('list', 'sm') + 'Detail Buku</a></div></section>' : heroHtml()) +
      '<div class="grid3 mt24" style="gap:16px">' +
      '<div class="stat2"><div><div class="t">Tahun Ajaran ' + esc(App.settings.TAHUN_AJARAN) + '</div><div class="v" data-count="' + h.stat.selesai + '">0</div><div class="l">Buku Selesai</div></div><span class="ico" style="background:var(--c-primary-soft);color:var(--c-primary)">' + ic('checkc', 'xl') + '</span></div>' +
      '<div class="stat2"><div><div class="t">Aktif di Rak Saya</div><div class="v" data-count="' + h.stat.sedang + '">0</div><div class="l g">Sedang Dibaca</div></div><span class="ico" style="background:var(--c-accent-soft);color:var(--c-accent-ink)">' + ic('open', 'xl') + '</span></div>' +
      '<div class="stat2"><div><div class="t">Pencapaian Bulan Ini</div><div class="v" data-count="' + h.stat.jam + '">0</div><div class="l y">Jam Membaca</div></div><span class="ico" style="background:#FFF1CC;color:#8A5A00">' + ic('clock', 'xl') + '</span></div></div>' +
      '<section class="section"><div class="sec-head"><div class="row wrap"><h2 style="font-size:22px">' + (me.tingkat ? 'Rekomendasi Untuk Kelas ' + esc(me.tingkat) : 'Rekomendasi Untuk Anda') + '</h2>' + (me.kelas ? '<span class="badge b-white b-mono">' + esc(me.kelas) + '</span>' : '') + '</div>' +
      '<a class="link-more p" href="#/' + (me.tingkat ? 'pelajaran' : 'rekomendasi') + '">Lihat Semua ' + ic('right', 'sm') + '</a></div><hr class="divider" style="margin-top:0">' +
      (h.rekomendasi.length ? '<div class="book-grid">' + h.rekomendasi.slice(0, 8).map(UI.bookCard).join('') + '</div>' : UI.empty('sparkles', 'Belum ada rekomendasi', 'Rekomendasi guru dan buku pelajaran kelasmu akan muncul di sini.')) + '</section>' +
      '<section class="section"><div class="sec-head"><div class="row"><h2 style="font-size:22px">Buku Terbaru Ditambahkan</h2><span class="badge b-purple b-mono">Terbaru</span></div><a class="link-more p" href="#/katalog?urut=terbaru">Lihat Semua ' + ic('right', 'sm') + '</a></div>' +
      (h.terbaru.length ? shelf(h.terbaru, 'h').replace('class="shelf"', 'class="shelf" style="grid-auto-columns:minmax(300px,1fr)"') : '<p class="muted">Belum ada buku.</p>') + '</section>' +
      (h.penulis && h.penulis.length ? '<section class="panel section"><div class="sec-head"><div class="sec-title"><span class="bar"></span>Penulis Teratas</div></div><div class="authors">' + h.penulis.map(UI.authorItem).join('') + '</div></section>' : '');
    const jam = new Date().getHours(), salam = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 18 ? 'Selamat sore' : 'Selamat malam';
    right = '<div class="rp-sec"><div class="lito-card"><button class="lc-m" type="button" data-mascot="[data-tip2]" data-pose="idle" aria-label="Lito, maskot perpustakaan. Ketuk untuk tips">' + FX.mascot({ size: 74, track: true }) + '</button>' +
      '<div style="min-width:0"><b>' + salam + ', ' + esc(me.nama.split(' ')[0]) + '!</b><p class="small" data-tip2></p></div></div></div>' +
      '<div class="rp-sec"><div class="rp-head"><h3>Pengumuman</h3><span class="mono xs muted">Pustakawan</span></div>' + annHtml(App.pengumuman) + '</div>' +
      '<div class="rp-sec"><div class="rp-head"><h3>' + ic('list') + 'Buku Berikutnya</h3><span class="mono xs muted">' + h.berikutnya.length + ' Antrean</span></div>' +
      (h.berikutnya.length ? h.berikutnya.map((b, i) => bookRowSmall(b, i === 0 ? 'Prioritas 1 · ' + (b.alasan2 || '') : b.alasan2)).join('') : '<p class="small muted">Simpan buku ke favorit atau tunggu rekomendasi guru — antreanmu tampil di sini.</p>') + '</div>' +
      (Session.can('rekomendasi.kirim') && !me.tingkat ? '<div class="rp-sec"><div class="info-card"><b class="row">' + ic('sparkles', 'sm') + 'Rekomendasikan ke kelas</b><p class="small muted mt8">Buka detail buku lalu tekan <b>Rekomendasikan ke Kelas</b> untuk mengirimnya ke siswa tingkat/kelas tertentu.</p></div></div>' : '') +
      '<div class="rp-sec"><div class="info-card"><b class="row">' + ic('target', 'sm') + 'Ringkasan Saya</b><div class="kv mt8"><span>Favorit</span><b>' + fmtN(h.stat.favorit) + '</b></div><div class="kv"><span>Sedang dibaca</span><b>' + fmtN(h.stat.sedang) + '</b></div><div class="kv"><span>Selesai (TA ini)</span><b>' + fmtN(h.stat.selesai) + '</b></div></div></div>';
  }
  el.innerHTML = '<div style="min-width:0">' + main + '</div><aside class="right-panel">' + right + '</aside>';
  UI.countUp(el);
  FX.decorate(el);
  $$('[data-guide]', el).forEach(b => b.addEventListener('click', guideModal));
}
page('/', ctx => {
  renderBeranda(ctx);
  const again = () => { if (ctx.alive()) { renderBeranda(ctx); App.on('boot', again); } };
  App.on('boot', again);
  App.reloadBoot();
}, { right: true });

/* ============================== KATALOG ============================== */
const URUT = [['populer', 'Paling Populer'], ['bulan', 'Populer Bulan Ini'], ['terbaru', 'Terbaru'], ['judul', 'Judul A–Z'], ['tahun', 'Tahun Terbit']];
page('/katalog', async ctx => {
  const q = Object.assign({ urut: 'populer', hal: '1' }, ctx.query), el = ctx.el, ref = App.ref;
  let view = LS.get('kat_view', 'card'), penulisList = LS.get('c_penulis_list', null);
  const total = ref.kategori.reduce((s, k) => s + (k.jumlah || 0), 0);
  const setQ = (patch, keepPage) => { const n = Object.assign({}, q, patch); if (!keepPage) n.hal = '1'; Router.go('/katalog' + qsBuild(n)); };
  const chip = (key, val, label) => '<button class="chip ' + ((q[key] || '') === val ? 'on' : '') + '" data-k="' + key + '" data-v="' + val + '">' + label + '</button>';
  el.innerHTML = '<div class="crumbs"><a href="#/">Beranda</a>' + ic('right', 'sm') + '<b>Eksplorasi Katalog</b></div>' +
    '<div class="page-head"><div><h1 class="page-title">' + (q.q ? 'Hasil pencarian "' + esc(q.q) + '"' : 'Katalog Koleksi Digital') + '</h1><p class="page-sub">Jelajahi ' + fmtN(total) + ' koleksi buku pelajaran, sains, sastra, dan referensi umum.</p></div>' +
    '<div class="row"><span class="badge b-white b-mono" style="padding:6px 12px;font-size:12px"><span class="dot" style="color:var(--c-accent)"></span>Koleksi Terindeks: <b data-total>…</b> Judul</span><button class="btn btn-outline btn-sm" data-csv>' + ic('download', 'sm') + 'Ekspor (CSV)</button></div></div>' +
    '<div class="filters"><div class="grid">' +
    '<div class="field"><span class="lbl-mono">Kategori utama</span><select class="sel" data-sel="kategori"><option value="">Semua Kategori</option>' + ref.kategori.map(k => '<option value="' + esc(k.id) + '" ' + (q.kategori === k.id ? 'selected' : '') + '>' + esc(k.nama) + ' (' + (k.jumlah || 0) + ')</option>').join('') + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Penulis / pengarang</span><select class="sel" data-sel="penulis"><option value="">Semua Penulis</option></select></div>' +
    '<div class="field"><span class="lbl-mono">Urutan katalog</span><select class="sel" data-sel="urut">' + URUT.map(u => '<option value="' + u[0] + '" ' + (q.urut === u[0] ? 'selected' : '') + '>' + u[1] + '</option>').join('') + '</select></div>' +
    '<div class="row" style="align-self:end"><button class="btn btn-ghost" data-reset>' + ic('refresh', 'sm') + 'Reset</button><span class="grow"></span><div class="view-toggle" role="group" aria-label="Tampilan"><button data-view="card" class="' + (view === 'card' ? 'on' : '') + '">' + ic('grid', 'sm') + 'Card</button><button data-view="list" class="' + (view === 'list' ? 'on' : '') + '">' + ic('list', 'sm') + 'List</button></div></div></div>' +
    '<div class="chips-row"><span class="lbl-mono">Akses:</span>' + chip('akses', '', 'Semua Akses') + chip('akses', 'PUBLIK', '● Publik') + chip('akses', 'TERDAFTAR', 'Pengguna Terdaftar') + chip('akses', 'SEKOLAH', 'Khusus Warga Sekolah') + (Session.me ? chip('akses', 'TERBATAS', ic('lock', 'sm') + ' Akses Terbatas') : '') + '</div>' +
    '<div class="chips-row"><span class="lbl-mono">Format:</span>' + chip('format', '', 'Semua Format').replace('class="chip', 'class="chip mono') + chip('format', 'PDF', 'PDF (E-Book)').replace('class="chip', 'class="chip mono') + chip('format', 'EPUB', 'EPUB').replace('class="chip', 'class="chip mono') + chip('format', 'LINK', 'Tautan Eksternal').replace('class="chip', 'class="chip mono') +
    '<span class="lbl-mono" style="margin-left:12px">Jenis:</span>' + chip('jenis', '', 'Semua') + chip('jenis', 'UMUM', 'Bacaan Umum') + chip('jenis', 'PELAJARAN', 'Buku Pelajaran') + '</div></div>' +
    '<div data-res>' + (view === 'card' ? UI.skCards(8) : UI.skRows(8)) + '</div>';
  const fillPenulis = list => { const s = $('[data-sel=penulis]', el); s.innerHTML = '<option value="">Semua Penulis</option>' + list.map(p => '<option value="' + esc(p.id) + '" ' + (q.penulis === p.id ? 'selected' : '') + '>' + esc(p.nama) + '</option>').join(''); };
  if (penulisList) fillPenulis(penulisList.d || []);
  $$('[data-sel]', el).forEach(s => s.addEventListener('change', () => setQ({ [s.dataset.sel]: s.value })));
  $$('.chips-row [data-k]', el).forEach(b => b.addEventListener('click', () => setQ({ [b.dataset.k]: b.dataset.v })));
  $('[data-reset]', el).addEventListener('click', () => Router.go('/katalog'));
  $$('[data-view]', el).forEach(b => b.addEventListener('click', () => { view = b.dataset.view; LS.set('kat_view', view); $$('[data-view]', el).forEach(x => x.classList.toggle('on', x === b)); if (last) draw(last); }));
  let last = null;
  const draw = d => {
    last = d;
    $('[data-total]', el).textContent = fmtN(d.total);
    const res = $('[data-res]', el);
    if (!d.items.length) { res.innerHTML = '<div class="panel">' + UI.empty('search', 'Tidak ada buku yang cocok', 'Coba kata kunci lain atau hapus beberapa filter.', '<button class="btn btn-outline" data-reset2>Reset filter</button>') + '</div>'; $('[data-reset2]', res).onclick = () => Router.go('/katalog'); return; }
    const pg = UI.pager({ total: d.total, hal: d.hal, halaman: d.halaman, per: d.per, unit: 'buku' });
    if (view === 'card') res.innerHTML = '<div class="book-grid">' + d.items.map(UI.bookCard).join('') + '</div><div class="pager-card">' + pg + '</div>';
    else res.innerHTML = '<div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl cards"><thead><tr><th>Sampul & judul buku</th><th>Penulis & penerbit</th><th>Kategori & rak</th><th>Tahun & ISBN</th><th>Format</th><th></th></tr></thead><tbody>' +
      d.items.map(b => '<tr><td data-l="Judul"><div class="row gap12"><div class="thumb">' + UI.cover(b, 6) + '</div><div style="min-width:0"><a href="#/buku/' + esc(b.id) + '" style="font-weight:700;color:var(--c-text)" class="clamp2">' + esc(b.judul) + '</a>' +
        '<div class="mono xs mt8">' + (b.st === 'BACA' ? '<span style="color:var(--c-accent-ink)">● Sedang Dibaca</span> <span class="progress thin" style="display:inline-block;width:80px;vertical-align:middle"><i style="width:' + b.prog + '%"></i></span> ' + b.prog + '%' : b.jenis === 'PELAJARAN' ? esc((b.tipe || 'Pelajaran') + ' · ' + (b.tingkat || []).join('/')) : esc(b.bahasa || '')) + (!b.baca ? ' <span style="color:var(--c-warn)">' + ic('lock', 'sm') + '</span>' : '') + '</div></div></div></td>' +
        '<td data-l="Penulis"><div>' + esc(b.penulis || '-') + '</div><div class="muted small">' + esc(b.penerbit || '') + '</div></td>' +
        '<td data-l="Kategori"><div>' + esc(b.mapelNama || b.katNama || '-') + '</div>' + (b.rak ? '<span class="badge b-gray b-mono">' + ic('book', 'sm') + esc(b.rak) + '</span>' : '') + '</td>' +
        '<td data-l="Tahun"><div class="mono small">' + esc(b.tahun || '-') + '</div><div class="mono xs muted">' + esc(b.isbn || '') + '</div></td>' +
        '<td data-l="Format">' + UI.formatTag(b.format) + '</td><td><div class="row end">' + UI.favBtn(b) + UI.readBtn(b, 'btn-sm') + '</div></td></tr>').join('') + '</tbody></table></div>' + pg + '</div>';
    UI.bindPager(res, p => setQ({ hal: String(p) }, true));
  };
  const key = 'kat_' + JSON.stringify(q) + (Session.me ? Session.me.id : '');
  await swr(key, 'katalog', Object.assign({}, q, { per: 12, denganPenulis: !penulisList || Date.now() - penulisList.t > 600000 }), 60000, (d, cached) => {
    if (!ctx.alive()) return;
    if (d.penulis) { penulisList = { t: Date.now(), d: d.penulis }; LS.set('c_penulis_list', penulisList); fillPenulis(d.penulis); }
    draw(d);
  }, r => { if (ctx.alive()) $('[data-res]', el).innerHTML = UI.errorBox(r.message); });
  $('[data-csv]', el).addEventListener('click', () => {
    if (!last) return;
    const rows = [['Judul', 'Penulis', 'Penerbit', 'Tahun', 'ISBN', 'Kategori/Mapel', 'Format', 'Akses', 'Pembaca']].concat(last.items.map(b => [b.judul, b.penulis, b.penerbit, b.tahun, b.isbn, b.mapelNama || b.katNama, b.format, UI.AKSES_LABEL[b.akses], b.pembaca]));
    UI.downloadBlob('katalog-halaman-' + last.hal + '.csv', new Blob([Zip.csvBuild(rows)], { type: 'text/csv' }));
  });
}, { keepScroll: false });

/* ============================== DETAIL BUKU ============================== */
async function renderDetail(ctx) {
  const id = ctx.params.id, el = ctx.el;
  el.innerHTML = '<div class="crumbs"><a href="#/">Beranda</a>' + ic('right', 'sm') + '<a href="#/katalog">Katalog</a></div><div class="detail"><div>' + UI.skBlock(420) + '</div><div>' + UI.skBlock(60) + UI.skBlock(200) + '</div></div>';
  await swr('bd_' + id + '_' + (Session.me ? Session.me.id : ''), 'buku.detail', { id }, 30000, d => { if (ctx.alive()) drawDetail(ctx, d); },
    r => { if (ctx.alive()) el.innerHTML = '<div class="panel">' + UI.empty('book', 'Buku tidak ditemukan', esc(r.message), '<a class="btn btn-primary" href="#/katalog">Ke Katalog</a>') + '</div>'; });
}
function drawDetail(ctx, b) {
  const el = ctx.el, me = Session.me, isPel = b.jenis === 'PELAJARAN';
  if (b.baca && b.ada && b.format === 'PDF' && window.Reader) Reader.warm();
  const cta = b.baca && b.ada && b.format !== 'LINK' ? '<a class="btn btn-accent btn-lg btn-block" href="#/baca/' + esc(b.id) + '">' + ic('open') + (b.st === 'BACA' && b.halBaca ? 'Lanjutkan Membaca (Hal ' + b.halBaca + ')' : b.st === 'SELESAI' ? 'Baca Lagi' : 'Baca Sekarang') + '</a>' : UI.readBtn(b, 'btn-lg btn-block');
  el.innerHTML = '<div class="row between wrap mb8"><div class="crumbs" style="margin:0"><a href="#/">' + ic('home', 'sm') + ' Beranda</a>' + ic('right', 'sm') + '<a href="#/' + (isPel ? 'pelajaran' : 'katalog') + '">' + (isPel ? 'Buku Pelajaran' : 'Katalog Koleksi') + '</a>' + ic('right', 'sm') +
    (isPel && b.mapelNama ? '<a href="#/pelajaran/' + esc(b.mapel) + qsBuild({ tingkat: (b.tingkat || [])[0] }) + '">' + esc(b.mapelNama) + '</a>' : b.katNama ? '<a href="#/katalog?kategori=' + esc(b.kat) + '">' + esc(b.katNama) + '</a>' : '') + ic('right', 'sm') + '<b class="trunc" style="max-width:320px">' + esc(b.judul) + '</b></div>' +
    '<button class="btn btn-outline btn-sm" data-back>' + ic('arrowl', 'sm') + 'Kembali</button></div>' +
    '<article class="detail mt12"><div><div class="cover-big">' + UI.cover(b, 26) + '</div><div class="fmt-bar"><span>' + ic('reader', 'sm') + ' ' + (b.format === 'LINK' ? 'Tautan Web' : esc(b.format)) + '</span><b>' + (b.hal ? b.hal + ' Hal' : b.ukuran ? fmtSize(b.ukuran) : '') + '</b></div>' +
    '<div class="row wrap mt16">' + UI.accessBadge(b.akses) + (b.baca ? '<span class="badge b-green"><span class="dot"></span>Tersedia untuk Dibaca Sekarang</span>' : '<span class="badge b-amber">' + ic('lock', 'sm') + (b.alasan === 'MASUK' ? 'Masuk untuk membaca' : 'Khusus warga sekolah') + '</span>') + '</div>' +
    '<div class="panel mt12 row" style="padding:12px 14px">' + ic('eye') + '<span class="mono"><b style="font-size:18px">' + fmtN(b.pembaca) + '</b> pembaca · ' + fmtN(b.selesaiCount) + ' selesai</span></div>' +
    '<div class="stack mt12" style="gap:10px">' + cta + '<div class="grid2" style="gap:10px">' +
    (me ? '<button class="btn btn-outline ' + (b.fav ? 'btn-soft' : '') + '" data-favd>' + ic('heart', 'sm') + (b.fav ? 'Tersimpan di Favorit' : 'Simpan ke Favorit') + '</button>' : '<a class="btn btn-outline" href="#/masuk">' + ic('heart', 'sm') + 'Favorit</a>') +
    '<button class="btn btn-outline" data-share>' + ic('share', 'sm') + 'Bagikan Buku</button></div>' +
    (b.format === 'LINK' && b.baca && b.url ? '<a class="btn btn-soft" href="' + esc(b.url) + '" target="_blank" rel="noopener">' + ic('external', 'sm') + 'Buka Sumber Referensi Eksternal</a>' : '') +
    (b.format === 'LINK' && b.baca && me && b.st !== 'SELESAI' ? '<button class="btn btn-ghost" data-done>' + ic('check', 'sm') + 'Tandai sudah selesai dibaca</button>' : '') +
    (Session.can('rekomendasi.kirim') ? '<button class="btn btn-outline-p" data-rek>' + ic('sparkles', 'sm') + 'Rekomendasikan ke Kelas</button>' : '') +
    (Session.can(['buku.ubah']) ? '<a class="btn btn-ghost" href="#/admin/buku/' + esc(b.id) + '">' + ic('edit', 'sm') + 'Ubah data buku</a>' : '') + '</div></div>' +
    '<div style="min-width:0"><div class="row wrap">' + (b.rak ? '<span class="badge b-purple b-mono" style="border-radius:3px">KODE RAK: ' + esc(b.rak) + '</span>' : '') +
    (isPel ? '<span class="badge b-solid" style="border-radius:3px">' + esc(b.mapelNama || 'Pelajaran') + '</span>' + (b.tingkat && b.tingkat.length ? '<span class="badge b-white b-mono">Kelas ' + esc(b.tingkat.join(', ')) + '</span>' : '') + (b.tipe ? '<span class="badge b-green">' + esc(b.tipe) + '</span>' : '') + (b.semester ? '<span class="badge b-gray b-mono">Semester ' + esc(b.semester) + '</span>' : '')
      : (b.katNama ? '<span class="badge b-solid" style="border-radius:3px">' + esc(b.katNama) + '</span>' : '')) + '</div>' +
    '<h1>' + esc(b.judul) + '</h1>' + (b.sub ? '<p class="muted" style="font-size:18px">' + esc(b.sub) + '</p>' : '') + '<hr class="divider">' +
    '<div class="row wrap" style="gap:14px">' + (b.penulis ? '<a class="row" href="#/katalog?penulis=' + esc(b.pid) + '" style="text-decoration:none"><span class="avatar sm" style="background:' + SP.avColor(b.penulis) + '">' + esc(SP.initials(b.penulis)) + '</span><span><b style="color:var(--c-primary-ink)">' + esc(b.penulis) + '</b><span class="mono xs muted" style="display:block">Penulis</span></span></a>' : '') +
    (b.penerbit || b.tahun ? '<span class="muted small row">' + ic('book', 'sm') + esc(b.penerbit || '') + (b.tahun ? ' • Terbit ' + esc(b.tahun) : '') + '</span>' : '') + '</div>' +
    (b.st ? '<div class="prog-box"><div class="row between wrap"><b class="row" style="color:var(--c-primary-ink)">' + ic('reader') + 'Progres Membaca Pribadi: ' + b.prog + '%</b><span class="mono xs muted">Terakhir dibaca ' + fmtRel(b.terakhir) + '</span></div>' +
      '<div class="progress mt12"><i style="width:' + b.prog + '%"></i></div><div class="row between mono xs mt8"><span class="muted">Halaman ' + (b.halBaca || 0) + (b.totalHal ? ' dari ' + b.totalHal : '') + '</span><span style="color:var(--c-accent-ink)">' + (b.st === 'SELESAI' ? 'Selesai dibaca ✓' : 'Sedang dibaca') + '</span></div></div>' : '') +
    '<div class="meta-grid">' + [['ISBN', b.isbn || '-'], [isPel ? 'Mata pelajaran' : 'Kategori', isPel ? (b.mapelNama || '-') : (b.katNama || '-')], ['Tebal buku', b.hal ? b.hal + ' halaman' : (b.totalHal ? b.totalHal + ' halaman' : '-')],
      ['Bahasa', b.bahasa || 'Indonesia'], ['Format', b.format === 'LINK' ? 'Tautan web' : b.format + (b.ukuran ? ' · ' + fmtSize(b.ukuran) : '')], ['Hak akses', UI.AKSES_LABEL[b.akses]]]
      .map(m => '<div class="m"><div class="lbl-mono">' + m[0] + '</div><div class="v"' + (m[0] === 'Hak akses' ? ' style="color:var(--c-accent-ink)"' : '') + '>' + esc(m[1]) + '</div></div>').join('') + '</div>' +
    '<div class="tabs" role="tablist"><button class="on" data-t="sin">' + ic('file', 'sm') + 'Sinopsis & Deskripsi</button>' + (b.penulisBio ? '<button data-t="bio">' + ic('user', 'sm') + 'Tentang Penulis</button>' : '') +
    '<button data-t="guru">' + ic('sparkles', 'sm') + 'Catatan Guru (' + (b.catatanGuru || []).length + ')</button></div>' +
    '<div data-tab="sin" class="prose">' + (b.deskripsi ? esc(b.deskripsi) : '<span class="muted">Belum ada sinopsis untuk buku ini.</span>') + '</div>' +
    '<div data-tab="bio" class="prose hide">' + esc(b.penulisBio || '') + '</div>' +
    '<div data-tab="guru" class="hide">' + ((b.catatanGuru || []).length ? b.catatanGuru.map(c => '<div class="quote">"' + esc(c.catatan || 'Direkomendasikan untuk kelas Anda.') + '"<div class="by">— ' + esc(c.guru) + ' · ' + fmtDate(c.waktu) + '</div></div>').join('') : '<p class="muted">Belum ada catatan guru untuk buku ini.</p>') +
    ((b.rekomendasiSaya || []).length ? '<div class="mt16"><b>Rekomendasi yang Anda kirim</b>' + b.rekomendasiSaya.map(r => '<div class="row between mt8 panel" style="padding:10px 14px"><span class="small">' + esc(r.kelas.length ? r.kelas.join(', ') : r.tingkat.length ? 'Kelas ' + r.tingkat.join(', ') : 'Semua siswa') + ' · ' + fmtDate(r.waktu) + '</span><button class="btn btn-sm btn-danger-o" data-rekdel="' + esc(r.id) + '">Hapus</button></div>').join('') + '</div>' : '') + '</div>' +
    '</div></article>' +
    (b.terkait && b.terkait.length ? '<section class="section"><div class="sec-head"><div><h2 style="font-size:22px">' + (isPel ? 'Materi Lain ' + esc(b.mapelNama || '') : 'Buku Terkait') + '</h2><p class="muted small">Koleksi pendukung yang mungkin Anda sukai</p></div><a class="link-more p" href="#/' + (isPel ? 'pelajaran/' + esc(b.mapel) : 'katalog?kategori=' + esc(b.kat)) + '">Lihat Semua ' + ic('right', 'sm') + '</a></div><div class="book-grid">' + b.terkait.slice(0, 4).map(UI.bookCard).join('') + '</div></section>' : '');
  $('[data-back]', el).onclick = () => history.length > 1 ? history.back() : Router.go('/katalog');
  $$('.tabs [data-t]', el).forEach(t => t.addEventListener('click', () => { $$('.tabs [data-t]', el).forEach(x => x.classList.toggle('on', x === t)); $$('[data-tab]', el).forEach(p => p.classList.toggle('hide', p.dataset.tab !== t.dataset.t)); }));
  const fb = $('[data-favd]', el);
  if (fb) fb.onclick = async () => { const on = !b.fav; const r = await api('favorit.toggle', { id: b.id, nilai: on }); if (UI.toastRes(r)) { b.fav = on; SP.cacheDrop('bd_' + b.id); SP.cacheDrop('rak'); drawDetail(ctx, b); } };
  $('[data-share]', el).onclick = async () => { const url = location.href.split('#')[0] + '#/buku/' + b.id; if (navigator.share) { try { await navigator.share({ title: b.judul, url }); } catch (e) { /* dibatalkan */ } } else UI.copyText(url); };
  const dn = $('[data-done]', el);
  if (dn) dn.onclick = async () => { const r = await api('progres.simpan', { id: b.id, hal: 1, total: 1, selesai: true }); if (UI.toastRes(r, 'Ditandai selesai. Hebat!')) { SP.cacheDrop('bd_' + b.id); SP.cacheDrop('rak'); renderDetail(ctx); } };
  const rk = $('[data-rek]', el); if (rk) rk.onclick = () => rekomendasiModal(b, () => { SP.cacheDrop('bd_' + b.id); renderDetail(ctx); });
  $$('[data-rekdel]', el).forEach(x => x.onclick = async () => { if (!(await UI.confirmDlg('Hapus rekomendasi ini?', { danger: true, ok: 'Hapus' }))) return; if (UI.toastRes(await api('guru.rekomendasi.hapus', { id: x.dataset.rekdel }))) { SP.cacheDrop('bd_' + b.id); renderDetail(ctx); } });
}
function rekomendasiModal(b, done) {
  const kel = App.ref.kelas || [];
  const m = UI.modal({ title: 'Rekomendasikan ke kelas', sub: esc(b.judul), body: '<div class="stack gap16"><div class="field"><span class="lbl">Tingkat</span><div class="row wrap">' + App.ref.tingkat.map(t => '<label class="chip"><input type="checkbox" value="' + t + '" data-tg hidden>Kelas ' + t + '</label>').join('') + '</div><span class="help">Kosongkan tingkat & kelas untuk semua siswa.</span></div>' +
    '<div class="field"><span class="lbl">Atau kelas tertentu</span><div class="row wrap" style="max-height:160px;overflow:auto">' + (kel.length ? kel.map(k => '<label class="chip"><input type="checkbox" value="' + esc(k.nama) + '" data-kl hidden>' + esc(k.nama) + '</label>').join('') : '<span class="muted small">Belum ada data kelas.</span>') + '</div></div>' +
    '<div class="field"><label for="rkc">Catatan untuk siswa (opsional)</label><textarea id="rkc" class="ta" maxlength="300" placeholder="Contoh: Baca Bab 2 sebelum praktikum hari Kamis."></textarea></div></div>',
    foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-send>' + ic('send', 'sm') + 'Kirim Rekomendasi</button>' });
  $$('label.chip', m.el).forEach(l => l.addEventListener('change', () => l.classList.toggle('on', $('input', l).checked)));
  $('[data-send]', m.el).onclick = async e => {
    const bb = e.currentTarget; UI.btnBusy(bb, true);
    const r = await api('guru.rekomendasikan', { id: b.id, tingkat: $$('[data-tg]:checked', m.el).map(x => x.value), kelas: $$('[data-kl]:checked', m.el).map(x => x.value), catatan: $('#rkc', m.el).value });
    UI.btnBusy(bb, false);
    if (UI.toastRes(r)) { m.close(); done && done(); }
  };
}
page('/buku/:id', renderDetail);
page('/baca/:id', async ctx => {
  renderDetail(ctx);
  Reader.open(ctx.params.id, () => { SP.cacheDrop('bd_' + ctx.params.id); Router.go('/buku/' + ctx.params.id, true); });
});

/* ============================== BUKU PELAJARAN ============================== */
const FASE = { X: 'Fase E', XI: 'Fase F', XII: 'Fase F' };
page('/pelajaran', async ctx => {
  const me = Session.me, q = ctx.query, el = ctx.el;
  const tingkat = q.tingkat || (me && me.tingkat) || 'X', kelas = q.kelas || (q.tingkat ? '' : (me && me.kelas) || ''), semester = q.semester || '';
  const go = patch => Router.go('/pelajaran' + qsBuild(Object.assign({ tingkat, kelas, semester }, patch)));
  el.innerHTML = '<div class="crumbs"><a href="#/">Beranda</a>' + ic('right', 'sm') + '<b>Buku Pelajaran</b></div>' +
    '<div class="page-head"><div><h1 class="page-title">Buku Pelajaran</h1><p class="page-sub">Materi belajar per tingkat, kelas, dan mata pelajaran — ' + esc(App.settings.KURIKULUM || '') + '.</p></div>' +
    (me && me.kelas ? '<span class="top-chip">' + ic('cap', 'sm') + 'Kelas Anda: ' + esc(me.kelas) + '</span>' : '') + '</div>' +
    '<div class="tier-tabs" role="tablist">' + ['X', 'XI', 'XII'].map(t => '<button class="tier ' + (t === tingkat ? 'on' : '') + '" data-tier="' + t + '" role="tab" aria-selected="' + (t === tingkat) + '"><span class="lv">' + t + '</span><span><b style="display:block;font-size:16px">Kelas ' + t + '</b><span class="muted small">' + FASE[t] + ' · ' + (t === 'X' ? 'Umum' : 'Pilihan peminatan') + '</span></span></button>').join('') + '</div>' +
    '<div class="filters"><div class="chips-row" style="margin-top:0" data-kelas><span class="lbl-mono">Kelas:</span><button class="chip ' + (!kelas ? 'on' : '') + '" data-kel="">Semua kelas ' + esc(tingkat) + '</button></div>' +
    '<div class="chips-row"><span class="lbl-mono">Semester:</span>' + [['', 'Semua'], ['1', 'Semester 1 (Ganjil)'], ['2', 'Semester 2 (Genap)']].map(s => '<button class="chip ' + (semester === s[0] ? 'on' : '') + '" data-sem="' + s[0] + '">' + s[1] + '</button>').join('') + '</div></div>' +
    '<div data-body><div class="subj-grid">' + Array(8).fill('<div class="subj">' + UI.skBlock(120) + '</div>').join('') + '</div></div>';
  $$('[data-tier]', el).forEach(b => b.onclick = () => go({ tingkat: b.dataset.tier, kelas: '' }));
  $$('[data-sem]', el).forEach(b => b.onclick = () => go({ semester: b.dataset.sem }));
  await swr('pel_' + tingkat + kelas + semester + (me ? me.id : ''), 'pelajaran', { tingkat, kelas, semester }, 60000, d => {
    if (!ctx.alive()) return;
    const kc = $('[data-kelas]', el);
    kc.innerHTML = '<span class="lbl-mono">Kelas:</span><button class="chip ' + (!kelas ? 'on' : '') + '" data-kel="">Semua kelas ' + esc(tingkat) + '</button>' + d.kelasList.map(k => '<button class="chip mono ' + (kelas.toUpperCase() === k.toUpperCase() ? 'on' : '') + '" data-kel="' + esc(k) + '">' + esc(k) + '</button>').join('');
    $$('[data-kel]', kc).forEach(b => b.onclick = () => go({ kelas: b.dataset.kel }));
    const body = $('[data-body]', el), withBooks = d.mapel.filter(m => m.jumlah), without = d.mapel.filter(m => !m.jumlah);
    body.innerHTML = (d.lanjut.length ? '<section class="mb16"><div class="sec-head"><div class="sec-title"><span class="bar"></span>Lanjutkan Belajar</div></div><div class="shelf" style="grid-auto-columns:minmax(300px,1fr)">' + d.lanjut.map(b => '<a class="hcard" href="#/baca/' + esc(b.id) + '"><div>' + UI.cover(b, 10) + '</div><div class="stack" style="gap:6px;min-width:0"><span class="badge b-purple" style="align-self:flex-start">' + esc(b.mapelNama) + '</span><b class="clamp2">' + esc(b.judul) + '</b><div class="progress thin"><i style="width:' + b.prog + '%"></i></div><span class="mono xs muted">' + b.prog + '% · ' + fmtRel(b.terakhir) + '</span></div></a>').join('') + '</div></section>' : '') +
      '<div class="sec-head"><div class="sec-title"><span class="bar"></span>Mata Pelajaran Kelas ' + esc(tingkat) + '</div><span class="mono small muted">' + fmtN(d.total) + ' materi</span></div>' +
      (d.mapel.length ? '<div class="subj-grid">' + withBooks.concat(without).map((m, i) => '<a class="subj ' + (m.jumlah ? '' : 'empty-s') + '" style="--sc:' + esc(m.warna || '#6B3FA0') + ';animation:pageIn .35s ' + Math.min(i * 25, 400) + 'ms both" href="#/pelajaran/' + esc(m.id) + qsBuild({ tingkat, kelas, semester }) + '">' +
        '<div class="row between"><span class="si">' + ic(m.ikon || 'buku', 'lg') + '</span>' + (m.kelompok ? '<span class="badge b-gray">' + esc(m.kelompok) + '</span>' : '') + '</div>' +
        '<div><div class="nm">' + esc(m.nama) + '</div><div class="mono xs muted mt8">' + (m.jumlah ? fmtN(m.jumlah) + ' materi' + (me && m.mulai ? ' · ' + m.selesai + ' selesai' : '') : 'Belum ada materi') + '</div></div>' +
        (me && m.mulai ? '<div><div class="progress thin"><i style="width:' + m.prog + '%"></i></div><div class="mono xs muted mt8">Progres rata-rata ' + m.prog + '%</div></div>' : '') +
        (Object.keys(m.tipe || {}).length ? '<div class="types">' + Object.keys(m.tipe).slice(0, 3).map(t => '<span class="badge b-purple">' + esc(t) + ' · ' + m.tipe[t] + '</span>').join('') + '</div>' : '') + '</a>').join('') + '</div>'
        : UI.empty('cap', 'Belum ada mata pelajaran', 'Admin dapat menambahkan mata pelajaran di Panel Admin → Mapel & Kelas.'));
  }, r => { if (ctx.alive()) $('[data-body]', el).innerHTML = UI.errorBox(r.message); });
});
page('/pelajaran/:mapel', async ctx => {
  const me = Session.me, q = ctx.query, el = ctx.el, mid = ctx.params.mapel;
  const m = (App.ref.mapel || []).find(x => x.id === mid) || { id: '_lain', nama: 'Lainnya', warna: '#6B3FA0', ikon: 'buku' };
  const tingkat = q.tingkat || (me && me.tingkat) || '', kelas = q.kelas || '', semester = q.semester || '';
  el.innerHTML = '<div class="crumbs"><a href="#/">Beranda</a>' + ic('right', 'sm') + '<a href="#/pelajaran' + qsBuild({ tingkat, kelas, semester }) + '">Buku Pelajaran</a>' + ic('right', 'sm') + '<b>' + esc(m.nama) + '</b></div>' +
    '<div class="hero" style="background:' + esc(m.warna || 'var(--c-primary)') + ';min-height:0;padding:28px 32px;grid-template-columns:auto minmax(0,1fr)"><span class="si" style="width:72px;height:72px;border-radius:14px;background:rgba(255,255,255,.18);display:grid;place-items:center">' + ic(m.ikon || 'buku', 'xl') + '</span>' +
    '<div><span class="eyebrow">' + (tingkat ? 'Kelas ' + esc(tingkat) + ' · ' + FASE[tingkat] : 'Semua tingkat') + (kelas ? ' · ' + esc(kelas) : '') + (semester ? ' · Semester ' + esc(semester) : '') + '</span><h1 style="font-size:34px;margin:12px 0 6px;text-transform:none">' + esc(m.nama) + '</h1><p data-sum>Memuat materi…</p></div></div>' +
    '<div class="row wrap mt16" data-tipe></div><div data-list class="mt16">' + UI.skRows(5) + '</div>';
  await swr('pelm_' + mid + tingkat + kelas + semester + (me ? me.id : ''), 'katalog', { jenis: 'PELAJARAN', mapel: mid, tingkat, kelas, semester, urut: 'urutan', per: 60 }, 60000, d => {
    if (!ctx.alive()) return;
    const groups = {};
    d.items.forEach(b => { (groups[b.tipe || 'Materi Lainnya'] = groups[b.tipe || 'Materi Lainnya'] || []).push(b); });
    const order = (App.ref.tipe || []).concat(['Materi Lainnya']).filter(t => groups[t]);
    const done = d.items.filter(b => b.st === 'SELESAI').length;
    $('[data-sum]', el).textContent = fmtN(d.total) + ' materi' + (me ? ' · ' + done + ' selesai dibaca' : '') + '.';
    $('[data-tipe]', el).innerHTML = order.map(t => '<a class="chip" href="#tp-' + SP.hashStr(t) + '">' + esc(t) + ' <span class="n">' + groups[t].length + '</span></a>').join('');
    $$('[data-tipe] a', el).forEach(a => a.onclick = e => { e.preventDefault(); const t = document.getElementById(a.getAttribute('href').slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('[data-list]', el).innerHTML = d.items.length ? order.map(t => '<div class="type-head" id="tp-' + SP.hashStr(t) + '">' + ic('layers', 'sm') + esc(t) + ' <span class="n">' + groups[t].length + ' materi</span></div>' +
      groups[t].map((b, i) => '<div class="lesson"><a href="#/buku/' + esc(b.id) + '">' + UI.cover(b, 7) + '</a><div style="min-width:0"><div class="no">' + (b.urutan ? 'BAB/URUTAN ' + b.urutan + ' · ' : '') + (b.semester ? 'SEMESTER ' + esc(b.semester) + ' · ' : '') + esc((b.kelas && b.kelas.length ? b.kelas.join(', ') : (b.tingkat || []).map(x => 'Kelas ' + x).join(', ')) || '') + '</div>' +
        '<a href="#/buku/' + esc(b.id) + '" style="font-weight:700;font-size:16px;color:var(--c-text)" class="clamp2">' + esc(b.judul) + '</a><div class="muted small trunc">' + esc(b.penulis || b.penerbit || '') + '</div>' +
        (b.st ? '<div class="row mt8" style="max-width:320px"><div class="progress thin grow"><i style="width:' + b.prog + '%"></i></div><span class="mono xs">' + (b.st === 'SELESAI' ? 'Selesai ✓' : b.prog + '%') + '</span></div>' : '') + '</div>' +
        '<div class="acts row">' + UI.favBtn(b) + UI.readBtn(b, 'btn-sm') + '</div></div>').join('')).join('')
      : '<div class="panel">' + UI.empty('cap', 'Belum ada materi', 'Materi ' + esc(m.nama) + (tingkat ? ' untuk kelas ' + esc(tingkat) : '') + ' belum diunggah. Coba tingkat lain atau hubungi guru mapel.', '<a class="btn btn-outline" href="#/pelajaran">Kembali</a>') + '</div>';
  }, r => { if (ctx.alive()) $('[data-list]', el).innerHTML = UI.errorBox(r.message); });
});

/* ============================== KOLEKSI SAYA ============================== */
page('/rak', async ctx => {
  const tab = ctx.query.tab || 'baca', el = ctx.el;
  const TABS = [['baca', 'Sedang Dibaca', 'open'], ['selesai', 'Selesai', 'checkc'], ['favorit', 'Favorit', 'heart']];
  el.innerHTML = '<div class="crumbs"><a href="#/">Beranda</a>' + ic('right', 'sm') + '<b>' + (tab === 'favorit' ? 'Favorit' : 'Koleksi Saya') + '</b></div><div class="page-head"><div><h1 class="page-title">' + (tab === 'favorit' ? 'Favorit Saya' : 'Koleksi Saya') + '</h1><p class="page-sub">Bacaan yang sedang berjalan, sudah selesai, dan yang Anda simpan.</p></div></div>' +
    '<div data-sum class="grid3 mb16"></div><div class="tabs" role="tablist">' + TABS.map(t => '<button class="' + (t[0] === tab ? 'on' : '') + '" data-tab="' + t[0] + '" role="tab">' + ic(t[2], 'sm') + t[1] + ' <span class="badge b-gray" data-n="' + t[0] + '">…</span></button>').join('') + '</div><div data-list>' + UI.skRows(4) + '</div>';
  $$('[data-tab]', el).forEach(b => b.onclick = () => Router.go('/rak?tab=' + b.dataset.tab));
  await swr('rak_' + tab + Session.me.id, 'rak', { tab }, 20000, d => {
    if (!ctx.alive()) return;
    Object.keys(d.jumlah).forEach(k => { const n = $('[data-n="' + k + '"]', el); if (n) n.textContent = d.jumlah[k]; });
    $('[data-sum]', el).innerHTML = '<div class="kpi"><div class="t">Sedang dibaca ' + ic('open', 'sm') + '</div><div class="v" data-count="' + d.jumlah.baca + '">0</div></div><div class="kpi"><div class="t">Selesai ' + ic('checkc', 'sm') + '</div><div class="v" data-count="' + d.jumlah.selesai + '">0</div></div>' +
      '<div class="kpi"><div class="t">Halaman dibaca ' + ic('file', 'sm') + '</div><div class="v" data-count="' + d.totalHal + '">0</div></div>';
    UI.countUp(el);
    const list = $('[data-list]', el);
    if (!d.items.length) { list.innerHTML = '<div class="panel">' + UI.empty(tab === 'favorit' ? 'heart' : 'koleksi', tab === 'favorit' ? 'Belum ada favorit' : tab === 'selesai' ? 'Belum ada buku selesai' : 'Belum ada bacaan aktif', tab === 'favorit' ? 'Ketuk ikon hati pada kartu buku untuk menyimpannya di sini.' : 'Mulai membaca dari katalog atau buku pelajaran.', '<a class="btn btn-accent" href="#/katalog">Jelajahi Katalog</a>') + '</div>'; return; }
    list.innerHTML = tab === 'favorit' ? '<div class="book-grid">' + d.items.map(UI.bookCard).join('') + '</div>' : d.items.map(b => '<div class="lesson"><a href="#/buku/' + esc(b.id) + '">' + UI.cover(b, 7) + '</a><div style="min-width:0"><div class="no">' + esc(b.mapelNama || b.katNama || '') + '</div><a href="#/buku/' + esc(b.id) + '" style="font-weight:700;font-size:16px;color:var(--c-text)" class="clamp2">' + esc(b.judul) + '</a>' +
      '<div class="muted small">' + esc(b.penulis || '') + '</div><div class="row mt8" style="max-width:420px"><div class="progress grow"><i style="width:' + (b.prog || 0) + '%"></i></div><span class="mono xs">' + (b.prog || 0) + '%</span></div><div class="mono xs muted mt8">Hal ' + (b.halBaca || 0) + (b.totalHal ? '/' + b.totalHal : '') + ' · ' + fmtRel(b.terakhir) + '</div></div>' +
      '<div class="acts row">' + UI.favBtn(b) + (tab === 'selesai' ? '<a class="btn btn-outline btn-sm" href="#/baca/' + esc(b.id) + '">Baca lagi</a>' : UI.readBtn(b, 'btn-sm')) + '</div></div>').join('');
  }, r => { if (ctx.alive()) $('[data-list]', el).innerHTML = UI.errorBox(r.message); });
}, { auth: true });

/* ============================== RIWAYAT ============================== */
page('/riwayat', async ctx => {
  const q = Object.assign({ hal: '1' }, ctx.query), el = ctx.el;
  const go = p => Router.go('/riwayat' + qsBuild(Object.assign({}, q, p)));
  el.innerHTML = '<div class="crumbs"><a href="#/">Beranda</a>' + ic('right', 'sm') + '<b>Riwayat Bacaan</b></div><div class="page-head"><div><h1 class="page-title">Riwayat Bacaan</h1><p class="page-sub">Semua buku yang pernah Anda buka beserta progresnya.</p></div><span class="top-chip" data-dur>' + ic('clock', 'sm') + '…</span></div>' +
    '<div class="filters"><div class="grid"><div class="field"><span class="lbl-mono">Status</span><select class="sel" data-f="status"><option value="">Semua</option><option value="BACA" ' + (q.status === 'BACA' ? 'selected' : '') + '>Sedang dibaca</option><option value="SELESAI" ' + (q.status === 'SELESAI' ? 'selected' : '') + '>Selesai</option></select></div>' +
    '<div class="field"><span class="lbl-mono">Dari tanggal</span><input class="inp" type="date" data-f="dari" value="' + esc(q.dari || '') + '"></div><div class="field"><span class="lbl-mono">Sampai</span><input class="inp" type="date" data-f="sampai" value="' + esc(q.sampai || '') + '"></div></div></div><div data-list>' + UI.skRows(5) + '</div>';
  $$('[data-f]', el).forEach(i => i.addEventListener('change', () => go({ [i.dataset.f]: i.value, hal: '1' })));
  const r = await api('riwayat', { status: q.status, dari: q.dari, sampai: q.sampai, hal: q.hal });
  if (!ctx.alive()) return;
  if (!r.success) { $('[data-list]', el).innerHTML = UI.errorBox(r.message); return; }
  const d = r.data;
  $('[data-dur]', el).innerHTML = ic('clock', 'sm') + 'Total ' + Math.round(d.totalDetik / 360) / 10 + ' jam membaca';
  $('[data-list]', el).innerHTML = d.items.length ? '<div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl cards"><thead><tr><th>Buku</th><th>Mulai</th><th>Terakhir</th><th>Progres</th><th>Status</th><th class="num">Durasi</th><th></th></tr></thead><tbody>' +
    d.items.map(x => '<tr><td data-l="Buku"><div class="row gap12"><div class="thumb">' + UI.cover(x, 6) + '</div><div><b class="clamp2">' + esc(x.judul) + '</b><div class="muted small">' + esc(x.penulis) + '</div></div></div></td><td data-l="Mulai" class="mono small">' + fmtDate(x.mulai) + '</td>' +
      '<td data-l="Terakhir" class="mono small">' + fmtDate(x.terakhir, true) + '</td><td data-l="Progres" style="min-width:140px"><div class="row"><div class="progress thin grow"><i style="width:' + x.prog + '%"></i></div><span class="mono xs">' + x.prog + '%</span></div><div class="mono xs muted">Hal ' + x.hal + (x.total ? '/' + x.total : '') + '</div></td>' +
      '<td data-l="Status">' + (x.st === 'SELESAI' ? '<span class="badge b-gray">' + ic('check', 'sm') + 'Selesai</span>' : '<span class="badge b-purple">Sedang dibaca</span>') + '</td><td data-l="Durasi" class="num">' + Math.round(x.dur / 60) + ' mnt</td>' +
      '<td>' + (x.ada ? '<a class="btn btn-sm btn-outline" href="#/' + (x.format === 'LINK' ? 'buku/' : 'baca/') + esc(x.id) + '">' + (x.st === 'SELESAI' ? 'Baca lagi' : 'Lanjutkan') + '</a>' : '') + '</td></tr>').join('') + '</tbody></table></div>' +
    UI.pager({ total: d.total, hal: d.hal, halaman: d.halaman, per: d.per, unit: 'riwayat' }) + '</div>' : '<div class="panel">' + UI.empty('history', 'Belum ada riwayat', 'Buku yang Anda buka akan tercatat di sini.') + '</div>';
  UI.bindPager(el, p => go({ hal: String(p) }));
}, { auth: true });

/* ============================== REKOMENDASI ============================== */
page('/rekomendasi', async ctx => {
  const el = ctx.el, me = Session.me;
  el.innerHTML = '<div class="crumbs"><a href="#/">Beranda</a>' + ic('right', 'sm') + '<b>Rekomendasi</b></div><div class="page-head"><div><h1 class="page-title">Rekomendasi untuk Anda</h1><p class="page-sub">Pilihan guru, buku populer, dan saran berdasarkan bacaan Anda.</p></div></div><div data-body>' + UI.skCards(8) + '</div>';
  await swr('rek_' + me.id, 'rekomendasi', {}, 60000, d => {
    if (!ctx.alive()) return;
    const sec = (t, sub, items, extra) => '<section class="section"><div class="sec-head"><div><div class="sec-title"><span class="bar"></span>' + t + '</div>' + (sub ? '<p class="muted small mt8">' + sub + '</p>' : '') + '</div>' + (extra || '') + '</div>' + items + '</section>';
    const guru = d.dariGuru.filter(b => !b.milikSaya), mine = d.dariGuru.filter(b => b.milikSaya);
    $('[data-body]', el).innerHTML =
      (guru.length ? sec('Dari Guru', 'Buku yang direkomendasikan guru untuk kelas Anda', '<div class="book-grid">' + guru.map((b, i) => '<div class="stack" style="gap:8px">' + UI.bookCard(b, i) + (b.catatan ? '<div class="quote" style="margin:0;font-size:13px">"' + esc(b.catatan) + '"<div class="by">— ' + esc(b.guruNama) + '</div></div>' : '<div class="mono xs muted">— ' + esc(b.guruNama) + ' · ' + fmtDate(b.rekWaktu) + '</div>') + '</div>').join('') + '</div>')
        : me.metode === 'NISN' ? sec('Dari Guru', '', '<div class="panel">' + UI.empty('sparkles', 'Belum ada rekomendasi guru', 'Rekomendasi guru untuk kelas ' + esc(me.kelas || '') + ' akan muncul di sini.') + '</div>') : '') +
      (mine.length ? sec('Rekomendasi yang Saya Kirim', '', '<div class="tbl-wrap"><table class="tbl cards"><thead><tr><th>Buku</th><th>Sasaran</th><th>Catatan</th><th>Tanggal</th><th></th></tr></thead><tbody>' + mine.map(b => '<tr><td data-l="Buku"><a href="#/buku/' + esc(b.id) + '"><b>' + esc(b.judul) + '</b></a></td><td data-l="Sasaran"><span class="badge b-purple">' + esc(b.target) + '</span></td><td data-l="Catatan" class="small">' + esc(b.catatan || '-') + '</td><td data-l="Tanggal" class="mono small">' + fmtDate(b.rekWaktu) + '</td><td><button class="btn btn-sm btn-danger-o" data-del="' + esc(b.rekId) + '">Hapus</button></td></tr>').join('') + '</tbody></table></div>') : '') +
      (d.kamu && d.kamu.items.length ? sec('Karena Anda membaca ' + esc(d.kamu.kategori), 'Buku di kategori favorit Anda yang belum dibaca', '<div class="book-grid">' + d.kamu.items.map(UI.bookCard).join('') + '</div>') : '') +
      sec('Paling Populer Bulan Ini', '', d.populer.length ? '<div class="book-grid">' + d.populer.map(UI.bookCard).join('') + '</div>' : '<p class="muted">Belum ada data.</p>', '<a class="link-more p" href="#/katalog?urut=bulan">Lihat semua ' + ic('right', 'sm') + '</a>') +
      sec('Terbaru', '', '<div class="book-grid">' + d.terbaru.map(UI.bookCard).join('') + '</div>', '<a class="link-more p" href="#/katalog?urut=terbaru">Lihat semua ' + ic('right', 'sm') + '</a>');
    $$('[data-del]', el).forEach(b => b.onclick = async () => { if (await UI.confirmDlg('Hapus rekomendasi ini?', { danger: true, ok: 'Hapus' }) && UI.toastRes(await api('guru.rekomendasi.hapus', { id: b.dataset.del }))) { SP.cacheDrop('rek_'); App.route(); } });
  }, r => { if (ctx.alive()) $('[data-body]', el).innerHTML = UI.errorBox(r.message); });
}, { auth: true });

/* ============================== PENGATURAN PROFIL ============================== */
page('/pengaturan', ctx => {
  const me = Session.me, el = ctx.el, staf = me.metode === 'SANDI';
  el.innerHTML = '<div class="crumbs"><a href="#/">Beranda</a>' + ic('right', 'sm') + '<b>Pengaturan</b></div><div class="page-head"><div><h1 class="page-title">Profil & Pengaturan</h1><p class="page-sub">Kelola data akun, keamanan, dan preferensi tampilan.</p></div></div>' +
    '<div class="layout-split"><div class="panel" style="text-align:center"><div style="position:relative;width:96px;margin:0 auto">' + UI.avatar(me, 'lg').replace('class="avatar lg"', 'class="avatar lg" style="width:96px;height:96px"') +
    '<label class="btn-icon sm" style="position:absolute;right:-4px;bottom:0;border-radius:50%;cursor:pointer" title="Ganti foto">' + ic('edit', 'sm') + '<input type="file" accept="image/*" data-foto hidden></label></div>' +
    '<h3 class="mt12" style="font-size:20px">' + esc(me.nama) + '</h3><span class="badge b-purple mt8">' + esc(me.peranNama) + '</span>' +
    '<div class="stack mt16" style="text-align:left;gap:0">' + [me.nisn ? ['NISN', me.nisn] : null, me.kelas ? ['Kelas', me.kelas] : null, me.nip ? ['NIP', me.nip] : null, me.email ? ['Email', me.email] : null, me.username ? ['Username', me.username] : null]
      .filter(Boolean).map(x => '<div class="kv"><span class="muted">' + x[0] + '</span><b>' + esc(x[1]) + '</b></div>').join('') + '</div>' +
    (me.metode === 'NISN' ? '<p class="help mt12" style="text-align:left">Nama & kelas mengikuti data sekolah. Hubungi pustakawan bila ada kesalahan.</p>' : '') + '</div>' +
    '<div class="stack gap16">' + (staf ? '<form class="form-sec" data-prof><h3><span class="no">1</span>Data profil</h3><div class="field"><label for="nm">Nama lengkap</label><input id="nm" class="inp" value="' + esc(me.nama) + '" maxlength="80"></div><div class="row end mt16"><button class="btn btn-primary">Simpan Profil</button></div></form>' +
      '<form class="form-sec" data-pw><h3><span class="no">2</span>Keamanan — ubah kata sandi</h3><div class="grid3"><div class="field"><label for="p0">Sandi saat ini</label><input id="p0" class="inp" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label for="p1">Sandi baru</label><input id="p1" class="inp" type="password" autocomplete="new-password"></div><div class="field"><label for="p2">Ulangi sandi baru</label><input id="p2" class="inp" type="password" autocomplete="new-password"></div></div>' +
      '<p class="help mt8">Minimal 8 karakter, berisi huruf dan angka. Perangkat lain akan otomatis dikeluarkan.</p><div class="row end mt16"><button class="btn btn-primary">' + ic('key', 'sm') + 'Ubah Kata Sandi</button></div></form>' : '') +
    '<div class="form-sec"><h3><span class="no">' + (staf ? 3 : 1) + '</span>Tampilan</h3><div class="row between"><div><b>Tampilan katalog bawaan</b><div class="help">Pilih kartu bergambar atau daftar ringkas.</div></div><div class="view-toggle"><button data-vw="card">' + ic('grid', 'sm') + 'Card</button><button data-vw="list">' + ic('list', 'sm') + 'List</button></div></div><hr class="divider">' +
    '<div class="row between"><div><b>Kurangi animasi</b><div class="help">Matikan efek gerak di seluruh aplikasi.</div></div><label class="switch"><input type="checkbox" data-rm ' + (LS.get('reduce_motion', false) ? 'checked' : '') + '><span class="tr"></span></label></div></div>' +
    '<div class="form-sec"><h3><span class="no">' + (staf ? 4 : 2) + '</span>Sesi</h3><p class="muted">Keluar dari semua perangkat bila Anda pernah masuk di komputer umum (lab, perpustakaan).</p><div class="row wrap mt16"><button class="btn btn-danger-o" data-all>' + ic('logout', 'sm') + 'Keluar dari Semua Perangkat</button><button class="btn btn-outline" data-clear>' + ic('refresh', 'sm') + 'Bersihkan cache perangkat ini</button></div></div>' +
    '<p class="mono xs muted">Versi aplikasi ' + SP.VERSION + '</p></div></div>';
  const vw = LS.get('kat_view', 'card'); $$('[data-vw]', el).forEach(b => { b.classList.toggle('on', b.dataset.vw === vw); b.onclick = () => { LS.set('kat_view', b.dataset.vw); $$('[data-vw]', el).forEach(x => x.classList.toggle('on', x === b)); UI.toast('Disimpan.'); }; });
  $('[data-rm]', el).onchange = e => { LS.set('reduce_motion', e.target.checked); document.documentElement.classList.toggle('reduce-motion', e.target.checked); };
  $('[data-foto]', el).onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const img = await UI.resizeImage(f, 320, 320, .82); UI.toast('Mengunggah foto…', 'warn'); const r = await api('profil.foto', { data: img.data, mime: img.mime }); if (UI.toastRes(r)) { me.foto = r.data.foto; Session.set(Session.token, me); App.renderShell(); App.route(); } }
    catch (err) { UI.toast(err.message, 'err'); }
  };
  const pf = $('[data-prof]', el); if (pf) pf.onsubmit = async e => { e.preventDefault(); const b = $('button', pf); UI.btnBusy(b, true); const r = await api('profil.simpan', { nama: $('#nm', el).value }); UI.btnBusy(b, false); if (UI.toastRes(r)) { me.nama = r.data.nama; Session.set(Session.token, me); App.renderShell(); } };
  const pw = $('[data-pw]', el);
  if (pw) pw.onsubmit = async e => {
    e.preventDefault(); const a = $('#p1', el).value;
    if (a !== $('#p2', el).value) return UI.toast('Kedua sandi baru tidak sama.', 'err');
    const b = $('button', pw); UI.btnBusy(b, true);
    const r = await api('profil.sandi', { lama: $('#p0', el).value, baru: a }); UI.btnBusy(b, false);
    if (UI.toastRes(r)) { Session.set(r.data.token, me); pw.reset(); }
  };
  $('[data-all]', el).onclick = async () => { if (!(await UI.confirmDlg('Semua sesi di perangkat lain akan berakhir, termasuk perangkat ini.', { ok: 'Keluar dari semua', danger: true }))) return; await api('auth.keluar', { semua: true }); Session.clear(); Router.go('/masuk'); location.reload(); };
  $('[data-clear]', el).onclick = () => { LS.clearCache(); UI.toast('Cache dibersihkan.'); };
}, { auth: true });
})();
