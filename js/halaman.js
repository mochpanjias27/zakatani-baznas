/* ZakaTani — halaman informasi: Beranda, Alur, Profil, Dampak, Tentang & Metodologi. */
(function (ZT) {
  'use strict';
  const U = ZT.U, H = {};

  /* =============================== BERANDA =============================== */
  /** Hasil model pada nilai awal (dipakai kartu Beranda agar selalu cocok dengan Simulasi). */
  H.hasilAwal = () => {
    if (!ZT.state.hasilAwal && window.solver) ZT.state.hasilAwal = ZT.M.jalankan(ZT.state.data, ZT.M.opsiAwal());
    return ZT.state.hasilAwal;
  };

  H.beranda = () => {
    U.$('#ilustrasi-hero').innerHTML = ZT.I.hero();
    U.$('#ilustrasi-cerita').innerHTML = ZT.I.cerita() + `<div class="lencana-mengambang"><b data-hitung="735">735</b><span style="font-size:13px;font-weight:700;line-height:1.3">petani binaan<br><small style="font-weight:600;color:var(--abu)">Lumbung Pangan</small></span></div>`;
    const st = ZT.state.data.statistik || {}, lumbung = ZT.D.jenis('lumbung');
    const padi = lumbung.filter((l) => l.komoditas === 'padi' && l.kapasitas_ton != null);
    const bz = ZT.D.jenis('baznas').filter((b) => b.kebutuhan_ton != null);
    const h = H.hasilAwal();
    const rata = h && h.status === 'optimal' ? h.kirimTotal / Math.max(1e-9, h.totalKebutuhan) : null;
    const prov = st.lokasi_nasional ? st.lokasi_nasional.provinsi : new Set(lumbung.map((l) => l.provinsi)).size;
    U.$('#kartu-statistik').innerHTML = [
      { ikon: 'gudang', warna: 'w-hijau', label: 'Lumbung pangan', nilai: lumbung.length, ket: `lokasi di ${prov} provinsi` },
      { ikon: 'padi', warna: 'w-emas', label: 'Kapasitas beras', nilai: padi.reduce((t, l) => t + l.kapasitas_ton, 0), desimal: 1, akhiran: 'ton', ket: 'per musim zakat fitrah' },
      { ikon: 'truk', warna: 'w-biru', label: 'Kebutuhan zakat fitrah', nilai: bz.reduce((t, b) => t + b.kebutuhan_ton, 0), akhiran: 'ton', ket: `di ${bz.length} kantor BAZNAS` },
      { ikon: 'karung', warna: 'w-merah', label: 'Ongkos kirim rata-rata', nilai: rata == null ? null : Math.round(rata / 1000), awalan: 'Rp', akhiran: 'rb', ket: 'per ton beras' },
      { ikon: 'naik', warna: 'w-hijau', label: 'Petani binaan jadi muzaki', nilai: st.petani_muzaki ? st.petani_muzaki.nilai : 80, ket: '2022–2024', sorot: true }
    ].map(U.kartuRingkas).join('');
    U.$('#kartu-statistik').className = 'grid-ringkas';
    U.hitungNaik(document.querySelector('[data-halaman="beranda"]'));
    H.gambarAlur('#alur-beranda', false);
  };

  /* ================================= ALUR ================================= */
  H.LANGKAH = [
    { id: 'tanam', ikon: 'bibit', judul: 'Tanam', teks: 'Petani binaan menanam dengan modal dan pendampingan.' },
    { id: 'panen', ikon: 'sabit', judul: 'Panen', teks: 'Hasil panen dicatat per musim.' },
    { id: 'giling', ikon: 'gilingan', judul: 'Giling & Kemas', teks: 'Gabah digiling dan dikemas di penggilingan.' },
    { id: 'salur', ikon: 'truk', judul: 'Salur lewat BAZNAS', teks: 'Beras dikirim ke BAZNAS penyalur.' },
    { id: 'zakat', ikon: 'tangan', judul: 'Zakat Fitrah untuk Mustahik', teks: 'Beras zakat fitrah sampai ke mustahik.' }
  ];

  H.terkait = (langkah) => {
    const L = ZT.D.jenis('lumbung');
    const R = ZT.D.param('radius_penggilingan_km');
    switch (langkah) {
      case 'tanam': return { judul: 'Lumbung dengan petani binaan', simpul: L, ket: 'Semua lumbung pangan dalam data. Angka petani dan lahan ada di panel detail.' };
      case 'panen': return { judul: 'Lumbung dengan data panen atau musim panen', simpul: L.filter((l) => l.panen_ton != null || (l.musim_panen && l.musim_panen.length)), ket: 'Hasil dan musim panen setiap lumbung (data ilustrasi).' };
      case 'giling': {
        const tanpa = new Set(ZT.M.tanpaPenggilingan(L, ZT.D.jenis('penggilingan'), R).map((l) => l.id));
        return { judul: `Lumbung dengan penggilingan terdaftar dalam radius ${R} km`, simpul: L.filter((l) => !tanpa.has(l.id)).concat(ZT.D.jenis('penggilingan')), ket: `${tanpa.size} lumbung belum punya penggilingan terdaftar dalam radius ${R} km; peluang lokasi penggilingan baru (lihat Simulasi).` };
      }
      case 'salur': {
        const ids = new Set((ZT.state.data.alur || []).map((a) => a.dari));
        return { judul: 'Lumbung pemasok beras zakat fitrah (alur tercatat)', simpul: L.filter((l) => ids.has(l.id)), ket: 'Contoh alur: Lumbung Sukabumi → BAZNAS RI.' };
      }
      default: return { judul: 'Kantor BAZNAS penyalur zakat fitrah', simpul: ZT.D.jenis('baznas'), ket: 'BAZNAS RI, provinsi, dan kabupaten/kota di wilayah lumbung.' };
    }
  };

  H.gambarAlur = (sel, lengkap) => {
    const box = U.$(sel);
    box.innerHTML = H.LANGKAH.map((l, i) => `<button class="langkah" data-langkah="${l.id}" aria-pressed="false"><span class="bulat">${U.ikon(l.ikon)}<span class="nomor">${i + 1}</span></span><span><h3>${l.judul}</h3><p>${l.teks}</p></span></button>`).join('');
    U.$$('[data-langkah]', box).forEach((b) => b.addEventListener('click', () => {
      if (!lengkap) { location.hash = 'alur'; setTimeout(() => H.pilihLangkah(b.dataset.langkah), 120); return; }
      H.pilihLangkah(b.dataset.langkah);
    }));
  };

  H.pilihLangkah = (id) => {
    U.$$('#alur-lengkap [data-langkah]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.langkah === id));
    const t = H.terkait(id), l = H.LANGKAH.find((x) => x.id === id);
    U.$('#panel-langkah').innerHTML = `<span class="eyebrow">Langkah ${H.LANGKAH.indexOf(l) + 1} · ${l.judul}</span><h3>${U.esc(t.judul)} (${t.simpul.length})</h3><p class="catatan">${U.esc(t.ket)}</p>
      <div class="daftar-chip">${t.simpul.map((s) => `<button class="chip-lumbung" data-fokus="${s.id}">${U.ikon(s.jenis === 'baznas' ? 'kubah' : s.jenis === 'penggilingan' ? 'gilingan' : s.komoditas === 'jagung' ? 'jagung' : s.komoditas === 'hortikultura' ? 'daun' : 'padi')}${U.esc(s.nama.replace('Lumbung Pangan ', ''))}</button>`).join('')}</div>
      <p class="catatan" style="margin-top:12px">Klik nama untuk membukanya di peta.</p>`;
    U.$$('#panel-langkah [data-fokus]').forEach((b) => b.addEventListener('click', () => ZT.Peta.fokus(b.dataset.fokus)));
  };

  H.alur = () => { H.gambarAlur('#alur-lengkap', true); H.pilihLangkah('tanam'); };


  /* ================================ PROFIL (No. 13) ================================ */
  const fp = { kom: new Set(), cari: '' };
  H.profil = () => {
    const grid = U.$('#grid-profil');
    const daftar = ZT.D.jenis('lumbung').filter((s) => {
      if (fp.kom.size && !fp.kom.has(s.komoditas)) return false;
      if (fp.cari) { const q = fp.cari.toLowerCase(); if (![s.nama, s.desa, s.kecamatan, s.kabupaten, s.provinsi, s.pengelola].join(' ').toLowerCase().includes(q)) return false; }
      return true;
    });
    grid.innerHTML = daftar.length ? daftar.map((s) => {
      const lok = [s.desa && 'Desa ' + s.desa, s.kecamatan && 'Kec. ' + s.kecamatan, s.kabupaten, s.provinsi].filter(Boolean).join(', ');
      return `<article class="kartu-profil"><div class="sampul" role="img" aria-label="Ilustrasi komoditas ${U.esc(s.komoditas)}">${ZT.I.sampul(s)}<span class="label-kom k-${U.esc(s.komoditas)}">${U.esc(s.komoditas)}</span></div>
        <div class="isi"><h3>${U.esc(s.nama)}</h3><div class="lokasi">${U.ikon('pin')} ${U.esc(lok)}</div>
        <div class="mini"><div><b>${U.nilaiRingkas(s, 'petani')}</b><span>petani</span></div><div><b>${U.nilaiRingkas(s, 'luas_ha', 1)}</b><span>ha lahan</span></div><div><b>${U.nilaiRingkas(s, 'panen_ton', 1)}</b><span>ton panen</span></div></div>
        <div class="peng"><b>Pengelola:</b> ${U.esc(s.pengelola || '–')}</div>
        <div class="kaki"><button class="tautan-zakat" data-zakat="${s.id}">Hitung zakat panen →</button>
        <button class="btn btn-utama btn-kecil" data-fokus="${s.id}">Lihat di peta <span class="panah" style="width:20px;height:20px">${U.ikon('panah')}</span></button></div></div></article>`;
    }).join('') : '<p class="kosong">Tidak ada lumbung yang cocok dengan filter.</p>';
    U.$$('#grid-profil [data-fokus]').forEach((b) => b.addEventListener('click', () => ZT.Peta.fokus(b.dataset.fokus)));
    U.$$('#grid-profil [data-zakat]').forEach((b) => b.addEventListener('click', () => ZT.Kalk.dariLumbung(b.dataset.zakat)));
  };
  H.pasangProfil = () => {
    U.$$('[data-p-kom]').forEach((b) => b.addEventListener('click', () => { const v = b.dataset.pKom; fp.kom.has(v) ? fp.kom.delete(v) : fp.kom.add(v); b.setAttribute('aria-pressed', fp.kom.has(v)); H.profil(); }));
    U.$('#p-cari').addEventListener('input', U.debounce((e) => { fp.cari = e.target.value.trim(); H.profil(); }, 200));
  };

  /* Grafik batang sederhana (warna teks mengikuti mode terang/gelap). */
  function grafikBatang(data, opsi) {
    const w = opsi.lebar || 640, barisH = opsi.barisH || 46, kiri = opsi.kiri || 170, atas = 10, h = atas + data.length * barisH + 30;
    const maks = Math.max(...data.map((d) => d.nilai), 1), lebar = w - kiri - 60;
    let g = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${U.esc(opsi.label)}" style="color:var(--arang)">`;
    for (let t = 0; t <= 4; t++) { const x = kiri + (lebar * t) / 4; g += `<line x1="${x}" y1="${atas}" x2="${x}" y2="${h - 26}" stroke="var(--garis)"/><text x="${x}" y="${h - 8}" font-size="11" fill="currentColor" opacity=".7" text-anchor="middle">${U.angka((maks * t) / 4, 0)}</text>`; }
    data.forEach((d, i) => {
      const y = atas + i * barisH + 8, bw = Math.max(2, (lebar * d.nilai) / maks);
      g += `<text x="${kiri - 12}" y="${y + 18}" font-size="13.5" font-weight="700" fill="currentColor" text-anchor="end">${U.esc(d.label)}</text>`;
      g += `<rect x="${kiri}" y="${y}" width="${bw}" height="26" rx="6" fill="${i === 0 ? '#1F5E3B' : '#4E8F3A'}"><title>${U.esc(d.label)}: ${d.nilai}</title></rect>`;
      g += `<text x="${kiri + bw + 8}" y="${y + 18}" font-size="14" font-weight="800" fill="currentColor">${U.angka(d.nilai, 0)}</text>`;
    });
    return g + '</svg>';
  }

  /* ============================== METODOLOGI (No. 14) ============================== */
  let tabMetode = 'model';
  H.metodologi = () => {
    const box = U.$('#isi-metodologi');
    const tabs = [['model', 'Model alokasi'], ['zakat', 'Zakat panen'], ['data', 'Data & catatan']];
    box.innerHTML = `<div class="tab-pil" role="tablist">${tabs.map(([k, t]) => `<button role="tab" aria-selected="${tabMetode === k}" data-tab-m="${k}">${t}</button>`).join('')}</div><div id="isi-tab-m"></div>`;
    U.$$('[data-tab-m]', box).forEach((b) => b.addEventListener('click', () => { tabMetode = b.dataset.tabM; H.metodologi(); }));
    const isi = U.$('#isi-tab-m');
    if (tabMetode === 'model') isi.innerHTML = tabModel();
    else if (tabMetode === 'zakat') isi.innerHTML = tabZakat();
    else isi.innerHTML = tabData();
  };

  function contohKalimat() {
    const h = H.hasilAwal();
    if (!h || h.status !== 'optimal') return '';
    const suka = h.alokasi.filter((a) => a.dari.id === 'L01').slice(0, 2).map((a) => a.ke.nama);
    const b = h.bulog[0];
    return `Contoh: beras Lumbung Sukabumi dikirim ke ${suka.join(' dan ') || 'BAZNAS terdekat'} lebih dulu, karena rutenya paling dekat${b ? `; kekurangan di ${U.esc(b.ke.nama)} ditutup Bulog` : ''}.`;
  }

  function tabModel() {
    const P = ZT.state.data.parameter;
    const langkah = [
      ['Kumpulkan data simpul', 'Kapasitas lumbung, musim panen, kebutuhan tiap kantor BAZNAS, dan lokasi gudang Bulog.', 'masukan'],
      ['Hitung ongkos tiap rute', 'Jarak × faktor jalan × tarif, ditambah ongkos lokal, penyeberangan, dan harga beli beras.', 'biaya'],
      ['Serap beras petani binaan', 'Model mengutamakan beras dari lumbung sebanyak mungkin.', 'tahap 1'],
      ['Pilih ongkos terkecil', 'Di antara pilihan itu, model memilih pengiriman paling murah; Bulog menutup kekurangan.', 'tahap 2']
    ];
    return `<div class="dua-sisi">
      <div><h2 style="font-size:24px;margin-bottom:20px">Dari data ke keputusan</h2>
        <ol class="jalur">${langkah.map((l, i) => `<li><span class="no">${i + 1}</span><h4>${l[0]}</h4><p>${l[1]}</p><span class="tag">${l[2]}</span></li>`).join('')}</ol></div>
      <div class="kotak"><h3>Rumus singkat</h3>
        <div class="rumus-baris"><small>Tahap 1 · maksimumkan beras lumbung terkirim</small>maks Σ<sub>i</sub>Σ<sub>j</sub> x<sub>ij</sub></div>
        <div class="rumus-baris"><small>Tahap 2 · minimumkan total ongkos</small>min Σ<sub>i</sub>Σ<sub>j</sub>(c<sub>ij</sub>+p<sub>i</sub>)x<sub>ij</sub> + Σ<sub>j</sub>(c<sub>Bj</sub>+p<sub>B</sub>)b<sub>j</sub></div>
        <p class="catatan">x = beras dari lumbung i ke BAZNAS j · b = pasokan Bulog · c = ongkos kirim · p = harga beli. Batasan: kiriman tiap lumbung ≤ kapasitasnya; kiriman ke tiap BAZNAS ≥ kebutuhannya; tahap 2 wajib mempertahankan serapan tahap 1.</p>
        <p class="catatan">c<sub>ij</sub> = maks(jarak × faktor jalan × tarif, ongkos lokal minimum) + biaya penyeberangan × jumlah pindah pulau.</p>
        <p style="font-size:14.5px;margin:0">${contohKalimat()}</p></div>
    </div>
    <details class="lipat" style="margin-top:26px"><summary>Parameter yang dipakai (data ilustrasi; dapat diubah di Simulasi)</summary><div class="isi-lipat">
      <div class="gulir-tabel"><table class="tabel"><thead><tr><th>Parameter</th><th class="angka">Nilai</th></tr></thead><tbody>
      ${Object.entries(P).map(([k, p]) => `<tr><td>${U.esc(p.label || k)}</td><td class="angka">${p.nilai == null ? 'tak terbatas' : U.angka(p.nilai, 2) + ' ' + U.esc(p.satuan || '')}</td></tr>`).join('')}
      </tbody></table></div></div></details>`;
  }

  function tabZakat() {
    return `<div class="grid-tiga">
      ${U.kartuRingkas({ ikon: 'timbang', warna: 'w-hijau', label: 'Nisab gabah per panen', angka: '653 kg', ket: 'PMA No. 52 Tahun 2014 (setara 520 kg beras)' })}
      ${U.kartuRingkas({ ikon: 'hujan', warna: 'w-biru', label: 'Kadar zakat', angka: '5% / 10%', ket: 'irigasi berbiaya / tadah hujan' })}
      ${U.kartuRingkas({ ikon: 'orang', warna: 'w-emas', label: 'Had kifayah', angka: 'Batas cukup', ket: 'batas cukup keluarga, ukuran graduasi menuju muzaki' })}
    </div>
    <div class="contoh-hitung">Contoh hitung: 4.700 kg gabah, sawah irigasi → 235 kg zakat (≈ Rp1,5 juta pada harga Rp6.500/kg). <a href="#kalkulator">Coba di Kalkulator Zakat →</a></div>
    <div class="kotak" style="margin-top:20px"><h3>Aturan yang dipakai kalkulator</h3>
      <ul style="margin:0;padding-left:20px;font-size:14.5px">
        <li>Zakat pertanian dikeluarkan setiap kali panen, tanpa menunggu satu tahun.</li>
        <li>Nisab beras 520 kg (Puskas BAZNAS). Jagung dan hortikultura dihitung dengan nisab setara 653 kg (asumsi kalkulator).</li>
        <li>Kadar 7,5% untuk pengairan campuran dan pilihan pengurangan biaya produksi masih perlu dikonfirmasi dengan amil atau panduan resmi BAZNAS.</li>
      </ul></div>`;
  }

  function tabData() {
    const sumber = [['BAZNAS', 'lokasi Lumbung Pangan'], ['BPS', 'produktivitas, rendemen'], ['Puskas BAZNAS', 'had kifayah, CIBEST'], ['Perum Bulog', 'gudang cadangan'], ['OpenStreetMap', 'peta dan jarak'], ['Kemenag', 'kalender Hijriah (jadwal Ramadan)']];
    return `<div class="dua-sisi">
      <div><h2 style="font-size:22px">Sumber data</h2><div class="daftar-sumber">${sumber.map((x) => `<div><b>${x[0]}</b>${x[1]}</div>`).join('')}</div></div>
      <div><h2 style="font-size:22px">Catatan penting</h2>
        <details class="lipat" open><summary>Angka saat ini adalah data ilustrasi</summary><div class="isi-lipat">Kapasitas, kebutuhan, ongkos, harga beli, musim panen, dan hasil simulasi adalah data ilustrasi untuk menunjukkan cara kerja model. Data asli dimasukkan setelah proposal diterima, tanpa mengubah tampilan.</div></details>
        <details class="lipat"><summary>Keterbatasan model</summary><div class="isi-lipat">Jarak memakai garis lurus × faktor jalan, belum rute jalan sebenarnya. Biaya penyeberangan dihitung rata per pindah pulau. Model satu periode (satu musim zakat fitrah). Komoditas selain beras tidak masuk alokasi. Titik lokasi berpresisi kabupaten.</div></details>
        <details class="lipat"><summary>Perlindungan data petani</summary><div class="isi-lipat">Situs hanya menampilkan angka agregat per lumbung. Tidak ada nama, NIK, alamat, atau nomor telepon petani. Kalkulator zakat menghitung di perangkat pengguna dan tidak mengirim data.</div></details>
      </div></div>`;
  }

  /* ============================== TENTANG & FAQ (No. 14) ============================== */
  H.tentang = () => {
    const dp = ZT.state.data.dampak;
    const data = (dp ? dp.data : []).slice().sort((a, b) => b.nilai - a.nilai).map((d) => ({ label: d.lokasi, nilai: d.nilai }));
    const total = data.reduce((t, d) => t + d.nilai, 0);
    const surel = ZT.CONFIG.kontakSurel;
    const faq = [
      ['Apa itu ZakaTani?', 'Peta rantai pasok Lumbung Pangan BAZNAS: dari lumbung, penggilingan, hingga BAZNAS penyalur, dilengkapi simulasi alokasi dan kalkulator zakat panen.'],
      ['Apakah ini situs resmi BAZNAS?', 'Bukan. ZakaTani adalah prototipe riset CRP untuk usulan Beasiswa Riset BAZNAS 2026. BAZNAS disebut sebagai pengelola program Lumbung Pangan, bukan pemilik situs ini.'],
      ['Dari mana angka di situs ini?', 'Lokasi lumbung disusun dari pemberitaan publik tentang program Lumbung Pangan. Kapasitas, kebutuhan, ongkos, dan hasil simulasi adalah data ilustrasi; angka ini akan diganti data asli setelah proposal diterima.'],
      ['Apakah data petani perorangan ditampilkan?', 'Tidak. Situs hanya menampilkan angka agregat per lumbung, tanpa nama, NIK, alamat, atau nomor telepon petani.'],
      ['Bagaimana cara menghitung zakat hasil panen?', 'Zakat wajib bila hasil satu kali panen mencapai nisab 653 kg gabah (520 kg beras). Kadarnya 5% untuk sawah irigasi berbiaya dan 10% untuk tadah hujan. <a href="#kalkulator">Buka Kalkulator Zakat →</a>'],
      ['Siapa yang mengembangkan ZakaTani?', 'Tim peneliti CRP (Communication in Research and Publications), sebagai bagian dari usulan Beasiswa Riset BAZNAS 2026.']
    ];
    const lumbungSampul = (kom) => ZT.I.sampul({ jenis: 'lumbung', komoditas: kom });
    U.$('#isi-tentang').innerHTML = `
      <section id="cerita-dampak"><div class="judul-seksi" style="margin-bottom:24px"><span class="eyebrow">Dari lumbung ke mustahik</span><h2>Cerita pemanfaatan</h2><p>Ilustrasi skenario pemanfaatan, bukan laporan kegiatan nyata.</p></div>
      <div class="grid-tiga">
        <article class="kartu-cerita"><div class="sampul">${lumbungSampul('padi')}</div><div class="isi"><span class="label-ilustrasi">Ilustrasi</span><h3>Panen raya menjadi zakat fitrah</h3><p>Lumbung memasok beras premium ke BAZNAS penyalur sebelum Ramadan; peta menunjukkan rute terdekat.</p><a class="tautan-zakat" href="#peta">Lihat peta →</a></div></article>
        <article class="kartu-cerita"><div class="sampul">${ZT.I.sampul({ jenis: 'bulog' })}</div><div class="isi"><span class="label-ilustrasi">Ilustrasi</span><h3>Gagal panen, pasokan tetap aman</h3><p>Skenario penurunan hasil panen 30% di satu provinsi; model menunjukkan berapa ton yang perlu ditutup Bulog.</p><a class="tautan-zakat" href="#simulasi">Coba simulasi →</a></div></article>
        <article class="kartu-cerita"><div class="sampul">${lumbungSampul('hortikultura')}</div><div class="isi"><span class="label-ilustrasi">Ilustrasi</span><h3>Petani binaan menjadi muzaki</h3><p>${total} petani binaan menunaikan zakat panen pada 2022–2024.</p>
          <div class="grafik-mini">${data.length ? grafikBatang(data, { label: 'Petani binaan menjadi muzaki per lokasi', kiri: 150, lebar: 420, barisH: 36 }) : ''}</div></div></article>
      </div></section>
      <section style="margin-top:46px"><div class="judul-seksi" style="margin-bottom:18px"><span class="eyebrow">FAQ</span><h2>Pertanyaan umum</h2></div>
        ${faq.map((f, i) => `<details class="lipat"${i === 0 ? ' open' : ''}><summary>${f[0]}</summary><div class="isi-lipat">${f[1]}</div></details>`).join('')}
      </section>
      <div class="kontak"><span><b>Hubungi kami</b> · surel CRP</span><span>${surel ? `<a href="mailto:${U.esc(surel)}" style="color:#fff">${U.esc(surel)}</a>` : '[alamat surel CRP]'}</span></div>`;
  };

  ZT.Hal = H;
})(window.ZT);
