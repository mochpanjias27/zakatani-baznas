/* ZakaTani — halaman Simulasi Alokasi: parameter, skenario risiko, hasil, perbandingan. */
(function (ZT) {
  'use strict';
  const S = { siap: false, map: null, opsi: null, hasil: null, tersimpan: [], modeCalon: false, nomorCalon: 0 };
  const U = ZT.U, W = ZT.CONFIG.warna;

  /* ---------------------------------------------------------- formulir */
  function isiFormulir() {
    const o = S.opsi;
    U.$('#p-tarif').value = o.tarif; U.$('#p-jalan').value = o.faktorJalan; U.$('#p-lokal').value = o.ongkosLokal; U.$('#p-seberang').value = o.penyeberangan;
    U.$('#p-hlumbung').value = o.hargaLumbung; U.$('#p-hbulog').value = o.hargaBulog;
    U.$('#p-bulogcap').value = o.kapBulog == null ? '' : o.kapBulog; U.$('#p-radius').value = o.radius; U.$('#p-jendela').value = o.jendela;
    U.$('#p-wajibgiling').checked = o.wajibGiling; U.$('#s-kebutuhan').value = o.deltaKebutuhan; U.$('#o-kebutuhan').textContent = (o.deltaKebutuhan > 0 ? '+' : '') + o.deltaKebutuhan + '%';
    U.$('#s-ramadan').value = o.ramadan || '';
    const tgt = U.$('#s-hujan-target');
    tgt.innerHTML = '<option value="semua">Semua lumbung</option>'
      + '<optgroup label="Per provinsi">' + ZT.D.provinsi().map((p) => `<option value="prov:${U.esc(p)}">${U.esc(p)}</option>`).join('') + '</optgroup>'
      + '<optgroup label="Per lumbung (padi)">' + ZT.D.jenis('lumbung').filter((l) => l.komoditas === 'padi').map((l) => `<option value="lumbung:${l.id}">${U.esc(l.nama.replace('Lumbung Pangan ', ''))}</option>`).join('') + '</optgroup>';
    daftarHujan(); daftarCalon();
  }

  function bacaFormulir() {
    const o = S.opsi, n = (id) => { const v = U.$(id).value; return v === '' ? null : +v; };
    o.tarif = n('#p-tarif') || 0; o.faktorJalan = n('#p-jalan') || 1; o.ongkosLokal = n('#p-lokal') || 0; o.penyeberangan = n('#p-seberang') || 0;
    o.hargaLumbung = n('#p-hlumbung') || 0; o.hargaBulog = n('#p-hbulog') || 0; o.kapBulog = n('#p-bulogcap');
    o.radius = n('#p-radius') || 100; o.jendela = Math.min(11, Math.max(1, n('#p-jendela') || 6)); o.wajibGiling = U.$('#p-wajibgiling').checked;
    o.ramadan = U.$('#s-ramadan').value || null; o.deltaKebutuhan = n('#s-kebutuhan') || 0;
  }

  function daftarHujan() {
    U.$('#daftar-hujan').innerHTML = S.opsi.hujan.length ? S.opsi.hujan.map((h, i) => `<span class="chip-skenario">${U.esc(namaCakupan(h.cakupan))} −${h.persen}%<button aria-label="Hapus" data-hapus-hujan="${i}">×</button></span>`).join('') : '<span class="catatan">Belum ada penurunan hasil panen.</span>';
    U.$$('[data-hapus-hujan]').forEach((b) => b.addEventListener('click', () => { S.opsi.hujan.splice(+b.dataset.hapusHujan, 1); daftarHujan(); jalankanOtomatis(); }));
  }
  const namaCakupan = (c) => c === 'semua' ? 'Semua lumbung' : c.startsWith('prov:') ? c.slice(5) : (ZT.D.byId(c.slice(8)) || { nama: c }).nama.replace('Lumbung Pangan ', '');

  function daftarCalon() {
    const el = U.$('#daftar-calon');
    el.innerHTML = S.opsi.calon.map((c, i) => `<span class="chip-skenario">${U.esc(c.nama)} <small>(${c.lat.toFixed(2)}, ${c.lon.toFixed(2)})</small><button aria-label="Hapus calon" data-hapus-calon="${i}">×</button></span>`).join('');
    U.$$('[data-hapus-calon]').forEach((b) => b.addEventListener('click', () => { S.opsi.calon.splice(+b.dataset.hapusCalon, 1); daftarCalon(); gambarCalon(); jalankanOtomatis(); }));
  }

  function keterangan(o) {
    const k = [];
    if (o.hujan.length) k.push('Hujan: ' + o.hujan.map((h) => namaCakupan(h.cakupan) + ' −' + h.persen + '%').join(', '));
    if (o.ramadan) k.push('Ramadan ' + o.ramadan + ' H (simpan ' + o.jendela + ' bln)');
    if (o.deltaKebutuhan) k.push('Kebutuhan ' + (o.deltaKebutuhan > 0 ? '+' : '') + o.deltaKebutuhan + '%');
    if (o.wajibGiling) k.push('Wajib lewat penggilingan');
    if (o.calon.length) k.push(o.calon.length + ' calon penggilingan');
    if (o.kapBulog != null) k.push('Bulog maks ' + o.kapBulog + ' t');
    return k.length ? k.join(' · ') : 'Kondisi dasar (tanpa risiko)';
  }

  /* ------------------------------------------------------------- peta */
  function gambarSimpul() {
    S.lapSimpul.clearLayers();
    const semua = ZT.D.simpul().filter((s) => s.jenis !== 'lumbung' || s.komoditas === 'padi');
    const geser = ZT.Peta.hitungGeser(semua);
    semua.forEach((s) => {
      const m = L.marker([s.lat, s.lon], { icon: ZT.Peta.ikonLeaflet(s, geser[s.id]), title: s.nama, keyboard: true, zIndexOffset: s.jenis === 'lumbung' ? 400 : 0 });
      let tip = `<b>${U.esc(s.nama)}</b>`;
      if (s.jenis === 'lumbung' && S.hasil) { const p = S.hasil.pasokan.find((x) => x.s.id === s.id); if (p) tip += `<br>Pasokan: ${U.angka(p.S, 1)} t — ${U.esc(p.alasan)}`; }
      if (s.jenis === 'baznas' && s.kebutuhan_ton != null) tip += `<br>Kebutuhan: ${U.angka(s.kebutuhan_ton * (1 + S.opsi.deltaKebutuhan / 100), 1)} t`;
      m.bindTooltip(tip, { className: 'zt-tip', direction: 'top', offset: [0, -12] });
      S.lapSimpul.addLayer(m);
    });
  }

  function gambarHasil() {
    S.lapHasil.clearLayers();
    const h = S.hasil; if (!h || h.status !== 'optimal') return;
    const maks = Math.max(1, ...h.alokasi.map((a) => a.ton));
    h.alokasi.forEach((a) => {
      const tebal = 2 + 10 * Math.sqrt(a.ton / maks);
      const titik = a.via ? [[a.dari.lat, a.dari.lon], [a.via.lat, a.via.lon], [a.ke.lat, a.ke.lon]] : [[a.dari.lat, a.dari.lon], [a.ke.lat, a.ke.lon]];
      let pts = [];
      for (let i = 0; i < titik.length - 1; i++) pts = pts.concat(ZT.G.lengkung(titik[i], titik[i + 1], 0.12, 20));
      const g = L.polyline(pts, { color: W.hijauTua, weight: tebal, opacity: 0.8, lineCap: 'round' });
      g.bindTooltip(`<b>${U.esc(a.dari.nama)} → ${U.esc(a.ke.nama)}</b><br>${U.angka(a.ton, 1)} ton · ${U.angka(a.km, 0)} km${a.via ? ' lewat ' + U.esc(a.via.nama) : ''}<br>Ongkos kirim ${U.rupiah(a.ongkosKirim)}`, { className: 'zt-tip', sticky: true });
      S.lapHasil.addLayer(g);
      S.lapHasil.addLayer(ZT.Peta.panahUjung(pts, W.hijauTua, 0.9));
    });
    const maksB = Math.max(1, ...h.bulog.map((b) => b.ton));
    h.bulog.forEach((b) => {
      const c = L.circleMarker([b.ke.lat, b.ke.lon], { radius: 8 + 22 * Math.sqrt(b.ton / maksB), color: W.bulog, weight: 1.6, dashArray: '4 4', fillColor: W.bulog, fillOpacity: 0.12 });
      c.bindTooltip(`<b>Bulog → ${U.esc(b.ke.nama)}</b><br>${U.angka(b.ton, 1)} ton dari ${U.esc(b.gudang ? b.gudang.nama : 'gudang Bulog')}`, { className: 'zt-tip' });
      S.lapHasil.addLayer(c);
    });
    h.kurang.forEach((k) => {
      S.lapHasil.addLayer(L.circleMarker([k.ke.lat, k.ke.lon], { radius: 14, color: '#A4361F', weight: 2.5, fill: false }).bindTooltip(`<b>${U.esc(k.ke.nama)}</b><br>Kurang ${U.angka(k.ton, 1)} ton`, { className: 'zt-tip' }));
    });
  }

  function gambarCalon() {
    S.lapCalon.clearLayers();
    S.opsi.calon.forEach((c) => {
      const m = L.marker([c.lat, c.lon], { icon: ZT.Peta.ikonLeaflet(c), draggable: true, title: c.nama, zIndexOffset: 800 });
      m.bindTooltip(`<b>${U.esc(c.nama)}</b><br>Seret untuk memindahkan`, { className: 'zt-tip' });
      m.on('dragend', () => { const p = m.getLatLng(); c.lat = p.lat; c.lon = p.lng; daftarCalon(); jalankanOtomatis(); });
      S.lapCalon.addLayer(m);
    });
  }

  /* ------------------------------------------------------------ hitung */
  function jalankan() {
    bacaFormulir();
    try { S.hasil = ZT.M.jalankan(ZT.state.data, S.opsi); }
    catch (e) { console.error(e); S.hasil = { status: 'gagal', galat: e.message }; }
    gambarSimpul(); gambarHasil(); tampilHasil();
  }
  const jalankanOtomatis = U.debounce(jalankan, 280);

  function tampilHasil() {
    const box = U.$('#hasil-simulasi'), h = S.hasil;
    if (!h || h.status !== 'optimal') { box.innerHTML = `<div class="kotak-peringatan">Model tidak menemukan solusi. ${U.esc(h && h.galat || '')}</div>`; return; }
    const K = h.totalKebutuhan || 1e-9;
    const hemat = h.pembanding ? h.pembanding.total - h.total : null;
    box.innerHTML = `
      <div class="judul-seksi" style="margin-bottom:22px"><span class="eyebrow">Hasil alokasi</span><h2 style="font-size:28px">${U.esc(keterangan(S.opsi))}</h2>
        <p style="font-size:14.5px">Kapasitas ${h.jumlahLumbungPadi} lumbung padi ${U.angka(h.kapasitasTotal, 1)} ton${h.pasokanTersedia < h.kapasitasTotal - 1e-6 ? ` (tersedia dalam skenario ini ${U.angka(h.pasokanTersedia, 1)} ton)` : ''}; terkirim ${U.angka(h.tonLumbung, 1)} ton ke ${h.penerima.length} kantor BAZNAS dengan kebutuhan ${U.angka(K, 1)} ton. Dipecahkan dalam ${U.angka(h.ms, 0)} ms.</p></div>
      <div class="grid-ringkas empat" style="margin-bottom:22px">
        ${U.kartuRingkas({ ikon: 'karung', warna: 'w-hijau', label: 'Total ongkos', angka: U.rupiahRingkas(h.total), ket: 'angkut + harga beli + Bulog', sorot: true })}
        ${U.kartuRingkas({ ikon: 'padi', warna: 'w-emas', label: 'Beras petani binaan terserap', angka: `${U.angka(h.tonLumbung, 1)} <small style="font-size:.55em">/ ${U.angka(h.pasokanTersedia, 1)} ton</small>`, ket: `kapasitas ${h.jumlahLumbungPadi} lumbung padi` })}
        ${U.kartuRingkas({ ikon: 'gudang', warna: 'w-biru', label: 'Dipenuhi Perum Bulog', angka: `${U.angka(h.tonBulog, 1)} <small style="font-size:.55em">ton</small>`, ket: h.tonKurang > 0 ? `hanya sisa kekurangan · tak terpenuhi ${U.angka(h.tonKurang, 1)} t` : 'hanya sisa kekurangan' })}
        ${U.kartuRingkas({ ikon: 'truk', warna: 'w-merah', label: 'Dibanding skema terpusat', angka: hemat != null ? (hemat >= 0 ? 'hemat ' : 'lebih mahal ') + U.rupiahRingkas(Math.abs(hemat)) : '–', ket: 'semua beras lewat BAZNAS RI dulu' })}
      </div>
      <div class="baris-aksi">
        <button class="btn btn-utama btn-kecil" id="btn-simpan-sk">+ Simpan skenario (${S.tersimpan.length}/${ZT.CONFIG.maksSkenario})</button>
        <button class="btn btn-garis btn-kecil" id="btn-csv">${U.ikon('unduh')} Ekspor CSV</button>
        <button class="btn btn-garis btn-kecil" id="btn-pdf">${U.ikon('unduh')} Ekspor PDF</button>
        ${h.pembanding ? `<span class="catatan">Skema terpusat: model yang sama, tetapi semua beras lumbung dikirim ke BAZNAS RI (Jakarta) dulu, lalu diteruskan.</span>` : ''}
      </div>
      <div class="dua-kolom" style="margin-top:8px">
        <div><h3 style="font-size:18px">Tabel alokasi</h3><div class="gulir-tabel"><table class="tabel">
          <thead><tr><th>Dari</th><th>Ke</th><th class="angka">Ton</th><th class="angka">Km</th><th class="angka">Ongkos kirim</th><th class="angka">Total</th></tr></thead><tbody>
          ${h.alokasi.map((a) => `<tr><td>${U.esc(a.dari.nama.replace('Lumbung Pangan ', 'LP '))}${a.via ? `<br><small class="catatan">lewat ${U.esc(a.via.nama.replace('Penggilingan', 'Pgl.'))}</small>` : ''}</td><td>${U.esc(a.ke.nama)}</td><td class="angka">${U.angka(a.ton, 1)}</td><td class="angka">${U.angka(a.km, 0)}</td><td class="angka">${U.rupiah(a.ongkosKirim)}</td><td class="angka">${U.rupiah(a.ongkos)}</td></tr>`).join('')}
          ${h.bulog.map((b) => `<tr class="bulog"><td>${U.esc(b.gudang ? b.gudang.nama : 'Perum Bulog')}</td><td>${U.esc(b.ke.nama)}</td><td class="angka">${U.angka(b.ton, 1)}</td><td class="angka">${U.angka(b.km, 0)}</td><td class="angka">${U.rupiah(b.ongkosKirim)}</td><td class="angka">${U.rupiah(b.ongkos)}</td></tr>`).join('')}
          ${h.kurang.map((k) => `<tr class="kurang"><td>Tak terpenuhi</td><td>${U.esc(k.ke.nama)}</td><td class="angka">${U.angka(k.ton, 1)}</td><td></td><td></td><td></td></tr>`).join('')}
          </tbody></table></div></div>
        <div><h3 style="font-size:18px">Pasokan lumbung dalam skenario</h3><div class="gulir-tabel"><table class="tabel">
          <thead><tr><th>Lumbung</th><th class="angka">Pasokan (t)</th><th>Keterangan</th></tr></thead><tbody>
          ${h.pasokan.map((p) => `<tr${p.ikut ? '' : ' style="opacity:.65"'}><td>${U.esc(p.s.nama.replace('Lumbung Pangan ', ''))}</td><td class="angka">${p.s.komoditas === 'padi' && p.s.kapasitas_ton != null ? U.angka(p.S, 1) : '–'}</td><td><small>${U.esc(p.alasan)}</small></td></tr>`).join('')}
          </tbody></table></div></div>
      </div>
      <h3 style="font-size:20px;margin-top:34px">Perbandingan skenario</h3>
      <p class="catatan">Simpan hingga ${ZT.CONFIG.maksSkenario} skenario untuk dibandingkan berdampingan. Kartu bergaris hijau = ongkos terendah.</p>
      <div class="banding" id="banding"></div>
      <div class="baris-aksi" id="aksi-banding"></div>`;
    U.$('#btn-simpan-sk').addEventListener('click', simpanSkenario);
    U.$('#btn-csv').addEventListener('click', () => ZT.E.simpanBerkas('zakatani-alokasi.csv', ZT.E.csvHasil(h), 'text/csv'));
    U.$('#btn-pdf').addEventListener('click', async () => { try { U.toast('Menyiapkan PDF…'); const b = await ZT.E.pdfHasil(h, keterangan(S.opsi)); ZT.E.simpanBerkas('zakatani-alokasi.pdf', b, 'application/pdf'); } catch (e) { U.toast(e.message); } });
    tampilBanding();
  }

  function simpanSkenario() {
    if (S.tersimpan.length >= ZT.CONFIG.maksSkenario) { U.toast('Maksimal 3 skenario. Hapus salah satu dulu.'); return; }
    S.tersimpan.push({ nama: 'Skenario ' + String.fromCharCode(65 + S.tersimpan.length), ket: keterangan(S.opsi), h: S.hasil });
    tampilHasil(); U.toast('Skenario disimpan.');
  }

  function tampilBanding() {
    const el = U.$('#banding'); if (!el) return;
    const min = S.tersimpan.length ? Math.min(...S.tersimpan.map((s) => s.h.total)) : null;
    let html = S.tersimpan.map((s, i) => {
      const K = s.h.totalKebutuhan || 1e-9;
      return `<div class="kartu-banding${s.h.total === min && S.tersimpan.length > 1 ? ' terbaik' : ''}"><button class="hapus" aria-label="Hapus ${U.esc(s.nama)}" data-hapus-sk="${i}">×</button>
        <h4>${U.esc(s.nama)}</h4><div class="ket">${U.esc(s.ket)}</div>
        <dl><dt>Total ongkos</dt><dd>${U.rupiahRingkas(s.h.total)}</dd><dt>Porsi Bulog</dt><dd>${U.persen(s.h.tonBulog / K, 1)}</dd>
        <dt>Bulog (ton)</dt><dd>${U.angka(s.h.tonBulog, 1)}</dd><dt>Tak terpenuhi</dt><dd>${U.angka(s.h.tonKurang, 1)} t</dd>
        <dt>Dari lumbung</dt><dd>${U.angka(s.h.tonLumbung, 1)} t</dd>${s.h.pembanding ? `<dt>Pola via RI</dt><dd>${U.rupiahRingkas(s.h.pembanding.total)}</dd>` : ''}</dl></div>`;
    }).join('');
    for (let i = S.tersimpan.length; i < ZT.CONFIG.maksSkenario; i++) html += `<div class="slot-kosong">Slot ${String.fromCharCode(65 + i)} kosong<br>Atur skenario, lalu klik "Simpan skenario"</div>`;
    el.innerHTML = html;
    U.$$('[data-hapus-sk]').forEach((b) => b.addEventListener('click', () => { S.tersimpan.splice(+b.dataset.hapusSk, 1); S.tersimpan.forEach((s, i) => { s.nama = 'Skenario ' + String.fromCharCode(65 + i); }); tampilHasil(); }));
    const aksi = U.$('#aksi-banding');
    aksi.innerHTML = S.tersimpan.length ? `<button class="btn btn-garis btn-kecil" id="btn-csv-sk">${U.ikon('unduh')} Ekspor perbandingan CSV</button><button class="btn btn-garis btn-kecil" id="btn-pdf-sk">${U.ikon('unduh')} Ekspor perbandingan PDF</button>` : '';
    if (S.tersimpan.length) {
      U.$('#btn-csv-sk').addEventListener('click', () => ZT.E.simpanBerkas('zakatani-skenario.csv', ZT.E.csvSkenario(S.tersimpan), 'text/csv'));
      U.$('#btn-pdf-sk').addEventListener('click', async () => { try { const b = await ZT.E.pdfSkenario(S.tersimpan); ZT.E.simpanBerkas('zakatani-skenario.pdf', b, 'application/pdf'); } catch (e) { U.toast(e.message); } });
    }
  }

  /* ------------------------------------------------------------ init */
  function pasangKontrol() {
    const sr = U.$('#s-ramadan');
    sr.innerHTML = '<option value="">Tanpa batasan</option>' + ZT.RAMADAN.map((r) => `<option value="${r.kode}">${r.label}</option>`).join('');
    ['#p-tarif', '#p-jalan', '#p-lokal', '#p-seberang', '#p-hlumbung', '#p-hbulog', '#p-bulogcap', '#p-radius', '#p-jendela', '#s-ramadan', '#p-wajibgiling'].forEach((id) => U.$(id).addEventListener('change', jalankanOtomatis));
    U.$('#s-kebutuhan').addEventListener('input', (e) => { U.$('#o-kebutuhan').textContent = (+e.target.value > 0 ? '+' : '') + e.target.value + '%'; jalankanOtomatis(); });
    U.$('#s-hujan').addEventListener('input', (e) => { U.$('#o-hujan').textContent = e.target.value + '%'; });
    U.$('#btn-hujan').addEventListener('click', () => {
      const cakupan = U.$('#s-hujan-target').value, persen = +U.$('#s-hujan').value;
      S.opsi.hujan = S.opsi.hujan.filter((h) => h.cakupan !== cakupan);
      if (persen > 0) S.opsi.hujan.push({ cakupan, persen });
      daftarHujan(); jalankanOtomatis();
    });
    U.$('#btn-hitung').addEventListener('click', () => { jalankan(); U.$('#hasil-simulasi').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    U.$('#btn-reset-sim').addEventListener('click', () => { S.opsi = ZT.M.opsiAwal(); isiFormulir(); gambarCalon(); jalankan(); });
    const btnC = U.$('#btn-calon');
    btnC.addEventListener('click', () => {
      S.modeCalon = !S.modeCalon; btnC.setAttribute('aria-pressed', S.modeCalon);
      btnC.textContent = S.modeCalon ? 'Klik lokasi di peta… (batal)' : '+ Tambah calon penggilingan di peta';
      U.$('#peta-simulasi').style.cursor = S.modeCalon ? 'crosshair' : '';
    });
    S.map.on('click', (e) => {
      if (!S.modeCalon) return;
      S.nomorCalon++;
      S.opsi.calon.push({ id: 'C' + S.nomorCalon, jenis: 'calon', nama: 'Calon penggilingan ' + S.nomorCalon, lat: e.latlng.lat, lon: e.latlng.lng, presisi_lokasi: 'desa' });
      if (!U.$('#p-wajibgiling').checked) { U.$('#p-wajibgiling').checked = true; U.toast('Opsi "harus digiling di penggilingan terdaftar" diaktifkan agar calon penggilingan berpengaruh.'); }
      S.modeCalon = false; btnC.setAttribute('aria-pressed', 'false'); btnC.textContent = '+ Tambah calon penggilingan di peta'; U.$('#peta-simulasi').style.cursor = '';
      daftarCalon(); gambarCalon(); jalankan();
    });
  }

  ZT.Simulasi = {
    init: async () => {
      if (S.siap) return;
      await ZT.Peta.muatBatas();
      S.map = ZT.Peta.buat(U.$('#peta-simulasi')).map;
      S.map.fitBounds(ZT.Peta.BATAS_INDONESIA);
      S.lapSimpul = L.layerGroup().addTo(S.map); S.lapHasil = L.layerGroup().addTo(S.map); S.lapCalon = L.layerGroup().addTo(S.map);
      U.$('#legenda-simulasi').innerHTML = ZT.Peta.legendaHTML('simulasi');
      S.opsi = ZT.M.opsiAwal();
      pasangKontrol(); isiFormulir();
      S.siap = true;
      jalankan();
    },
    tampil: () => { if (S.map) setTimeout(() => { S.map.invalidateSize(); if (!S.dipas) { S.map.fitBounds(ZT.Peta.BATAS_INDONESIA); S.dipas = true; } }, 80); },
    rerender: () => { if (!S.siap) return; const calon = S.opsi.calon, hujan = S.opsi.hujan; S.opsi = Object.assign(ZT.M.opsiAwal(), { calon, hujan }); isiFormulir(); jalankan(); },
    _state: S
  };
})(window.ZT);
