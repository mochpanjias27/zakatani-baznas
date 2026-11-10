/* ZakaTani — Kalkulator Zakat Panen (No. 15).
 * Semua perhitungan di perangkat pengguna; tidak ada data yang dikirim.
 *   Nisab: 653 kg gabah per panen (PMA No. 52 Tahun 2014, Pasal 14 ayat 1); 520 kg beras (Puskas BAZNAS).
 *   Jagung & hortikultura: nisab setara 653 kg (asumsi kalkulator).
 *   Kadar: 5% irigasi berbiaya · 10% tadah hujan/sungai · 7,5% campuran. Dikeluarkan setiap kali panen.
 */
(function (ZT) {
  'use strict';
  const U = ZT.U;
  const KOMODITAS = {
    padi: { label: 'Padi (gabah)', satuan: [['kg GKP', 'kg GKP'], ['kg GKG', 'kg GKG'], ['ton', 'ton gabah']], harga: 6500, benda: 'gabah' },
    beras: { label: 'Beras', satuan: [['kg beras', 'kg beras'], ['ton', 'ton beras']], harga: 13000, benda: 'beras' },
    jagung: { label: 'Jagung', satuan: [['kg', 'kg jagung'], ['ton', 'ton jagung']], harga: 5000, benda: 'jagung' },
    hortikultura: { label: 'Hortikultura', satuan: [['kg', 'kg hasil'], ['ton', 'ton hasil']], harga: null, benda: 'hasil panen' }
  };
  const KADAR = [['0.05', 'Irigasi berbiaya (pompa, sewa air)', '5%'], ['0.10', 'Tadah hujan atau sungai tanpa biaya', '10%'], ['0.075', 'Campuran', '7,5%']];
  const K = { komoditas: 'padi', jumlah: '4700', satuan: 'kg GKP', kadar: '0.05', harga: '6500', kurangi: false, biaya: '', lumbung: null };

  K.nisab = (komoditas, satuan) => (komoditas === 'beras' || satuan === 'kg beras' ? 520 : 653);

  /** Hitung zakat; kembali {galat} atau {wajib, kg, nisab, zakatKg, rupiah, ...}. */
  K.hitung = (st) => {
    const v = Number(String(st.jumlah).replace(/\./g, '').replace(',', '.'));
    if (st.jumlah === '' || isNaN(v) || v < 0) return { galat: 'Isi hasil panen dalam angka.' };
    const kg = st.satuan === 'ton' ? v * 1000 : v;
    const nisab = K.nisab(st.komoditas, st.satuan);
    const harga = st.harga === '' ? null : Number(String(st.harga).replace(/\./g, ''));
    if (harga != null && (isNaN(harga) || harga < 0)) return { galat: 'Isi harga jual dalam angka.', bidang: 'harga' };
    const kadar = +st.kadar;
    let bersih = kg, potong = 0;
    if (st.kurangi && st.biaya !== '') {
      const b = Number(String(st.biaya).replace(/\./g, ''));
      if (isNaN(b) || b < 0) return { galat: 'Isi biaya produksi dalam angka.', bidang: 'biaya' };
      if (!harga) return { galat: 'Isi harga jual agar biaya produksi bisa dikurangkan.', bidang: 'harga' };
      potong = b / harga; bersih = Math.max(0, kg - potong);
    }
    const wajib = kg >= nisab;
    const zakatKg = wajib ? bersih * kadar : 0;
    return { kg, nisab, wajib, kadar, bersih, potong, zakatKg, harga, rupiah: harga ? zakatKg * harga : null, kurang: Math.max(0, nisab - kg) };
  };

  const rpJt = (v) => (v >= 1e6 ? 'Rp' + (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' jt' : U.rupiah(v));

  function formulir() {
    const kom = KOMODITAS[K.komoditas];
    return `<div class="kotak">
      <div class="isian"><span class="judul-isian">1. Komoditas</span><div class="pilihan-chip" role="group" aria-label="Komoditas">
        ${Object.entries(KOMODITAS).map(([k, x]) => `<button type="button" data-kom="${k}" aria-pressed="${K.komoditas === k}">${x.label}</button>`).join('')}</div></div>
      <div class="isian"><label for="k-jumlah">2. Hasil panen</label><div class="baris-angka">
        <input id="k-jumlah" inputmode="decimal" value="${U.esc(K.jumlah)}" aria-describedby="k-galat-jumlah">
        <select id="k-satuan" aria-label="Satuan">${kom.satuan.map(([v, t]) => `<option value="${v}" ${K.satuan === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="pesan-galat" id="k-galat-jumlah" role="alert"></div></div>
      <div class="isian"><span class="judul-isian">3. Cara pengairan</span><div class="radio-baris">
        ${KADAR.map(([v, t, p]) => `<label><input type="radio" name="k-kadar" value="${v}" ${K.kadar === v ? 'checked' : ''}> ${t} · <b>${p}</b></label>`).join('')}</div></div>
      <div class="isian"><label for="k-harga">4. Harga jual per kg (opsional)</label><div class="baris-angka"><span style="align-self:center;font-weight:800">Rp</span><input id="k-harga" inputmode="numeric" value="${U.esc(K.harga)}" placeholder="mis. 6500"></div>
        <div class="pesan-galat" id="k-galat-harga" role="alert"></div></div>
      <label class="label-cek"><input type="checkbox" id="k-kurangi" ${K.kurangi ? 'checked' : ''}> Kurangi biaya produksi <span class="catatan">(ulama berbeda pendapat; bawaan: tidak)</span></label>
      <div class="isian ${K.kurangi ? '' : 'tersembunyi'}" id="k-isian-biaya"><label for="k-biaya">Biaya produksi panen ini (Rp)</label><div class="baris-angka"><input id="k-biaya" inputmode="numeric" value="${U.esc(K.biaya)}" placeholder="mis. 3000000"></div>
        <div class="pesan-galat" id="k-galat-biaya" role="alert"></div></div>
    </div>`;
  }

  function hasil() {
    const r = K.hitung(K), box = U.$('#k-hasil');
    ['jumlah', 'harga', 'biaya'].forEach((b) => { const el = U.$('#k-galat-' + b); if (el) el.textContent = ''; });
    if (r.galat) {
      const el = U.$('#k-galat-' + (r.bidang || 'jumlah')); if (el) el.textContent = r.galat;
      box.innerHTML = '<div class="kotak"><p class="catatan" style="margin:0">Lengkapi isian untuk melihat hasil.</p></div>'; return;
    }
    const kom = KOMODITAS[K.komoditas], benda = K.satuan === 'kg beras' || K.komoditas === 'beras' ? 'beras' : kom.benda;
    const satuanTeks = (kom.satuan.find(([v]) => v === K.satuan) || [K.satuan, K.satuan])[1];
    const lumbung = K.lumbung ? ZT.D.byId(K.lumbung) : null;
    const persen = (r.kadar * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 });
    const status = r.wajib
      ? `<div class="status-zakat wajib"><b>Sudah wajib zakat</b>Hasil panen ${U.angka(r.kg, 0)} kg melewati nisab ${U.angka(r.nisab, 0)} kg ${benda === 'beras' ? 'beras' : 'gabah'}.</div>`
      : `<div class="status-zakat belum"><b>Belum wajib zakat pertanian</b>Hasil panen ${U.angka(r.kg, 0)} kg, kurang ${U.angka(r.kurang, 0)} kg dari nisab ${U.angka(r.nisab, 0)} kg. Anda tetap dapat berinfak secara sukarela.</div>`;
    box.innerHTML = `<div class="kotak hasil-zakat">${status}
      ${r.wajib ? `<div class="dua-angka"><div><span>Zakat (${persen}%)</span><b>${U.angka(r.zakatKg, r.zakatKg < 100 ? 1 : 0)} kg</b><small>${U.esc(benda)}${r.potong ? ` · setelah biaya ≈ ${U.angka(r.potong, 0)} kg` : ''}</small></div>
        <div><span>Setara</span><b>${r.rupiah != null ? rpJt(r.rupiah) : '–'}</b><small>${r.harga ? `harga ${U.rupiah(r.harga)}/kg` : 'isi harga jual untuk melihat nilai rupiah'}</small></div></div>` : ''}
      <p style="font-size:14.5px;font-weight:600">Zakat pertanian dikeluarkan setiap kali panen.</p>
      <button class="btn btn-garis btn-kecil" id="k-cari">Cari BAZNAS terdekat di peta ↗</button>
      <p class="catatan" style="margin-top:14px">Hasil ini perkiraan. Untuk kepastian, konsultasikan dengan amil BAZNAS setempat.${K.komoditas === 'jagung' || K.komoditas === 'hortikultura' ? ' Untuk jagung dan hortikultura, kalkulator memakai nisab setara 653 kg.' : ''}</p>
      ${lumbung ? `<p class="catatan" style="margin:0">Diisi dari kartu Profil Lumbung: <b>${U.esc(lumbung.nama)}</b> · ${U.angka(lumbung.panen_ton, 1)} ton (data ilustrasi).</p>` : `<p class="catatan" style="margin:0">Dari kartu Profil Lumbung, hasil panen lumbung terisi otomatis.</p>`}
      <p class="catatan" style="margin:6px 0 0">Satuan: ${U.esc(satuanTeks)}.</p></div>`;
    U.$('#k-cari').addEventListener('click', cariBaznas);
  }

  function cariBaznas() {
    const bz = ZT.D.jenis('baznas');
    const ke = (titik) => { const t = ZT.G.terdekat({ id: '_', lat: titik.lat, lon: titik.lon }, bz); if (t) ZT.Peta.fokus(t.simpul.id); };
    const lumbung = K.lumbung ? ZT.D.byId(K.lumbung) : null;
    if (lumbung) { ke(lumbung); return; }
    if (!navigator.geolocation) { U.toast('Lokasi perangkat tidak tersedia. Pilih kantor BAZNAS di peta.'); location.hash = 'peta'; return; }
    U.toast('Mencari lokasi Anda…');
    navigator.geolocation.getCurrentPosition((p) => ke({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => { U.toast('Izin lokasi tidak diberikan. Pilih kantor BAZNAS di peta.'); location.hash = 'peta'; }, { timeout: 8000, maximumAge: 600000 });
  }

  K.render = () => {
    U.$('#isi-kalkulator').innerHTML = `<div class="tata-kalk"><div>${formulir()}</div><div id="k-hasil" aria-live="polite"></div></div>`;
    U.$$('[data-kom]').forEach((b) => b.addEventListener('click', () => {
      K.komoditas = b.dataset.kom; const kom = KOMODITAS[K.komoditas];
      K.satuan = kom.satuan[0][0]; K.harga = kom.harga == null ? '' : String(kom.harga); K.lumbung = null; K.render();
    }));
    const ikat = (id, kunci, ev = 'input') => U.$(id).addEventListener(ev, (e) => { K[kunci] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; hasil(); });
    ikat('#k-jumlah', 'jumlah'); ikat('#k-satuan', 'satuan', 'change'); ikat('#k-harga', 'harga'); ikat('#k-biaya', 'biaya');
    U.$('#k-jumlah').addEventListener('input', () => { K.lumbung = null; });
    U.$('#k-kurangi').addEventListener('change', (e) => { K.kurangi = e.target.checked; U.$('#k-isian-biaya').classList.toggle('tersembunyi', !K.kurangi); hasil(); });
    U.$$('input[name="k-kadar"]').forEach((r) => r.addEventListener('change', () => { K.kadar = r.value; hasil(); }));
    hasil();
  };

  /** Dipanggil dari kartu Profil Lumbung: isi komoditas & hasil panen lumbung itu. */
  K.dariLumbung = (id) => {
    const s = ZT.D.byId(id); if (!s) return;
    K.komoditas = KOMODITAS[s.komoditas] ? s.komoditas : 'padi';
    const kom = KOMODITAS[K.komoditas];
    K.satuan = 'ton'; K.jumlah = s.panen_ton != null ? String(s.panen_ton).replace('.', ',') : ''; K.harga = kom.harga == null ? '' : String(kom.harga); K.lumbung = id;
    if (location.hash === '#kalkulator') K.render(); else location.hash = 'kalkulator';
  };

  ZT.Kalk = K;
})(window.ZT);
