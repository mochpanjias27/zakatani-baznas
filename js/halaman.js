/* ZakaTani — halaman informasi: Beranda, Alur, Profil, Dampak, Tentang & Metodologi. */
(function (ZT) {
  'use strict';
  const U = ZT.U, H = {};

  /* =============================== BERANDA =============================== */
  H.beranda = () => {
    U.$('#ilustrasi-hero').innerHTML = ZT.I.hero();
    U.$('#ilustrasi-cerita').innerHTML = ZT.I.cerita() + `<div class="lencana-mengambang"><b data-hitung="735">735</b><span style="font-size:13px;font-weight:700;line-height:1.3">petani binaan<br><small style="font-weight:600;color:#585C54">Lumbung Pangan, 2025</small></span></div>`;
    const st = ZT.state.data.statistik, lumbung = ZT.D.jenis('lumbung');
    const prov = new Set(lumbung.map((l) => l.provinsi).filter(Boolean)).size;
    const src = (s) => s && s.sumber && s.sumber[0] ? `Sumber: <a href="${U.esc(s.sumber[0].url)}" target="_blank" rel="noopener">${U.esc(s.sumber[0].label.split(':')[0])}</a>` : '';
    const kartu = [
      { ikon: 'padi', angka: lumbung.length, label: 'Titik Lumbung Pangan', sumber: `Data peta ZakaTani · ${src(st.lokasi_nasional)} (21 lokasi)` },
      { ikon: 'peta', angka: prov, label: 'Provinsi', sumber: `Dihitung dari data peta (termasuk Papua) · berita menyebut ${st.lokasi_nasional ? st.lokasi_nasional.provinsi : '–'} provinsi` },
      { ikon: 'tangan', angka: st.penerima_zakat_fitrah ? st.penerima_zakat_fitrah.nilai : null, label: 'Mustahik penerima zakat fitrah (target jiwa)', sumber: src(st.penerima_zakat_fitrah) + ' · beras dari lumbung + Bulog' },
      { ikon: 'naik', angka: st.petani_muzaki ? st.petani_muzaki.nilai : null, label: 'Petani binaan menjadi muzaki (2022–2024)', sumber: src(st.petani_muzaki), sorot: true }
    ];
    U.$('#kartu-statistik').innerHTML = kartu.map((k) => `<div class="kartu-stat${k.sorot ? ' sorot' : ''}"><span class="ikon">${U.ikon(k.ikon)}</span>
      <span class="angka" data-hitung="${k.angka == null ? 0 : k.angka}">${k.angka == null ? '–' : U.angka(k.angka, 0)}</span><span class="label">${k.label}</span><span class="sumber">${k.sumber}</span></div>`).join('');
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
      case 'panen': return { judul: 'Lumbung dengan data panen atau musim panen', simpul: L.filter((l) => l.panen_ton != null || (l.musim_panen && l.musim_panen.length)), ket: 'Musim panen sebagian besar masih data contoh; hasil panen yang tercatat berlabel asli.' };
      case 'giling': {
        const tanpa = new Set(ZT.M.tanpaPenggilingan(L, ZT.D.jenis('penggilingan'), R).map((l) => l.id));
        return { judul: `Lumbung dengan penggilingan terdaftar dalam radius ${R} km`, simpul: L.filter((l) => !tanpa.has(l.id)).concat(ZT.D.jenis('penggilingan')), ket: `${tanpa.size} lumbung belum punya penggilingan terdaftar dalam radius ${R} km; peluang lokasi penggilingan baru (lihat Simulasi).` };
      }
      case 'salur': {
        const ids = new Set((ZT.state.data.alur || []).map((a) => a.dari));
        return { judul: 'Lumbung pemasok beras zakat fitrah (alur tercatat)', simpul: L.filter((l) => ids.has(l.id)), ket: 'Alur Sukabumi → BAZNAS RI terdokumentasi; tujuan alur lainnya perlu verifikasi.' };
      }
      default: return { judul: 'Kantor BAZNAS penyalur zakat fitrah', simpul: ZT.D.jenis('baznas'), ket: 'BAZNAS RI, provinsi, dan kabupaten/kota di wilayah lumbung. Kebutuhan beras masih data contoh.' };
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

  /* ================================ PROFIL ================================ */
  const fp = { kom: new Set(), cari: '' };
  H.profil = () => {
    const grid = U.$('#grid-profil');
    const daftar = ZT.D.jenis('lumbung').filter((s) => {
      if (fp.kom.size && !fp.kom.has(s.komoditas || 'kosong')) return false;
      if (fp.cari) { const q = fp.cari.toLowerCase(); if (![s.nama, s.desa, s.kecamatan, s.kabupaten, s.provinsi, s.pengelola].join(' ').toLowerCase().includes(q)) return false; }
      return true;
    });
    grid.innerHTML = daftar.length ? daftar.map((s) => {
      const lok = [s.desa && 'Desa ' + s.desa, s.kecamatan && 'Kec. ' + s.kecamatan, s.kabupaten, s.provinsi].filter(Boolean).join(', ');
      const src = (s.sumber || []).find((x) => x.url && !/github/.test(x.url));
      return `<article class="kartu-profil"><div class="sampul" role="img" aria-label="Ilustrasi komoditas ${U.esc(s.komoditas || 'belum ada data')}">${ZT.I.sampul(s)}<span class="label-kom">${U.esc(s.komoditas || 'komoditas belum ada data')}</span></div>
        <div class="isi"><h3>${U.esc(s.nama)}</h3><div class="lokasi">${U.ikon('pin')} ${U.esc(lok)}${s.presisi_lokasi !== 'desa' ? ` <small>(titik peta: presisi ${U.esc(s.presisi_lokasi)})</small>` : ''}</div>
        <div class="mini"><div><b>${U.nilaiRingkas(s, 'petani')}</b><span>petani</span></div><div><b>${U.nilaiRingkas(s, 'luas_ha', 1)}</b><span>ha lahan</span></div><div><b>${U.nilaiRingkas(s, 'panen_ton', 1)}</b><span>ton panen</span></div></div>
        <div class="peng"><b>Pengelola:</b> ${U.esc(s.pengelola || 'belum ada data')}${s.tahun_mulai ? ` · <b>Mulai:</b> ${U.nilai(s, 'tahun_mulai')}` : ''}</div>
        ${s.catatan ? `<p class="catatan" style="margin-bottom:10px">${U.esc(s.catatan)}</p>` : ''}
        <div class="kaki">${src ? `<a class="src" href="${U.esc(src.url)}" target="_blank" rel="noopener">Sumber ↗</a>` : '<span class="catatan">sumber: belum ada</span>'}
        <button class="btn btn-utama btn-kecil" data-fokus="${s.id}">Lihat di peta <span class="panah" style="width:20px;height:20px">${U.ikon('panah')}</span></button></div></div></article>`;
    }).join('') : '<p class="kosong">Tidak ada lumbung yang cocok dengan filter.</p>';
    U.$$('#grid-profil [data-fokus]').forEach((b) => b.addEventListener('click', () => ZT.Peta.fokus(b.dataset.fokus)));
  };
  H.pasangProfil = () => {
    U.$$('[data-p-kom]').forEach((b) => b.addEventListener('click', () => { const v = b.dataset.pKom; fp.kom.has(v) ? fp.kom.delete(v) : fp.kom.add(v); b.setAttribute('aria-pressed', fp.kom.has(v)); H.profil(); }));
    U.$('#p-cari').addEventListener('input', U.debounce((e) => { fp.cari = e.target.value.trim(); H.profil(); }, 200));
  };

  /* ================================ DAMPAK ================================ */
  function grafikBatang(data, opsi) {
    const w = 640, barisH = 46, kiri = opsi.kiri || 170, atas = 10, h = atas + data.length * barisH + 30;
    const maks = Math.max(...data.map((d) => d.nilai), 1), lebar = w - kiri - 70;
    let g = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${U.esc(opsi.label)}">`;
    for (let t = 0; t <= 4; t++) { const x = kiri + (lebar * t) / 4; g += `<line x1="${x}" y1="${atas}" x2="${x}" y2="${h - 26}" stroke="#E5DDCA"/><text x="${x}" y="${h - 8}" font-size="11" fill="#585C54" text-anchor="middle">${U.angka((maks * t) / 4, 0)}</text>`; }
    data.forEach((d, i) => {
      const y = atas + i * barisH + 8, bw = Math.max(2, (lebar * d.nilai) / maks);
      g += `<text x="${kiri - 12}" y="${y + 19}" font-size="13.5" font-weight="700" fill="#2B2B2B" text-anchor="end">${U.esc(d.label)}</text>`;
      g += `<rect x="${kiri}" y="${y}" width="${bw}" height="28" rx="6" fill="${i === 0 ? '#1F5E3B' : opsi.warna || '#4E8F3A'}"><title>${U.esc(d.label)}: ${d.nilai}</title></rect>`;
      g += `<text x="${kiri + bw + 8}" y="${y + 19}" font-size="14" font-weight="800" fill="#1F5E3B">${U.angka(d.nilai, 0)}${d.contoh ? ' (contoh)' : ''}</text>`;
    });
    return g + '</svg>';
  }

  H.dampak = () => {
    const dp = ZT.state.data.dampak, st = ZT.state.data.statistik;
    const data = (dp ? dp.data : []).slice().sort((a, b) => b.nilai - a.nilai).map((d) => ({ label: d.lokasi, nilai: d.nilai }));
    const total = data.reduce((t, d) => t + d.nilai, 0);
    const petani = ZT.D.jenis('lumbung').filter((l) => l.petani != null && !(U.isContoh(l, 'petani') && U.hanyaAsli())).sort((a, b) => b.petani - a.petani)
      .map((l) => ({ label: l.nama.replace('Lumbung Pangan ', ''), nilai: l.petani, contoh: U.isContoh(l, 'petani') }));
    U.$('#isi-dampak').innerHTML = `
      <div class="dua-kolom">
        <div class="grafik-wrap"><span class="eyebrow">Muzaki baru</span><h2 style="font-size:24px">${U.esc(dp ? dp.judul : '')}</h2>
          ${data.length ? grafikBatang(data, { label: 'Grafik batang petani binaan menjadi muzaki per lokasi', kiri: 170 }) : '<p class="kosong">belum ada data</p>'}
          <p class="catatan" style="margin-top:12px">${U.esc(dp ? dp.catatan : '')}</p><div class="sub-judul">Sumber</div>${U.sumberHTML(dp ? dp.sumber : [])}</div>
        <div>
          <div class="kartu-stat sorot" style="margin-bottom:18px"><span class="ikon">${U.ikon('naik')}</span><span class="angka" data-hitung="${total}">${total}</span><span class="label">petani binaan menjadi muzaki, 2022–2024</span>
            <span class="sumber">Dari ${data.length} lokasi · ${st.petani_muzaki ? `<a href="${U.esc(st.petani_muzaki.sumber[0].url)}" target="_blank" rel="noopener">ANTARA</a>` : ''}</span></div>
          <div class="kartu-stat"><span class="ikon">${U.ikon('petani')}</span><span class="angka" data-hitung="${st.petani_binaan_nasional ? st.petani_binaan_nasional.nilai : 0}">–</span><span class="label">petani binaan Lumbung Pangan BAZNAS (2025)</span>
            <span class="sumber">${st.petani_binaan_nasional ? `<a href="${U.esc(st.petani_binaan_nasional.sumber[0].url)}" target="_blank" rel="noopener">ANTARA Megapolitan</a>` : ''}</span></div>
          <div class="kotak-peringatan" style="margin-top:18px"><b>Dari mustahik menjadi muzaki.</b> Petani menjadi muzaki saat penghasilannya mencapai nisab zakat pertanian. Indikator ini dipantau bersama had kifayah oleh pendamping.</div>
        </div>
      </div>
      <div class="grafik-wrap" style="margin-top:26px"><span class="eyebrow">Skala program</span><h2 style="font-size:22px">Petani binaan per lumbung (yang sudah berdata)</h2>
        ${petani.length ? grafikBatang(petani, { label: 'Grafik batang petani binaan per lumbung', kiri: 220, warna: '#8A6440' }) : '<p class="kosong">belum ada data</p>'}
        <p class="catatan">Hanya lumbung yang jumlah petaninya tercatat. Sebagian angka masih perlu verifikasi (lihat Profil Lumbung).</p></div>`;
    U.hitungNaik(U.$('#isi-dampak'));
  };

  /* ================================ TENTANG ================================ */
  H.tentang = () => {
    const P = ZT.state.data.parameter;
    const semuaSumber = new Map();
    ZT.D.simpul().forEach((s) => (s.sumber || []).forEach((x) => { if (x.url) semuaSumber.set(x.url, x.label); }));
    Object.values(ZT.state.data.statistik || {}).forEach((s) => (s.sumber || []).forEach((x) => semuaSumber.set(x.url, x.label)));
    const baris = Object.entries(P).map(([k, p]) => `<tr><td>${U.esc(p.label || k)}</td><td class="angka">${p.nilai == null ? 'tak terbatas' : U.angka(p.nilai, 2) + ' ' + U.esc(p.satuan || '')}</td><td>${p.status === 'contoh' ? U.lencanaContoh() : 'asli'}</td></tr>`).join('');
    U.$('#isi-tentang').innerHTML = `
      <h2 style="margin-top:0">Tujuan riset</h2>
      <p>ZakaTani dilampirkan pada proposal <b>Beasiswa Riset BAZNAS 2026, Kategori Kelompok Riset, Klaster B.7 Lumbung Pangan</b>. Riset ini memetakan dan menganalisis rantai pasok Lumbung Pangan (lumbung → penggilingan → BAZNAS penyalur → mustahik), lalu menghitung alokasi pasokan beras zakat fitrah yang paling hemat. Tujuannya membantu amil mengambil keputusan berbasis data dan memperkuat semangat program: <i>Lumbung Pangan BAZNAS Berdaya, Umat Berjaya</i>.</p>
      <ol><li>Memetakan simpul rantai pasok beserta presisi lokasinya.</li><li>Menghitung alokasi optimal beras zakat fitrah dari lumbung ke BAZNAS.</li><li>Mengukur ketahanan rantai pasok terhadap gagal panen, jadwal Ramadan, dan perubahan kebutuhan.</li><li>Menunjukkan lokasi penggilingan baru yang paling menurunkan ongkos.</li></ol>

      <h2>Tim peneliti</h2>
      <div class="grid-tim">
        <div class="kartu-tim"><div class="avatar">${U.ikon('orang')}</div><b>[Nama Ketua Peneliti]</b><span>Ketua · pemodelan optimasi</span></div>
        <div class="kartu-tim"><div class="avatar">${U.ikon('orang')}</div><b>[Nama Anggota 1]</b><span>Anggota · rantai pasok &amp; zakat</span></div>
        <div class="kartu-tim"><div class="avatar">${U.ikon('orang')}</div><b>[Nama Anggota 2]</b><span>Anggota · sistem informasi geografis</span></div>
      </div>
      <p class="catatan" style="margin-top:8px">Nama dan afiliasi diisi tim sebelum proposal dikirim.</p>

      <h2>Model optimasi alokasi</h2>
      <p>Model transportasi (pemrograman linear) dengan Perum Bulog sebagai pemasok cadangan berongkos lebih tinggi, agar model selalu punya solusi dan kekurangan pasokan lumbung terlihat jelas.</p>
      <div class="rumus">
        Minimumkan&nbsp; Z = Σ<sub>i</sub> Σ<sub>j</sub> c<sub>ij</sub> x<sub>ij</sub> + Σ<sub>j</sub> c<sub>B</sub> b<sub>j</sub> + Σ<sub>j</sub> M u<sub>j</sub><br>
        dengan&nbsp; Σ<sub>j</sub> x<sub>ij</sub> ≤ S<sub>i</sub> &nbsp;&nbsp;(kapasitas pasok lumbung i)<br>
        &emsp;&emsp;&emsp;&nbsp; Σ<sub>i</sub> x<sub>ij</sub> + b<sub>j</sub> + u<sub>j</sub> ≥ D<sub>j</sub> &nbsp;&nbsp;(kebutuhan beras zakat fitrah BAZNAS j)<br>
        &emsp;&emsp;&emsp;&nbsp; Σ<sub>j</sub> b<sub>j</sub> ≤ K<sub>B</sub> &nbsp;(opsional), &nbsp; x<sub>ij</sub>, b<sub>j</sub>, u<sub>j</sub> ≥ 0<br>
        c<sub>ij</sub> = jarak<sub>ij</sub> × faktor jalan × tarif per ton-km
      </div>
      <ul>
        <li><b>x<sub>ij</sub></b>: ton beras dari lumbung i ke BAZNAS j; <b>b<sub>j</sub></b>: pasokan Bulog ke BAZNAS j; <b>u<sub>j</sub></b>: kebutuhan tak terpenuhi (penalti M sangat besar; hanya muncul bila Bulog dibatasi).</li>
        <li><b>jarak<sub>ij</sub></b>: jarak garis lurus haversine. Bila opsi "harus digiling" aktif: min<sub>k</sub>[jarak(i,k) + jarak(k,j)] atas penggilingan terdaftar dan calon.</li>
        <li><b>S<sub>i</sub></b> = kapasitas × (1 − penurunan hasil panen). Dengan skenario Ramadan: kapasitas dipakai hanya bila ada bulan panen 1 sampai W bulan sebelum Ramadan (W = lama simpan); bila tidak, lumbung memasok dari stok simpan.</li>
        <li><b>D<sub>j</sub></b> = kebutuhan × (1 + perubahan kebutuhan).</li>
        <li><b>Pembanding pola saat ini</b>: model yang sama, tetapi semua beras lumbung lewat BAZNAS RI (Jakarta) sebelum diteruskan ke BAZNAS j.</li>
        <li>Dipecahkan di browser dengan <i>javascript-lp-solver</i> (simpleks). Urutan variabel tetap, jadi data yang sama memberi hasil yang sama.</li>
      </ul>
      <h3>Parameter global (bisa diubah di layar Simulasi &amp; Kelola Data)</h3>
      <table class="tabel" style="max-width:640px"><thead><tr><th>Parameter</th><th class="angka">Nilai</th><th>Status</th></tr></thead><tbody>${baris}</tbody></table>

      <h2>Data dan koordinat</h2>
      <ul>
        <li>Data simpul dan parameter disimpan terpisah dari kode (<code>data/simpul.json</code>, atau Supabase bila dikonfigurasi).</li>
        <li>Setiap angka berstatus <b>asli</b> (bersumber, minimal satu URL) atau <b>contoh</b> (sementara, berlabel ${U.lencanaContoh()}). Mode <b>Hanya data asli</b> menyembunyikan semua angka contoh.</li>
        <li>Koordinat tidak ditebak. Titik desa dipakai bila sudah terverifikasi; sementara ini semua simpul memakai titik acuan kabupaten/kota (atau centroid provinsi untuk Papua), dengan presisi ditandai garis tepi putus-putus.</li>
        <li>Angka berlabel <span class="lencana-verif">perlu verifikasi</span> berasal dari brief tim (sumber publik) dan URL angkanya belum dilengkapi.</li>
      </ul>
      <h3>Sumber data</h3>${U.sumberHTML([...semuaSumber].map(([url, label]) => ({ url, label })))}

      <h2>Asumsi dan keterbatasan</h2>
      <ul>
        <li>Jarak garis lurus × faktor jalan belum menggambarkan rute sebenarnya, termasuk penyeberangan laut antarpulau. Tarif tunggal per ton-km belum membedakan moda.</li>
        <li>Bulog diasumsikan memasok dari gudang setempat dengan ongkos rata per ton.</li>
        <li>Kapasitas, kebutuhan, musim panen, stok, dan tarif masih data contoh. Hasil simulasi adalah ilustrasi metode, bukan rekomendasi operasional.</li>
        <li>Komoditas non-beras (jagung, hortikultura) dan lumbung tanpa kapasitas tidak ikut model beras.</li>
        <li>Model satu periode (satu musim zakat fitrah); belum memodelkan persediaan antarperiode.</li>
      </ul>

      <h2>Tahap berikutnya (selama riset, 2 tahun)</h2>
      <ol><li>Mengganti data contoh dengan data asli BAZNAS dan hasil survei lapangan (kapasitas, kebutuhan, ongkos).</li><li>Verifikasi koordinat sampai tingkat desa.</li><li>Kalibrasi parameter model (tarif, faktor jalan, musim panen) dan validasi hasil bersama amil.</li><li>Uji pengguna dengan System Usability Scale, lalu perbaikan.</li><li>Pendaftaran HKI dan dokumentasi teknis.</li></ol>

      <h2>Disclaimer</h2>
      <div class="kotak-peringatan"><b>Prototipe riset — Beasiswa Riset BAZNAS 2026.</b> Data dari sumber publik dan dapat berubah. <b>Bukan situs resmi BAZNAS.</b> BAZNAS disebut sebagai pengelola program Lumbung Pangan, bukan pemilik website ini. Logo resmi BAZNAS tidak dipakai. Angka berlabel "contoh" bersifat sementara dan tidak boleh dikutip sebagai data resmi. Ilustrasi dibuat tim; tidak ada foto yang diambil dari situs BAZNAS atau media.</div>`;
  };

  ZT.Hal = H;
})(window.ZT);
