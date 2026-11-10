/* ZakaTani — model alokasi DUA TAHAP (pemrograman linear).
 *
 * Tahap 1 — serap beras petani binaan sebanyak mungkin:
 *   X* = maks Σ_i Σ_j x_ij
 *        dengan Σ_j x_ij ≤ S_i  (kapasitas lumbung i),  Σ_i x_ij ≤ D_j  (kebutuhan BAZNAS j)
 * Tahap 2 — di antara pilihan itu, pilih ongkos total terkecil:
 *   min Σ_i Σ_j (c_ij + p_i)·x_ij + Σ_j (c_Bj + p_B)·b_j + Σ_j M·u_j
 *        dengan Σ_j x_ij ≤ S_i,  Σ_i x_ij + b_j + u_j ≥ D_j,  Σ_i Σ_j x_ij ≥ X*,  (opsional) Σ_j b_j ≤ K_B
 *
 *   c_ij = maks( jarak × faktor jalan × tarif , ongkos lokal minimum ) + penyeberangan × jumlah pindah pulau
 *   jarak = haversine(i,j), atau min_k [haversine(i,k) + haversine(k,j)] bila wajib lewat penggilingan k
 *   p_i  = harga beli beras lumbung;  p_B = harga beli beras Bulog
 *   c_Bj = ongkos dari gudang Bulog di provinsi BAZNAS j (aturan ongkos yang sama)
 *   u_j  = kebutuhan tak terpenuhi (penalti M; hanya muncul bila pasokan Bulog dibatasi)
 *
 * Dipecahkan di browser dengan javascript-lp-solver; urutan variabel tetap (urut id)
 * sehingga data yang sama selalu memberi hasil yang sama.
 */
