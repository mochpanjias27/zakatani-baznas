/* ZakaTani — lapisan data.
 * Data simpul & parameter disimpan terpisah dari kode (data/simpul.json).
 * Urutan sumber saat memuat:
 *   1) Supabase (bila ZT.CONFIG.supabase diisi)          → data bersama tim
 *   2) Penyimpanan artifact (kapabilitas `db`, bila ada) → data bersama tim
 *   3) localStorage (mode demo lokal)                    → hanya di browser ini
 *   4) data/simpul.json                                  → mode cadangan tanpa server
 */
(function (ZT) {
  'use strict';
  const D = {};
  const KUNCI_LOKAL = 'zakatani:dataset:v2';
  const C = ZT.CONFIG;

  ZT.state = ZT.state || { hanyaAsli: false, data: null, awal: null, sumberData: 'berkas', bisaSimpan: false, pengguna: null };

  const klon = (o) => JSON.parse(JSON.stringify(o));

  /* ------------------------------------------------------------------ muat */
  D.muat = async () => {
    const res = await fetch(C.berkasData, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Gagal memuat ' + C.berkasData);
    const awal = await res.json();
    ZT.state.awal = klon(awal);
    let data = awal, sumber = 'berkas';
    try {
      const lokal = localStorage.getItem(KUNCI_LOKAL);
      if (lokal) { data = JSON.parse(lokal); sumber = 'lokal'; }
    } catch (e) { /* localStorage tidak tersedia */ }
    D.pasang(data, sumber);
    return data;
  };

  /** Pasang dataset baru ke state (tanpa menyimpan). */
  D.pasang = (data, sumber) => {
    data.parameter = Object.assign(klon(ZT.state.awal ? ZT.state.awal.parameter : {}), data.parameter || {});
    data.alur = data.alur || (ZT.state.awal ? klon(ZT.state.awal.alur) : []);
    data.statistik = data.statistik || (ZT.state.awal ? klon(ZT.state.awal.statistik) : {});
    data.dampak = data.dampak || (ZT.state.awal ? klon(ZT.state.awal.dampak) : null);
    ZT.state.data = data;
    if (sumber) ZT.state.sumberData = sumber;
  };

  /* ---------------------------------------------- penyimpanan bersama */
  // Kapabilitas artifact (hanya tersedia saat dibuka sebagai artifact claude.ai).
  D.hubungkanArtifact = async () => {
    if (!window.claude || typeof window.claude.use !== 'function') return null;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      ZT.state.artifactDb = db; ZT.state.artifactUser = user;
      if (!db) return null;
      // Batas waktu 10 detik agar halaman tidak menunggu tanpa akhir.
      const snap = await Promise.race([db.doc('dataset/aktif').get(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))]);
      if (snap && snap.exists) {
        const isi = snap.data();
        if (isi && isi.json) { D.pasang(JSON.parse(isi.json), 'artifact'); return 'dimuat'; }
      }
      return 'kosong';
    } catch (e) { return null; }
  };

  D.bisaTulisArtifact = () => {
    const u = ZT.state.artifactUser; if (!ZT.state.artifactDb) return false;
    if (!u) return true; // tidak diberi tahu → coba; penolakan menentukan
    const c = u.can ? u.can('data.write') : null;
    return c === null || c === undefined ? true : !!c;
  };

  // Supabase (opsional) — dimuat dinamis hanya bila dikonfigurasi.
  D.supabaseAktif = () => !!(C.supabase.url && C.supabase.anonKey);
  D.supabase = async () => {
    if (!D.supabaseAktif()) return null;
    if (ZT.state.sb) return ZT.state.sb;
    await new Promise((ok, gagal) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = ok; s.onerror = gagal; document.head.appendChild(s);
    });
    ZT.state.sb = window.supabase.createClient(C.supabase.url, C.supabase.anonKey);
    return ZT.state.sb;
  };
  D.muatSupabase = async () => {
    try {
      const sb = await D.supabase(); if (!sb) return null;
      const { data, error } = await sb.from(C.supabase.tabel).select('isi').eq('id', C.supabase.baris).maybeSingle();
      if (error) throw error;
      if (data && data.isi) { D.pasang(data.isi, 'supabase'); return 'dimuat'; }
      return 'kosong';
    } catch (e) { console.warn('[ZakaTani] Supabase:', e); return null; }
  };

  /** Simpan dataset aktif ke tujuan terbaik yang tersedia. */
  D.simpan = async () => {
    const d = ZT.state.data;
    d.meta = Object.assign({}, d.meta, { diperbarui: new Date().toISOString().slice(0, 10) });
    if (D.supabaseAktif() && ZT.state.pengguna) {
      const sb = await D.supabase();
      const { error } = await sb.from(C.supabase.tabel).upsert({ id: C.supabase.baris, isi: d, diperbarui: new Date().toISOString() });
      if (error) throw new Error('Supabase: ' + error.message);
      ZT.state.sumberData = 'supabase'; return 'supabase';
    }
    if (ZT.state.artifactDb && D.bisaTulisArtifact()) {
      try {
        await ZT.state.artifactDb.doc('dataset/aktif').set({ json: JSON.stringify(d), diperbarui: new Date().toISOString() });
        ZT.state.sumberData = 'artifact'; return 'artifact';
      } catch (e) {
        if (e && e.code === 'invalid_argument') ZT.state.artifactTolak = true;
        if (e && e.code === 'quota_exceeded') throw new Error('Penyimpanan penuh: ' + e.message);
        // jatuh ke penyimpanan lokal
      }
    }
    try { localStorage.setItem(KUNCI_LOKAL, JSON.stringify(d)); ZT.state.sumberData = 'lokal'; return 'lokal'; }
    catch (e) { throw new Error('Browser tidak mengizinkan penyimpanan lokal.'); }
  };

  D.kembalikanAwal = async () => {
    try { localStorage.removeItem(KUNCI_LOKAL); } catch (e) { /* */ }
    D.pasang(klon(ZT.state.awal), 'berkas');
    if ((ZT.state.artifactDb && D.bisaTulisArtifact()) || (D.supabaseAktif() && ZT.state.pengguna)) await D.simpan();
  };

  /* ------------------------------------------------------------ getter */
  D.simpul = () => ZT.state.data.simpul;
  D.byId = (id) => ZT.state.data.simpul.find((s) => s.id === id);
  D.jenis = (j) => ZT.state.data.simpul.filter((s) => s.jenis === j);
  D.param = (k) => { const p = ZT.state.data.parameter[k]; return p ? p.nilai : null; };
  D.provinsi = () => [...new Set(D.jenis('lumbung').map((s) => s.provinsi).filter(Boolean))].sort();
  D.kelompokPengelola = (s) => {
    const p = (s.pengelola || ''); const r = [];
    if (/BAZNAS RI/i.test(p)) r.push('ri');
    if (/Prov|Kab|Kota/i.test(p)) r.push('daerah');
    return r;
  };

  /* --------------------------------------------------------- CSV & Excel */
  const KOLOM = ['id', 'jenis', 'nama', 'tingkat_baznas', 'desa', 'kecamatan', 'kabupaten', 'provinsi', 'lat', 'lon', 'presisi_lokasi',
    'komoditas', 'pengelola', 'petani', 'luas_ha', 'panen_ton', 'tahun_mulai', 'kapasitas_ton', 'musim_panen', 'stok_simpan_ton', 'kebutuhan_ton']
    .concat(C.fieldAngka.map((f) => 'status_' + f)).concat(['sumber_url', 'sumber_label', 'perlu_verifikasi', 'catatan']);
  D.KOLOM = KOLOM;

  const selCSV = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  D.keCSV = (baris, kolom) => '﻿' + [kolom.join(',')].concat(baris.map((r) => kolom.map((k) => selCSV(r[k])).join(','))).join('\n');

  D.simpulKeBaris = (s) => {
    const r = {};
    KOLOM.forEach((k) => { r[k] = ''; });
    ['id', 'jenis', 'nama', 'tingkat_baznas', 'desa', 'kecamatan', 'kabupaten', 'provinsi', 'lat', 'lon', 'presisi_lokasi', 'komoditas', 'pengelola',
      'petani', 'luas_ha', 'panen_ton', 'tahun_mulai', 'kapasitas_ton', 'stok_simpan_ton', 'kebutuhan_ton', 'catatan'].forEach((k) => { r[k] = s[k] == null ? '' : s[k]; });
    r.musim_panen = (s.musim_panen || []).join(';');
    C.fieldAngka.forEach((f) => { r['status_' + f] = s[f] == null ? '' : (s.status && s.status[f]) || 'asli'; });
    r.sumber_url = (s.sumber || []).map((x) => x.url || '').join(' | ');
    r.sumber_label = (s.sumber || []).map((x) => x.label || '').join(' | ');
    r.perlu_verifikasi = (s.perlu_verifikasi || []).join(';');
    return r;
  };
  D.eksporSimpulCSV = () => D.keCSV(D.simpul().map(D.simpulKeBaris), KOLOM);

  /** Parser CSV sederhana yang menghormati tanda kutip; pemisah koma atau titik koma. */
  D.parseCSV = (teks) => {
    teks = teks.replace(/^﻿/, '');
    const barisPertama = teks.split(/\r?\n/)[0] || '';
    const sep = (barisPertama.match(/;/g) || []).length > (barisPertama.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], sel = '', kutip = false;
    for (let i = 0; i < teks.length; i++) {
      const ch = teks[i];
      if (kutip) {
        if (ch === '"') { if (teks[i + 1] === '"') { sel += '"'; i++; } else kutip = false; } else sel += ch;
      } else if (ch === '"') kutip = true;
      else if (ch === sep) { row.push(sel); sel = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && teks[i + 1] === '\n') i++; row.push(sel); rows.push(row); row = []; sel = ''; }
      else sel += ch;
    }
    if (sel !== '' || row.length) { row.push(sel); rows.push(row); }
    const kepala = (rows.shift() || []).map((h) => h.trim().toLowerCase());
    return { kepala, baris: rows.filter((r) => r.some((c) => String(c).trim() !== '')).map((r) => Object.fromEntries(kepala.map((h, i) => [h, (r[i] == null ? '' : String(r[i]).trim())]))) };
  };

  D.muatXLSX = async () => {
    if (window.XLSX) return window.XLSX;
    await new Promise((ok, gagal) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = () => gagal(new Error('Pustaka Excel gagal dimuat')); document.head.appendChild(s); });
    return window.XLSX;
  };
  D.parseExcel = async (buf) => {
    const X = await D.muatXLSX();
    const wb = X.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const arr = X.utils.sheet_to_json(ws, { defval: '', raw: false });
    const kepala = arr.length ? Object.keys(arr[0]).map((h) => h.trim().toLowerCase()) : [];
    return { kepala, baris: arr.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim().toLowerCase(), String(v).trim()]))) };
  };

  /**
   * Validasi tabel unggahan → {simpul, galat[], peringatan[]}.
   * Galat menghentikan penyimpanan; peringatan hanya memberi tahu.
   */
  D.validasi = (tabel) => {
    const galat = [], peringatan = [], simpul = [], idSet = new Set();
    const hilang = C.kolomWajib.filter((k) => !tabel.kepala.includes(k));
    if (hilang.length) galat.push('Kolom wajib tidak ada: ' + hilang.join(', '));
    const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));
    tabel.baris.forEach((r, i) => {
      const n = i + 2, pre = `Baris ${n}${r.id ? ' (' + r.id + ')' : ''}: `;
      if (!r.id) galat.push(pre + 'id kosong.');
      else if (idSet.has(r.id)) galat.push(pre + 'id ganda.'); else idSet.add(r.id);
      if (!C.jenisValid.includes(r.jenis)) galat.push(pre + `jenis "${r.jenis}" tidak dikenal (lumbung | penggilingan | baznas | bulog).`);
      if (!r.nama) galat.push(pre + 'nama kosong.');
      const lat = num(r.lat), lon = num(r.lon);
      if (lat == null || isNaN(lat) || lat < -11.5 || lat > 6.5) galat.push(pre + 'lat di luar wilayah Indonesia atau kosong.');
      if (lon == null || isNaN(lon) || lon < 94 || lon > 142) galat.push(pre + 'lon di luar wilayah Indonesia atau kosong.');
      if (!C.presisiValid.includes(r.presisi_lokasi)) galat.push(pre + 'presisi_lokasi harus desa | kecamatan | kabupaten | provinsi.');
      if (r.jenis === 'baznas' && !['ri', 'provinsi', 'kabupaten'].includes(r.tingkat_baznas)) galat.push(pre + 'tingkat_baznas harus ri | provinsi | kabupaten.');
      const s = {
        id: r.id, jenis: r.jenis, nama: r.nama, tingkat_baznas: r.tingkat_baznas || null, desa: r.desa || null, kecamatan: r.kecamatan || null,
        kabupaten: r.kabupaten || null, provinsi: r.provinsi || null, lat, lon, presisi_lokasi: r.presisi_lokasi, komoditas: r.komoditas || null,
        pengelola: r.pengelola || null, status: {}, sumber: [], perlu_verifikasi: (r.perlu_verifikasi || '').split(/[;|]/).map((x) => x.trim()).filter(Boolean), catatan: r.catatan || ''
      };
      C.fieldAngka.forEach((f) => {
        if (f === 'musim_panen') {
          const m = (r.musim_panen || '').split(/[;|,\s]+/).filter(Boolean).map(Number);
          if (m.some((b) => !(b >= 1 && b <= 12))) galat.push(pre + 'musim_panen harus angka bulan 1–12 dipisah titik koma.');
          s.musim_panen = m.length ? m : null;
        } else {
          const v = num(r[f]);
          if (v != null && isNaN(v)) galat.push(pre + `${f} bukan angka.`);
          s[f] = v;
        }
        const ada = s[f] != null;
        let st = (r['status_' + f] || '').toLowerCase();
        if (ada && !st) { st = 'contoh'; peringatan.push(pre + `status_${f} kosong → dianggap "contoh".`); }
        if (st && !['asli', 'contoh'].includes(st)) galat.push(pre + `status_${f} harus asli | contoh.`);
        if (ada) s.status[f] = st;
      });
      const urls = (r.sumber_url || '').split('|').map((x) => x.trim());
      const labels = (r.sumber_label || '').split('|').map((x) => x.trim());
      urls.forEach((u, k) => { if (u || labels[k]) s.sumber.push({ url: u || null, label: labels[k] || u }); });
      const adaAsli = Object.values(s.status).includes('asli');
      if (adaAsli && !s.sumber.some((x) => x.url)) peringatan.push(pre + 'ada angka berstatus "asli" tanpa URL sumber (minimal 1 URL).');
      if (r.jenis === 'lumbung' && s.komoditas === 'padi' && s.kapasitas_ton == null) peringatan.push(pre + 'lumbung padi tanpa kapasitas_ton tidak ikut model alokasi.');
      if (r.jenis === 'baznas' && s.kebutuhan_ton == null) peringatan.push(pre + 'BAZNAS tanpa kebutuhan_ton tidak ikut model alokasi.');
      simpul.push(s);
    });
    return { simpul, galat, peringatan };
  };

  ZT.D = D;
})(window.ZT);
