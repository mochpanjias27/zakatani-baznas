/* ZakaTani — peta rantai pasok (Leaflet) dan halaman Peta. */
(function (ZT) {
  'use strict';
  const P = {}, U = ZT.U, G = ZT.G, W = ZT.CONFIG.warna;
  let batasProvinsi = null;

  /* ============================== Pabrik peta ============================== */
  P.muatBatas = async () => {
    if (batasProvinsi) return batasProvinsi;
    try { const r = await fetch(ZT.CONFIG.berkasBatas); batasProvinsi = await r.json(); } catch (e) { batasProvinsi = null; }
    return batasProvinsi;
  };

  /** Buat peta dengan basemap batas provinsi (selalu) + ubin daring (Esri/CARTO/OSM, bila bisa dimuat). */
  P.buat = (el) => {
    const map = L.map(el, { zoomControl: true, minZoom: 3, maxZoom: 13, worldCopyJump: false, zoomSnap: 0.25, attributionControl: true })
      .setView(ZT.CONFIG.pusatIndonesia, ZT.CONFIG.zoomAwal);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    map.fitBounds(P.BATAS_INDONESIA);
    let lapisBatas = null;
    if (batasProvinsi) {
      lapisBatas = L.geoJSON(batasProvinsi, { style: P.gayaBatas(), interactive: false }).addTo(map);
      map.attributionControl.addAttribution('Batas provinsi: GeoJSON terbuka');
      P._batas.push(lapisBatas);
    }
    let pilih = ZT.CONFIG.basemapPilihan;
    if (pilih === 'carto' && !ZT.CONFIG.kunciCarto) pilih = 'osm'; // tanpa kunci CARTO menampilkan tanda air
    const bm0 = ZT.CONFIG.basemaps[pilih] || ZT.CONFIG.basemaps.osm;
    const bm = Object.assign({}, bm0, { url: bm0.url.replace('KUNCI', encodeURIComponent(ZT.CONFIG.kunciCarto || '')) });
    const ubin = L.tileLayer(bm.url, { attribution: bm.atribusi, subdomains: bm.subdomains || 'abc', maxZoom: bm.maxZoom || 18, maxNativeZoom: bm.maxZoom || 18 });
    let ubinOk = false;
    ubin.once('tileload', () => { ubinOk = true; if (lapisBatas) { lapisBatas._ubinOk = true; lapisBatas.setStyle({ fillOpacity: 0, opacity: 0 }); } });
    ubin.addTo(map); ubin.bringToBack();
    // bila ubin tidak bisa dimuat (luring / diblokir), tetap memakai batas provinsi
    map.on('unload', () => ubin.off());
    return { map, lapisBatas, ubinOk: () => ubinOk };
  };

  P._batas = [];
  P.gelap = () => document.documentElement.getAttribute('data-tema') === 'gelap';
  P.gayaBatas = () => (P.gelap() ? { color: '#4D6B58', weight: 0.8, fillColor: '#1D3326', fillOpacity: 1 } : { color: '#BFB497', weight: 0.8, fillColor: '#F1ECDD', fillOpacity: 1 });
  /** Dipanggil saat mode terang/gelap berganti (ubin daring digelapkan lewat CSS). */
  P.temaBerubah = () => P._batas.forEach((l) => { if (!l._ubinOk) l.setStyle(P.gayaBatas()); });
  P.BATAS_INDONESIA = [[-11.2, 94.8], [4.2, 141.2]];

  /* Geser piksel untuk simpul yang bertumpuk di titik yang sama (presisi kabupaten). */
  const GESER = [[0, 0], [17, 11], [-17, -11], [17, -13], [-17, 13], [26, 0], [-26, 0]];
  const URUT_JENIS = { lumbung: 0, penggilingan: 1, baznas: 2, bulog: 3, calon: 4 };
  P.hitungGeser = (simpul) => {
    const grup = {}, out = {};
    simpul.slice().sort((a, b) => URUT_JENIS[a.jenis] - URUT_JENIS[b.jenis] || a.id.localeCompare(b.id)).forEach((s) => {
      const k = s.lat.toFixed(3) + ',' + s.lon.toFixed(3);
      grup[k] = grup[k] || 0;
      out[s.id] = GESER[grup[k] % GESER.length]; grup[k]++;
    });
    return out;
  };

  P.ikonLeaflet = (s, geser) => {
    const p = ZT.I.penanda(s, { dx: geser ? -geser[0] : 0, dy: geser ? -geser[1] : 0 });
    return L.divIcon({ className: 'zt-marker', html: p.html, iconSize: p.size, iconAnchor: p.anchor });
  };

  P.namaJenis = (s) => s.jenis === 'lumbung' ? 'Lumbung Pangan' : s.jenis === 'penggilingan' ? 'Penggilingan/pengolahan' : s.jenis === 'bulog' ? 'Perum Bulog' :
    s.jenis === 'calon' ? 'Calon penggilingan' : ({ ri: 'BAZNAS RI', provinsi: 'BAZNAS provinsi', kabupaten: 'BAZNAS kabupaten/kota' }[s.tingkat_baznas] || 'BAZNAS');

  /** Panah kecil di ujung garis. */
  P.panahUjung = (pts, warna, opacity = 1) => {
    const a = pts[pts.length - 3], b = pts[pts.length - 1];
    const sudut = Math.atan2(-(b[0] - a[0]), b[1] - a[1]) * 180 / Math.PI;
    return L.marker(b, { interactive: false, keyboard: false, icon: L.divIcon({ className: 'zt-marker', iconSize: [14, 14], iconAnchor: [7, 7],
      html: `<svg width="14" height="14" viewBox="-7 -7 14 14" style="transform:rotate(${sudut}deg);opacity:${opacity}"><path d="M-5 -5 L6 0 L-5 5 Z" fill="${warna}" stroke="#fff" stroke-width="1"/></svg>` }) });
  };

  P.legendaHTML = (jenis = 'peta') => {
    const ik = (x) => ZT.I.penanda(x).html;
    const baris = (sw, t) => `<li><span class="sw">${sw}</span>${t}</li>`;
    let h = baris(ik({ jenis: 'lumbung', komoditas: 'padi' }), 'Lumbung pangan')
      + baris(ik({ jenis: 'penggilingan' }), 'Penggilingan')
      + baris(`<span style="transform:scale(.8);display:inline-block">${ik({ jenis: 'baznas', tingkat_baznas: 'provinsi' })}</span>`, 'Kantor BAZNAS')
      + baris(ik({ jenis: 'bulog' }), 'Perum Bulog');
    if (jenis === 'peta') {
      h += baris('<svg width="26" height="8"><path d="M0 4h26" stroke="#E3B23C" stroke-width="4" stroke-dasharray="6 4"/></svg>', 'Alur pasok');
    } else {
      h += baris('<svg width="26" height="10"><path d="M0 5h26" stroke="#1F5E3B" stroke-width="6"/></svg>', 'Alokasi (tebal ∝ ton)')
        + baris('<svg width="22" height="22" viewBox="-11 -11 22 22"><circle r="9" fill="#6B6F68" fill-opacity=".12" stroke="#6B6F68" stroke-width="1.6" stroke-dasharray="3 3"/></svg>', 'Pasokan Bulog (luas ∝ ton)')
        + baris(ik({ jenis: 'calon' }), 'Calon penggilingan');
    }
    return h;
  };

  /* ============================== Halaman Peta ============================== */
  const H = { siap: false, map: null, lapis: {}, penanda: {}, filter: { kom: new Set(), peng: new Set(), prov: '' }, pilih: null, garisTerdekat: null, garisAlur: [], radius: null };

  function cocok(s) {
    const f = H.filter;
    if (f.prov && s.provinsi !== f.prov) return false;
    if (s.jenis !== 'lumbung') return true;
    if (f.kom.size && !f.kom.has(s.komoditas)) return false;
    if (f.peng.size) { const g = ZT.D.kelompokPengelola(s); if (!g.some((x) => f.peng.has(x))) return false; }
    return true;
  }

  function gambarPenanda() {
    Object.values(H.lapis).forEach((l) => l.clearLayers());
    H.penanda = {};
    const semua = ZT.D.simpul();
    const geser = P.hitungGeser(semua);
    semua.forEach((s) => {
      if (!cocok(s)) return;
      const m = L.marker([s.lat, s.lon], { icon: P.ikonLeaflet(s, geser[s.id]), title: s.nama, alt: s.nama, riseOnHover: true, keyboard: true,
        zIndexOffset: s.jenis === 'lumbung' ? 400 : s.tingkat_baznas === 'ri' ? 300 : 0 });
      m.bindTooltip(`${U.esc(s.nama)}<br><span style="font-weight:600;opacity:.75">${P.namaJenis(s)}</span>`, { className: 'zt-tip', direction: 'top', offset: [0, -12] });
      m.on('click', () => P.pilih(s.id));
      m.on('keypress', (e) => { if (e.originalEvent.key === 'Enter') P.pilih(s.id); });
      const lap = s.jenis === 'lumbung' ? 'lumbung' : s.jenis;
      H.lapis[lap].addLayer(m);
      H.penanda[s.id] = m;
    });
    gambarAlur();
  }

  function gambarAlur() {
    H.lapis.alur.clearLayers(); H.garisAlur = [];
    (ZT.state.data.alur || []).forEach((a) => {
      const dari = ZT.D.byId(a.dari), ke = ZT.D.byId(a.ke);
      if (!dari || !ke || !cocok(dari)) return;
      const pts = G.lengkung([dari.lat, dari.lon], [ke.lat, ke.lon], 0.22);
      const pasti = true;
      const garis = L.polyline(pts, { color: W.gabah, weight: 4, opacity: 0.95, className: 'garis-alur' });
      garis.bindTooltip(`<b>${U.esc(dari.nama)} → ${U.esc(ke.nama)}</b><br>Alur pasok beras zakat fitrah`, { className: 'zt-tip', sticky: true });
      garis.on('click', () => P.pilih(dari.id));
      H.lapis.alur.addLayer(garis);
      H.lapis.alur.addLayer(P.panahUjung(pts, W.gabah, 1));
      H.garisAlur.push({ a, garis });
    });
  }

  function ringkasan() {
    const lumbung = ZT.D.jenis('lumbung').filter(cocok);
    const bz = ZT.D.jenis('baznas').filter((b) => !H.filter.prov || b.provinsi === H.filter.prov);
    const petani = lumbung.reduce((t, l) => t + (l.petani || 0), 0);
    const R = H.radius != null ? H.radius : ZT.D.param('radius_penggilingan_km');
    const tanpa = ZT.M.tanpaPenggilingan(lumbung, ZT.D.jenis('penggilingan'), R);
    const box = U.$('#bilah-ringkas');
    box.innerHTML = '<div class="grid-ringkas empat">' + [
      { ikon: 'gudang', warna: 'w-hijau', label: 'Lumbung pangan', angka: U.angka(lumbung.length, 0), ket: 'lokasi' },
      { ikon: 'kubah', warna: 'w-emas', label: 'Kantor BAZNAS', angka: U.angka(bz.length, 0), ket: 'kantor penyalur' },
      { ikon: 'petani', warna: 'w-biru', label: 'Petani binaan', angka: U.angka(petani, 0), ket: 'orang' },
      { ikon: 'gilingan', warna: 'w-merah', label: 'Jauh dari penggilingan', angka: U.angka(tanpa.length, 0), ket: `lumbung · &gt; <input type="number" id="radius-ringkas" min="10" max="2000" step="10" value="${R}" aria-label="Radius penggilingan dalam km"> km` }
    ].map(U.kartuRingkas).join('') + '</div>';
    U.$('#radius-ringkas').addEventListener('change', (e) => { H.radius = Math.max(10, +e.target.value || 100); ringkasan(); });
  }

  /** Buka panel detail simpul dan sorot di peta. */
  P.pilih = (id, terbang) => {
    const s = ZT.D.byId(id); if (!s) return;
    H.pilih = id;
    Object.entries(H.penanda).forEach(([k, m]) => { const el = m.getElement(); if (el) el.classList.toggle('pilih', k === id); });
    if (H.garisTerdekat) { H.map.removeLayer(H.garisTerdekat); H.garisTerdekat = null; }
    let terdekat = null;
    if (s.jenis === 'lumbung') {
      terdekat = G.baznasTerdekat(s, ZT.D.simpul());
      H.garisTerdekat = L.layerGroup();
      ['kabupaten', 'provinsi', 'ri'].forEach((t) => {
        const d = terdekat[t]; if (!d) return;
        L.polyline([[s.lat, s.lon], [d.simpul.lat, d.simpul.lon]], { color: '#7A7F75', weight: 2, dashArray: '5 6', opacity: 0.9, interactive: false }).addTo(H.garisTerdekat);
      });
      H.garisTerdekat.addTo(H.map);
    }
    if (terbang) H.map.flyTo([s.lat, s.lon], Math.max(H.map.getZoom(), 7), { duration: 0.8 });
    tampilPanel(s, terdekat);
  };

  function tampilPanel(s, terdekat) {
    const panel = U.$('#panel-detail');
    const lok = [s.desa && 'Desa ' + s.desa, s.kecamatan && 'Kec. ' + s.kecamatan, s.kabupaten, s.provinsi].filter(Boolean).join(', ');
    let angka = '', tabel = '';
    const baris = (lbl, html) => `<tr><th>${lbl}</th><td>${html}</td></tr>`;
    if (s.jenis === 'lumbung') {
      angka = `<div class="angka-utama"><div><b>${U.nilaiRingkas(s, 'petani')}</b><span>petani</span></div><div><b>${U.nilaiRingkas(s, 'luas_ha', 1)}</b><span>luas (ha)</span></div><div><b>${U.nilaiRingkas(s, 'kapasitas_ton', 1)}</b><span>kapasitas (ton)</span></div></div>`;
      tabel = baris('Komoditas', s.komoditas ? U.esc(s.komoditas) : '<span class="kosong">belum ada data</span>')
        + baris('Jumlah petani', U.nilai(s, 'petani', { d: 0, satuan: 'orang' }))
        + baris('Luas lahan', U.nilai(s, 'luas_ha', { satuan: 'ha' }))
        + baris('Hasil panen', U.nilai(s, 'panen_ton', { satuan: s.komoditas === 'jagung' ? 'ton jagung' : 'ton' }))
        + baris('Kapasitas pasok', U.nilai(s, 'kapasitas_ton', { satuan: 'ton beras/musim' }))
        + baris('Stok simpan', U.nilai(s, 'stok_simpan_ton', { satuan: 'ton' }))
        + baris('Musim panen', U.nilai(s, 'musim_panen'))
        + baris('Tahun mulai', U.nilai(s, 'tahun_mulai'))
        + baris('Pengelola', s.pengelola ? U.esc(s.pengelola) : '<span class="kosong">belum ada data</span>');
    } else if (s.jenis === 'baznas') {
      angka = `<div class="angka-utama" style="grid-template-columns:1fr 1fr"><div><b>${U.nilaiRingkas(s, 'kebutuhan_ton', 1)}</b><span>kebutuhan beras (ton)</span></div><div><b style="font-size:15px">${P.namaJenis(s).replace('BAZNAS ', '')}</b><span>tingkat</span></div></div>`;
      tabel = baris('Kebutuhan beras zakat fitrah', U.nilai(s, 'kebutuhan_ton', { satuan: 'ton' }));
    } else {
      tabel = baris('Pengelola', s.pengelola ? U.esc(s.pengelola) : '<span class="kosong">belum ada data</span>') + baris('Komoditas', s.komoditas ? U.esc(s.komoditas) : '<span class="kosong">belum ada data</span>');
    }

    let blokTerdekat = '';
    if (terdekat) {
      const t = (lbl, d) => d ? `<div><span>${lbl}: ${U.esc(d.simpul.nama)}</span><b>${U.angka(d.km, 0)} km</b></div>` : '';
      const nol = terdekat.kabupaten && terdekat.kabupaten.km < 1;
      blokTerdekat = `<div class="sub-judul">BAZNAS terdekat (garis lurus)</div><div class="terdekat">${t('Kab/kota', terdekat.kabupaten)}${t('Provinsi', terdekat.provinsi)}${t('RI', terdekat.ri)}</div>
        ${nol ? '<p class="catatan">Lumbung dan kantor BAZNAS kabupaten berada di kabupaten yang sama.</p>' : ''}`;
    }
    const alur = (ZT.state.data.alur || []).filter((a) => a.dari === s.id || a.ke === s.id);
    const blokAlur = alur.length ? `<div class="sub-judul">Alur pasok tercatat</div>` + alur.map((a) => `<p style="font-size:13.5px;margin-bottom:6px"><b>${U.esc(ZT.D.byId(a.dari).nama)} → ${U.esc(ZT.D.byId(a.ke).nama)}</b><br><span class="catatan">Beras zakat fitrah</span></p>`).join('') : '';
    panel.innerHTML = `<div class="sampul" role="img" aria-label="Ilustrasi ${U.esc(s.komoditas || P.namaJenis(s))}">${ZT.I.sampul(s)}<button class="tutup" aria-label="Tutup panel">✕</button></div>
      <div class="isi"><span class="eyebrow" style="margin-bottom:6px">${P.namaJenis(s)}</span><h2>${U.esc(s.nama)}</h2><div class="lokasi">${U.ikon('pin')} ${U.esc(lok) || '<span class="kosong">lokasi belum ada data</span>'}</div>
      ${angka}<table class="tabel-detail">${tabel}</table>${blokTerdekat}${blokAlur}
</div>`;
    panel.classList.add('buka');
    panel.querySelector('.tutup').addEventListener('click', P.tutupPanel);
  }

  P.tutupPanel = () => {
    U.$('#panel-detail').classList.remove('buka'); H.pilih = null;
    if (H.garisTerdekat) { H.map.removeLayer(H.garisTerdekat); H.garisTerdekat = null; }
    Object.values(H.penanda).forEach((m) => { const el = m.getElement(); if (el) el.classList.remove('pilih'); });
  };

  function pasangFilter() {
    const sel = U.$('#f-prov');
    sel.innerHTML = '<option value="">Semua provinsi</option>' + ZT.D.provinsi().map((p) => `<option>${U.esc(p)}</option>`).join('');
    U.$$('[data-f-kom]').forEach((b) => b.addEventListener('click', () => { togel(b, H.filter.kom, b.dataset.fKom); }));
    U.$$('[data-f-peng]').forEach((b) => b.addEventListener('click', () => { togel(b, H.filter.peng, b.dataset.fPeng); }));
    sel.addEventListener('change', () => { H.filter.prov = sel.value; segarkan(true); });
    U.$('#f-reset').addEventListener('click', () => {
      H.filter.kom.clear(); H.filter.peng.clear(); H.filter.prov = ''; sel.value = '';
      U.$$('[data-f-kom],[data-f-peng]').forEach((b) => b.setAttribute('aria-pressed', 'false')); segarkan(true);
    });
    U.$$('[data-lapis]').forEach((c) => c.addEventListener('change', () => { const l = H.lapis[c.dataset.lapis]; c.checked ? l.addTo(H.map) : H.map.removeLayer(l); }));
    function togel(btn, set, val) { set.has(val) ? set.delete(val) : set.add(val); btn.setAttribute('aria-pressed', set.has(val)); segarkan(true); }
  }

  function segarkan(sesuaikan) {
    gambarPenanda(); ringkasan();
    if (H.pilih) { const s = ZT.D.byId(H.pilih); if (s && cocok(s)) P.pilih(H.pilih); else P.tutupPanel(); }
    if (sesuaikan) {
      const pts = ZT.D.jenis('lumbung').filter(cocok).map((s) => [s.lat, s.lon]);
      if (pts.length) H.map.flyToBounds(L.latLngBounds(pts).pad(0.25), { maxZoom: 8, duration: 0.6 });
    }
  }

  function sorotContoh() {
    const g = H.garisAlur.find((x) => x.a.dari === 'L01');
    if (!g) return;
    const el = g.garis.getElement(); if (el) { el.classList.add('garis-sorot'); setTimeout(() => el.classList.remove('garis-sorot'), 5200); }
    const c = U.$('#callout-alur'); c.classList.remove('tersembunyi');
    U.$('#callout-lihat').onclick = () => {
      const a = ZT.D.byId('L01'), b = ZT.D.byId('B00');
      H.map.flyToBounds(L.latLngBounds([[a.lat, a.lon], [b.lat, b.lon]]).pad(0.8), { duration: 0.9 });
      P.pilih('L01'); c.classList.add('tersembunyi');
    };
    U.$('#callout-tutup').onclick = () => c.classList.add('tersembunyi');
  }

  P.init = async () => {
    if (H.siap) return;
    await P.muatBatas();
    const { map } = P.buat(U.$('#peta-utama'));
    H.map = map;
    ['lumbung', 'penggilingan', 'baznas', 'bulog', 'alur'].forEach((k) => { H.lapis[k] = L.layerGroup().addTo(map); });
    H.lapis.alur.addTo(map);
    U.$('#isi-legenda').innerHTML = P.legendaHTML('peta');
    pasangFilter();
    H.siap = true;
    segarkan(false);
    map.fitBounds(P.BATAS_INDONESIA);
    setTimeout(sorotContoh, 700);
  };

  P.tampil = () => { if (H.map) setTimeout(() => { H.map.invalidateSize(); if (!H.dipas) { H.map.fitBounds(P.BATAS_INDONESIA); H.dipas = true; } }, 80); };
  P.rerender = () => { if (H.siap) { const sel = U.$('#f-prov'); const v = sel.value; sel.innerHTML = '<option value="">Semua provinsi</option>' + ZT.D.provinsi().map((p) => `<option ${p === v ? 'selected' : ''}>${U.esc(p)}</option>`).join(''); segarkan(false); } };
  /** Dipakai halaman lain: buka peta lalu pilih simpul. */
  P.fokus = (id) => {
    location.hash = 'peta';
    const tunggu = () => { if (H.siap) { H.map.invalidateSize(); P.pilih(id, true); } else setTimeout(tunggu, 120); };
    setTimeout(tunggu, 150);
  };

  ZT.Peta = P;
})(window.ZT);
