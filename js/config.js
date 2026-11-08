/* ZakaTani — konfigurasi global.
 * Semua modul memakai satu ruang nama: window.ZT
 * Ubah nilai di sini tanpa menyentuh modul lain.
 */
window.ZT = window.ZT || {};

ZT.CONFIG = {
  versi: '0.1.0',
  // Berkas data (mode cadangan tanpa server). Dibaca relatif terhadap index.html.
  berkasData: 'data/simpul.json',
  berkasBatas: 'data/indonesia-provinsi.json',

  // Supabase (opsional). Isi untuk mengaktifkan penyimpanan PostgreSQL + login tim.
  // Biarkan kosong → website membaca data/simpul.json (bisa dibuka juri tanpa login).
  // Skema tabel ada di docs/supabase.sql.
  supabase: { url: '', anonKey: '', tabel: 'dataset', baris: 'aktif' },

  // Basemap daring (dipakai bila bisa dimuat). Jika diblokir/luring,
  // peta otomatis memakai batas provinsi dari berkasBatas.
  // Bawaan: OpenStreetMap standar (berwarna, berlabel kota). Pilihan lain tanpa kunci: 'esri' (abu-abu terang).
  // Ubin CARTO kini butuh API key. Untuk CARTO dengan kunci, isi url sendiri.
  basemapPilihan: 'osm',
  // Isi kunci gratis dari https://carto.com/basemaps/apikey lalu ganti basemapPilihan ke 'carto' (Positron, sesuai brief).
  kunciCarto: '',
  basemaps: {
    esri: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      atribusi: 'Basemap &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors', maxZoom: 16, subdomains: ''
    },
    carto: {
      url: 'https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=KUNCI',
      atribusi: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>', maxZoom: 19, subdomains: ''
    },
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      atribusi: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19, subdomains: ''
    }
  },

  warna: {
    hijauTua: '#1F5E3B', hijauPadi: '#4E8F3A', gabah: '#E3B23C', tanah: '#8A6440',
    krem: '#FAF7EF', arang: '#2B2B2B', abu: '#7A7F75', bulog: '#6B6F68'
  },

  // Kolom wajib saat unggah CSV/Excel di Kelola Data.
  kolomWajib: ['id', 'jenis', 'nama', 'provinsi', 'lat', 'lon', 'presisi_lokasi'],
  // Angka per simpul yang memiliki status asli/contoh.
  fieldAngka: ['petani', 'luas_ha', 'panen_ton', 'tahun_mulai', 'kapasitas_ton', 'stok_simpan_ton', 'kebutuhan_ton', 'musim_panen'],
  jenisValid: ['lumbung', 'penggilingan', 'baznas', 'bulog'],
  presisiValid: ['desa', 'kecamatan', 'kabupaten', 'provinsi'],
  maksSkenario: 3,
  pusatIndonesia: [-2.5, 118], zoomAwal: 5
};

ZT.BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
