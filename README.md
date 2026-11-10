# ZakaTani — Peta & Simulasi Rantai Pasok Lumbung Pangan BAZNAS

Prototipe riset untuk proposal **Beasiswa Riset BAZNAS 2026**, Kategori Kelompok Riset, **Klaster B.7 Lumbung Pangan**.
Jargon: *Lumbung Pangan BAZNAS Berdaya, Umat Berjaya.*

> Prototipe riset. Data dari sumber publik dan dapat berubah. **Bukan situs resmi BAZNAS.**

## Fitur
| Halaman | Isi |
|---|---|
| Beranda | Hero, 5 kartu angka berikon (lumbung, kapasitas, kebutuhan, ongkos kirim rata-rata, muzaki), Tentang ZakaTani, alur, 5 kartu fitur |
| Alur Rantai Pasok | 5 langkah (Tanam → Panen → Giling & Kemas → Salur lewat BAZNAS → Zakat Fitrah) dan putaran "petani binaan menjadi muzaki" |
| Peta | Leaflet + OpenStreetMap; lumbung/penggilingan/BAZNAS/gudang Bulog; filter; panel detail; BAZNAS terdekat; alur pasok beranimasi; 4 kartu angka |
| Simulasi Alokasi | Model **dua tahap**: (1) serap beras petani binaan sebanyak mungkin, (2) ongkos total terkecil (kirim + harga beli); Bulog dari gudang provinsi hanya mengisi kekurangan; skenario curah hujan, jadwal Ramadan 1448–1450 H, kebutuhan; calon penggilingan; simpan 3 skenario; ekspor CSV/PDF; pembanding skema terpusat |
| Profil Lumbung | 21 kartu + "Hitung zakat panen →" + "Lihat di peta" |
| Metodologi | Tab Model alokasi · Zakat panen · Data & catatan |
| Tentang & FAQ | Cerita pemanfaatan (ilustrasi), 6 pertanyaan umum, kontak surel CRP |
| Kalkulator Zakat | Zakat hasil panen (nisab 653 kg gabah / 520 kg beras; 5% · 10% · 7,5%), dihitung di perangkat |
| Kelola Data (tim) | Tidak ada di menu; buka lewat `…/#kelola` |

Mode terang/gelap: tombol ☀/☾ di kanan menu (mengikuti pengaturan perangkat pada kunjungan pertama).

**Semua angka kapasitas, kebutuhan, ongkos, dan hasil simulasi adalah data ilustrasi**; pita hijau muda di bawah menu menandainya di semua halaman. Status `asli`/`contoh` tetap disimpan di data untuk tim tetapi tidak ditampilkan.

Yang perlu diisi tim: `kontakSurel` di `js/config.js` (alamat surel CRP).

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
js/kalkulator.js           kalkulator zakat panen
js/app.js                  titik masuk, router, mode terang/gelap
data/simpul.json           simpul, parameter, alur, statistik, dampak (TERPISAH dari kode)
data/indonesia-provinsi.json  batas 38 provinsi (basemap luring)
tools/buat_data.py         generator data awal (koordinat dari dataset terbuka, bukan tebakan)
tools/terapkan_ilustrasi.py  melengkapi data ilustrasi (petani, panen, gudang Bulog, parameter biaya)
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
