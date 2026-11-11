/* ==========================================================================
   PANEL ADMIN
   Dashboard · Buku · Kategori & Penulis · Mapel & Kelas · Pengguna · Peran & Izin
   Laporan · Pengumuman · Notifikasi · Identitas · Log · Impor · Sistem
   ========================================================================== */
(function () {
'use strict';
const { ic, esc, $, $$, fmtN, fmtDate, fmtRel, fmtSize, api, apiMany, Session, Router, LS, qsBuild } = SP;
const page = App.page;
const head = (title, sub, actions, crumb) => '<div class="crumbs"><a href="#' + App.adminHome() + '">Panel Admin</a>' + ic('right', 'sm') + '<b>' + esc(crumb || title) + '</b></div>' +
  '<div class="page-head"><div><h1 class="page-title">' + esc(title) + '</h1>' + (sub ? '<p class="page-sub">' + sub + '</p>' : '') + '</div><div class="row wrap">' + (actions || '') + '</div></div>';
const STATUS_BADGE = { TERBIT: '<span class="badge b-green"><span class="dot"></span>Terbit</span>', DRAF: '<span class="badge b-amber">Draf</span>', ARSIP: '<span class="badge b-gray">Arsip</span>' };
const opt = (v, l, cur) => '<option value="' + esc(v) + '" ' + (String(cur) === String(v) ? 'selected' : '') + '>' + esc(l) + '</option>';
let REF = null;
async function getRef(force) { if (REF && !force) return REF; const r = await api('adm.ref', {}); if (r.success) REF = r.data; return REF; }

/* ============================== DASHBOARD ============================== */
page('/admin', async ctx => {
  const el = ctx.el;
  el.innerHTML = head('Dashboard', 'Ringkasan koleksi, pengguna, dan aktivitas literasi digital sekolah.', '<span class="mono xs muted" data-upd></span><button class="btn btn-outline btn-sm" data-fresh>' + ic('refresh', 'sm') + 'Segarkan</button>' + (Session.can('laporan.lihat') ? '<a class="btn btn-primary btn-sm" href="#/admin/laporan">' + ic('bars', 'sm') + 'Laporan</a>' : '')) +
    '<div data-body><div class="kpi-grid">' + Array(6).fill('<div class="kpi">' + UI.skBlock(64) + '</div>').join('') + '</div><div class="charts-2">' + UI.skBlock(280) + UI.skBlock(280) + '</div></div>';
  const load = async fresh => {
    const key = 'adm_dash_' + Session.me.id;
    const draw = d => { if (ctx.alive()) drawDash(el, d); };
    if (fresh) { const r = await api('adm.dashboard', { _fresh: true }); if (UI.toastRes(r, 'Data diperbarui.')) { SP.cachePut(key, r.data); draw(r.data); } return; }
    await SP.swr(key, 'adm.dashboard', {}, 30000, draw, r => { if (ctx.alive()) $('[data-body]', el).innerHTML = UI.errorBox(r.message); });
  };
  $('[data-fresh]', el).onclick = e => { const bb = e.currentTarget; UI.btnBusy(bb, true); load(true).then(() => UI.btnBusy(bb, false)); };
  await load(false);
}, { izin: 'dashboard.lihat' });
function drawDash(el, d) {
  const k = d.kartu;
  $('[data-upd]', el).textContent = 'Diperbarui ' + fmtRel(d.dibuat);
  const kpi = (t, v, s, i) => '<div class="kpi"><div class="t">' + t + ic(i, 'sm') + '</div><div class="v" data-count="' + v + '">0</div><div class="s">' + s + '</div></div>';
  $('[data-body]', el).innerHTML = '<div class="kpi-grid">' + kpi('Total koleksi', k.buku, k.draf + ' draf menunggu terbit', 'book') + kpi('Pengguna terdaftar', k.pengguna, 'Akun aktif', 'users') +
    kpi('Aktif hari ini', k.aktifHariIni, 'Pengguna yang masuk', 'activity') + kpi('Aktivitas baca', k.aktivitasBaca, k.hariIni + ' sesi hari ini', 'open') +
    kpi('Buku selesai', k.selesai, 'Sepanjang waktu', 'checkc') + '<div class="kpi"><div class="t">Terpopuler' + ic('star', 'sm') + '</div><div style="font-weight:700;font-size:15px;margin-top:10px" class="clamp2">' + esc(k.terpopuler ? k.terpopuler.judul : '—') + '</div><div class="s">' + (k.terpopuler ? fmtN(k.terpopuler.pembaca) + ' pembaca' : 'Belum ada data') + '</div></div></div>' +
    '<div class="charts-2"><div class="chart-card"><div class="row between wrap"><div><h3>Pengguna aktif</h3><div class="sub">Jumlah pengguna unik yang masuk</div></div><div class="seg" data-per><button class="on" data-v="harian">Harian</button><button data-v="mingguan">Mingguan</button><button data-v="bulanan">Bulanan</button></div></div><div data-c1></div></div>' +
    '<div class="chart-card"><h3>Koleksi per kategori</h3><div class="sub">Buku terbit</div><div data-c2></div></div></div>' +
    '<div class="charts-2b"><div class="chart-card"><h3>Buku paling banyak dibaca</h3><div class="sub">Jumlah pembaca unik</div><div data-c3></div></div><div class="chart-card"><h3>Aktivitas baca per tingkat</h3><div class="sub">Sesi baca siswa (arahkan kursor untuk jumlah selesai)</div><div data-c4></div></div></div>' +
    '<div class="charts-2b"><div class="chart-card"><h3>Aktivitas baca per kelas</h3><div class="sub">12 kelas teraktif</div><div data-c5></div></div><div class="chart-card"><h3>Buku selesai dibaca per bulan</h3><div class="sub">12 bulan terakhir</div><div data-c6></div></div></div>' +
    '<div class="charts-2b"><div class="chart-card"><h3>Penambahan koleksi</h3><div class="sub">Buku baru per bulan</div><div data-c7></div></div><div class="chart-card"><h3>Pengguna per peran</h3><div class="sub">Akun aktif</div><div data-c8></div></div></div>' +
    '<section class="section"><div class="sec-head"><div class="sec-title"><span class="bar"></span>Aktivitas terbaru</div>' + (Session.can('log.lihat') ? '<a class="link-more p" href="#/admin/log">Log lengkap ' + ic('right', 'sm') + '</a>' : '') + '</div>' +
    '<div class="tbl-wrap"><table class="tbl cards"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Target</th></tr></thead><tbody>' +
    (d.terbaru.length ? d.terbaru.map(l => '<tr><td data-l="Waktu" class="mono small">' + fmtRel(l.waktu) + '</td><td data-l="Pengguna"><b>' + esc(l.nama) + '</b> <span class="muted small">' + esc(l.peran) + '</span></td><td data-l="Aksi"><span class="badge b-purple b-mono">' + esc(l.aksi) + '</span></td><td data-l="Target" class="small">' + esc(l.target) + '</td></tr>').join('') : '<tr><td colspan="4" class="muted">Belum ada aktivitas.</td></tr>') + '</tbody></table></div></section>';
  UI.countUp(el);
  Charts.line($('[data-c1]', el), d.aktif.harian, { unit: 'pengguna', label: 'Pengguna aktif harian' });
  UI.segInit($('[data-per]', el), v => Charts.line($('[data-c1]', el), d.aktif[v], { unit: 'pengguna', label: 'Pengguna aktif ' + v }));
  Charts.donut($('[data-c2]', el), d.perKategori, { unit: 'buku', label: 'Koleksi per kategori' });
  Charts.barH($('[data-c3]', el), d.topBuku, { unit: 'pembaca', label: 'Buku terpopuler' });
  Charts.barV($('[data-c4]', el), d.perTingkat, { unit: 'sesi', label: 'Aktivitas per tingkat' });
  Charts.barH($('[data-c5]', el), d.perKelas, { unit: 'sesi', label: 'Aktivitas per kelas' });
  Charts.line($('[data-c6]', el), d.selesaiBulanan, { unit: 'buku selesai', label: 'Buku selesai per bulan' });
  Charts.barV($('[data-c7]', el), d.penambahan, { unit: 'buku', label: 'Penambahan koleksi', height: 200 });
  Charts.donut($('[data-c8]', el), d.perPeran, { unit: 'akun', label: 'Pengguna per peran' });
}

/* ============================== KELOLA BUKU ============================== */
page('/admin/buku', async ctx => {
  const q = Object.assign({ hal: '1', per: '20', status: '' }, ctx.query), el = ctx.el;
  const go = (p, keep) => Router.go('/admin/buku' + qsBuild(Object.assign({}, q, p, keep ? {} : { hal: '1' })));
  const ref = await getRef();
  if (!ctx.alive()) return;
  el.innerHTML = head('Kelola Buku', 'Tambah, ubah, terbitkan, dan atur akses koleksi digital.', (Session.can('impor.jalankan') ? '<a class="btn btn-outline" href="#/admin/impor?target=buku">' + ic('upload', 'sm') + 'Impor</a>' : '') +
    (Session.can('buku.tambah') ? '<a class="btn btn-outline-p" href="#/admin/buku/baru?jenis=PELAJARAN">' + ic('cap', 'sm') + 'Buku Pelajaran</a><a class="btn btn-primary" href="#/admin/buku/baru">' + ic('plus', 'sm') + 'Tambah Buku</a>' : ''), 'Buku') +
    '<div class="tabs" data-st>' + [['', 'Semua'], ['TERBIT', 'Terbit'], ['DRAF', 'Draf'], ['ARSIP', 'Arsip']].map(s => '<button class="' + (q.status === s[0] ? 'on' : '') + '" data-s="' + s[0] + '">' + s[1] + ' <span class="badge b-gray" data-n="' + (s[0] || 'SEMUA') + '">…</span></button>').join('') + '</div>' +
    '<div class="filters"><div class="grid"><div class="field"><span class="lbl-mono">Cari</span><div class="inp-wrap">' + ic('search', 'sm') + '<input class="inp" data-q placeholder="Judul, penulis, ISBN…" value="' + esc(q.q || '') + '"></div></div>' +
    '<div class="field"><span class="lbl-mono">Jenis</span><select class="sel" data-f="jenis">' + opt('', 'Semua', q.jenis) + opt('UMUM', 'Bacaan umum', q.jenis) + opt('PELAJARAN', 'Buku pelajaran', q.jenis) + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Kategori</span><select class="sel" data-f="kategori">' + opt('', 'Semua', q.kategori) + ref.kategori.map(k => opt(k.id, k.nama, q.kategori)).join('') + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Mapel</span><select class="sel" data-f="mapel">' + opt('', 'Semua', q.mapel) + ref.mapel.map(k => opt(k.id, k.nama, q.mapel)).join('') + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Akses</span><select class="sel" data-f="akses">' + opt('', 'Semua', q.akses) + ['PUBLIK', 'TERDAFTAR', 'SEKOLAH', 'TERBATAS'].map(a => opt(a, UI.AKSES_LABEL[a], q.akses)).join('') + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Format</span><select class="sel" data-f="format">' + opt('', 'Semua', q.format) + opt('PDF', 'PDF', q.format) + opt('EPUB', 'EPUB', q.format) + opt('LINK', 'Tautan', q.format) + '</select></div></div></div>' +
    '<div data-bulk></div><div data-list>' + UI.skRows(8) + '</div>';
  $$('[data-s]', el).forEach(b => b.onclick = () => go({ status: b.dataset.s }));
  $$('[data-f]', el).forEach(s => s.onchange = () => go({ [s.dataset.f]: s.value }));
  $('[data-q]', el).addEventListener('input', SP.debounce(e => go({ q: e.target.value.trim() }), 450));
  const sel = new Set();
  const load = async () => {
    const r = await api('adm.buku.daftar', Object.assign({}, q, { per: Number(q.per) }));
    if (!ctx.alive()) return;
    if (!r.success) { $('[data-list]', el).innerHTML = UI.errorBox(r.message); return; }
    const d = r.data;
    Object.keys(d.jumlah).forEach(k => { const n = $('[data-n="' + k + '"]', el); if (n) n.textContent = d.jumlah[k]; });
    const bulk = () => {
      $('[data-bulk]', el).innerHTML = sel.size ? '<div class="bulk"><div class="row">' + ic('check') + '<b>' + sel.size + ' buku dipilih</b><button class="btn btn-ghost btn-sm" data-clr>Batal pilihan</button></div><div class="row wrap">' +
        (Session.can('buku.ubah') ? '<button class="btn btn-sm btn-accent" data-ba="TERBIT">' + ic('check', 'sm') + 'Terbitkan</button><button class="btn btn-sm btn-outline" data-ba="DRAF">Jadikan draf</button><button class="btn btn-sm btn-outline" data-ba="ARSIP">Arsipkan</button>' +
          '<select class="sel" data-bk style="width:auto;min-height:32px"><option value="">Pindah kategori…</option>' + ref.kategori.map(k => opt(k.id, k.nama)).join('') + '</select>' : '') +
        (Session.can('buku.hapus') ? '<button class="btn btn-sm btn-danger-o" data-ba="HAPUS">' + ic('trash', 'sm') + 'Hapus</button>' : '') + '</div></div>' : '';
      const c = $('[data-clr]', el); if (c) c.onclick = () => { sel.clear(); $$('[data-ck]', el).forEach(x => { x.checked = false; x.closest('tr').classList.remove('sel'); }); bulk(); };
      $$('[data-ba]', el).forEach(b => b.onclick = () => massal(b.dataset.ba));
      const bk = $('[data-bk]', el); if (bk) bk.onchange = () => bk.value && massal('KATEGORI', bk.value);
    };
    const massal = async (aksi, nilai) => {
      if (aksi === 'HAPUS' && !(await UI.confirmDlg('Hapus permanen ' + sel.size + ' buku? Berkas di folder aplikasi ikut dipindahkan ke sampah Drive.', { danger: true, ok: 'Hapus' }))) return;
      const r2 = await api('adm.buku.massal', { ids: Array.from(sel), aksi, nilai });
      if (UI.toastRes(r2)) { sel.clear(); SP.cacheDrop('kat_'); App.reloadBoot(); load(); bulk(); }
    };
    $('[data-list]', el).innerHTML = d.items.length ? '<div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl cards"><thead><tr><th style="width:36px"><input type="checkbox" data-all aria-label="Pilih semua"></th><th>Buku</th><th>Kategori / Mapel</th><th>Format</th><th>Akses</th><th>Status</th><th class="num">Pembaca</th><th>Diubah</th><th></th></tr></thead><tbody>' +
      d.items.map(b => '<tr><td><input type="checkbox" data-ck="' + esc(b.id) + '" aria-label="Pilih ' + esc(b.judul) + '"></td><td data-l="Buku"><div class="row gap12"><div class="thumb">' + UI.cover(b, 6) + '</div><div style="min-width:0"><a href="#/admin/buku/' + esc(b.id) + '" style="font-weight:700;color:var(--c-text)" class="clamp2">' + esc(b.judul) + '</a><div class="muted small trunc">' + esc(b.penulis || '—') + (b.tahun ? ' · ' + esc(b.tahun) : '') + '</div>' + (!b.ada ? '<span class="badge b-red">Belum ada berkas</span>' : '') + '</div></div></td>' +
        '<td data-l="Kategori">' + (b.jenis === 'PELAJARAN' ? '<span class="badge b-solid">' + esc(b.mapelNama || 'Pelajaran') + '</span><div class="mono xs muted mt8">' + esc((b.kelas.length ? b.kelas : b.tingkat).join(', ')) + (b.tipe ? ' · ' + esc(b.tipe) : '') + '</div>' : esc(b.katNama || '—')) + '</td>' +
        '<td data-l="Format">' + UI.formatTag(b.format) + (b.ukuran ? '<div class="mono xs muted mt8">' + fmtSize(b.ukuran) + '</div>' : '') + '</td><td data-l="Akses">' + UI.accessBadge(b.akses, true) + '</td><td data-l="Status">' + (STATUS_BADGE[b.status] || '') + '</td>' +
        '<td data-l="Pembaca" class="num">' + fmtN(b.pembaca) + '</td><td data-l="Diubah" class="mono xs muted">' + fmtDate(b.diubah) + '<div>' + esc(b.oleh || '') + '</div></td>' +
        '<td><div class="row end"><a class="btn-icon sm btn" href="#/buku/' + esc(b.id) + '" aria-label="Lihat">' + ic('eye', 'sm') + '</a>' + (Session.can('buku.ubah') ? '<a class="btn-icon sm btn" href="#/admin/buku/' + esc(b.id) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</a>' : '') + '</div></td></tr>').join('') +
      '</tbody></table></div>' + UI.pager({ total: d.total, hal: d.hal, halaman: d.halaman, per: d.per, unit: 'buku', perOpts: [10, 20, 50] }) + '</div>'
      : '<div class="panel">' + UI.empty('book', 'Tidak ada buku', q.q ? 'Tidak ada hasil untuk "' + esc(q.q) + '".' : 'Mulai tambahkan koleksi pertama Anda.', Session.can('buku.tambah') ? '<a class="btn btn-primary" href="#/admin/buku/baru">' + ic('plus', 'sm') + 'Tambah Buku</a>' : '') + '</div>';
    UI.bindPager(el, p => go({ hal: String(p) }, true), p => go({ per: String(p) }));
    $$('[data-ck]', el).forEach(c => c.onchange = () => { c.checked ? sel.add(c.dataset.ck) : sel.delete(c.dataset.ck); c.closest('tr').classList.toggle('sel', c.checked); bulk(); });
    const all = $('[data-all]', el); if (all) all.onchange = () => { $$('[data-ck]', el).forEach(c => { c.checked = all.checked; c.dispatchEvent(new Event('change')); }); };
  };
  load();
}, { izin: 'buku.lihat' });

/* ---------- Form tambah / ubah buku ---------- */
async function uploadBook(file, onProg) {
  const fmt = /\.epub$/i.test(file.name) || file.type === 'application/epub+zip' ? 'EPUB' : 'PDF';
  const s = await api('unggah.mulai', { nama: file.name, format: fmt, ukuran: file.size });
  if (!s.success) throw new Error(s.message);
  const CH = s.data.potong, n = Math.ceil(file.size / CH);
  for (let i = 0; i < n; i++) {
    const data = UI.bufB64(await file.slice(i * CH, (i + 1) * CH).arrayBuffer());
    let r;
    for (let t = 0; t < 3; t++) { r = await api('unggah.potong', { uid: s.data.uid, i, data }); if (r.success || r.code === 'ORDER') break; await new Promise(z => setTimeout(z, 1000 * (t + 1))); }
    if (!r.success) throw new Error(r.message);
    onProg((i + 1) / n);
    if (r.data.selesai) return r.data;
  }
  throw new Error('Unggahan tidak selesai.');
}
async function bookForm(ctx) {
  const id = ctx.params.id, baru = !id, el = ctx.el;
  el.innerHTML = UI.skBlock(80) + '<div class="mt16">' + UI.skBlock(400) + '</div>';
  const res = await apiMany(baru ? [['adm.ref', {}]] : [['adm.ref', {}], ['adm.buku.get', { id }]]);
  if (!ctx.alive()) return;
  if (!res[0].success) { el.innerHTML = UI.errorBox(res[0].message); return; }
  REF = res[0].data;
  if (!baru && !res[1].success) { el.innerHTML = UI.errorBox(res[1].message); return; }
  const ref = REF, max = Number(App.settings.MAKS_UNGGAH_MB || 25);
  const B = baru ? { akses: 'SEKOLAH', status: 'DRAF', jenis: ctx.query.jenis === 'PELAJARAN' ? 'PELAJARAN' : 'UMUM', format: 'PDF', bahasa: 'Indonesia', sumber: 'UNGGAH', kurikulum: App.settings.KURIKULUM || '' } : res[1].data;
  B.tingkat = Array.isArray(B.tingkat) ? B.tingkat : String(B.tingkat || '').split(',').filter(Boolean);
  B.kelas = Array.isArray(B.kelas) ? B.kelas : String(B.kelas || '').split(',').filter(Boolean);
  B.akses_peran = String(B.akses_peran || '').split(',').filter(Boolean); B.akses_kelompok = String(B.akses_kelompok || '').split(',').filter(Boolean);
  if (!baru) B.sumber = B.format === 'LINK' ? 'LINK' : 'UNGGAH';
  const chk = (name, val, on, label) => '<label class="chip ' + (on ? 'on' : '') + '"><input type="checkbox" name="' + name + '" value="' + esc(val) + '" ' + (on ? 'checked' : '') + ' hidden>' + esc(label) + '</label>';
  const AK = [['PUBLIK', 'Publik', 'Dapat dibaca siapa pun tanpa login.', 'globe'], ['TERDAFTAR', 'Pengguna Terdaftar', 'Dapat dibaca semua pengguna yang sudah masuk.', 'user'],
    ['SEKOLAH', 'Khusus Warga Sekolah', 'Siswa, guru, dan staf sekolah.', 'cap'], ['TERBATAS', 'Terbatas', 'Hanya peran atau kelas/tingkat tertentu.', 'lock']];
  el.innerHTML = '<div class="crumbs"><a href="#/admin/buku">Kelola Buku</a>' + ic('right', 'sm') + '<b>' + (baru ? 'Tambah Buku' : 'Ubah Buku') + '</b></div>' +
    '<div class="page-head"><div><a href="#/admin/buku" class="small">' + ic('arrowl', 'sm') + ' Kembali ke daftar buku</a><h1 class="page-title mt8">' + (baru ? 'Tambah Buku Baru' : esc(B.judul)) + '</h1></div>' + (!baru ? '<div class="row">' + (STATUS_BADGE[B.status] || '') + '<a class="btn btn-outline btn-sm" href="#/buku/' + esc(B.id) + '">' + ic('eye', 'sm') + 'Lihat halaman buku</a></div>' : '') + '</div>' +
    '<form data-form novalidate><div class="layout-2"><div>' +
    '<section class="form-sec"><h3><span class="no">1</span>Jenis koleksi</h3><div class="seg full" data-jenis><button type="button" data-v="UMUM" class="' + (B.jenis !== 'PELAJARAN' ? 'on' : '') + '">' + ic('book', 'sm') + 'Bacaan Umum</button><button type="button" data-v="PELAJARAN" class="' + (B.jenis === 'PELAJARAN' ? 'on' : '') + '">' + ic('cap', 'sm') + 'Buku / Materi Pelajaran</button></div>' +
    '<div data-pel class="' + (B.jenis === 'PELAJARAN' ? '' : 'hide') + ' mt16"><div class="grid2"><div class="field"><label>Mata pelajaran <span class="req">*</span></label><select class="sel" name="mapel_id">' + opt('', 'Pilih mapel…', B.mapel_id) + ref.mapel.map(m => opt(m.id, m.nama + (m.kode ? ' (' + m.kode + ')' : ''), B.mapel_id)).join('') + '</select></div>' +
    '<div class="field"><label>Tipe materi</label><select class="sel" name="tipe_materi">' + opt('', 'Pilih tipe…', B.tipe_materi) + ref.tipe.map(t => opt(t, t, B.tipe_materi)).join('') + '</select></div>' +
    '<div class="field span2"><label>Tingkat <span class="req">*</span></label><div class="row wrap">' + ref.tingkat.map(t => chk('tingkat', t, B.tingkat.indexOf(t) > -1, 'Kelas ' + t)).join('') + '</div><span class="help">Materi tampil di menu Buku Pelajaran untuk tingkat yang dipilih.</span></div>' +
    '<div class="field span2"><label>Khusus kelas tertentu <span class="muted small">(opsional)</span></label><div class="row wrap" data-kelas-chips style="max-height:150px;overflow:auto"></div><span class="help">Kosongkan agar semua kelas di tingkat tersebut dapat membaca. Bila dipilih, hanya siswa kelas itu (serta guru & staf) yang melihat materi ini.</span></div>' +
    '<div class="field"><label>Semester</label><select class="sel" name="semester">' + opt('', 'Semua semester', B.semester) + opt('1', 'Semester 1 (Ganjil)', B.semester) + opt('2', 'Semester 2 (Genap)', B.semester) + '</select></div>' +
    '<div class="field"><label>Urutan / bab</label><input class="inp" type="number" min="0" name="urutan" value="' + esc(B.urutan || '') + '" placeholder="1"></div>' +
    '<div class="field span2"><label>Kurikulum</label><input class="inp" name="kurikulum" value="' + esc(B.kurikulum || '') + '" placeholder="Kurikulum Merdeka"></div></div></div></section>' +
    '<section class="form-sec"><h3><span class="no">2</span>Informasi dasar</h3><div class="grid2"><div class="field span2"><label>Judul buku <span class="req">*</span></label><input class="inp" name="judul" required maxlength="200" value="' + esc(B.judul || '') + '"></div>' +
    '<div class="field span2"><label>Subjudul</label><input class="inp" name="subjudul" maxlength="200" value="' + esc(B.subjudul || '') + '"></div>' +
    '<div class="field"><label>Penulis</label><input class="inp" name="penulis" list="dl-penulis" value="' + esc(B.penulis || '') + '"><datalist id="dl-penulis">' + ref.penulis.map(p => '<option value="' + esc(p.nama) + '">').join('') + '</datalist></div>' +
    '<div class="field"><label>Penerbit</label><input class="inp" name="penerbit" value="' + esc(B.penerbit || '') + '"></div>' +
    '<div class="field"><label>Tahun terbit</label><input class="inp mono" name="tahun" inputmode="numeric" maxlength="4" value="' + esc(B.tahun || '') + '"></div><div class="field"><label>ISBN</label><input class="inp mono" name="isbn" value="' + esc(B.isbn || '') + '"></div>' +
    '<div class="field"><label>Kategori</label><select class="sel" name="kategori_id">' + opt('', 'Tanpa kategori', B.kategori_id) + ref.kategori.map(k => opt(k.id, k.nama, B.kategori_id)).join('') + '</select></div>' +
    '<div class="field"><label>Bahasa</label><input class="inp" name="bahasa" value="' + esc(B.bahasa || 'Indonesia') + '"></div>' +
    '<div class="field"><label>Jumlah halaman</label><input class="inp mono" type="number" min="0" name="halaman" value="' + esc(B.halaman || '') + '"></div><div class="field"><label>Kode rak</label><input class="inp mono" name="kode_rak" value="' + esc(B.kode_rak || '') + '" placeholder="Sains A-12"></div>' +
    '<div class="field span2"><label>Sinopsis / deskripsi</label><textarea class="ta" name="deskripsi" maxlength="8000">' + esc(B.deskripsi || '') + '</textarea></div></div></section>' +
    '<section class="form-sec"><h3><span class="no">3</span>Berkas buku</h3><div class="seg full" data-src><button type="button" data-v="UNGGAH" class="' + (B.sumber === 'UNGGAH' ? 'on' : '') + '">' + ic('upload', 'sm') + 'Unggah PDF/EPUB</button><button type="button" data-v="DRIVE" class="' + (B.sumber === 'DRIVE' ? 'on' : '') + '">' + ic('database', 'sm') + 'Dari Google Drive</button><button type="button" data-v="LINK" class="' + (B.sumber === 'LINK' ? 'on' : '') + '">' + ic('link', 'sm') + 'Tautan eksternal</button></div>' +
    '<div data-s="UNGGAH" class="mt16"><label class="dropzone" data-drop><input type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" hidden data-file>' + ic('upload', 'xl') + '<div class="mt8"><b>Pilih atau tarik berkas ke sini</b></div><div class="help">PDF atau EPUB, maksimal ' + max + ' MB. Diunggah bertahap langsung ke Google Drive sekolah.</div></label>' +
    '<div data-upinfo class="mt12">' + (B.file_ada || B.file_id ? '<div class="alert green">' + ic('checkc') + '<div>Berkas sudah tersimpan (' + esc(B.format) + (B.ukuran ? ', ' + fmtSize(B.ukuran) : '') + '). Unggah berkas baru untuk menggantinya.</div></div>' : '') + '</div></div>' +
    '<div data-s="DRIVE" class="mt16 field"><label>Tautan berkas Google Drive</label><input class="inp" name="drive" placeholder="https://drive.google.com/file/d/…/view"><span class="help">Berkas harus milik/dibagikan ke akun pemilik Apps Script. Cocok untuk berkas besar yang sudah ada di Drive.</span></div>' +
    '<div data-s="LINK" class="mt16 field"><label>Alamat tautan (https://)</label><input class="inp" name="url" value="' + esc(B.url || '') + '" placeholder="https://buku.sumber-resmi.go.id/…"><span class="help">Untuk buku yang dibaca di situs penyedia resmi. Pembaca membuka tab baru.</span></div></section>' +
    '<section class="form-sec"><h3><span class="no">4</span>Tingkat akses</h3><div class="grid2">' + AK.map(a => '<label class="radio-card ' + (B.akses === a[0] ? 'on' : '') + '"><input type="radio" name="akses" value="' + a[0] + '" ' + (B.akses === a[0] ? 'checked' : '') + '><span>' + ic(a[3], 'sm') + ' <b>' + a[1] + '</b><div class="help">' + a[2] + '</div></span></label>').join('') + '</div>' +
    '<div data-terbatas class="mt16 ' + (B.akses === 'TERBATAS' ? '' : 'hide') + '"><div class="field"><label>Peran yang diizinkan</label><div class="row wrap">' + ref.peran.map(p => chk('akses_peran', p.id, B.akses_peran.indexOf(p.id) > -1, p.nama)).join('') + '</div></div>' +
    '<div class="field mt12"><label>Atau tingkat / kelas yang diizinkan</label><div class="row wrap" style="max-height:150px;overflow:auto">' + ref.tingkat.map(t => chk('akses_kelompok', t, B.akses_kelompok.indexOf(t) > -1, 'Tingkat ' + t)).join('') + ref.kelas.map(k => chk('akses_kelompok', k.nama, B.akses_kelompok.indexOf(k.nama) > -1, k.nama)).join('') + '</div></div></div>' +
    '<div class="alert amber mt16">' + ic('info') + '<div>Pastikan sekolah memiliki izin distribusi digital untuk setiap buku yang diunggah.</div></div></section></div>' +
    '<aside><section class="form-sec"><h3>' + ic('file') + 'Sampul</h3><div style="max-width:220px;margin:0 auto" data-cvprev>' + UI.cover({ id: B.id || 'baru', judul: B.judul || 'Judul Buku', penulis: B.penulis, cover: B.cover_url }, 16) + '</div>' +
    '<label class="btn btn-outline btn-block mt16">' + ic('upload', 'sm') + 'Unggah gambar sampul<input type="file" accept="image/*" hidden data-cover></label><div class="field mt12"><span class="lbl-mono">atau URL gambar</span><input class="inp" name="cover_url" value="' + esc(B.cover_url || '') + '" placeholder="https://…"></div>' +
    '<p class="help mt8">Gambar diperkecil otomatis (maks. 600 px). Tanpa sampul, aplikasi membuat sampul berwarna dari judul.</p></section>' +
    '<section class="form-sec"><h3>' + ic('info') + 'Ringkasan</h3><div class="kv"><span>Status</span><b data-sumst>' + esc(B.status) + '</b></div><div class="kv"><span>Ditambahkan</span><b>' + (B.dibuat ? fmtDate(B.dibuat) : '—') + '</b></div><div class="kv"><span>Oleh</span><b>' + esc(B.dibuat_oleh || Session.me.nama) + '</b></div>' +
    (!baru && Session.can('buku.hapus') ? '<button type="button" class="btn btn-danger-o btn-block mt16" data-del>' + ic('trash', 'sm') + 'Hapus buku</button>' : '') + '</section></aside></div>' +
    '<div class="sticky-bar"><a class="btn btn-outline" href="#/admin/buku">Batal</a><div class="row wrap"><span class="err-text" data-err></span><button type="button" class="btn btn-outline" data-save="DRAF">Simpan sebagai Draf</button><button type="button" class="btn btn-accent" data-save="TERBIT">' + ic('check', 'sm') + (B.status === 'TERBIT' ? 'Simpan & Tetap Terbit' : 'Terbitkan') + '</button></div></div></form>';
  const f = $('[data-form]', el);
  const bindChips = root => $$('label.chip', root).forEach(l => { const i = $('input', l); i.onchange = () => l.classList.toggle('on', i.checked); });
  const drawKelas = () => {
    const tg = $$('input[name=tingkat]:checked', f).map(i => i.value);
    const list = ref.kelas.filter(k => !tg.length || tg.indexOf(k.tingkat) > -1);
    $('[data-kelas-chips]', el).innerHTML = list.length ? list.map(k => chk('kelas', k.nama, B.kelas.indexOf(k.nama) > -1, k.nama)).join('') : '<span class="muted small">Belum ada data kelas untuk tingkat ini.</span>';
    bindChips($('[data-kelas-chips]', el));
  };
  bindChips(f); drawKelas();
  $$('input[name=tingkat]', f).forEach(i => i.addEventListener('change', () => { B.kelas = $$('input[name=kelas]:checked', f).map(x => x.value); drawKelas(); }));
  UI.segInit($('[data-jenis]', el), v => { B.jenis = v; $('[data-pel]', el).classList.toggle('hide', v !== 'PELAJARAN'); });
  const showSrc = v => { B.sumber = v; $$('[data-s]', el).forEach(s => s.classList.toggle('hide', s.dataset.s !== v)); };
  UI.segInit($('[data-src]', el), showSrc); showSrc(B.sumber);
  $$('input[name=akses]', f).forEach(r => r.onchange = () => { $$('.radio-card', f).forEach(c => c.classList.toggle('on', $('input', c).checked)); $('[data-terbatas]', el).classList.toggle('hide', r.value !== 'TERBATAS' || !r.checked); });
  // unggah berkas buku
  let uploading = false;
  const startUpload = async file => {
    if (!file) return;
    if (!/\.(pdf|epub)$/i.test(file.name)) return UI.toast('Pilih berkas PDF atau EPUB.', 'err');
    if (file.size > max * 1048576) return UI.toast('Ukuran maksimal ' + max + ' MB. Gunakan opsi "Dari Google Drive" untuk berkas besar.', 'err');
    const info = $('[data-upinfo]', el);
    info.innerHTML = '<div class="panel"><div class="row between"><b class="trunc">' + ic('file', 'sm') + ' ' + esc(file.name) + '</b><span class="mono small" data-pct>0%</span></div><div class="progress mt8"><i data-bar style="width:2%"></i></div><div class="help mt8">' + fmtSize(file.size) + ' · jangan tutup halaman sampai selesai</div></div>';
    uploading = true;
    try {
      const r = await uploadBook(file, p => { $('[data-bar]', info).style.width = Math.round(p * 100) + '%'; $('[data-pct]', info).textContent = Math.round(p * 100) + '%'; });
      B.file_id = r.fileId; B.ukuran = r.ukuran; B.format = r.format; B.sumber = 'UNGGAH';
      info.innerHTML = '<div class="alert green">' + ic('checkc') + '<div><b>' + esc(file.name) + '</b> berhasil diunggah (' + fmtSize(r.ukuran) + ').</div></div>';
      if (!$('[name=judul]', f).value) $('[name=judul]', f).value = file.name.replace(/\.(pdf|epub)$/i, '').replace(/[_-]+/g, ' ');
    } catch (e) { info.innerHTML = '<div class="alert red">' + ic('alert') + '<div>' + esc(e.message) + '</div></div>'; }
    uploading = false;
  };
  $('[data-file]', el).onchange = e => startUpload(e.target.files[0]);
  const dz = $('[data-drop]', el);
  ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => startUpload(e.dataTransfer.files[0]));
  // sampul
  const prevCover = () => { $('[data-cvprev]', el).innerHTML = UI.cover({ id: B.id || 'baru', judul: $('[name=judul]', f).value || 'Judul Buku', penulis: $('[name=penulis]', f).value, cover: $('[name=cover_url]', f).value }, 16); };
  $('[name=cover_url]', f).addEventListener('change', prevCover);
  $('[name=judul]', f).addEventListener('input', SP.debounce(prevCover, 400));
  $('[data-cover]', el).onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const img = await UI.resizeImage(file, 600, 900, .84);
      $('[data-cvprev]', el).innerHTML = '<div class="cover"><img src="' + img.preview + '" alt=""></div>';
      const r = await api('unggah.gambar', { jenis: 'cover', data: img.data, mime: img.mime, nama: $('[name=judul]', f).value || 'sampul' });
      if (UI.toastRes(r, 'Sampul diunggah.')) { $('[name=cover_url]', f).value = r.data.url; B.cover_id = r.data.fileId; }
    } catch (err) { UI.toast(err.message, 'err'); }
  };
  // simpan
  $$('[data-save]', el).forEach(btn => btn.onclick = async () => {
    if (uploading) return UI.toast('Tunggu unggahan selesai.', 'warn');
    const fd = new FormData(f), err = $('[data-err]', el); err.textContent = '';
    const data = { id: B.id || '', jenis: B.jenis, sumber: B.sumber, file_id: B.file_id || '', ukuran: B.ukuran || 0, format: B.sumber === 'LINK' ? 'LINK' : B.format, cover_id: B.cover_id || '', status: btn.dataset.save,
      tingkat: fd.getAll('tingkat'), kelas: fd.getAll('kelas'), akses_peran: fd.getAll('akses_peran'), akses_kelompok: fd.getAll('akses_kelompok') };
    ['judul', 'subjudul', 'penulis', 'penerbit', 'tahun', 'isbn', 'kategori_id', 'bahasa', 'halaman', 'kode_rak', 'deskripsi', 'mapel_id', 'tipe_materi', 'semester', 'urutan', 'kurikulum', 'akses', 'drive', 'url', 'cover_url'].forEach(k => { data[k] = fd.get(k) || ''; });
    if (!data.judul.trim()) { err.textContent = 'Judul wajib diisi.'; $('[name=judul]', f).focus(); return; }
    UI.btnBusy(btn, true, 'Menyimpan…');
    const r = await api('adm.buku.simpan', { buku: data });
    UI.btnBusy(btn, false);
    if (!r.success) { err.textContent = r.message; UI.toast(r.message, 'err'); return; }
    UI.toast(r.message); SP.cacheDrop('kat_'); SP.cacheDrop('bd_'); SP.cacheDrop('pel'); App.reloadBoot();
    Router.go('/admin/buku');
  });
  const del = $('[data-del]', el);
  if (del) del.onclick = async () => {
    if (!(await UI.confirmDlg('Hapus "' + esc(B.judul) + '" secara permanen? Riwayat baca tetap tersimpan untuk laporan.', { danger: true, ok: 'Hapus buku' }))) return;
    if (UI.toastRes(await api('adm.buku.massal', { ids: [B.id], aksi: 'HAPUS' }))) { SP.cacheDrop('kat_'); App.reloadBoot(); Router.go('/admin/buku'); }
  };
}
page('/admin/buku/baru', bookForm, { izin: 'buku.tambah' });
page('/admin/buku/:id', bookForm, { izin: 'buku.ubah' });

/* ============================== KATEGORI & PENULIS ============================== */
const IKON = ['buku', 'pena', 'atom', 'flask', 'dna', 'matematika', 'sejarah', 'globe', 'bahasa', 'seni', 'komputer', 'grafik', 'peta', 'orang', 'olahraga', 'agama', 'pancasila', 'bintang', 'referensi', 'palu'];
function refDrawer(jenis, item, done) {
  const x = item || {}, title = { kategori: 'kategori', penulis: 'penulis', mapel: 'mata pelajaran', kelas: 'kelas' }[jenis];
  const ref = REF || {};
  let body = '<div class="field"><label>Nama <span class="req">*</span></label><input class="inp" name="nama" value="' + esc(x.nama || '') + '" maxlength="120" ' + (jenis === 'kelas' ? 'placeholder="Contoh: XII MIPA 2"' : '') + '></div>';
  if (jenis === 'kategori' || jenis === 'mapel') body += '<div class="grid2"><div class="field"><label>Warna</label><div class="color-inp"><input type="color" name="warna" value="' + esc(x.warna || '#6B3FA0') + '"><span class="mono small muted">dipakai di sampul & kartu</span></div></div>' +
    '<div class="field"><label>Ikon</label><select class="sel" name="ikon">' + IKON.map(i => opt(i, i, x.ikon)).join('') + '</select></div></div>';
  if (jenis === 'kategori') body += '<div class="field"><label>Deskripsi</label><textarea class="ta" name="deskripsi">' + esc(x.deskripsi || '') + '</textarea></div>';
  if (jenis === 'mapel') body += '<div class="grid2"><div class="field"><label>Kode</label><input class="inp mono" name="kode" value="' + esc(x.kode || '') + '" maxlength="12"></div><div class="field"><label>Kelompok</label><input class="inp" name="kelompok" list="dl-kel" value="' + esc(x.kelompok || '') + '"><datalist id="dl-kel"><option value="Umum"><option value="IPA"><option value="IPS"><option value="Bahasa"><option value="Pilihan"><option value="Muatan Lokal"></datalist></div></div>' +
    '<div class="field"><label>Diajarkan di tingkat</label><div class="row wrap">' + ['X', 'XI', 'XII'].map(t => '<label class="chip ' + ((x.tingkat || ['X', 'XI', 'XII']).indexOf(t) > -1 ? 'on' : '') + '"><input type="checkbox" name="tingkat" value="' + t + '" ' + ((x.tingkat || ['X', 'XI', 'XII']).indexOf(t) > -1 ? 'checked' : '') + ' hidden>Kelas ' + t + '</label>').join('') + '</div></div>';
  if (jenis === 'kelas') body += '<div class="grid2"><div class="field"><label>Tingkat</label><select class="sel" name="tingkat">' + opt('', 'Otomatis dari nama', x.tingkat) + ['X', 'XI', 'XII'].map(t => opt(t, t, x.tingkat)).join('') + '</select></div><div class="field"><label>Jurusan / peminatan</label><input class="inp" name="jurusan" value="' + esc(x.jurusan || '') + '"></div></div>' +
    '<div class="field"><label>Wali kelas</label><select class="sel" name="wali_id">' + opt('', '—', x.wali_id) + (ref.guru || []).map(g => opt(g.id, g.nama, x.wali_id)).join('') + '</select></div>' + (x.id ? '<p class="help">Mengganti nama kelas otomatis memperbarui kelas siswa dan materi yang memakai nama lama.</p>' : '');
  if (jenis === 'penulis') body += '<div class="field"><label>Biografi singkat</label><textarea class="ta" name="bio">' + esc(x.bio || '') + '</textarea></div><div class="field"><label>Foto</label><div class="row"><span data-fprev>' + (x.foto ? '<img src="' + esc(x.foto) + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover">' : '') + '</span><label class="btn btn-outline btn-sm">' + ic('upload', 'sm') + 'Unggah foto<input type="file" accept="image/*" hidden data-pfoto></label><input type="hidden" name="foto" value="' + esc(x.foto || '') + '"></div></div>';
  if (jenis !== 'penulis' && jenis !== 'kelas') body += '<div class="field"><label>Urutan tampil</label><input class="inp" type="number" name="urutan" value="' + esc(x.urutan || 99) + '"></div>';
  const d = UI.drawer({ title: (x.id ? 'Ubah ' : 'Tambah ') + title, body: '<form data-rf class="stack gap16">' + body + '</form>',
    foot: (x.id ? '<button class="btn btn-danger-o" data-rdel style="margin-right:auto">' + ic('trash', 'sm') + 'Hapus</button>' : '') + '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-rsave>Simpan</button>' });
  $$('label.chip', d.el).forEach(l => { const i = $('input', l); i.onchange = () => l.classList.toggle('on', i.checked); });
  const pf = $('[data-pfoto]', d.el);
  if (pf) pf.onchange = async e => { try { const img = await UI.resizeImage(e.target.files[0], 300, 300); const r = await api('unggah.gambar', { jenis: 'penulis', data: img.data, mime: img.mime, nama: 'penulis' }); if (UI.toastRes(r, 'Foto diunggah.')) { $('[name=foto]', d.el).value = r.data.url; $('[data-fprev]', d.el).innerHTML = '<img src="' + img.preview + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover">'; } } catch (er) { UI.toast(er.message, 'err'); } };
  $('[data-rsave]', d.el).onclick = async e => {
    const fd = new FormData($('[data-rf]', d.el)), it = { id: x.id || '' };
    fd.forEach((v, k) => { if (k !== 'tingkat') it[k] = v; });
    if (jenis === 'mapel') it.tingkat = fd.getAll('tingkat'); else if (jenis === 'kelas') it.tingkat = fd.get('tingkat');
    const bb = e.currentTarget; UI.btnBusy(bb, true); const r = await api('adm.ref.simpan', { jenis, item: it }); UI.btnBusy(bb, false);
    if (UI.toastRes(r)) { d.close(); App.reloadBoot(); done(); }
  };
  const del = $('[data-rdel]', d.el);
  if (del) del.onclick = async () => { if (!(await UI.confirmDlg('Hapus ' + title + ' "' + esc(x.nama) + '"?', { danger: true, ok: 'Hapus' }))) return; if (UI.toastRes(await api('adm.ref.hapus', { jenis, id: x.id }))) { d.close(); App.reloadBoot(); done(); } };
}
function refPage(cfg) {
  return async ctx => {
    const el = ctx.el, tab = ctx.query.tab || cfg.tabs[0][0];
    el.innerHTML = head(cfg.title, cfg.sub, '<button class="btn btn-primary" data-add>' + ic('plus', 'sm') + 'Tambah</button>') +
      '<div class="tabs">' + cfg.tabs.map(t => '<button class="' + (t[0] === tab ? 'on' : '') + '" data-tab="' + t[0] + '">' + ic(t[2], 'sm') + t[1] + '</button>').join('') + '</div><div data-list>' + UI.skRows(6) + '</div>';
    $$('[data-tab]', el).forEach(b => b.onclick = () => Router.go(cfg.path + '?tab=' + b.dataset.tab));
    const load = async () => {
      const ref = await getRef(true); if (!ctx.alive()) return;
      const list = ref[tab] || [];
      $('[data-list]', el).innerHTML = list.length ? cfg.render[tab](list) : '<div class="panel">' + UI.empty(cfg.tabs.find(t => t[0] === tab)[2], 'Belum ada data', 'Tambahkan data pertama dengan tombol Tambah.') + '</div>';
      $$('[data-edit]', el).forEach(b => b.onclick = () => refDrawer(tab, list.find(x => x.id === b.dataset.edit), load));
    };
    $('[data-add]', el).onclick = () => refDrawer(tab, null, load);
    load();
  };
}
page('/admin/kategori', refPage({ path: '/admin/kategori', title: 'Kategori & Penulis', sub: 'Kelompokkan koleksi dan kelola data penulis.', tabs: [['kategori', 'Kategori', 'layers'], ['penulis', 'Penulis', 'pena']],
  render: {
    kategori: l => '<div class="tbl-wrap"><table class="tbl cards"><thead><tr><th>Kategori</th><th>Deskripsi</th><th class="num">Buku</th><th class="num">Urutan</th><th></th></tr></thead><tbody>' + l.map(k => '<tr><td data-l="Kategori"><div class="row"><span class="si" style="width:34px;height:34px;border-radius:8px;display:grid;place-items:center;color:#fff;background:' + esc(k.warna || '#6B3FA0') + '">' + ic(k.ikon || 'buku', 'sm') + '</span><b>' + esc(k.nama) + '</b></div></td><td data-l="Deskripsi" class="small muted">' + esc(k.deskripsi || '') + '</td><td data-l="Buku" class="num">' + fmtN(k.jumlah) + '</td><td data-l="Urutan" class="num">' + k.urutan + '</td><td><button class="btn btn-sm btn-outline" data-edit="' + esc(k.id) + '">' + ic('edit', 'sm') + 'Ubah</button></td></tr>').join('') + '</tbody></table></div>',
    penulis: l => '<div class="authors" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">' + l.map(p => '<div class="panel row" style="padding:14px"><span class="avatar" style="background:' + SP.avColor(p.nama) + '">' + (p.foto ? '<img src="' + esc(p.foto) + '" alt="">' : esc(SP.initials(p.nama))) + '</span><div class="grow"><b class="trunc" style="display:block">' + esc(p.nama) + '</b><span class="mono xs muted">' + fmtN(p.jumlah) + ' buku</span></div><button class="btn-icon sm" data-edit="' + esc(p.id) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button></div>').join('') + '</div>'
  } }), { izin: 'kategori.kelola' });
page('/admin/pelajaran', refPage({ path: '/admin/pelajaran', title: 'Mata Pelajaran & Kelas', sub: 'Atur mapel per tingkat dan daftar kelas (rombel) untuk menu Buku Pelajaran.', tabs: [['mapel', 'Mata Pelajaran', 'cap'], ['kelas', 'Kelas / Rombel', 'users']],
  render: {
    mapel: l => '<div class="tbl-wrap"><table class="tbl cards"><thead><tr><th>Mata pelajaran</th><th>Kode</th><th>Kelompok</th><th>Tingkat</th><th class="num">Materi</th><th></th></tr></thead><tbody>' + l.map(m => '<tr><td data-l="Mapel"><div class="row"><span class="si" style="width:34px;height:34px;border-radius:8px;display:grid;place-items:center;color:#fff;background:' + esc(m.warna || '#6B3FA0') + '">' + ic(m.ikon || 'buku', 'sm') + '</span><b>' + esc(m.nama) + '</b></div></td><td data-l="Kode" class="mono small">' + esc(m.kode) + '</td><td data-l="Kelompok"><span class="badge b-gray">' + esc(m.kelompok || '-') + '</span></td><td data-l="Tingkat">' + (m.tingkat || []).map(t => '<span class="badge b-purple b-mono">' + t + '</span>').join(' ') + '</td><td data-l="Materi" class="num">' + fmtN(m.jumlah) + '</td><td><button class="btn btn-sm btn-outline" data-edit="' + esc(m.id) + '">' + ic('edit', 'sm') + 'Ubah</button></td></tr>').join('') + '</tbody></table></div>',
    kelas: l => ['X', 'XI', 'XII'].map(t => { const k = l.filter(x => x.tingkat === t); return k.length ? '<div class="type-head">' + ic('cap', 'sm') + 'Kelas ' + t + ' <span class="n">' + k.length + ' rombel · ' + fmtN(k.reduce((s, x) => s + x.siswa, 0)) + ' siswa</span></div><div class="subj-grid">' +
      k.map(x => '<div class="panel" style="padding:16px"><div class="row between"><b style="font-size:16px">' + esc(x.nama) + '</b><button class="btn-icon sm" data-edit="' + esc(x.id) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button></div><div class="muted small mt8">' + esc(x.jurusan || 'Umum') + (x.wali ? ' · Wali: ' + esc(x.wali) : '') + '</div><div class="row mt12"><span class="badge b-green">' + fmtN(x.siswa) + ' siswa</span>' + (Session.can('pengguna.lihat') ? '<a class="small" href="#/admin/pengguna?kelas=' + encodeURIComponent(x.nama) + '">Lihat siswa</a>' : '') + '</div></div>').join('') + '</div>' : ''; }).join('')
  } }), { izin: 'pelajaran.kelola' });

/* ============================== PENGGUNA ============================== */
page('/admin/pengguna', async ctx => {
  const q = Object.assign({ hal: '1', per: '20' }, ctx.query), el = ctx.el;
  const go = (p, keep) => Router.go('/admin/pengguna' + qsBuild(Object.assign({}, q, p, keep ? {} : { hal: '1' })));
  const ref = await getRef(); if (!ctx.alive()) return;
  el.innerHTML = head('Pengguna & Akses', 'Kelola akun siswa (NISN), guru, pustakawan, dan admin.', (Session.can('impor.jalankan') ? '<a class="btn btn-outline" href="#/admin/impor?target=siswa">' + ic('upload', 'sm') + 'Impor Data Siswa</a>' : '') + (Session.can('pengguna.kelola') ? '<button class="btn btn-primary" data-add>' + ic('userplus', 'sm') + 'Tambah Pengguna</button>' : ''), 'Pengguna') +
    '<div class="kpi-grid mb16" data-stat>' + Array(5).fill('<div class="kpi">' + UI.skBlock(54) + '</div>').join('') + '</div>' +
    '<div class="filters"><div class="grid"><div class="field"><span class="lbl-mono">Cari</span><div class="inp-wrap">' + ic('search', 'sm') + '<input class="inp" data-q placeholder="Nama, NISN, NIP, email…" value="' + esc(q.q || '') + '"></div></div>' +
    '<div class="field"><span class="lbl-mono">Peran</span><select class="sel" data-f="peran">' + opt('', 'Semua peran', q.peran) + ref.peran.map(p => opt(p.id, p.nama, q.peran)).join('') + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Kelas</span><select class="sel" data-f="kelas">' + opt('', 'Semua kelas', q.kelas) + ref.kelas.map(k => opt(k.nama, k.nama, q.kelas)).join('') + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Status</span><select class="sel" data-f="status">' + opt('', 'Semua', q.status) + opt('AKTIF', 'Aktif', q.status) + opt('NONAKTIF', 'Nonaktif', q.status) + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Urutkan</span><select class="sel" data-f="urut">' + opt('nama', 'Nama A–Z', q.urut) + opt('kelas', 'Kelas', q.urut) + opt('aktif', 'Terakhir aktif', q.urut) + opt('terbaru', 'Terbaru dibuat', q.urut) + '</select></div></div></div><div data-bulk></div><div data-list>' + UI.skRows(8) + '</div>';
  $$('[data-f]', el).forEach(s => s.onchange = () => go({ [s.dataset.f]: s.value }));
  $('[data-q]', el).addEventListener('input', SP.debounce(e => go({ q: e.target.value.trim() }), 450));
  let boleh = [];
  const sel = new Set();
  const load = async () => {
    const r = await api('adm.pengguna.daftar', Object.assign({}, q, { per: Number(q.per) }));
    if (!ctx.alive()) return;
    if (!r.success) { $('[data-list]', el).innerHTML = UI.errorBox(r.message); return; }
    const d = r.data, s = d.stat; boleh = d.bolehPeran;
    $('[data-stat]', el).innerHTML = [['Total akun', s.total, 'users'], ['Akun siswa', s.siswa, 'cap'], ['Guru & staf', s.staf, 'user'], ['Nonaktif', s.nonaktif, 'lock'], ['Aktif hari ini', s.aktifHariIni, 'activity']]
      .map(x => '<div class="kpi"><div class="t">' + x[0] + ic(x[2], 'sm') + '</div><div class="v" data-count="' + x[1] + '">0</div></div>').join('');
    UI.countUp($('[data-stat]', el));
    const bulk = () => {
      $('[data-bulk]', el).innerHTML = sel.size ? '<div class="bulk"><b>' + sel.size + ' akun dipilih</b><div class="row wrap"><button class="btn btn-sm btn-accent" data-st="AKTIF">Aktifkan</button><button class="btn btn-sm btn-outline" data-st="NONAKTIF">Nonaktifkan</button>' + (Session.can('pengguna.hapus') ? '<button class="btn btn-sm btn-danger-o" data-hps>' + ic('trash', 'sm') + 'Hapus</button>' : '') + '</div></div>' : '';
      $$('[data-st]', el).forEach(b => b.onclick = async () => { if (UI.toastRes(await api('adm.pengguna.status', { ids: Array.from(sel), status: b.dataset.st }))) { sel.clear(); bulk(); load(); } });
      const h = $('[data-hps]', el); if (h) h.onclick = async () => { if (!(await UI.confirmDlg('Hapus ' + sel.size + ' akun? Riwayat bacaan tetap tersimpan untuk laporan (tanpa nama).', { danger: true, ok: 'Hapus akun' }))) return; if (UI.toastRes(await api('adm.pengguna.hapus', { ids: Array.from(sel) }))) { sel.clear(); bulk(); load(); } };
    };
    const aktif = n => n ? String(n).replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1') : '—';
    $('[data-list]', el).innerHTML = d.items.length ? '<div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl cards"><thead><tr><th style="width:36px"><input type="checkbox" data-all aria-label="Pilih semua"></th><th>Nama & identitas</th><th>Peran</th><th>NISN / NIP / Email</th><th>Kelas</th><th>Status</th><th>Aktif terakhir</th><th></th></tr></thead><tbody>' +
      d.items.map(u => '<tr><td>' + (boleh.indexOf(u.peran) > -1 && u.id !== Session.me.id ? '<input type="checkbox" data-ck="' + esc(u.id) + '">' : '') + '</td><td data-l="Nama"><div class="row">' + UI.avatar(u, 'sm') + '<div><b>' + esc(u.nama) + '</b><div class="mono xs muted">' + (u.sumber === 'IMPOR' ? ic('lock', 'sm') + ' Hasil impor data sekolah' : esc(u.sumber || '')) + '</div></div></div></td>' +
        '<td data-l="Peran"><span class="badge ' + (u.metode === 'NISN' ? 'b-gray' : u.peran === 'superadmin' || u.peran === 'admin' ? 'b-solid' : 'b-purple') + '">' + esc(u.peranNama) + '</span></td>' +
        '<td data-l="Identitas" class="mono small">' + esc(u.nisn ? 'NISN: ' + u.nisn : u.nip ? 'NIP: ' + u.nip : '') + '<div class="muted">' + esc(u.email || u.username || '') + '</div></td><td data-l="Kelas">' + esc(u.kelas || '—') + '</td>' +
        '<td data-l="Status">' + (u.status === 'AKTIF' ? '<span class="badge b-green"><span class="dot"></span>Aktif</span>' : '<span class="badge b-red">Nonaktif</span>') + '</td><td data-l="Aktif terakhir" class="mono small">' + aktif(u.aktif) + '</td>' +
        '<td><div class="row end">' + (boleh.indexOf(u.peran) > -1 ? '<button class="btn-icon sm" data-edit="' + esc(u.id) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button>' + (u.metode === 'SANDI' ? '<button class="btn-icon sm" data-reset="' + esc(u.id) + '" aria-label="Atur ulang sandi" title="Atur ulang sandi">' + ic('key', 'sm') + '</button>' : '') : '') + '</div></td></tr>').join('') +
      '</tbody></table></div>' + UI.pager({ total: d.total, hal: d.hal, halaman: d.halaman, per: d.per, unit: 'akun', perOpts: [20, 50, 100] }) + '</div>' : '<div class="panel">' + UI.empty('users', 'Tidak ada pengguna', 'Ubah filter atau tambah pengguna baru.') + '</div>';
    UI.bindPager(el, p => go({ hal: String(p) }, true), p => go({ per: String(p) }));
    $$('[data-ck]', el).forEach(c => c.onchange = () => { c.checked ? sel.add(c.dataset.ck) : sel.delete(c.dataset.ck); c.closest('tr').classList.toggle('sel', c.checked); bulk(); });
    const all = $('[data-all]', el); if (all) all.onchange = () => $$('[data-ck]', el).forEach(c => { c.checked = all.checked; c.dispatchEvent(new Event('change')); });
    $$('[data-edit]', el).forEach(b => b.onclick = () => userDrawer(d.items.find(u => u.id === b.dataset.edit), ref, boleh, load));
    $$('[data-reset]', el).forEach(b => b.onclick = async () => {
      const u = d.items.find(x => x.id === b.dataset.reset);
      if (!(await UI.confirmDlg('Buat kata sandi sementara baru untuk ' + esc(u.nama) + '? Sesi lamanya akan berakhir.', { ok: 'Atur ulang' }))) return;
      const r2 = await api('adm.pengguna.reset', { id: u.id }); if (r2.success) showTemp(u.nama, r2.data.sandiSementara, r2.data.emailTerkirim); else UI.toast(r2.message, 'err');
    });
  };
  const add = $('[data-add]', el); if (add) add.onclick = () => userDrawer(null, ref, boleh, load);
  load();
}, { izin: 'pengguna.lihat' });
function showTemp(nama, sandi, terkirim) {
  UI.modal({ title: 'Kata sandi sementara', sub: esc(nama), body: '<p class="muted">Berikan kata sandi ini kepada pengguna. Kata sandi hanya ditampilkan sekali.</p><div class="code-box mt16">' + esc(sandi) + '</div>' +
    (terkirim ? '<div class="alert green mt16">' + ic('mail') + '<div>Email aktivasi juga sedang dikirim.</div></div>' : '') + '<p class="help mt12">Minta pengguna mengganti sandi di Pengaturan → Keamanan setelah masuk.</p>',
    foot: '<button class="btn btn-outline" data-copy>' + ic('copy', 'sm') + 'Salin</button><button class="btn btn-primary" data-close>Selesai</button>' }).el.querySelector('[data-copy]').onclick = () => UI.copyText(sandi);
}
function userDrawer(u, ref, boleh, done) {
  const x = u || { status: 'AKTIF', peran: boleh.indexOf('siswa') > -1 ? 'siswa' : boleh[0] }, roles = ref.peran.filter(p => boleh.indexOf(p.id) > -1);
  const d = UI.drawer({ title: u ? 'Ubah pengguna' : 'Tambah pengguna', sub: u ? esc(u.nama) : 'Akun siswa masuk dengan NISN; guru & staf dengan email/username + sandi.',
    body: '<form data-uf class="stack gap16"><div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="inp" name="nama" value="' + esc(x.nama || '') + '"></div>' +
      '<div class="field"><label>Peran <span class="req">*</span></label><select class="sel" name="peran">' + roles.map(p => opt(p.id, p.nama, x.peran)).join('') + '</select></div>' +
      '<div data-nisn class="stack gap16"><div class="grid2"><div class="field"><label>NISN <span class="req">*</span></label><input class="inp mono" name="nisn" inputmode="numeric" maxlength="10" value="' + esc(x.nisn || '') + '"></div>' +
      '<div class="field"><label>Kelas <span class="req">*</span></label><input class="inp" name="kelas" list="dl-kls" value="' + esc(x.kelas || '') + '" placeholder="XI MIPA 2"><datalist id="dl-kls">' + ref.kelas.map(k => '<option value="' + esc(k.nama) + '">').join('') + '</datalist></div></div>' +
      '<div class="field"><label>Tanggal lahir <span class="muted small">(untuk mode login NISN + tanggal lahir)</span></label><input class="inp" type="date" name="tgl" value="' + esc(x.tgl || '') + '"></div></div>' +
      '<div data-sandi class="stack gap16"><div class="field"><label>Email</label><input class="inp" type="email" name="email" value="' + esc(x.email || '') + '" placeholder="nama@sekolah.sch.id"></div>' +
      '<div class="grid2"><div class="field"><label>Username</label><input class="inp mono" name="username" value="' + esc(x.username || '') + '"></div><div class="field"><label>NIP</label><input class="inp mono" name="nip" value="' + esc(x.nip || '') + '"></div></div>' +
      (!u ? '<div class="alert">' + ic('key') + '<div>Kata sandi sementara dibuat otomatis. Bila email diisi dan notifikasi aktivasi aktif, kata sandi juga dikirim lewat email.</div></div>' : '') + '</div>' +
      '<div class="row between panel" style="padding:14px"><div><b>Status akun</b><div class="help">Nonaktif = tidak bisa masuk, sesi langsung berakhir.</div></div><label class="switch"><input type="checkbox" name="aktif" ' + (x.status === 'AKTIF' ? 'checked' : '') + '><span class="tr"></span></label></div></form>',
    foot: (u && Session.can('pengguna.hapus') && u.id !== Session.me.id ? '<button class="btn btn-danger-o" data-udel style="margin-right:auto">' + ic('trash', 'sm') + 'Hapus</button>' : '') + '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-usave>' + (u ? 'Simpan' : 'Buat Akun') + '</button>' });
  const f = $('[data-uf]', d.el), nisnRole = id => { const r = ref.peran.find(p => p.id === id); return id === 'siswa' || (r && /siswa/i.test(r.nama)); };
  const sync = () => { const n = nisnRole(f.peran.value); $('[data-nisn]', d.el).classList.toggle('hide', !n); $('[data-sandi]', d.el).classList.toggle('hide', n); };
  f.peran.onchange = sync; sync();
  $('[data-usave]', d.el).onclick = async e => {
    const fd = new FormData(f), p = { id: x.id || '', status: f.aktif.checked ? 'AKTIF' : 'NONAKTIF' };
    ['nama', 'peran', 'nisn', 'kelas', 'tgl', 'email', 'username', 'nip'].forEach(k => { p[k] = fd.get(k) || ''; });
    const bb = e.currentTarget; UI.btnBusy(bb, true); const r = await api('adm.pengguna.simpan', { pengguna: p }); UI.btnBusy(bb, false);
    if (!r.success) return UI.toast(r.message, 'err');
    UI.toast(r.message); d.close(); done();
    if (r.data.sandiSementara) showTemp(p.nama, r.data.sandiSementara, r.data.emailTerkirim);
  };
  const del = $('[data-udel]', d.el);
  if (del) del.onclick = async () => { if (!(await UI.confirmDlg('Hapus akun ' + esc(u.nama) + '?', { danger: true, ok: 'Hapus' }))) return; if (UI.toastRes(await api('adm.pengguna.hapus', { id: u.id }))) { d.close(); done(); } };
}

/* ============================== PERAN & IZIN ============================== */
const GRUP_IZIN = [['Perpustakaan', ['baca', 'rekomendasi.kirim']], ['Koleksi', ['buku.lihat', 'buku.tambah', 'buku.ubah', 'buku.hapus', 'kategori.kelola', 'pelajaran.kelola']],
  ['Pengguna', ['pengguna.lihat', 'pengguna.kelola', 'pengguna.hapus', 'peran.kelola', 'impor.jalankan']], ['Laporan & audit', ['dashboard.lihat', 'laporan.lihat', 'laporan.ekspor', 'log.lihat']],
  ['Sistem & komunikasi', ['pengumuman.kelola', 'notifikasi.kelola', 'identitas.kelola', 'sistem.kelola']]];
page('/admin/peran', async ctx => {
  const el = ctx.el;
  el.innerHTML = head('Peran & Izin', 'Atur hak akses setiap peran. Perubahan izin langsung berlaku tanpa perlu masuk ulang.', '<button class="btn btn-primary" data-new>' + ic('plus', 'sm') + 'Peran Baru</button>', 'Peran & Izin') + '<div data-body>' + UI.skBlock(400) + '</div>';
  let cur = ctx.query.id || 'admin';
  const load = async () => {
    const r = await api('adm.peran', {}); if (!ctx.alive()) return;
    if (!r.success) { $('[data-body]', el).innerHTML = UI.errorBox(r.message); return; }
    const { peran, izin } = r.data, nama = {}; izin.forEach(i => { nama[i.id] = i.nama; });
    const draw = () => {
      const R = cur === '__baru' ? { id: '', nama: '', deskripsi: '', izin: ['baca'], warga: true, metode: 'SANDI', sistem: false, pengguna: 0 } : (peran.find(p => p.id === cur) || peran[0]);
      const su = R.izin.indexOf('*') > -1;
      $('[data-body]', el).innerHTML = '<div class="layout-split"><div>' + peran.map(p => '<button class="role-it ' + (p.id === R.id ? 'on' : '') + '" data-r="' + esc(p.id) + '"><div class="row between"><b>' + esc(p.nama) + '</b><span class="badge b-white b-mono">' + p.pengguna + ' akun</span></div><div class="small muted mt8 clamp2">' + esc(p.deskripsi) + '</div><div class="row mt8">' + (p.sistem ? '<span class="badge b-gray">' + ic('lock', 'sm') + 'Bawaan</span>' : '<span class="badge b-purple">Kustom</span>') + '<span class="badge b-white">' + (p.metode === 'NISN' ? 'Login NISN' : 'Login sandi') + '</span></div></button>').join('') + '</div>' +
        '<div class="panel"><div class="grid2"><div class="field"><label>Nama peran</label><input class="inp" data-nm value="' + esc(R.nama) + '"></div><div class="field"><label>Metode masuk</label><select class="sel" data-mt ' + (R.sistem ? 'disabled' : '') + '>' + opt('SANDI', 'Email/username + kata sandi', R.metode) + opt('NISN', 'NISN (tanpa sandi)', R.metode) + '</select></div>' +
        '<div class="field span2"><label>Deskripsi</label><input class="inp" data-ds value="' + esc(R.deskripsi) + '"></div></div>' +
        '<div class="row between panel mt16" style="padding:12px 14px"><div><b>Warga sekolah</b><div class="help">Dapat membaca buku berakses "Khusus Warga Sekolah". Matikan untuk peran seperti alumni atau tamu terdaftar.</div></div><label class="switch"><input type="checkbox" data-wg ' + (R.warga ? 'checked' : '') + ' ' + (su ? 'disabled' : '') + '><span class="tr"></span></label></div>' +
        (su ? '<div class="alert mt16">' + ic('shield') + '<div><b>Super Admin</b> selalu memiliki seluruh izin dan tidak dapat dibatasi, demi keamanan sistem.</div></div>' : '') +
        '<div class="tbl-wrap mt16"><table class="tbl perm-tbl"><thead><tr><th>Izin</th><th>Aktif</th></tr></thead><tbody>' + GRUP_IZIN.map(g => '<tr class="perm-grp"><td colspan="2">' + g[0] + '</td></tr>' + g[1].map(k => '<tr><td><b class="mono small">' + k + '</b><div class="small muted">' + esc(nama[k] || '') + '</div></td><td><input type="checkbox" data-iz="' + k + '" ' + (su || R.izin.indexOf(k) > -1 ? 'checked' : '') + ' ' + (su ? 'disabled' : '') + ' style="width:20px;height:20px;accent-color:var(--c-primary)"></td></tr>').join('')).join('') + '</tbody></table></div>' +
        '<div class="row between wrap mt16">' + (R.id && !R.sistem ? '<button class="btn btn-danger-o" data-rdel>' + ic('trash', 'sm') + 'Hapus peran</button>' : '<span class="help">' + (R.sistem ? 'Peran bawaan dapat diubah izinnya, tetapi tidak dapat dihapus.' : '') + '</span>') +
        '<div class="row">' + (R.id ? '<button class="btn btn-outline" data-clone>' + ic('copy', 'sm') + 'Duplikat</button>' : '') + '<button class="btn btn-primary" data-save>Simpan Izin</button></div></div></div></div>';
      $$('[data-r]', el).forEach(b => b.onclick = () => { cur = b.dataset.r; draw(); });
      const val = () => ({ id: R.id, nama: $('[data-nm]', el).value, deskripsi: $('[data-ds]', el).value, metode: $('[data-mt]', el).value, warga: $('[data-wg]', el).checked, izin: $$('[data-iz]:checked', el).map(c => c.dataset.iz) });
      $('[data-save]', el).onclick = async e => { const bb = e.currentTarget; UI.btnBusy(bb, true); const r2 = await api('adm.peran.simpan', { peran: val() }); UI.btnBusy(bb, false); if (UI.toastRes(r2)) { cur = r2.data.id; REF = null; App.reloadBoot(); load(); } };
      const cl = $('[data-clone]', el); if (cl) cl.onclick = async () => { const v = val(); v.id = ''; v.nama = v.nama + ' (salinan)'; if (v.izin.length === 0 && R.izin.indexOf('*') > -1) v.izin = Object.keys(nama); const r2 = await api('adm.peran.simpan', { peran: v }); if (UI.toastRes(r2)) { cur = r2.data.id; load(); } };
      const dl = $('[data-rdel]', el); if (dl) dl.onclick = async () => { if (await UI.confirmDlg('Hapus peran "' + esc(R.nama) + '"?', { danger: true, ok: 'Hapus' }) && UI.toastRes(await api('adm.peran.hapus', { id: R.id }))) { cur = 'admin'; load(); } };
    };
    draw();
    $('[data-new]', el).onclick = () => { cur = '__baru'; draw(); $('[data-nm]', el).focus(); };
  };
  load();
}, { izin: 'peran.kelola' });

/* ============================== LAPORAN ============================== */
const JENIS_L = [['statistik', 'Rekap Statistik'], ['koleksi', 'Koleksi Buku'], ['populer', 'Buku Populer'], ['aktivitas', 'Aktivitas Membaca'], ['literasi', 'Literasi per Kelas'], ['pengguna', 'Pengguna']];
page('/admin/laporan', async ctx => {
  const today = new Date(), iso = d => d.toISOString().slice(0, 10);
  const q = Object.assign({ jenis: 'statistik', dari: iso(new Date(today - 30 * 864e5)), sampai: iso(today) }, ctx.query), el = ctx.el;
  const ref = await getRef(); if (!ctx.alive()) return;
  const jenisList = JENIS_L.filter(j => j[0] !== 'pengguna' || Session.can('pengguna.lihat'));
  el.innerHTML = head('Laporan & Analitik', 'Rekap literasi untuk dokumentasi dan evaluasi program sekolah.', (Session.can('laporan.ekspor') ? '<button class="btn btn-outline" data-xls>' + ic('download', 'sm') + 'Ekspor Excel</button><button class="btn btn-primary" data-pdf>' + ic('file', 'sm') + 'Ekspor PDF</button>' : '<span class="badge b-gray">' + ic('eye', 'sm') + 'Hanya Lihat</span>'), 'Laporan') +
    '<div class="tabs">' + jenisList.map(j => '<button class="' + (q.jenis === j[0] ? 'on' : '') + '" data-j="' + j[0] + '">' + j[1] + '</button>').join('') + '</div>' +
    '<div class="filters"><div class="grid"><div class="field"><span class="lbl-mono">Dari</span><input type="date" class="inp" data-f="dari" value="' + esc(q.dari) + '"></div><div class="field"><span class="lbl-mono">Sampai</span><input type="date" class="inp" data-f="sampai" value="' + esc(q.sampai) + '"></div>' +
    '<div class="field"><span class="lbl-mono">Kategori</span><select class="sel" data-f="kategori">' + opt('', 'Semua', q.kategori) + ref.kategori.map(k => opt(k.id, k.nama, q.kategori)).join('') + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Tingkat</span><select class="sel" data-f="tingkat">' + opt('', 'Semua', q.tingkat) + ['X', 'XI', 'XII'].map(t => opt(t, 'Kelas ' + t, q.tingkat)).join('') + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Kelas</span><select class="sel" data-f="kelas">' + opt('', 'Semua', q.kelas) + ref.kelas.map(k => opt(k.nama, k.nama, q.kelas)).join('') + '</select></div>' +
    '<div class="field"><span class="lbl-mono">Cari di tabel</span><input class="inp" data-tq placeholder="Kata kunci…"></div></div></div><div data-body>' + UI.skBlock(300) + '</div>';
  $$('[data-j]', el).forEach(b => b.onclick = () => Router.go('/admin/laporan' + qsBuild(Object.assign({}, q, { jenis: b.dataset.j }))));
  $$('[data-f]', el).forEach(i => i.onchange = () => Router.go('/admin/laporan' + qsBuild(Object.assign({}, q, { [i.dataset.f]: i.value }))));
  const params = { jenis: q.jenis, dari: q.dari, sampai: q.sampai, kategori: q.kategori, tingkat: q.tingkat, kelas: q.kelas };
  const r = await api('adm.laporan', params); if (!ctx.alive()) return;
  if (!r.success) { $('[data-body]', el).innerHTML = UI.errorBox(r.message); return; }
  const L = r.data; let sortK = null, sortD = 1, hal = 1, per = 25, term = '';
  const fmtCell = (v, t) => t === 'tanggal' ? fmtDate(v) : t === 'tanggalwaktu' ? fmtDate(v, true) : t === 'angka' ? fmtN(v) : esc(v);
  const rowsNow = () => { let rows = L.baris; if (term) rows = rows.filter(b => L.kolom.some(k => String(b[k.k] === undefined ? '' : b[k.k]).toLowerCase().indexOf(term) > -1)); if (sortK) rows = rows.slice().sort((a, b) => (a[sortK] > b[sortK] ? 1 : a[sortK] < b[sortK] ? -1 : 0) * sortD); return rows; };
  const drawTable = () => {
    const rows = rowsNow(), pages = Math.max(1, Math.ceil(rows.length / per)); hal = Math.min(hal, pages);
    $('[data-tbl]', el).innerHTML = '<div class="tbl-scroll"><table class="tbl cards"><thead><tr>' + L.kolom.map(k => '<th class="sort ' + (k.tipe === 'angka' ? 'num' : '') + '" data-sort="' + k.k + '">' + esc(k.label) + (sortK === k.k ? (sortD > 0 ? ' ▲' : ' ▼') : '') + '</th>').join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.slice((hal - 1) * per, hal * per).map(b => '<tr>' + L.kolom.map(k => '<td data-l="' + esc(k.label) + '" class="' + (k.tipe === 'angka' ? 'num' : '') + '">' + fmtCell(b[k.k], k.tipe) + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + L.kolom.length + '" class="muted">Tidak ada data pada periode/filter ini.</td></tr>') + '</tbody></table></div>' +
      UI.pager({ total: rows.length, hal, halaman: pages, per, unit: 'baris', perOpts: [25, 50, 100] });
    $$('[data-sort]', el).forEach(th => th.onclick = () => { sortD = sortK === th.dataset.sort ? -sortD : 1; sortK = th.dataset.sort; drawTable(); });
    UI.bindPager($('[data-tbl]', el), p => { hal = p; drawTable(); }, p => { per = p; hal = 1; drawTable(); });
  };
  $('[data-body]', el).innerHTML = '<div class="row wrap mb16">' + L.ringkas.map(x => '<span class="badge b-white" style="padding:8px 12px;font-size:13px">' + esc(x.label) + ': <b class="mono">' + esc(typeof x.nilai === 'number' ? fmtN(x.nilai) : x.nilai) + '</b></span>').join('') + '</div>' +
    (L.grafik ? '<div class="chart-card mb16"><h3>' + esc(L.grafik.judul) + '</h3><div data-g></div></div>' : '') +
    '<div class="tbl-wrap"><div class="row between" style="padding:14px 16px;border-bottom:1px solid var(--c-border-s)"><b>' + esc(L.judul) + '</b><span class="mono xs muted">' + fmtN(L.baris.length) + ' baris · dibuat ' + fmtDate(L.dibuat, true) + '</span></div><div data-tbl></div></div>';
  if (L.grafik) { const g = $('[data-g]', el); L.grafik.tipe === 'donut' ? Charts.donut(g, L.grafik.data, { unit: 'buku' }) : L.grafik.tipe === 'line' ? Charts.line(g, L.grafik.data, { unit: 'sesi' }) : Charts.barH(g, L.grafik.data, {}); }
  drawTable();
  $('[data-tq]', el).addEventListener('input', SP.debounce(e => { term = e.target.value.toLowerCase().trim(); hal = 1; drawTable(); }, 250));
  const xb = $('[data-xls]', el);
  if (xb) xb.onclick = () => {
    const rows = [L.kolom.map(k => k.label)].concat(rowsNow().map(b => L.kolom.map(k => { const v = b[k.k]; return k.tipe === 'tanggal' || k.tipe === 'tanggalwaktu' ? fmtDate(v, k.tipe === 'tanggalwaktu') : (typeof v === 'number' ? v : (v === undefined ? '' : String(v))); })));
    UI.downloadBlob(L.jenis + '-' + q.dari + '_' + q.sampai + '.xlsx', Zip.xlsxBlob(rows, L.judul));
  };
  const pb = $('[data-pdf]', el);
  if (pb) pb.onclick = async () => { UI.btnBusy(pb, true, 'Membuat PDF…'); const r2 = await api('adm.laporan.pdf', params); UI.btnBusy(pb, false); if (r2.success) UI.downloadB64(r2.data.nama, r2.data.data, 'application/pdf'); else UI.toast(r2.message, 'err'); };
}, { izin: 'laporan.lihat' });

/* ============================== PENGUMUMAN ============================== */
const AUD = [['SEMUA', 'Semua pengguna masuk'], ['SISWA', 'Siswa'], ['GURU', 'Guru'], ['STAF', 'Staf perpustakaan'], ['PUBLIK', 'Publik (tamu)']];
page('/admin/pengumuman', async ctx => {
  const el = ctx.el;
  el.innerHTML = head('Pengumuman', 'Tampil di beranda dan lonceng notifikasi sesuai sasaran. Dapat juga dikirim lewat email.', '<button class="btn btn-primary" data-new>' + ic('plus', 'sm') + 'Pengumuman Baru</button>', 'Pengumuman') + '<div class="layout-2" style="grid-template-columns:minmax(0,1fr) minmax(0,1.1fr)"><div data-list>' + UI.skRows(4) + '</div><div data-ed></div></div>';
  let list = [], cur = null;
  const toLocal = t => t ? new Date(t - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
  const editor = p => {
    const x = p || { audiens: ['SEMUA'], tingkat: [], prioritas: 'BIASA', status: 'DRAF' }; cur = x;
    $('[data-ed]', el).innerHTML = '<form class="form-sec" data-pf style="position:sticky;top:80px"><h3>' + ic('edit') + (p ? 'Ubah pengumuman' : 'Pengumuman baru') + '</h3><div class="stack gap16">' +
      '<div class="field"><label>Judul <span class="req">*</span></label><input class="inp" name="judul" maxlength="140" value="' + esc(x.judul || '') + '"></div>' +
      '<div class="field"><label>Isi</label><textarea class="ta" name="isi" maxlength="4000" style="min-height:140px">' + esc(x.isi || '') + '</textarea></div>' +
      '<div class="field"><label>Sasaran</label><div class="row wrap">' + AUD.map(a => '<label class="chip ' + (x.audiens.indexOf(a[0]) > -1 ? 'on' : '') + '"><input type="checkbox" name="audiens" value="' + a[0] + '" ' + (x.audiens.indexOf(a[0]) > -1 ? 'checked' : '') + ' hidden>' + a[1] + '</label>').join('') + '</div></div>' +
      '<div class="field"><label>Khusus siswa tingkat <span class="muted small">(opsional)</span></label><div class="row wrap">' + ['X', 'XI', 'XII'].map(t => '<label class="chip ' + (x.tingkat.indexOf(t) > -1 ? 'on' : '') + '"><input type="checkbox" name="tingkat" value="' + t + '" ' + (x.tingkat.indexOf(t) > -1 ? 'checked' : '') + ' hidden>Kelas ' + t + '</label>').join('') + '</div></div>' +
      '<div class="grid2"><div class="field"><label>Mulai tampil</label><input class="inp" type="datetime-local" name="mulai" value="' + toLocal(x.mulai) + '"></div><div class="field"><label>Selesai tampil</label><input class="inp" type="datetime-local" name="selesai" value="' + toLocal(x.selesai) + '"></div></div>' +
      '<div class="field"><label>Prioritas</label><div class="seg" data-prio>' + [['BIASA', 'Biasa'], ['TINGGI', 'Tinggi'], ['PENTING', 'Penting']].map(o => '<button type="button" data-v="' + o[0] + '" class="' + (x.prioritas === o[0] ? 'on' : '') + '">' + o[1] + '</button>').join('') + '</div></div>' +
      '<div class="row between"><span><b>Sematkan di atas</b><div class="help">Selalu tampil paling atas.</div></span><label class="switch"><input type="checkbox" name="sematkan" ' + (x.sematkan ? 'checked' : '') + '><span class="tr"></span></label></div>' +
      '<div class="row between"><span><b>Kirim juga lewat email</b><div class="help">' + (x.email ? 'Email sudah pernah dikirim.' : 'Dikirim bertahap ke pengguna sasaran yang punya email.') + '</div></span><label class="switch"><input type="checkbox" name="kirim_email" ' + (x.email ? 'checked disabled' : '') + '><span class="tr"></span></label></div>' +
      '<div class="row between wrap mt8">' + (p ? '<button type="button" class="btn btn-danger-o" data-del>' + ic('trash', 'sm') + 'Hapus</button>' : '<span></span>') + '<div class="row"><button type="button" class="btn btn-outline" data-sv="DRAF">Simpan Draf</button><button type="button" class="btn btn-accent" data-sv="TERBIT">' + ic('send', 'sm') + 'Terbitkan</button></div></div></div></form>';
    const f = $('[data-pf]', el); let prio = x.prioritas;
    $$('label.chip', f).forEach(l => { const i = $('input', l); i.onchange = () => l.classList.toggle('on', i.checked); });
    UI.segInit($('[data-prio]', f), v => { prio = v; });
    $$('[data-sv]', f).forEach(b => b.onclick = async () => {
      const fd = new FormData(f);
      const data = { id: x.id || '', judul: fd.get('judul'), isi: fd.get('isi'), audiens: fd.getAll('audiens'), tingkat: fd.getAll('tingkat'), mulai: fd.get('mulai') ? new Date(fd.get('mulai')).getTime() : '', selesai: fd.get('selesai') ? new Date(fd.get('selesai')).getTime() : '',
        prioritas: prio, sematkan: f.sematkan.checked, kirim_email: f.kirim_email.checked && !x.email, status: b.dataset.sv };
      UI.btnBusy(b, true); const r = await api('adm.pengumuman.simpan', { pengumuman: data }); UI.btnBusy(b, false);
      if (UI.toastRes(r)) { App.reloadBoot(); load(r.data.id); }
    });
    const d = $('[data-del]', f); if (d) d.onclick = async () => { if (await UI.confirmDlg('Hapus pengumuman ini?', { danger: true, ok: 'Hapus' }) && UI.toastRes(await api('adm.pengumuman.hapus', { id: x.id }))) { App.reloadBoot(); load(); } };
  };
  const load = async keep => {
    const r = await api('adm.pengumuman', {}); if (!ctx.alive()) return;
    if (!r.success) { $('[data-list]', el).innerHTML = UI.errorBox(r.message); return; }
    list = r.data;
    const st = { TERBIT: 'b-green', DRAF: 'b-amber', TERJADWAL: 'b-blue', KEDALUWARSA: 'b-gray' };
    $('[data-list]', el).innerHTML = list.length ? list.map(p => '<div class="ann" data-p="' + esc(p.id) + '" style="cursor:pointer;background:#fff;' + (keep === p.id ? 'box-shadow:inset 4px 0 0 var(--c-primary)' : '') + '"><div class="row wrap"><span class="badge ' + st[p.tampil] + '">' + p.tampil + '</span>' + (p.sematkan ? '<span class="badge b-solid">' + ic('pin', 'sm') + 'Disematkan</span>' : '') + (p.prioritas !== 'BIASA' ? '<span class="badge b-red">' + p.prioritas + '</span>' : '') + p.audiens.map(a => '<span class="badge b-white">' + a + '</span>').join('') + '</div>' +
      '<h4>' + esc(p.judul) + '</h4><p class="clamp2">' + esc(p.isi) + '</p><div class="mono xs muted mt8">' + esc(p.oleh) + ' · ' + fmtDate(p.diubah || p.dibuat, true) + (p.email ? ' · ' + ic('mail', 'sm') + ' email terkirim' : '') + '</div></div>').join('') : '<div class="panel">' + UI.empty('megaphone', 'Belum ada pengumuman', 'Buat pengumuman pertama untuk siswa dan guru.') + '</div>';
    $$('[data-p]', el).forEach(c => c.onclick = () => { editor(list.find(x => x.id === c.dataset.p)); $$('[data-p]', el).forEach(z => z.style.boxShadow = z === c ? 'inset 4px 0 0 var(--c-primary)' : ''); });
    editor(keep ? list.find(x => x.id === keep) : null);
  };
  $('[data-new]', el).onclick = () => editor(null);
  load();
}, { izin: 'pengumuman.kelola' });

/* ============================== NOTIFIKASI ============================== */
page('/admin/notifikasi', async ctx => {
  const el = ctx.el;
  el.innerHTML = head('Notifikasi Email', 'Email dikirim lewat Gmail akun pemilik Apps Script, bertahap sesuai kuota harian.', '', 'Notifikasi') + '<div data-body>' + UI.skBlock(300) + '</div>';
  const r = await api('adm.pengaturan', {}); if (!ctx.alive()) return;
  if (!r.success || !r.data.notifikasi) { $('[data-body]', el).innerHTML = UI.errorBox(r.message || 'Tidak ada akses.'); return; }
  const n = r.data.notifikasi;
  const row = (k, t, d) => '<div class="row between" style="padding:14px 0;border-bottom:1px solid var(--c-border-s)"><div><b>' + t + '</b><div class="help">' + d + '</div></div><label class="switch"><input type="checkbox" data-k="' + k + '" ' + (n[k] === 'on' ? 'checked' : '') + '><span class="tr"></span></label></div>';
  $('[data-body]', el).innerHTML = '<div class="layout-2"><div class="form-sec"><h3>' + ic('bell') + 'Jenis notifikasi</h3>' + row('NOTIF_AKTIVASI', 'Aktivasi akun', 'Kirim kata sandi sementara saat akun guru/staf dibuat atau diatur ulang.') +
    row('NOTIF_BUKU_BARU', 'Buku baru terbit', 'Kabari pengguna ber-email saat buku umum/ sekolah diterbitkan.') + row('NOTIF_PENGUMUMAN', 'Pengumuman', 'Izinkan pengumuman dikirim juga lewat email.') + row('NOTIF_RESET', 'Reset kata sandi', 'Tautan pemulihan untuk guru & staf (berlaku 15 menit).') +
    '<div class="grid2 mt16"><div class="field"><label>Nama pengirim</label><input class="inp" data-k="EMAIL_NAMA_PENGIRIM" value="' + esc(n.EMAIL_NAMA_PENGIRIM || '') + '" placeholder="' + esc(App.settings.APP_NAME) + '"></div><div class="field"><label>Balas ke (reply-to)</label><input class="inp" type="email" data-k="EMAIL_BALAS_KE" value="' + esc(n.EMAIL_BALAS_KE || '') + '" placeholder="perpus@sekolah.sch.id"></div></div>' +
    '<div class="row end mt16"><button class="btn btn-primary" data-save>Simpan</button></div></div>' +
    '<div class="stack gap16"><div class="form-sec"><h3>' + ic('mail') + 'Kuota & uji</h3><div class="kv"><span>Sisa kuota email hari ini</span><b>' + (r.data.kuotaEmail === null ? '—' : fmtN(r.data.kuotaEmail)) + '</b></div><p class="help mt8">Akun Gmail biasa ±100 email/hari; Google Workspace ±1.500/hari. Email yang melebihi kuota otomatis dikirim besok.</p>' +
    '<div class="field mt16"><label>Kirim email uji ke</label><input class="inp" type="email" data-to value="' + esc(r.data.emailSaya || '') + '"></div><button class="btn btn-outline btn-block mt12" data-test>' + ic('send', 'sm') + 'Kirim Email Uji</button></div>' +
    '<div class="alert">' + ic('info') + '<div>Tautan di email memakai alamat situs dari menu <b>Identitas Aplikasi</b>. Pastikan sudah benar.</div></div></div></div>';
  $('[data-save]', el).onclick = async e => { const v = {}; $$('[data-k]', el).forEach(i => { v[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.value; }); const bb = e.currentTarget; UI.btnBusy(bb, true); UI.toastRes(await api('adm.pengaturan.simpan', { bagian: 'notifikasi', nilai: v })); UI.btnBusy(bb, false); };
  $('[data-test]', el).onclick = async e => { const bb = e.currentTarget; UI.btnBusy(bb, true); UI.toastRes(await api('adm.email.uji', { ke: $('[data-to]', el).value })); UI.btnBusy(bb, false); };
}, { izin: 'notifikasi.kelola' });

/* ============================== IDENTITAS ============================== */
page('/admin/identitas', async ctx => {
  const el = ctx.el;
  el.innerHTML = head('Identitas Aplikasi', 'Logo, nama, dan warna berlaku langsung di seluruh halaman setelah disimpan.', '<button class="btn btn-outline" data-def>' + ic('refresh', 'sm') + 'Warna bawaan</button><button class="btn btn-primary" data-save>Simpan Perubahan</button>', 'Identitas') + '<div data-body>' + UI.skBlock(400) + '</div>';
  const r = await api('adm.pengaturan', {}); if (!ctx.alive()) return;
  if (!r.success || !r.data.identitas) { $('[data-body]', el).innerHTML = UI.errorBox(r.message || 'Tidak ada akses.'); return; }
  const s = r.data.identitas, u = r.data.umum;
  const inp = (k, l, ph, h) => '<div class="field"><label>' + l + '</label><input class="inp" data-k="' + k + '" value="' + esc(s[k] || '') + '" placeholder="' + esc(ph || '') + '">' + (h ? '<span class="help">' + h + '</span>' : '') + '</div>';
  const col = (k, l) => '<div class="field"><label>' + l + '</label><div class="color-inp"><input type="color" data-c="' + k + '" value="' + esc(s[k]) + '"><input class="inp mono" data-k="' + k + '" value="' + esc(s[k]) + '" maxlength="7" style="width:120px"></div></div>';
  $('[data-body]', el).innerHTML = '<div class="layout-2"><div>' +
    '<section class="form-sec"><h3><span class="no">1</span>Logo</h3><div class="row gap16"><div class="brand-logo" data-lprev style="width:72px;height:72px">' + (s.LOGO_URL ? '<img src="' + esc(s.LOGO_URL) + '" alt="">' : ic('logo', 'xl')) + '</div><div class="stack"><label class="btn btn-outline">' + ic('upload', 'sm') + 'Unggah logo<input type="file" accept="image/png,image/jpeg,image/webp" hidden data-logo></label><span class="help">PNG/JPG persegi, akan diperkecil ke 256 px (thumbnail 48×48 di sidebar).</span>' +
    (s.LOGO_URL ? '<button class="btn btn-ghost btn-sm" data-rmlogo style="align-self:flex-start">Hapus logo</button>' : '') + '</div></div><input type="hidden" data-k="LOGO_URL" value="' + esc(s.LOGO_URL || '') + '"></section>' +
    '<section class="form-sec"><h3><span class="no">2</span>Nama & sekolah</h3><div class="grid2">' + inp('APP_NAME', 'Nama aplikasi', 'Smapatispa') + inp('APP_TAGLINE', 'Subjudul', 'Perpustakaan Digital') + inp('SCHOOL_NAME', 'Nama sekolah', 'SMA Negeri …', 'Tampil di halaman masuk, kop laporan PDF, dan email.') +
    inp('KONTAK_BANTUAN', 'Kontak bantuan', 'WA 08xx / ruang perpustakaan') + inp('TAHUN_AJARAN', 'Tahun ajaran', '2026/2027') + inp('KURIKULUM', 'Label kurikulum', 'Kurikulum Merdeka') + '</div>' +
    inp('APP_URL', 'Alamat situs (URL GitHub Pages)', 'https://nama.github.io/repo/', 'Dipakai untuk tautan di email. Terisi otomatis saat Super Admin pertama kali masuk.') + '</section>' +
    '<section class="form-sec"><h3><span class="no">3</span>Warna</h3><div class="grid3">' + col('WARNA_UTAMA', 'Warna utama') + col('WARNA_AKSEN', 'Warna aksen (tombol aksi)') + col('WARNA_LATAR', 'Warna latar') + '</div><p class="help mt12">Warna tombol otomatis digelapkan bila perlu agar teks putih tetap terbaca (kontras WCAG AA).</p></section>' +
    '<section class="form-sec"><h3><span class="no">4</span>Banner beranda</h3>' + inp('BANNER_JUDUL', 'Judul banner', 'Buku Terpopuler Bulan Ini') + '<div class="field mt12"><label>Teks banner</label><textarea class="ta" data-k="BANNER_TEKS" maxlength="240" style="min-height:80px">' + esc(s.BANNER_TEKS || '') + '</textarea></div></section>' +
    (u ? '<section class="form-sec"><h3><span class="no">5</span>Keamanan & batas (Super Admin)</h3><div class="row between"><div><b>Siswa wajib isi tanggal lahir saat masuk</b><div class="help">Menambah lapisan keamanan selain NISN. Pastikan tanggal lahir siswa sudah diimpor.</div></div><label class="switch"><input type="checkbox" data-u="LOGIN_SISWA_TGL_LAHIR" ' + (u.LOGIN_SISWA_TGL_LAHIR === 'on' ? 'checked' : '') + '><span class="tr"></span></label></div>' +
      '<div class="grid3 mt16"><div class="field"><label>Maks. unggah (MB)</label><input class="inp mono" type="number" min="1" max="45" data-u="MAKS_UNGGAH_MB" value="' + esc(u.MAKS_UNGGAH_MB) + '"></div><div class="field"><label>Sesi siswa (hari)</label><input class="inp mono" type="number" min="1" max="60" data-u="SESI_SISWA_HARI" value="' + esc(u.SESI_SISWA_HARI) + '"></div><div class="field"><label>Sesi staf (jam)</label><input class="inp mono" type="number" min="1" max="168" data-u="SESI_STAF_JAM" value="' + esc(u.SESI_STAF_JAM) + '"></div></div>' +
      '<div class="row end mt16"><button class="btn btn-outline" data-saveu>Simpan Keamanan</button></div></section>' : '') +
    '</div><aside><div class="form-sec" style="position:sticky;top:80px"><h3>' + ic('eye') + 'Pratinjau langsung</h3><div class="preview-box" data-pv></div><p class="help mt8">Pratinjau berubah saat Anda mengetik.</p></div></aside></div>';
  const val = k => { const i = $('[data-k="' + k + '"]', el); return i ? i.value : ''; };
  const preview = () => {
    const p = SP.hexRgb(val('WARNA_UTAMA')) ? val('WARNA_UTAMA') : '#6B3FA0', a = SP.hexRgb(val('WARNA_AKSEN')) ? val('WARNA_AKSEN') : '#5E9E34', bg = SP.hexRgb(val('WARNA_LATAR')) ? val('WARNA_LATAR') : '#F4F1FA';
    const pS = SP.strongFor(p), aS = SP.strongFor(a), logo = val('LOGO_URL');
    $('[data-pv]', el).style.setProperty('--pv-bg', bg);
    $('[data-pv]', el).innerHTML = '<div style="display:grid;grid-template-columns:132px minmax(0,1fr);min-height:260px"><div style="background:#fff;border-right:1px solid #E5E1EE;padding:14px"><div class="row" style="gap:8px"><span style="width:32px;height:32px;border-radius:5px;background:' + pS + ';display:grid;place-items:center;color:#fff;overflow:hidden">' + (logo ? '<img src="' + esc(logo) + '" style="width:100%;height:100%;object-fit:cover">' : ic('logo', 'sm')) + '</span><span><b style="color:' + pS + ';font-size:13px;display:block" class="trunc">' + esc(val('APP_NAME') || 'Smapatispa') + '</b><span style="font-size:10px;color:#686177">' + esc(val('APP_TAGLINE')) + '</span></span></div>' +
      '<div style="margin-top:14px;padding:8px 10px;border-radius:5px;background:' + aS + ';color:#fff;font-size:12px;font-weight:600">' + ic('home', 'sm') + ' Beranda</div><div style="padding:8px 10px;font-size:12px;color:#4A4458">' + ic('grid', 'sm') + ' Katalog</div><div style="padding:8px 10px;font-size:12px;color:#4A4458">' + ic('cap', 'sm') + ' Pelajaran</div></div>' +
      '<div style="padding:14px"><div style="background:' + pS + ';color:#fff;border-radius:6px;padding:14px"><div style="font-size:10px;letter-spacing:.1em;opacity:.8">REKOMENDASI</div><b style="font-size:15px;display:block;margin:6px 0 8px;text-transform:uppercase">' + esc(val('BANNER_JUDUL') || 'Buku Terpopuler') + '</b><span style="display:inline-block;background:' + aS + ';padding:5px 10px;border-radius:4px;font-size:11px;font-weight:600">Lihat Sekarang</span></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"><span style="padding:6px 10px;border-radius:4px;background:' + aS + ';color:#fff;font-size:11px;font-weight:600">Baca Sekarang</span><span style="padding:6px 10px;border-radius:4px;border:1px solid ' + pS + ';color:' + pS + ';font-size:11px;font-weight:600">Detail</span><span style="padding:4px 10px;border-radius:99px;background:' + SP.mix(a, '#ffffff', .86) + ';color:' + aS + ';font-size:11px;font-weight:600">Tersedia</span></div></div></div>';
  };
  $$('[data-c]', el).forEach(c => c.addEventListener('input', () => { $('[data-k="' + c.dataset.c + '"]', el).value = c.value.toUpperCase(); preview(); }));
  $$('[data-k]', el).forEach(i => i.addEventListener('input', () => { const c = $('[data-c="' + i.dataset.k + '"]', el); if (c && SP.hexRgb(i.value)) c.value = i.value; preview(); }));
  preview();
  $('[data-def]', el).onclick = () => { [['WARNA_UTAMA', '#6B3FA0'], ['WARNA_AKSEN', '#5E9E34'], ['WARNA_LATAR', '#F4F1FA']].forEach(x => { $('[data-k="' + x[0] + '"]', el).value = x[1]; $('[data-c="' + x[0] + '"]', el).value = x[1]; }); preview(); };
  $('[data-logo]', el).onchange = async e => {
    try { const img = await UI.resizeImage(e.target.files[0], 256, 256, .9); $('[data-lprev]', el).innerHTML = '<img src="' + img.preview + '" alt="">';
      const r2 = await api('unggah.gambar', { jenis: 'logo', data: img.data, mime: img.mime, nama: 'logo' }); if (UI.toastRes(r2, 'Logo diunggah — tekan Simpan Perubahan.')) { $('[data-k=LOGO_URL]', el).value = r2.data.url; preview(); } }
    catch (er) { UI.toast(er.message, 'err'); }
  };
  const rl = $('[data-rmlogo]', el); if (rl) rl.onclick = () => { $('[data-k=LOGO_URL]', el).value = ''; $('[data-lprev]', el).innerHTML = ic('logo', 'xl'); preview(); };
  $('[data-save]', el).onclick = async e => {
    const v = {}; $$('[data-k]', el).forEach(i => { v[i.dataset.k] = i.value; });
    const bb = e.currentTarget; UI.btnBusy(bb, true); const r2 = await api('adm.pengaturan.simpan', { bagian: 'identitas', nilai: v }); UI.btnBusy(bb, false);
    if (UI.toastRes(r2)) { App.settings = Object.assign(App.settings, r2.data.settings); SP.applyTheme(App.settings); SP.cacheDrop('boot'); App.renderShell(); App.reloadBoot(); }
  };
  const su = $('[data-saveu]', el);
  if (su) su.onclick = async () => { const v = {}; $$('[data-u]', el).forEach(i => { v[i.dataset.u] = i.type === 'checkbox' ? i.checked : i.value; }); if (UI.toastRes(await api('adm.pengaturan.simpan', { bagian: 'umum', nilai: v }))) App.reloadBoot(); };
}, { izin: 'identitas.kelola' });

/* ============================== LOG ============================== */
page('/admin/log', async ctx => {
  const q = Object.assign({ hal: '1' }, ctx.query), el = ctx.el;
  const go = (p, keep) => Router.go('/admin/log' + qsBuild(Object.assign({}, q, p, keep ? {} : { hal: '1' })));
  el.innerHTML = head('Log Aktivitas', 'Catatan tindakan admin & pengguna. Log hanya dapat dibaca — tidak dapat diubah atau dihapus dari aplikasi.', '<span class="badge b-gray">' + ic('lock', 'sm') + 'Hanya baca</span>', 'Log') +
    '<div class="filters"><div class="grid"><div class="field"><span class="lbl-mono">Cari</span><div class="inp-wrap">' + ic('search', 'sm') + '<input class="inp" data-q value="' + esc(q.q || '') + '" placeholder="Nama, aksi, target…"></div></div><div class="field"><span class="lbl-mono">Jenis aksi</span><select class="sel" data-f="aksi"><option value="">Semua</option></select></div>' +
    '<div class="field"><span class="lbl-mono">Dari</span><input type="date" class="inp" data-f="dari" value="' + esc(q.dari || '') + '"></div><div class="field"><span class="lbl-mono">Sampai</span><input type="date" class="inp" data-f="sampai" value="' + esc(q.sampai || '') + '"></div></div></div><div data-list>' + UI.skRows(8) + '</div>';
  $$('[data-f]', el).forEach(i => i.onchange = () => go({ [i.dataset.f]: i.value }));
  $('[data-q]', el).addEventListener('input', SP.debounce(e => go({ q: e.target.value.trim() }), 450));
  const r = await api('adm.log', q); if (!ctx.alive()) return;
  if (!r.success) { $('[data-list]', el).innerHTML = UI.errorBox(r.message); return; }
  const d = r.data;
  $('[data-f=aksi]', el).innerHTML = '<option value="">Semua</option>' + Object.keys(d.jenis).sort().map(k => opt(k, k + ' (' + d.jenis[k] + ')', q.aksi)).join('');
  const tone = a => /HAPUS|GAGAL/.test(a) ? 'b-red' : /LOGIN/.test(a) ? 'b-blue' : /TAMBAH|IMPOR/.test(a) ? 'b-green' : 'b-purple';
  $('[data-list]', el).innerHTML = '<div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl cards"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Peran</th><th>Aksi</th><th>Target</th><th>Detail</th></tr></thead><tbody>' +
    (d.items.length ? d.items.map(l => '<tr><td data-l="Waktu" class="mono small nowrap">' + fmtDate(l.waktu, true) + '</td><td data-l="Pengguna"><b>' + esc(l.nama) + '</b></td><td data-l="Peran" class="small muted">' + esc(l.peran) + '</td><td data-l="Aksi"><span class="badge ' + tone(l.aksi) + ' b-mono">' + esc(l.aksi) + '</span></td><td data-l="Target" class="small">' + esc(l.target) + '</td>' +
      '<td data-l="Detail" class="small muted" style="max-width:340px">' + (l.detail ? '<details><summary class="small" style="cursor:pointer">Lihat</summary><code style="white-space:pre-wrap;word-break:break-all;font-size:11px">' + esc(l.detail) + '</code></details>' : '—') + '</td></tr>').join('') : '<tr><td colspan="6" class="muted">Tidak ada log.</td></tr>') +
    '</tbody></table></div>' + UI.pager({ total: d.total, hal: d.hal, halaman: d.halaman, per: d.per, unit: 'entri' }) + '</div><p class="help mt12">Menampilkan maksimal 5.000 entri terbaru. Log lengkap tersimpan di sheet <b>Log</b> pada spreadsheet database.</p>';
  UI.bindPager(el, p => go({ hal: String(p) }, true));
}, { izin: 'log.lihat' });

/* ============================== IMPOR / MIGRASI ============================== */
const TARGET = [['siswa', 'Data Siswa', 'cap', 'NISN, nama, kelas (rombel), tanggal lahir. Cocok dari ekspor data sekolah.', ['NISN', 'Nama', 'Kelas', 'Tanggal Lahir', 'Email']],
  ['staf', 'Guru & Staf', 'user', 'Nama, email/username, NIP, peran. Kata sandi dibuat otomatis.', ['Nama', 'Email', 'Username', 'NIP', 'Peran']],
  ['buku', 'Koleksi Buku', 'book', 'Judul, penulis, kategori, tautan Drive/web, mapel & tingkat.', ['Judul', 'Penulis', 'Penerbit', 'Tahun', 'ISBN', 'Kategori', 'Sinopsis', 'Format', 'Tautan', 'Link Drive', 'Sampul', 'Akses', 'Status', 'Mapel', 'Tingkat', 'Semester', 'Tipe Materi', 'Kurikulum', 'Urutan']],
  ['kelas', 'Kelas / Rombel', 'users', 'Nama kelas, tingkat, jurusan.', ['Nama', 'Tingkat', 'Jurusan']],
  ['mapel', 'Mata Pelajaran', 'layers', 'Nama mapel, kode, kelompok, tingkat.', ['Nama', 'Kode', 'Kelompok', 'Tingkat']],
  ['kategori', 'Kategori', 'grid', 'Nama kategori dan deskripsi.', ['Nama', 'Deskripsi', 'Warna']]];
page('/admin/impor', ctx => {
  const el = ctx.el; let target = ctx.query.target || 'siswa', src = 'file', rows = null, sumber = '', sheet = '';
  el.innerHTML = head('Impor & Migrasi Data', 'Pindahkan data dari berkas Excel/CSV atau spreadsheet lama. Aman diulang: data yang sama tidak akan dobel.', '', 'Impor') +
    '<section class="form-sec"><h3><span class="no">1</span>Pilih jenis data</h3><div class="subj-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">' + TARGET.map(t => '<button class="subj" data-t="' + t[0] + '" style="text-align:left;' + (t[0] === target ? 'border-color:var(--c-primary);box-shadow:inset 0 0 0 1px var(--c-primary)' : '') + '"><span class="si">' + ic(t[2], 'lg') + '</span><div class="nm">' + t[1] + '</div><div class="small muted">' + t[3] + '</div></button>').join('') + '</div></section>' +
    '<section class="form-sec"><h3><span class="no">2</span>Sumber data</h3><div class="seg" data-src><button class="on" data-v="file">' + ic('upload', 'sm') + 'Berkas Excel / CSV</button><button data-v="sheet">' + ic('database', 'sm') + 'Spreadsheet lama (Google Sheets)</button></div>' +
    '<div data-s="file" class="mt16"><label class="dropzone">' + ic('upload', 'xl') + '<div class="mt8"><b>Pilih berkas .xlsx atau .csv</b></div><div class="help">Baris pertama berisi judul kolom. Nama kolom boleh berbeda urutan (dibaca berdasarkan nama).</div><input type="file" accept=".csv,.xlsx,text/csv" hidden data-file></label>' +
    '<div class="row mt12"><button class="btn btn-ghost btn-sm" data-tpl>' + ic('download', 'sm') + 'Unduh template CSV</button><span class="help" data-fname></span></div></div>' +
    '<div data-s="sheet" class="mt16 hide"><div class="alert">' + ic('info') + '<div>Spreadsheet sumber hanya <b>dibaca</b>, tidak pernah diubah. Harus dapat dibuka oleh akun pemilik Apps Script (akun Google yang sama).</div></div>' +
    '<div class="row mt12"><input class="inp grow" data-url placeholder="Tempel URL atau ID spreadsheet lama"><button class="btn btn-outline" data-open>Buka</button></div><div data-sheets class="mt12"></div></div></section>' +
    '<section class="form-sec"><h3><span class="no">3</span>Opsi & pindai</h3><div class="stack gap12"><label class="row between"><span><b>Timpa data yang sudah ada</b><div class="help">Mati: hanya menambah data baru dan memperbarui kolom aman (mis. nama & kelas siswa). Hidup: juga menimpa status/peran/metadata.</div></span><span class="switch"><input type="checkbox" data-timpa><span class="tr"></span></span></label>' +
    '<label class="row between" data-emailopt><span><b>Kirim email aktivasi ke akun baru</b><div class="help">Untuk guru & staf yang memiliki email. Dikirim bertahap sesuai kuota.</div></span><span class="switch"><input type="checkbox" data-email><span class="tr"></span></span></label></div>' +
    '<div class="row end mt16"><button class="btn btn-outline" data-scan>' + ic('search', 'sm') + 'Pindai (tanpa menyimpan)</button><button class="btn btn-accent" data-run disabled>' + ic('check', 'sm') + 'Jalankan Impor</button></div></section><div data-rep></div>';
  const T = () => TARGET.find(t => t[0] === target);
  const syncT = () => { $('[data-emailopt]', el).classList.toggle('hide', target !== 'staf'); $$('[data-t]', el).forEach(b => b.style.cssText = 'text-align:left;' + (b.dataset.t === target ? 'border-color:var(--c-primary);box-shadow:inset 0 0 0 1px var(--c-primary)' : '')); $('[data-run]', el).disabled = true; $('[data-rep]', el).innerHTML = ''; };
  $$('[data-t]', el).forEach(b => b.onclick = () => { target = b.dataset.t; syncT(); });
  syncT();
  UI.segInit($('[data-src]', el), v => { src = v; $$('[data-s]', el).forEach(s => s.classList.toggle('hide', s.dataset.s !== v)); $('[data-run]', el).disabled = true; });
  $('[data-tpl]', el).onclick = () => UI.downloadBlob('template-' + target + '.csv', new Blob([Zip.csvBuild([T()[4]])], { type: 'text/csv' }));
  $('[data-file]', el).onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const raw = /\.xlsx$/i.test(f.name) ? await Zip.xlsxRead(await f.arrayBuffer()) : Zip.csvParse(await f.text());
      rows = Zip.rowsToObjects(raw);
      $('[data-fname]', el).innerHTML = ic('file', 'sm') + ' <b>' + esc(f.name) + '</b> — ' + fmtN(rows.length) + ' baris, kolom: ' + esc(Object.keys(rows[0] || {}).slice(0, 8).join(', '));
      $('[data-run]', el).disabled = true;
    } catch (er) { UI.toast('Berkas tidak dapat dibaca: ' + er.message, 'err'); }
  };
  $('[data-open]', el).onclick = async e => {
    const bb = e.currentTarget; UI.btnBusy(bb, true); const r = await api('adm.impor.sumber', { sumber: $('[data-url]', el).value.trim() }); UI.btnBusy(bb, false);
    if (!r.success) return UI.toast(r.message, 'err');
    sumber = $('[data-url]', el).value.trim();
    $('[data-sheets]', el).innerHTML = '<b>' + esc(r.data.nama) + '</b><div class="stack mt8">' + r.data.sheets.map((s, i) => '<label class="radio-card"><input type="radio" name="sh" value="' + esc(s.nama) + '" ' + (i === 0 ? 'checked' : '') + '><span><b>' + esc(s.nama) + '</b> <span class="mono xs muted">' + fmtN(s.baris) + ' baris</span><div class="help">' + esc(s.header.join(' · ')) + '</div></span></label>').join('') + '</div>';
    $$('input[name=sh]', el).forEach(i => i.onchange = () => { $$('.radio-card', $('[data-sheets]', el)).forEach(c => c.classList.toggle('on', $('input', c).checked)); });
    $$('.radio-card', $('[data-sheets]', el)).forEach(c => c.classList.toggle('on', $('input', c).checked));
  };
  const payload = dry => {
    const p = { target, dryRun: dry, opsi: { timpa: $('[data-timpa]', el).checked, kirimEmail: $('[data-email]', el).checked } };
    if (src === 'sheet') { const s = $('input[name=sh]:checked', el); if (!sumber || !s) return null; p.sumber = sumber; p.sheet = s.value; }
    else { if (!rows || !rows.length) return null; p.baris = rows; }
    return p;
  };
  const report = (d, dry) => {
    const j = d.jumlah;
    $('[data-rep]', el).innerHTML = '<section class="form-sec" style="animation:pageIn .3s both"><h3>' + ic(dry ? 'search' : 'checkc') + (dry ? 'Hasil pindai — belum ada yang disimpan' : 'Impor selesai') + '</h3><div class="mono xs muted mb16">Sumber: ' + esc(d.sumber) + '</div>' +
      '<div class="kpi-grid">' + [['Baris sumber', j.sumber, 'file'], ['Ditambah', j.tambah, 'plus'], ['Diperbarui', j.ubah, 'refresh'], ['Dilewati', j.lewati, 'right']].map(x => '<div class="kpi"><div class="t">' + x[0] + ic(x[2], 'sm') + '</div><div class="v">' + fmtN(x[1]) + '</div></div>').join('') + '</div>' +
      (d.peringatan.length ? '<div class="alert amber mt16">' + ic('alert') + '<div><b>Peringatan (' + d.peringatan.length + ')</b><ul style="margin:6px 0 0;padding-left:18px">' + d.peringatan.map(p => '<li class="small">' + esc(p) + '</li>').join('') + '</ul></div></div>' : '') +
      (dry && d.contoh.length ? '<details class="mt16"><summary class="small" style="cursor:pointer">Contoh data yang akan ditambahkan</summary><pre class="mono xs" style="white-space:pre-wrap;background:var(--c-surface);padding:12px;border-radius:6px">' + esc(JSON.stringify(d.contoh, null, 2)) + '</pre></details>' : '') +
      (!dry ? '<div class="alert green mt16">' + ic('info') + '<div>Jalankan impor yang sama lagi kapan saja untuk menyinkronkan perubahan (delta sync) — data tidak akan dobel.</div></div>' : '') + '</section>';
  };
  $('[data-scan]', el).onclick = async e => {
    const p = payload(true); if (!p) return UI.toast(src === 'sheet' ? 'Buka spreadsheet & pilih sheet dulu.' : 'Pilih berkas dulu.', 'warn');
    const bb = e.currentTarget; UI.btnBusy(bb, true, 'Memindai…'); const r = await api('adm.impor', p); UI.btnBusy(bb, false);
    if (!r.success) return UI.toast(r.message, 'err');
    report(r.data, true); $('[data-run]', el).disabled = !(r.data.jumlah.tambah || r.data.jumlah.ubah);
  };
  $('[data-run]', el).onclick = async e => {
    const bb = e.currentTarget, p = payload(false); if (!p) return;
    if (!(await UI.confirmDlg('Jalankan impor ' + esc(T()[1]) + ' sekarang? Data akan ditulis ke database.', { ok: 'Jalankan Impor' }))) return;
    UI.btnBusy(bb, true, 'Mengimpor…'); const r = await api('adm.impor', p); UI.btnBusy(bb, false);
    if (!UI.toastRes(r)) return;
    report(r.data, false); bb.disabled = true; REF = null; SP.cacheDrop('kat_'); App.reloadBoot();
  };
}, { izin: 'impor.jalankan' });

/* ============================== STATUS SISTEM ============================== */
page('/admin/sistem', async ctx => {
  const el = ctx.el;
  el.innerHTML = head('Status Sistem', 'Kesehatan cache, antrean, pemicu, dan kuota. Khusus Super Admin.', '<button class="btn btn-outline" data-a="kuras">' + ic('send', 'sm') + 'Proses antrean</button><button class="btn btn-primary" data-a="segarkan">' + ic('refresh', 'sm') + 'Segarkan cache</button>', 'Sistem') + '<div data-body>' + UI.skBlock(300) + '</div>';
  const load = async () => {
    const r = await api('adm.sistem', {}); if (!ctx.alive()) return;
    if (!r.success) { $('[data-body]', el).innerHTML = UI.errorBox(r.message); return; }
    const d = r.data, hot = Object.keys(d.cache).filter(k => d.cache[k] === 'HANGAT').length;
    const kv = (a, b) => '<div class="kv"><span>' + a + '</span><b>' + b + '</b></div>';
    $('[data-body]', el).innerHTML = '<div class="sys-grid"><div class="form-sec"><h3>' + ic('database') + 'Cache server</h3>' + Object.keys(d.cache).map(k => kv(k, d.cache[k] === 'HANGAT' ? '<span class="badge b-green">HANGAT</span>' : '<span class="badge b-amber">dingin</span>')).join('') +
      kv('Pemanasan terakhir', d.warmTerakhir ? fmtRel(Date.parse(d.warmTerakhir.at)) + ' (' + esc(d.warmTerakhir.scope) + ')' : '—') + '<p class="help mt8">' + hot + '/4 cache hangat. Cache dingin terisi otomatis saat dibuka pertama kali.</p></div>' +
      '<div class="form-sec"><h3>' + ic('clock') + 'Pemicu & antrean</h3>' + kv('Pemicu pemeliharaan (5 mnt)', d.pemicu.indexOf('pemeliharaan') > -1 ? '<span class="badge b-green">Aktif</span>' : '<span class="badge b-gray">' + (d.keepWarm === 'off' ? 'Dimatikan' : 'Belum dipasang') + '</span>') +
      kv('Antrean log aktivitas', fmtN(d.antrean.aktivitas + d.antrean.log)) + kv('Email menunggu', fmtN(d.antrean.email)) + kv('Email gagal', fmtN(d.antrean.emailGagal)) + kv('Sisa kuota email', d.kuotaEmail === null ? '—' : fmtN(d.kuotaEmail)) +
      '<div class="row mt12">' + (d.pemicu.indexOf('pemeliharaan') > -1 ? '<button class="btn btn-sm btn-outline" data-a="pemicu_off">Matikan pemicu</button>' : '<button class="btn btn-sm btn-accent" data-a="pemicu_on">Pasang pemicu</button>') + '</div></div>' +
      '<div class="form-sec"><h3>' + ic('bars') + 'Data</h3>' + kv('Buku', fmtN(d.jumlah.buku)) + kv('Pengguna', fmtN(d.jumlah.pengguna)) + kv('Baris riwayat baca', fmtN(d.jumlah.riwayat)) + kv('Baris log', fmtN(d.jumlah.log)) + kv('Script Properties', d.propsKB + ' KB / 500 KB') +
      '<div class="row wrap mt12"><a class="btn btn-sm btn-outline" href="' + esc(d.spreadsheet) + '" target="_blank" rel="noopener">' + ic('external', 'sm') + 'Spreadsheet</a>' + (d.folder ? '<a class="btn btn-sm btn-outline" href="' + esc(d.folder) + '" target="_blank" rel="noopener">' + ic('external', 'sm') + 'Folder Drive</a>' : '') + '</div></div>' +
      '<div class="form-sec"><h3>' + ic('info') + 'Versi</h3>' + kv('Backend', esc(d.versi)) + kv('Frontend', SP.VERSION) + kv('Akun pemilik', esc(d.akunPemilik || '—')) +
      '<p class="help mt8">Ketik <code>Perf.table()</code> atau <code>Perf.summary()</code> di console browser (F12) untuk melihat waktu tiap permintaan.</p></div></div>';
    bindA();
  };
  const bindA = () => $$('[data-a]', el).forEach(b => b.onclick = async () => { UI.btnBusy(b, true); const r = await api('adm.sistem.aksi', { aksi: b.dataset.a }); UI.btnBusy(b, false); if (UI.toastRes(r)) load(); });
  bindA(); load();
}, { izin: 'sistem.kelola' });
})();
