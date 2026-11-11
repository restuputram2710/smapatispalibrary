# Panduan Instalasi — Smapatispa Digital Library

Panduan ini ditulis untuk Anda yang **belum pernah** memakai Apps Script atau GitHub. Ikuti urutannya dari atas ke bawah; setiap tahap punya tanda "✅ Berhasil bila…" supaya Anda tahu kapan boleh lanjut.

Perkiraan waktu: **45–60 menit** untuk pemasangan pertama.

---

## Gambaran singkat

Aplikasi ini terdiri dari tiga bagian yang saling terhubung:

| Bagian | Tempatnya | Isinya |
|---|---|---|
| **Backend (API)** | Google Apps Script — akun Google sekolah/admin | `Kode.gs` + `appsscript.json` |
| **Database & berkas** | Google Sheets + Google Drive akun yang sama | Dibuat **otomatis** oleh `setupAplikasi()` |
| **Tampilan (frontend)** | GitHub Pages (gratis) | Isi ZIP `smapatispa-web.zip` |

```
Siswa/Guru (browser/HP) ──► GitHub Pages (tampilan) ──► Apps Script /exec (API) ──► Sheets + Drive
```

**Berkas yang Anda terima:**

- `Kode.gs` — seluruh kode backend (satu berkas, disalin-tempel ke Apps Script)
- `appsscript.json` — pengaturan izin & zona waktu Apps Script
- `smapatispa-web.zip` — tampilan web (yang diunggah ke GitHub)
- `PANDUAN-INSTALASI.md` — dokumen ini (salinannya juga ada di dalam ZIP)

> 💡 **Pakai akun Google yang sama dari awal sampai akhir.** Akun inilah "pemilik" database, folder Drive, dan pengirim email. Disarankan akun milik sekolah/perpustakaan, bukan akun pribadi guru, agar tidak hilang saat ada pergantian staf.

---

## Tahap A — Pasang backend di Apps Script

### A1. Buat proyek

1. Buka **https://script.google.com** → klik **Proyek baru** (New project).
2. Klik judul "Proyek tanpa judul" di kiri atas → ganti menjadi `Smapatispa Digital Library` → **Ganti nama**.

### A2. Tampilkan berkas `appsscript.json`

1. Klik ikon **⚙️ Setelan Proyek** (Project Settings) di sidebar kiri.
2. Centang **"Tampilkan file manifes 'appsscript.json' di editor"**.
3. Kembali ke ikon **< > Editor**.

### A3. Tempel kode

1. Klik berkas **`Kode.gs`** di daftar berkas → hapus semua isinya (Ctrl+A lalu Delete).
2. Buka berkas `Kode.gs` yang Anda terima dengan Notepad/TextEdit → salin **seluruh** isinya (Ctrl+A, Ctrl+C) → tempel di editor (Ctrl+V).
3. Klik berkas **`appsscript.json`** → hapus isinya → tempel isi `appsscript.json` yang Anda terima.
4. Tekan **Ctrl+S** (atau ikon 💾) untuk menyimpan.

✅ Berhasil bila penyimpanan tidak memunculkan pesan error dan bagian atas `Kode.gs` berisi tulisan `SMAPATISPA DIGITAL LIBRARY — Backend REST API`.

### A4. Jalankan `setupAplikasi`

1. Di bilah atas editor, pada daftar pilihan fungsi, pilih **`setupAplikasi`** → klik **▶ Jalankan** (Run).
2. Muncul jendela **"Otorisasi diperlukan"** → **Tinjau izin** → pilih akun Google Anda.
3. Google menampilkan peringatan **"Google belum memverifikasi aplikasi ini"**. Ini normal untuk skrip buatan sendiri. Klik **Lanjutan** (Advanced) → **Buka Smapatispa Digital Library (tidak aman)** → **Izinkan** (Allow).

   > Izin yang diminta: Spreadsheet & Drive (database dan berkas buku), kirim email (notifikasi), pemicu terjadwal (pemeliharaan), dan akses URL (unggah berkas besar ke Drive). Semua berjalan di akun Anda sendiri.

4. Tunggu ±30–60 detik sampai **Log eksekusi** menampilkan `✅ Setup selesai.`

