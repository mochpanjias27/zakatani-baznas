# ZakaTani — Peta & Simulasi Rantai Pasok Lumbung Pangan BAZNAS

Prototipe riset untuk proposal **Beasiswa Riset BAZNAS 2026**, Kategori Kelompok Riset, **Klaster B.7 Lumbung Pangan**.
Cerita intinya: *Dari Sawah Mustahik ke Mustahik.*

> Prototipe riset. Data dari sumber publik dan dapat berubah. **Bukan situs resmi BAZNAS.**

## Fitur
| Halaman | Isi |
|---|---|
| Beranda | Hero, 4 kartu angka bersumber, ringkasan alur, fitur |
| Alur Rantai Pasok | 5 langkah (Tanam → Panen → Giling & Kemas → Salur lewat BAZNAS → Zakat Fitrah) dan putaran "petani binaan menjadi muzaki"; klik langkah untuk melihat lumbung terkait |
| Peta | Leaflet; lumbung/penggilingan/BAZNAS/Bulog dengan bentuk ikon berbeda; filter chip (komoditas, pengelola, provinsi); panel detail; BAZNAS terdekat (haversine) dan garis putus-putus; alur pasok beranimasi; bilah ringkasan dengan radius penggilingan yang bisa diatur |
| Simulasi Alokasi | Model transportasi (LP) di browser; Bulog sebagai pemasok cadangan; faktor jalan & tarif bisa diubah; calon penggilingan baru (klik di peta); skenario curah hujan, jadwal Ramadan, perubahan kebutuhan; simpan & bandingkan hingga 3 skenario; ekspor CSV/PDF; pembanding pola saat ini (semua lewat BAZNAS RI) |
| Profil Lumbung | Kartu per lumbung + "Lihat di peta" |
| Dampak | Grafik petani binaan menjadi muzaki per lokasi (bersumber) |
| Tentang & Metodologi | Tujuan, tim, rumus, parameter, sumber data, asumsi, keterbatasan, disclaimer |
| Kelola Data | Unggah CSV/Excel → validasi kolom wajib → pratinjau → simpan; sunting simpul; parameter; ekspor; kembalikan data awal |

Setiap angka punya status **asli** (bersumber) atau **contoh** (berlabel di semua halaman). Saklar **Hanya data asli** di bilah atas menyembunyikan semua angka contoh.

## Struktur kode
```
index.html                 kerangka 8 halaman (router hash)
css/style.css              palet, tipografi (Plus Jakarta Sans), komponen
js/config.js               konfigurasi (berkas data, Supabase, basemap, kolom wajib)
js/util.js                 format angka, label status asli/contoh, modal, toast
js/ilustrasi.js            ilustrasi vektor buatan tim + ikon penanda peta
js/geo.js                  haversine, simpul terdekat, garis lengkung
js/data.js                 muat/simpan data (berkas, browser, artifact, Supabase), CSV/Excel, validasi
js/model.js                model optimasi alokasi (javascript-lp-solver) + skenario
js/ekspor.js               ekspor CSV & PDF (jsPDF)
js/peta.js                 pabrik peta + halaman Peta
js/simulasi.js             halaman Simulasi Alokasi
js/halaman.js              Beranda, Alur, Profil, Dampak, Tentang
js/kelola.js               Kelola Data
js/app.js                  titik masuk, router, saklar "Hanya data asli"
data/simpul.json           simpul, parameter, alur, statistik, dampak (TERPISAH dari kode)
data/indonesia-provinsi.json  batas 38 provinsi (basemap luring)
tools/buat_data.py         generator data awal (koordinat dari dataset resmi, bukan tebakan)
docs/supabase.sql          skema tabel + kebijakan akses Supabase
```

## Menjalankan
Website statis; cukup disajikan lewat server web (bukan `file://`):
```bash
python3 -m http.server 8000   # lalu buka http://localhost:8000
```
Pustaka (Leaflet, javascript-lp-solver, SheetJS, jsPDF) dimuat dari CDN.

## Hosting (Vercel/Netlify)
Tanpa build. **Vercel:** Add New → Project → impor repo `zakatani-baznas` → Framework Preset: *Other* → Build Command & Output Directory dikosongkan → Deploy. `vercel.json` dan `netlify.toml` sudah disertakan.

## Basemap
Bawaan: OpenStreetMap standar (tanpa kunci; patuhi kebijakan pemakaian ubin OSM untuk lalu lintas rendah). Alternatif: `'esri'` (abu-abu terang). Ubin CARTO sejak Agustus–September 2026 wajib API key (gratis). Untuk memakai CARTO Positron: isi `kunciCarto` dan ubah `basemapPilihan` ke `'carto'` di `js/config.js`. Bila ubin daring gagal, peta tetap menampilkan batas provinsi bawaan.

## Supabase (opsional: penyimpanan bersama + login tim)
1. Buat proyek Supabase (paket gratis), jalankan `docs/supabase.sql`.
2. Buat akun tim di **Authentication → Users**.
3. Isi `ZT.CONFIG.supabase.url` dan `anonKey` di `js/config.js`.
Tanpa konfigurasi, website membaca `data/simpul.json` sehingga juri bisa membuka tanpa login. Kelola Data berjalan dalam **mode demo lokal** (tersimpan di browser saja).
Saat dibuka sebagai artifact claude.ai, Kelola Data memakai penyimpanan bersama artifact (pemilik/editor).

## Mengganti data contoh dengan data asli
* Lewat layar: **Kelola Data → Unduh templat** → sunting di Excel → unggah kembali.
* Kolom wajib: `id, jenis, nama, provinsi, lat, lon, presisi_lokasi`.
* Setiap kolom angka punya `status_<kolom>` = `asli` | `contoh`. Angka asli wajib punya minimal satu URL di `sumber_url` (pisahkan beberapa URL dengan `|`).
* Status kosong otomatis dianggap `contoh` (tidak pernah tampil sebagai data resmi).

## Catatan data awal
* Koordinat semua simpul saat ini berpresisi **kabupaten** (titik acuan kab/kota dari dataset terbuka) atau **provinsi** (Papua), ditandai garis tepi putus-putus. Verifikasi koordinat desa dijadwalkan selama riset.
* Kapasitas, kebutuhan, musim panen, stok simpan, dan tarif masih **data contoh**.
* Angka berlabel "perlu verifikasi" berasal dari brief tim; URL angkanya perlu dilengkapi.
* Sebelum pendaftaran HKI, pastikan nama ZakaTani belum dipakai aplikasi lain.

## Lisensi pustaka
Leaflet (BSD-2), javascript-lp-solver (Unlicense), SheetJS CE (Apache-2.0), jsPDF (MIT), jsPDF-AutoTable (MIT). Batas provinsi: dataset GeoJSON terbuka (perlu verifikasi BIG/BPS).
