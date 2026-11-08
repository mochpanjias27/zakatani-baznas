/* ZakaTani — model optimasi alokasi (model transportasi, pemrograman linear).
 *
 *   Minimumkan   Σ_i Σ_j c_ij·x_ij  +  Σ_j c_B·b_j  +  Σ_j M·u_j
 *   dengan       Σ_j x_ij ≤ S_i                (kapasitas pasok lumbung i)
 *                Σ_i x_ij + b_j + u_j ≥ D_j    (kebutuhan beras zakat fitrah BAZNAS j)
 *                Σ_j b_j ≤ K_B                 (opsional: batas pasokan Bulog)
 *                x, b, u ≥ 0
 *   c_ij = jarak_ij × faktor jalan × tarif per ton-km
 *   jarak_ij = haversine(i,j), atau min_k [haversine(i,k) + haversine(k,j)] bila beras
 *              wajib lewat penggilingan k (penggilingan terdaftar + calon).
 *   b_j = pasokan Perum Bulog (pemasok cadangan, ongkos c_B per ton).
 *   u_j = kebutuhan tak terpenuhi (penalti M sangat besar; hanya muncul bila Bulog dibatasi).
 *
 * Dipecahkan di browser dengan javascript-lp-solver (simpleks). Urutan variabel
 * dibuat tetap (urut id) sehingga hasil sama bila dijalankan ulang dengan data sama.
 */
