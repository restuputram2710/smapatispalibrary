# Smapatispa Digital Library — Tampilan Web

Perpustakaan digital sekolah: katalog buku, **Buku Pelajaran per tingkat / kelas / mata pelajaran**, pembaca PDF & EPUB, koleksi pribadi siswa, rekomendasi guru, serta panel admin (dashboard, laporan PDF/Excel, impor data, peran & izin, identitas aplikasi).

Folder ini adalah **frontend** yang di-hosting di GitHub Pages. Backend-nya berjalan di Google Apps Script (berkas `Kode.gs` dan `appsscript.json` diberikan terpisah).

## Mulai cepat

1. Pasang backend dan terbitkan sebagai Web App → salin URL `/exec`.
2. Isi URL tersebut di **`js/config.js`**.
3. Dari **folder ini** (yang berisi `index.html`), jalankan:
   ```bash
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/NAMAPENGGUNA/NAMA-REPO.git
   git push -u origin main
   ```
4. GitHub → Settings → Pages → Branch `main` · `/ (root)` → Save.

Langkah lengkap untuk pemula ada di **[PANDUAN-INSTALASI.md](PANDUAN-INSTALASI.md)**.

## Struktur

```
index.html          halaman tunggal (SPA, navigasi berbasis #)
css/style.css       sistem desain (ungu #6B3FA0, hijau #5E9E34, Inter + JetBrains Mono)
js/config.js        URL backend — satu-satunya berkas yang diubah
js/core.js          pemanggil API, cache, sesi, utilitas
js/ui.js            komponen (kartu buku, modal, toast, tabel, sampul)
js/charts.js        grafik SVG (garis, batang, donat) dengan tooltip
js/zip.js           baca/tulis ZIP, XLSX, CSV (tanpa pustaka luar)
js/reader.js        pembaca PDF (pdf.js via CDN) & EPUB
js/app.js           kerangka, router, navigasi
js/pages-anggota.js beranda, katalog, detail, buku pelajaran, koleksi, masuk
js/pages-admin.js   panel admin
```

Tidak ada langkah build — semua HTML/CSS/JavaScript murni. Untuk memeriksa kinerja, buka Console browser dan ketik `Perf.table()`.