(function (ZT) {
  'use strict';
  const M = {};
  const G = ZT.G;
  const PENALTI = 1e9; // ribu Rp per ton

  M.opsiAwal = () => {
    const P = ZT.D.param;
    return {
      tarif: P('tarif_per_tonkm'), faktorJalan: P('faktor_jalan'), ongkosLokal: P('ongkos_lokal_min_per_ton'),
      penyeberangan: P('biaya_penyeberangan_per_ton'), hargaLumbung: P('harga_beras_lumbung_per_ton'), hargaBulog: P('harga_beras_bulog_per_ton'),
      kapBulog: P('kapasitas_bulog_ton'), radius: P('radius_penggilingan_km'), jendela: P('jendela_simpan_bulan'),
      wajibGiling: false, calon: [], hujan: [], ramadan: null, deltaKebutuhan: 0
    };
  };

  M.penurunan = (s, hujan) => {
    let r = 0, tingkat = -1;
    for (const h of hujan) {
      const t = h.cakupan === 'semua' ? 0 : h.cakupan === 'prov:' + s.provinsi ? 1 : h.cakupan === 'lumbung:' + s.id ? 2 : -1;
      if (t > tingkat) { tingkat = t; r = h.persen / 100; }
    }
    return r;
  };

  M.panenSiap = (musim, bulanRamadan, jendela) => {
    if (!musim || !musim.length) return false;
    return musim.some((h) => { const selisih = (bulanRamadan - h + 12) % 12; return selisih >= 1 && selisih <= jendela; });
  };

  M.bulanRamadan = (kode) => { const r = ZT.RAMADAN.find((x) => x.kode === String(kode)); return r ? r.bulan : null; };

  M.pasokan = (data, o) => {
    const out = [], bulan = o.ramadan ? M.bulanRamadan(o.ramadan) : null;
    data.simpul.filter((s) => s.jenis === 'lumbung').sort((a, b) => a.id.localeCompare(b.id)).forEach((s) => {
      if (s.komoditas !== 'padi') { out.push({ s, S: 0, ikut: false, alasan: `komoditas ${s.komoditas || '–'} (bukan beras)` }); return; }
      if (s.kapasitas_ton == null) { out.push({ s, S: 0, ikut: false, alasan: 'kapasitas belum diisi' }); return; }
      const r = M.penurunan(s, o.hujan);
      let S = s.kapasitas_ton * (1 - r), alasan = r ? `hasil panen −${Math.round(r * 100)}%` : 'kapasitas penuh';
      if (bulan) {
        if (M.panenSiap(s.musim_panen, bulan, o.jendela)) alasan += '; panen selesai sebelum Ramadan';
        else if (s.stok_simpan_ton) { S = s.stok_simpan_ton; alasan = 'panen belum siap; memasok dari stok simpan'; }
        else { S = 0; alasan = 'panen belum siap & tanpa stok simpan'; }
      }
      out.push({ s, S: Math.max(0, +S.toFixed(3)), ikut: S > 0, alasan, r });
    });
    return out;
  };

  const pulau = (s) => ZT.PULAU[s.provinsi] || s.provinsi || '?';

  /** Rute i→j (opsional lewat penggilingan terdekat): km dan jumlah penyeberangan. */
  M.rute = (a, b, giling) => {
    const seg = (x, y) => ({ km: G.haversine(x, y), seb: pulau(x) === pulau(y) ? 0 : 1 });
    if (!giling || !giling.length) { const r = seg(a, b); return { km: r.km, seb: r.seb, via: null }; }
    let best = null;
    for (const k of giling) {
      const r1 = seg(a, k), r2 = seg(k, b);
      const r = { km: r1.km + r2.km, seb: r1.seb + r2.seb, via: k };
      if (!best || r.km < best.km) best = r;
    }
    return best;
  };

  /** Ongkos kirim per ton untuk satu rute. */
  M.ongkosKirim = (r, o) => Math.max(r.km * o.faktorJalan * o.tarif, o.ongkosLokal || 0) + r.seb * (o.penyeberangan || 0);

  function pecahkan(pemasok, penerima, gudang, o, fungsiRute) {
    const info = {}, kirim = {};
    pemasok.forEach((p) => penerima.forEach((q) => {
      const r = fungsiRute(p.s, q.s), ck = M.ongkosKirim(r, o);
      const nama = 'x|' + p.s.id + '|' + q.s.id;
      info[nama] = { dari: p.s, ke: q.s, km: r.km, via: r.via, seb: r.seb, kirimTon: ck, hargaTon: o.hargaLumbung };
      kirim[nama] = ck;
    }));
    const infoB = {};
    penerima.forEach((q) => {
      const g = gudang[q.s.provinsi] || null;
      const r = g ? M.rute(g, q.s, null) : { km: 0, seb: 0 };
      infoB[q.s.id] = { gudang: g, km: r.km, kirimTon: M.ongkosKirim(r, o) };
    });

    // ---- Tahap 1: maksimumkan beras lumbung terserap ----
    const m1 = { optimize: 'serap', opType: 'max', constraints: {}, variables: {} };
    pemasok.forEach((p) => { m1.constraints['S|' + p.s.id] = { max: p.S }; });
    penerima.forEach((q) => { m1.constraints['D|' + q.s.id] = { max: q.D }; });
    Object.keys(info).forEach((n) => { const f = info[n]; m1.variables[n] = { serap: 1, ['S|' + f.dari.id]: 1, ['D|' + f.ke.id]: 1 }; });
    const t0 = performance.now();
    const h1 = window.solver.Solve(m1);
    const Xmaks = h1.feasible ? Math.max(0, +h1.result || 0) : 0;

    // ---- Tahap 2: minimumkan ongkos total dengan serapan ≥ X* ----
    const m2 = { optimize: 'ongkos', opType: 'min', constraints: {}, variables: {} };
    pemasok.forEach((p) => { m2.constraints['S|' + p.s.id] = { max: p.S }; });
    penerima.forEach((q) => { m2.constraints['D|' + q.s.id] = { min: q.D }; });
    m2.constraints.SERAP = { min: Math.max(0, Xmaks - 1e-6) };
    if (o.kapBulog != null && o.kapBulog !== '' && !isNaN(o.kapBulog)) m2.constraints.KB = { max: +o.kapBulog };
    Object.keys(info).forEach((n) => {
      const f = info[n];
      m2.variables[n] = { ongkos: (f.kirimTon + f.hargaTon) / 1000, ['S|' + f.dari.id]: 1, ['D|' + f.ke.id]: 1, SERAP: 1 };
    });
    penerima.forEach((q) => {
      m2.variables['b|' + q.s.id] = { ongkos: (infoB[q.s.id].kirimTon + o.hargaBulog) / 1000, ['D|' + q.s.id]: 1, KB: 1 };
      m2.variables['u|' + q.s.id] = { ongkos: PENALTI, ['D|' + q.s.id]: 1 };
    });
    const h2 = window.solver.Solve(m2);
    const ms = performance.now() - t0;
    if (!h2.feasible) return { status: 'gagal', ms };

    const alokasi = [], bulog = [], kurang = [];
    let ongkosKirim = 0, ongkosHarga = 0, ongkosBulog = 0, tonL = 0, tonB = 0, tonU = 0;
    Object.keys(h2).forEach((k) => {
      const v = +h2[k];
      if (!/^[xbu]\|/.test(k) || !(v > 1e-6)) return;
      const ton = Math.round(v * 1000) / 1000;
      if (k[0] === 'x') {
        const f = info[k], ok = ton * f.kirimTon, oh = ton * f.hargaTon;
        alokasi.push({ dari: f.dari, ke: f.ke, ton, km: f.km, via: f.via, seb: f.seb, ongkosKirim: ok, ongkosHarga: oh, ongkos: ok + oh });
        ongkosKirim += ok; ongkosHarga += oh; tonL += ton;
      } else if (k[0] === 'b') {
        const id = k.slice(2), ke = penerima.find((q) => q.s.id === id).s, ib = infoB[id];
        const ok = ton * ib.kirimTon, oh = ton * o.hargaBulog;
        bulog.push({ ke, ton, gudang: ib.gudang, km: ib.km, ongkosKirim: ok, ongkosHarga: oh, ongkos: ok + oh });
        ongkosBulog += ok + oh; tonB += ton;
      } else {
        kurang.push({ ke: penerima.find((q) => q.s.id === k.slice(2)).s, ton }); tonU += ton;
      }
    });
    alokasi.sort((a, b) => b.ton - a.ton || a.dari.id.localeCompare(b.dari.id));
    bulog.sort((a, b) => b.ton - a.ton);
    const kirimBulog = bulog.reduce((t, b) => t + b.ongkosKirim, 0);
    return {
      status: 'optimal', alokasi, bulog, kurang, Xmaks,
      ongkosKirim, ongkosHarga, ongkosBulog, kirimTotal: ongkosKirim + kirimBulog,
      totalAngkut: ongkosKirim + ongkosHarga, totalBulog: ongkosBulog, total: ongkosKirim + ongkosHarga + ongkosBulog,
      tonLumbung: tonL, tonBulog: tonB, tonKurang: tonU, ms
    };
  }

  M.jalankan = (data, o) => {
    const pas = M.pasokan(data, o);
    const pemasok = pas.filter((p) => p.ikut);
    const penerima = data.simpul.filter((s) => s.jenis === 'baznas' && s.kebutuhan_ton != null)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((s) => ({ s, D: Math.max(0, +(s.kebutuhan_ton * (1 + o.deltaKebutuhan / 100)).toFixed(3)) }));
    const gudang = {};
    data.simpul.filter((s) => s.jenis === 'bulog').forEach((g) => { gudang[g.provinsi] = g; });
    const giling = o.wajibGiling ? data.simpul.filter((s) => s.jenis === 'penggilingan').concat(o.calon || []) : null;

    const optimal = pecahkan(pemasok, penerima, gudang, o, (a, b) => M.rute(a, b, giling));

    // Skema terpusat: semua beras lumbung lewat BAZNAS RI dulu, lalu diteruskan.
    const ri = data.simpul.find((s) => s.jenis === 'baznas' && s.tingkat_baznas === 'ri');
    let pembanding = null;
    if (ri) {
      pembanding = pecahkan(pemasok, penerima, gudang, o, (a, b) => {
        const ke = M.rute(a, ri, giling);
        if (b.id === ri.id) return ke;
        const lanjut = M.rute(ri, b, null);
        return { km: ke.km + lanjut.km, seb: ke.seb + lanjut.seb, via: ke.via };
      });
    }
    const totalKebutuhan = penerima.reduce((t, q) => t + q.D, 0);
    const pasokanTersedia = pemasok.reduce((t, p) => t + p.S, 0);
    const kapasitasPadi = pas.filter((p) => p.s.komoditas === 'padi' && p.s.kapasitas_ton != null);
    return {
      ...optimal, pembanding, pasokan: pas, penerima, totalKebutuhan, pasokanTersedia,
      jumlahLumbungPadi: kapasitasPadi.length, kapasitasTotal: kapasitasPadi.reduce((t, p) => t + p.s.kapasitas_ton, 0),
      opsi: JSON.parse(JSON.stringify({ ...o, calon: (o.calon || []).map((c) => ({ id: c.id, nama: c.nama, lat: c.lat, lon: c.lon })) }))
    };
  };

  M.tanpaPenggilingan = (lumbung, giling, R) => lumbung.filter((l) => !giling.some((g) => G.haversine(l, g) <= R));

  ZT.M = M;
})(window.ZT);