**⚠️ PENTING — catat kata sandi Super Admin sekarang.** Di log akan tampil:

```
🔐 AKUN SUPER ADMIN (catat sekarang — hanya tampil SEKALI):
   Username    : superadmin   (atau email: akun-anda@…)
   Kata sandi  : xxxxxxxxxxxxxx
```

Kata sandi ini **hanya muncul sekali**. Lupa mencatat? Jalankan fungsi `resetSandiSuperAdmin` untuk membuat sandi baru.

Yang dibuat otomatis di Google Drive Anda:

```
📚 Smapatispa Digital Library/
├── 🗃️ Database — Smapatispa Digital Library   (Google Sheets, 16 sheet)
├── 📕 Berkas Buku        ← PDF/EPUB (privat, hanya dibaca lewat aplikasi)
├── 🖼️ Sampul             ← gambar sampul buku
├── 🎨 Gambar & Logo      ← logo sekolah & foto profil
└── 📄 Ekspor             ← hasil ekspor laporan
```

`setupAplikasi` **aman dijalankan ulang** kapan saja (misalnya setelah memperbarui kode): ia hanya menambah yang belum ada dan tidak pernah menghapus data.

### A5. (Opsional) Isi data contoh untuk mencoba

Pilih fungsi **`isiDataContoh`** → ▶ Jalankan. Ini membuat 6 buku contoh (termasuk buku pelajaran Fisika, Matematika, Bahasa Indonesia, dan Biologi), 3 kelas, 3 akun siswa, dan 1 akun guru:

- Siswa contoh: NISN `9990000001` (X-1), `9990000002` (XI MIPA 1), `9990000003` (XII IPS 2)
- Guru contoh: username `guru.contoh`, sandinya tampil di log

Setelah selesai mencoba, jalankan **`hapusDataContoh`** — semua buku dan akun contoh dihapus, data asli Anda tidak tersentuh.

---

## Tahap B — Terbitkan backend sebagai Web App

1. Di kanan atas editor: **Terapkan** (Deploy) → **Deployment baru** (New deployment).
2. Klik ikon **⚙️** di samping "Pilih jenis" → pilih **Aplikasi web** (Web app).
3. Isi:

   | Kolom | Nilai |
   |---|---|
   | Deskripsi | `Versi 1.0.0` |
   | Jalankan sebagai (Execute as) | **Saya** (Me) |
   | Yang memiliki akses (Who has access) | **Siapa saja** (Anyone) |

   > "Siapa saja" diperlukan agar tampilan web di GitHub bisa memanggil API. Data tetap aman: setiap permintaan diperiksa token login dan izin perannya di server, dan berkas buku di Drive tidak pernah dibagikan publik.

4. Klik **Terapkan** → salin **URL aplikasi web** (berakhiran **`/exec`**).

✅ Berhasil bila URL tersebut, saat dibuka di tab browser baru, menampilkan teks seperti:

```json
{"success":true,"app":"Smapatispa Digital Library API","v":"1.0.0","siap":true, …}
```

Kalau `"siap": false`, berarti `setupAplikasi` belum berhasil dijalankan — ulangi Tahap A4.

---

## Tahap C — Hubungkan tampilan web ke backend

1. Unduh `smapatispa-web.zip` → klik kanan → **Extract All / Ekstrak Semua**. Akan muncul folder **`smapatispa-web`**.
2. Buka folder **`smapatispa-web`**. Isinya harus seperti ini (**`index.html` langsung terlihat**, bukan di dalam folder lain):

   ```
   smapatispa-web/
   ├── index.html
   ├── README.md
   ├── PANDUAN-INSTALASI.md
   ├── css/
   │   └── style.css
   └── js/
       ├── config.js      ← satu-satunya berkas yang perlu Anda ubah
       ├── core.js, ui.js, app.js, charts.js, zip.js, reader.js
       ├── pages-anggota.js
       └── pages-admin.js
   ```

3. Buka **`js/config.js`** dengan Notepad (klik kanan → Buka dengan → Notepad). Ganti alamat contoh dengan URL `/exec` dari Tahap B:

   ```js
   window.APP_CONFIG = {
     GAS_URL: 'https://script.google.com/macros/s/AKfycb…panjang…/exec'
   };
   ```

   Pastikan tanda kutip `'…'` tetap ada dan URL berakhiran `/exec` (bukan `/dev`). Simpan.