(function (ZT) {
  'use strict';
  const M = {};
  const G = ZT.G;
  const PENALTI = 1e9; // ribu Rp per ton (= Rp 1 triliun/ton) untuk kebutuhan tak terpenuhi

  /** Opsi bawaan dari parameter data. */
  M.opsiAwal = () => {
    const P = ZT.D.param;
    return {
      tarif: P('tarif_per_tonkm'), faktorJalan: P('faktor_jalan'), ongkosBulog: P('ongkos_bulog_per_ton'),
      kapBulog: P('kapasitas_bulog_ton'), radius: P('radius_penggilingan_km'), jendela: P('jendela_simpan_bulan'),
      wajibGiling: false, calon: [], hujan: [], ramadan: null, deltaKebutuhan: 0
    };
  };

  /** Penurunan hasil panen untuk satu lumbung: aturan lumbung > provinsi > semua. */
  M.penurunan = (s, hujan) => {
    let r = 0, tingkat = -1;
    for (const h of hujan) {
      const t = h.cakupan === 'semua' ? 0 : h.cakupan === 'prov:' + s.provinsi ? 1 : h.cakupan === 'lumbung:' + s.id ? 2 : -1;
      if (t > tingkat) { tingkat = t; r = h.persen / 100; }
    }
    return r;
  };

  /** Apakah panen tersedia sebelum bulan Ramadan (dalam batas lama simpan)? */
  M.panenSiap = (musim, ramadan, jendela) => {
    if (!musim || !musim.length) return false;
    return musim.some((h) => { const selisih = (ramadan - h + 12) % 12; return selisih >= 1 && selisih <= jendela; });
  };

  /** Hitung pasokan efektif tiap lumbung padi berdasarkan skenario. */
  M.pasokan = (data, o) => {
    const out = [];
    data.simpul.filter((s) => s.jenis === 'lumbung').sort((a, b) => a.id.localeCompare(b.id)).forEach((s) => {
      if (s.komoditas !== 'padi') { out.push({ s, S: 0, ikut: false, alasan: s.komoditas ? `komoditas ${s.komoditas} (bukan beras)` : 'komoditas belum ada data' }); return; }
      if (s.kapasitas_ton == null) { out.push({ s, S: 0, ikut: false, alasan: 'kapasitas belum ada data' }); return; }
      const r = M.penurunan(s, o.hujan);
      let S = s.kapasitas_ton * (1 - r), alasan = r ? `hasil panen −${Math.round(r * 100)}%` : 'kapasitas penuh';
      if (o.ramadan) {
        if (M.panenSiap(s.musim_panen, o.ramadan, o.jendela)) alasan += '; panen selesai sebelum Ramadan';
        else if (s.stok_simpan_ton) { S = s.stok_simpan_ton; alasan = 'panen belum siap; memasok dari stok simpan'; }
        else { S = 0; alasan = 'panen belum siap & tanpa stok simpan'; }
      }
      out.push({ s, S: Math.max(0, +S.toFixed(3)), ikut: S > 0, alasan, r });
    });
    return out;
  };

  /** Jarak tempuh (km garis lurus) lumbung→BAZNAS, opsional lewat penggilingan terdekat. */
  M.jarak = (a, b, giling) => {
    if (!giling || !giling.length) return { km: G.haversine(a, b), via: null };
    let best = null;
    for (const k of giling) {
      const km = G.haversine(a, k) + G.haversine(k, b);
      if (!best || km < best.km) best = { km, via: k };
    }
    return best;
  };

  /** Pecahkan satu model transportasi. fungsiJarak(i,j) → {km, via}. */
  function pecahkan(pemasok, penerima, o, fungsiJarak) {
    const model = { optimize: 'ongkos', opType: 'min', constraints: {}, variables: {} };
    const jalanTarif = o.faktorJalan * o.tarif; // Rp per km garis lurus per ton
    const info = {};
    pemasok.forEach((p) => { model.constraints['S|' + p.s.id] = { max: p.S }; });
    penerima.forEach((q) => { model.constraints['D|' + q.s.id] = { min: q.D }; });
    if (o.kapBulog != null && o.kapBulog !== '' && !isNaN(o.kapBulog)) model.constraints.KB = { max: +o.kapBulog };
    pemasok.forEach((p) => penerima.forEach((q) => {
      const j = fungsiJarak(p.s, q.s);
      const c = (j.km * jalanTarif) / 1000; // ribu Rp per ton
      const nama = 'x|' + p.s.id + '|' + q.s.id;
      model.variables[nama] = { ongkos: c, ['S|' + p.s.id]: 1, ['D|' + q.s.id]: 1 };
      info[nama] = { dari: p.s, ke: q.s, km: j.km, via: j.via, cTon: c * 1000 };
    }));
    penerima.forEach((q) => {
      model.variables['b|' + q.s.id] = { ongkos: o.ongkosBulog / 1000, ['D|' + q.s.id]: 1, KB: 1 };
      model.variables['u|' + q.s.id] = { ongkos: PENALTI, ['D|' + q.s.id]: 1 };
    });
    const t0 = performance.now();
    const hasil = window.solver.Solve(model);
    const ms = performance.now() - t0;
    if (!hasil.feasible) return { status: 'gagal', ms };
    const alokasi = [], bulog = [], kurang = [];
    let totalAngkut = 0, totalBulog = 0, tonL = 0, tonB = 0, tonU = 0;
    Object.keys(hasil).forEach((k) => {
      const v = +hasil[k];
      if (!/^[xbu]\|/.test(k) || !(v > 1e-6)) return;
      const ton = Math.round(v * 1000) / 1000;
      if (k[0] === 'x') {
        const f = info[k], ongkos = ton * f.cTon;
        alokasi.push({ dari: f.dari, ke: f.ke, ton, km: f.km, via: f.via, ongkos });
        totalAngkut += ongkos; tonL += ton;
      } else if (k[0] === 'b') {
        const ke = penerima.find((q) => q.s.id === k.slice(2)).s, ongkos = ton * o.ongkosBulog;
        bulog.push({ ke, ton, ongkos }); totalBulog += ongkos; tonB += ton;
      } else {
        kurang.push({ ke: penerima.find((q) => q.s.id === k.slice(2)).s, ton }); tonU += ton;
      }
    });
    alokasi.sort((a, b) => b.ton - a.ton || a.dari.id.localeCompare(b.dari.id));
    bulog.sort((a, b) => b.ton - a.ton);
    return { status: 'optimal', alokasi, bulog, kurang, totalAngkut, totalBulog, total: totalAngkut + totalBulog, tonLumbung: tonL, tonBulog: tonB, tonKurang: tonU, ms };
  }

  /** Jalankan skenario lengkap: alokasi optimal + pembanding pola saat ini (semua lewat BAZNAS RI). */
  M.jalankan = (data, o) => {
    const pas = M.pasokan(data, o);
    const pemasok = pas.filter((p) => p.ikut);
    const penerima = data.simpul.filter((s) => s.jenis === 'baznas' && s.kebutuhan_ton != null)
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((s) => ({ s, D: Math.max(0, +(s.kebutuhan_ton * (1 + o.deltaKebutuhan / 100)).toFixed(3)) }));
    const giling = o.wajibGiling ? data.simpul.filter((s) => s.jenis === 'penggilingan').concat(o.calon || []) : null;

    const optimal = pecahkan(pemasok, penerima, o, (a, b) => M.jarak(a, b, giling));

    // Pembanding: seluruh beras lumbung dikirim ke BAZNAS RI lebih dulu, lalu diteruskan ke BAZNAS j.
    const ri = data.simpul.find((s) => s.jenis === 'baznas' && s.tingkat_baznas === 'ri');
    let pembanding = null;
    if (ri) {
      pembanding = pecahkan(pemasok, penerima, o, (a, b) => {
        const ke = M.jarak(a, ri, giling);
        return { km: ke.km + (b.id === ri.id ? 0 : G.haversine(ri, b)), via: ke.via };
      });
    }
    const totalKebutuhan = penerima.reduce((t, q) => t + q.D, 0);
    const pasokanTersedia = pemasok.reduce((t, p) => t + p.S, 0);
    return { ...optimal, pembanding, pasokan: pas, penerima, totalKebutuhan, pasokanTersedia, opsi: JSON.parse(JSON.stringify({ ...o, calon: (o.calon || []).map((c) => ({ id: c.id, nama: c.nama, lat: c.lat, lon: c.lon })) })) };
  };

  /** Jumlah lumbung yang tidak punya penggilingan terdaftar dalam radius R km. */
  M.tanpaPenggilingan = (lumbung, giling, R) => lumbung.filter((l) => !giling.some((g) => G.haversine(l, g) <= R));

  ZT.M = M;
})(window.ZT);