> 🔒 `config.js` hanya berisi alamat API yang memang publik. **Jangan pernah** menaruh kata sandi, token, atau ID spreadsheet di berkas frontend — semua rahasia sudah disimpan otomatis di Script Properties (lihat Bagian H).

---

## Tahap D — Unggah tampilan web ke GitHub Pages

> ⚠️ **Selalu lewat terminal, jangan pakai tombol "Upload files" di situs GitHub.** Unggah lewat web meratakan semua berkas ke satu folder sehingga `css/` dan `js/` hilang dan situs tampil tanpa gaya.

### D1. Pasang Git (sekali saja)

- **Windows:** unduh dari **https://git-scm.com/download/win**, instal dengan pilihan bawaan. Setelah itu buka **PowerShell** dari menu Start.
- **Mac:** buka **Terminal**, ketik `git --version` → bila belum ada, macOS menawarkan pemasangan otomatis.

Cek:

```bash
git --version
```

✅ Berhasil bila muncul `git version 2.x.x`.

### D2. Atur identitas Git (sekali seumur komputer)

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@contoh.com"
```

`user.name` bebas (hanya label riwayat), `user.email` sebaiknya sama dengan email akun GitHub.

### D3. Buat akun & repository GitHub

1. Daftar di **https://github.com** (lewati bila sudah punya). Nama pengguna Anda akan menjadi bagian alamat situs: `namapengguna.github.io`.
2. Klik **+** (kanan atas) → **New repository**.
3. Isi **Repository name**, misalnya `perpustakaan`. Pilih **Public** (wajib untuk GitHub Pages gratis). **Jangan** centang "Add a README", ".gitignore", atau "license".
4. Klik **Create repository**. Biarkan halaman berikutnya terbuka — Anda butuh alamatnya.

### D4. Masuk ke folder yang BENAR (langkah paling penting)

Folder kerja Anda adalah **`smapatispa-web`** — folder hasil ekstrak ZIP yang **di dalamnya langsung ada `index.html`**. Di folder inilah `git init` dijalankan. Jangan di folder Unduhan/Downloads, jangan di folder induknya.

Cara cepat di Windows: buka folder `smapatispa-web` di File Explorer → klik bilah alamat → ketik `powershell` → Enter. PowerShell langsung terbuka di folder itu.

Atau ketik manual (sesuaikan jalurnya):

```powershell
cd "C:\Users\NamaAnda\Downloads\smapatispa-web"
```

Periksa isinya:

```powershell
dir
```

(Mac/Linux: `ls -la`)

✅ Boleh lanjut **hanya bila** daftar menampilkan `index.html`, folder `css`, dan folder `js`. Kalau yang terlihat justru folder `smapatispa-web` lagi, ketik `cd smapatispa-web` lalu `dir` sekali lagi.

### D5. Kirim ke GitHub (jalankan satu per satu)

```bash
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/NAMAPENGGUNA/perpustakaan.git
git push -u origin main
```

Catatan per perintah:

- `git add .` — ada **titik** di akhir. Tanpa titik, tidak ada berkas yang ditambahkan.
- `git remote add …` — ganti `NAMAPENGGUNA` dan `perpustakaan` sesuai milik Anda (salin dari halaman repository di D3).
- `git push` akan meminta **Username** (nama pengguna GitHub) dan **Password**. Untuk Password, tempelkan **Personal Access Token**, bukan kata sandi akun (lihat D6).
- Saat menempel token, **layar tetap kosong** — tidak ada karakter atau bintang yang muncul. Ini normal. Tempel (klik kanan) lalu tekan Enter.

✅ Berhasil bila muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### D6. Membuat Personal Access Token (bila diminta)

1. Buka **https://github.com/settings/tokens** → **Generate new token** → **Generate new token (classic)**.
2. **Note:** `upload-perpustakaan` · **Expiration:** 90 hari (atau *No expiration*) · centang **repo**.
3. Klik **Generate token** → salin token `ghp_…` (hanya tampil sekali, simpan dulu di Notepad).
4. Jalankan lagi `git push -u origin main` dan tempel token sebagai password.

> Kesulitan dengan terminal? Alternatif visual: **GitHub Desktop** (https://desktop.github.com) → masuk lewat browser → **File → Add local repository** → pilih folder `smapatispa-web` → **Publish repository** (hilangkan centang "Keep this code private").

### D7. Aktifkan GitHub Pages

1. Buka repository Anda di github.com. Pastikan di halaman depan terlihat `index.html`, folder `css`, dan folder `js` (bukan folder `smapatispa-web` atau `frontend`).
2. **Settings** → **Pages** (sidebar kiri).
3. **Source:** *Deploy from a branch* · **Branch:** `main` · folder **`/ (root)`** → **Save**.
4. Tunggu 1–2 menit, muat ulang halaman. Akan muncul: **"Your site is live at https://namapengguna.github.io/perpustakaan/"**.
5. Centang **Enforce HTTPS** bila tersedia.

✅ Berhasil bila alamat tersebut menampilkan beranda perpustakaan berwarna ungu-hijau dengan banner "Buku Terpopuler Bulan Ini".

---

## Tahap E — Masuk pertama kali & pengaturan awal

1. Buka situs Anda → **Masuk NISN / Email** → tab **Staf / Guru (Email)**.
2. Masukkan `superadmin` dan kata sandi dari Tahap A4.
3. **Ganti kata sandi**: menu akun (kanan atas) → **Pengaturan** → bagian **Keamanan — ubah kata sandi**.
4. Buka **Panel Admin** (menu kiri bawah "Pengelola") lalu atur berurutan:

| Menu | Yang diatur |
|---|---|
| **Identitas Aplikasi** | Unggah logo (otomatis diperkecil menjadi thumbnail), nama aplikasi, subjudul, nama sekolah, tahun ajaran, warna utama/aksen/latar (pratinjau langsung), teks banner. Kolom *Alamat situs* terisi otomatis saat Super Admin pertama kali masuk — dipakai untuk tautan di email. |
| **Mapel & Kelas** | 17 mata pelajaran Kurikulum Merdeka SMA sudah terisi — ubah/tambah sesuai sekolah. Tambahkan kelas/rombel (mis. `X-1`, `XI MIPA 2`) beserta tingkatnya. |
| **Impor Data** | Masukkan data siswa & guru sekaligus (Bagian G). |
| **Pengguna** | Tambah akun staf satu per satu bila perlu. Kata sandi sementara tampil sekali dan dapat dikirim lewat email aktivasi. |
| **Peran & Izin** | 6 peran bawaan: Super Admin, Admin Perpustakaan, Pustakawan, Kepala Sekolah/Manajemen (hanya baca laporan), Guru, Siswa. Izin per peran bisa diubah lewat matriks centang. |
| **Notifikasi Email** | Nyalakan/matikan jenis email, lalu tekan **Kirim Email Uji** ke alamat Anda. |
| **Kategori & Penulis** | 8 kategori bawaan dapat diubah. Penulis dibuat otomatis saat menambah buku. |

**Cara masuk tiap pengguna:**

- **Siswa** → tab *Siswa (NISN)*, cukup 10 digit NISN, tanpa kata sandi. (Opsional: wajibkan tanggal lahir sebagai lapis keamanan tambahan di *Identitas Aplikasi → Keamanan & batas*.)
- **Guru & staf** → tab *Staf / Guru*, email atau username + kata sandi. Lupa sandi → tautan pemulihan dikirim ke email.
- **Pengunjung tanpa akun** → bisa menjelajah katalog dan membaca buku berakses **Publik**.

---

## Tahap F — Menambah buku (termasuk Buku Pelajaran)

**Panel Admin → Kelola Buku → Tambah Buku** (atau tombol **Buku Pelajaran** untuk langsung ke formulir materi pelajaran).

1. **Jenis koleksi**: *Bacaan Umum* atau *Buku Pelajaran*. Untuk Buku Pelajaran isi **mata pelajaran**, **tingkat** (X/XI/XII, boleh lebih dari satu), **kelas khusus** (opsional, mis. hanya `XI MIPA 1`), **semester**, **tipe materi** (Modul Ajar, Ringkasan Materi, LKPD, Bank Soal, …), dan **urutan/bab**.
2. **Berkas buku** — pilih salah satu:
   - **Unggah PDF/EPUB** — maksimal 25 MB (bisa diubah, batas aman Google 45 MB). Diunggah bertahap langsung ke folder *Berkas Buku*, aman untuk koneksi lambat.
   - **Dari Google Drive** — tempel tautan berkas Drive yang dapat dibuka akun pemilik skrip.
   - **Tautan eksternal** — buku di situs lain (mis. SIBI Kemdikbud); dibuka di tab baru.
3. **Tingkat akses**: *Publik* (siapa saja) · *Pengguna Terdaftar* (semua yang masuk) · *Khusus Warga Sekolah* (siswa, guru, staf) · *Terbatas* (hanya peran/kelompok yang Anda pilih).
4. **Simpan sebagai Draf** atau **Terbitkan**.

Siswa melihat Buku Pelajaran di menu **Buku Pelajaran**: pilih tingkat → kelas → mata pelajaran → daftar materi yang dikelompokkan per tipe, lengkap dengan progres baca. Siswa otomatis diarahkan ke tingkat dan kelasnya sendiri.

---

## Tahap G — Impor & migrasi data (siswa, guru, buku)

**Panel Admin → Impor Data.**

1. **Pilih jenis data**: Data Siswa · Guru & Staf · Koleksi Buku · Kelas/Rombel · Mata Pelajaran · Kategori.
2. **Sumber data**:
   - **Berkas Excel (.xlsx) atau CSV** — misalnya hasil ekspor Dapodik/data sekolah. Klik **Unduh template CSV** bila ingin contoh kolom.
   - **Spreadsheet lama (Google Sheets)** — tempel URL spreadsheet aplikasi lama. Spreadsheet sumber **hanya dibaca**, tidak pernah diubah, dan harus bisa dibuka oleh akun pemilik Apps Script.
3. Kolom dikenali dari **nama judul kolom**, bukan urutannya. Contoh yang dikenali untuk siswa: `NISN`, `Nama` / `Nama Peserta Didik`, `Kelas` / `Rombel Saat Ini`, `Tanggal Lahir`.
4. Tekan **Pindai (tanpa menyimpan)** — muncul laporan: berapa baris akan *ditambah*, *diperbarui*, *dilewati*, beserta peringatan (mis. NISN tidak 10 digit).
5. Bila laporan sudah benar, tekan **Jalankan Impor**.

**Aman diulang (delta sync):** impor dengan berkas yang sama atau yang sudah diperbarui kapan saja — data yang sudah ada dicocokkan (NISN untuk siswa, email/username untuk staf, ISBN — atau judul+penulis bila tanpa ISBN — untuk buku) sehingga **tidak pernah dobel**. Kelas, kategori, mapel, dan penulis yang belum ada dibuat otomatis.

> 💡 **NISN berawalan nol** (mis. `0071234567`) kadang terpotong menjadi `71234567` oleh Excel. Aplikasi otomatis melengkapi kembali nol di depan sampai 10 digit, tetapi sebaiknya kolom NISN di Excel diformat sebagai **Teks** sebelum ekspor agar tidak ada salah cocok.

---

## Bagian H — Script Properties (tempat rahasia disimpan)

Semua ID dan rahasia disimpan di **Apps Script → ⚙️ Setelan Proyek → Properti skrip**, **bukan** di kode, sheet, atau frontend. Semuanya **terisi otomatis** oleh `setupAplikasi` — Anda tidak perlu mengisi apa pun secara manual.

| Properti | Isi | Boleh diubah? |
|---|---|---|
| `SESSION_SECRET` | Kunci tanda tangan token login (64 karakter acak) | Jangan diedit manual. Untuk menggantinya jalankan `rotasiSecretSesi` (semua pengguna harus masuk ulang) — lakukan bila curiga ada kebocoran. |
| `SPREADSHEET_ID` | ID database | Hanya bila Anda sengaja memindahkan database |
| `ROOT_FOLDER_ID`, `FOLDER_BUKU`, `FOLDER_SAMPUL`, `FOLDER_GAMBAR`, `FOLDER_EKSPOR` | ID folder Drive | Hanya bila memindahkan folder |
| `KEEP_WARM` | `on`/`off` — pemicu pemeliharaan | Lewat fungsi `matikanKeepWarm` / `nyalakanKeepWarm` |
| `REV_…` | Penanda pencabutan sesi per pengguna (mis. setelah ganti sandi) | Dikelola & dibersihkan otomatis — jangan diedit |

Sheet **AppConfig** di spreadsheet hanya berisi *catatan* ID untuk memudahkan Anda; kode tidak membaca dari sana.

---

## Bagian I — Kinerja & kuota Google

Aplikasi dirancang untuk 100–300 pengguna per hari dan 50–100 pengguna aktif bersamaan:

- **Cache bertingkat**: katalog, beranda, dan dashboard disajikan dari cache server (tanpa membaca Sheets) dan cache browser, sehingga perpindahan menu terasa instan.
- **Pemicu `pemeliharaan` tiap 5 menit** (dipasang otomatis): menulis antrean log aktivitas ke sheet, mengirim antrean email, dan memanaskan cache agar pengguna pertama di pagi hari tidak menunggu lama.
- **Antrean email**: email dikirim bertahap sesuai kuota harian Google — sekitar **100 penerima/hari** untuk akun Gmail biasa dan **1.500/hari** untuk Google Workspace. Sisa kuota terlihat di **Panel Admin → Status Sistem**.
- Pemicu memakai kuota waktu jalan pemicu harian (sekitar 90 menit/hari untuk Gmail biasa, lebih besar untuk Workspace). Bila kuota terasa sempit, jalankan **`matikanKeepWarm`** — email & log tetap diproses saat ada pengguna yang membuka aplikasi.
- Cek kesehatan kapan saja: jalankan **`cekPerforma`** di editor, atau buka **Panel Admin → Status Sistem** (antrean, cache, pemicu, kuota, tombol *Segarkan cache*).
- Untuk teknisi: di browser, buka Console (F12) dan ketik `Perf.table()` untuk melihat waktu setiap panggilan API.

---

## Bagian J — Memperbarui aplikasi

**Backend (bila ada versi baru `Kode.gs`):**

1. Tempel `Kode.gs` baru ke editor (ganti seluruh isi) → **Ctrl+S**.
2. Jalankan **`setupAplikasi`** sekali (aman — menambahkan kolom/sheet baru bila ada).
3. **Terapkan → Kelola deployment** → ikon ✏️ pada deployment yang ada → **Versi: Versi baru** → **Terapkan**.

   Dengan cara ini **URL `/exec` tetap sama**, sehingga `config.js` tidak perlu diubah. (Jangan membuat "Deployment baru" lagi — itu menghasilkan URL berbeda.)

**Frontend (bila ada berkas tampilan baru):** salin berkas baru ke folder `smapatispa-web` (timpa yang lama, **kecuali `js/config.js`** milik Anda), lalu dari folder itu:

```bash
git add .
git commit -m "Pembaruan tampilan"
git push
```

Tunggu 1–2 menit. Bila masih tampil versi lama, tekan **Ctrl+Shift+R** atau buka di jendela Incognito.

---

## Bagian K — Catatan penting

- **Berkas buku tidak pernah dibagikan publik.** Pembaca mengambil isi buku lewat API setelah hak aksesnya diperiksa (token baca berlaku 3 jam). Jangan mengubah setelan berbagi folder *Berkas Buku*.
- **Sampul & logo** dibagikan "siapa saja yang memiliki tautan (lihat)" agar bisa tampil di halaman. Bila domain Google Workspace sekolah melarang berbagi publik, sampul akan diganti otomatis dengan sampul warna yang dibuat aplikasi (tetap rapi), dan logo tidak tampil — minta admin Workspace mengizinkan berbagi tautan untuk folder *Sampul* dan *Gambar & Logo*.
- **Pembaca buku** mendukung PDF (pdf.js, dimuat dari CDN jsDelivr) dan EPUB (pembaca bawaan, tanpa pustaka tambahan): navigasi halaman/bab, daftar isi, penanda, tema terang/sepia/gelap, zoom, mode 1–2 halaman, layar penuh, dan progres yang tersimpan otomatis. Buku yang pernah dibuka disimpan sementara di perangkat sehingga pembukaan berikutnya lebih cepat.
- **Cadangan data**: di Google Sheets, **File → Buat salinan** secara berkala (mis. tiap akhir semester).

---

## Bagian L — Fungsi yang bisa dijalankan dari editor Apps Script

| Fungsi | Kegunaan |
|---|---|
| `setupAplikasi` | Pemasangan awal / perbaikan struktur (aman diulang) |
| `isiDataContoh` / `hapusDataContoh` | Tambah / hapus data uji coba |
| `resetSandiSuperAdmin` | Buat kata sandi baru Super Admin (tampil di log) |
| `rotasiSecretSesi` | Ganti kunci token — semua pengguna keluar |
| `cekPerforma` | Uji kecepatan baca data & sisa kuota email |
| `kosongkanCache` | Paksa semua cache dibangun ulang (mis. setelah mengedit sheet secara manual) |
| `matikanKeepWarm` / `nyalakanKeepWarm` | Matikan / nyalakan pemicu pemeliharaan 5 menit |

> ✍️ **Mengedit spreadsheet langsung?** Boleh untuk perbaikan kecil, tetapi jangan mengubah baris judul (baris 1) atau urutan kolom ID. Setelah mengedit, jalankan `kosongkanCache` agar perubahan langsung terlihat di aplikasi.

---

## Bagian M — Mengatasi masalah

| Yang terlihat | Penyebab | Solusi |
|---|---|---|
| Halaman "Konfigurasi belum lengkap" | `js/config.js` belum diisi | Isi URL `/exec` (Tahap C), lalu `git add .` → `git commit -m "isi config"` → `git push` |
| Situs GitHub 404 | `index.html` tidak berada di root repository | Lihat repository di github.com: harus terlihat `index.html`. Bila yang terlihat folder, ulangi D4–D5 dari folder `smapatispa-web` dan akhiri dengan `git push -u origin main --force` (menimpa isi lama yang salah susun) |
| Tampilan tanpa warna/gaya | Folder `css/` / `js/` hilang (unggah lewat web GitHub) | Unggah ulang lewat terminal (Tahap D), jangan "Upload files" |
| "Tidak dapat terhubung ke server" | URL salah, memakai `/dev`, atau akses deployment bukan "Siapa saja" | Buka URL `/exec` di browser — harus tampil JSON. Periksa setelan deployment (Tahap B) |
| Perubahan kode backend tidak berlaku | Deployment belum diperbarui | Kelola deployment → ✏️ → **Versi baru** (Bagian J) |
| NISN "tidak terdaftar" | Siswa belum diimpor / NISN terpotong nol depan | Impor data siswa; cek kolom NISN 10 digit |
| Lupa kata sandi Super Admin | — | Jalankan `resetSandiSuperAdmin`, sandi baru tampil di log |
| Email tidak terkirim | Kuota harian habis / notifikasi dimatikan | Panel Admin → Status Sistem (lihat kuota & antrean); email tertunda dikirim otomatis besok |
| Unggah berkas gagal di tengah jalan | Koneksi terputus / berkas > batas | Ulangi unggah; periksa batas MB di Identitas → Keamanan & batas (maks. 45) |
| Pesan "Drive API has not been used in project…" saat unggah/membaca buku | Drive API belum aktif di proyek | Editor → **Layanan (+)** → pilih **Drive API** → Tambahkan, lalu coba lagi |
| Data baru dari sheet tidak muncul | Cache server (maks. 15 menit) | Panel Admin → Status Sistem → **Segarkan cache**, atau jalankan `kosongkanCache` |
| Situs tampil versi lama | Cache browser | **Ctrl+Shift+R** atau jendela Incognito |
| `Password authentication is not supported` saat `git push` | GitHub menolak sandi akun | Gunakan Personal Access Token (D6) |
| `remote origin already exists` | Perintah remote sudah pernah dijalankan | Lewati, langsung `git push -u origin main` |
| `src refspec main does not match any` | Belum ada commit | `git add .` lalu `git commit -m "Upload pertama"` dulu |

---

*Smapatispa Digital Library v1.0.0 — backend Google Apps Script (REST API), frontend HTML/CSS/JS murni di GitHub Pages.*
