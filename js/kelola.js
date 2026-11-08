/* ZakaTani — halaman Kelola Data (khusus tim): masuk, unggah CSV/Excel, validasi,
 * pratinjau, sunting simpul, parameter, ekspor, kembalikan ke data awal. */
(function (ZT) {
  'use strict';
  const U = ZT.U, D = ZT.D, C = ZT.CONFIG, K = { tab: 'unggah', unggahan: null, cari: '' };

  /* ---------------------------------------------------------- akses */
  function modeAkses() {
    if (D.supabaseAktif()) return ZT.state.pengguna ? { kode: 'supabase', ok: true, teks: `Masuk sebagai <b>${U.esc(ZT.state.pengguna.email)}</b>. Perubahan disimpan ke Supabase dan terlihat oleh semua pengunjung.` }
      : { kode: 'supabase-keluar', ok: false, teks: 'Masuk dengan akun tim (Supabase) untuk menyunting data.' };
    if (ZT.state.artifactDb) {
      if (ZT.state.artifactTolak || !D.bisaTulisArtifact()) return { kode: 'artifact-baca', ok: false, teks: 'Anda hanya dapat melihat. Penyimpanan bersama hanya untuk pemilik/editor artifact ini.' };
      return { kode: 'artifact', ok: true, teks: 'Tersambung ke penyimpanan bersama artifact. Perubahan Anda terlihat oleh semua yang membuka tautan ini.' };
    }
    return { kode: 'lokal', ok: true, teks: '<b>Mode demo lokal (tanpa server).</b> Tidak ada login; perubahan hanya tersimpan di browser ini. Untuk login tim sungguhan, isi konfigurasi Supabase di <code>js/config.js</code> (lihat <code>docs/supabase.sql</code>).' };
  }

  function kotakStatus() {
    const a = modeAkses();
    const sumberTeks = { berkas: 'data/simpul.json (bawaan)', lokal: 'penyimpanan browser ini', artifact: 'penyimpanan bersama artifact', supabase: 'Supabase' }[ZT.state.sumberData];
    let form = '';
    if (a.kode === 'supabase-keluar') form = `<form class="form-masuk" id="form-masuk"><input type="email" id="m-email" placeholder="email tim" required aria-label="Email"><input type="password" id="m-sandi" placeholder="kata sandi" required aria-label="Kata sandi"><button class="btn btn-utama btn-kecil">Masuk</button></form>`;
    if (a.kode === 'supabase') form = `<button class="btn btn-garis btn-kecil" id="btn-keluar">Keluar</button>`;
    return `<div class="status-masuk${a.ok ? ' ok' : ''}"><span class="titik"></span><div style="flex:1;min-width:240px">${a.teks}<br><small class="catatan">Data aktif dari: ${sumberTeks} · diperbarui ${U.esc((ZT.state.data.meta || {}).diperbarui || '–')}</small></div>${form}</div>`;
  }

  /* ---------------------------------------------------------- render */
  K.render = () => {
    const box = U.$('#isi-kelola'), a = modeAkses();
    const tabs = [['unggah', 'Unggah CSV/Excel'], ['sunting', 'Sunting simpul'], ['parameter', 'Parameter'], ['ekspor', 'Ekspor & cadangan']];
    box.innerHTML = kotakStatus() + `<div class="tab-bar" role="tablist">${tabs.map(([k, t]) => `<button role="tab" aria-selected="${K.tab === k}" data-tab="${k}">${t}</button>`).join('')}</div><div id="isi-tab"></div>`;
    U.$$('[data-tab]', box).forEach((b) => b.addEventListener('click', () => { K.tab = b.dataset.tab; K.render(); }));
    const fm = U.$('#form-masuk'); if (fm) fm.addEventListener('submit', masuk);
    const bk = U.$('#btn-keluar'); if (bk) bk.addEventListener('click', keluar);
    ({ unggah: tabUnggah, sunting: tabSunting, parameter: tabParameter, ekspor: tabEkspor })[K.tab](U.$('#isi-tab'), a.ok);
  };

  async function masuk(e) {
    e.preventDefault();
    try {
      const sb = await D.supabase();
      const { data, error } = await sb.auth.signInWithPassword({ email: U.$('#m-email').value, password: U.$('#m-sandi').value });
      if (error) throw error;
      ZT.state.pengguna = data.user; U.toast('Berhasil masuk.'); K.render();
    } catch (err) { U.toast('Gagal masuk: ' + err.message); }
  }
  async function keluar() { const sb = await D.supabase(); await sb.auth.signOut(); ZT.state.pengguna = null; K.render(); }

  async function simpanDanSegarkan(pesan) {
    try {
      const ke = await D.simpan();
      U.toast(pesan + ' Tersimpan di ' + ({ lokal: 'browser ini', artifact: 'penyimpanan bersama', supabase: 'Supabase' }[ke] || ke) + '.');
    } catch (e) { U.toast('Gagal menyimpan: ' + e.message, 5000); }
    ZT.App.segarkanSemua(); K.render();
  }

  /* ---------------------------------------------------------- unggah */
  function tabUnggah(el, bolehTulis) {
    el.innerHTML = `
      <p>Unggah berkas <b>.csv</b> atau <b>.xlsx</b> berisi tabel simpul (satu baris = satu simpul). Kolom wajib: <code>${C.kolomWajib.join(', ')}</code>.
      Kolom angka didampingi <code>status_&lt;kolom&gt;</code> berisi <code>asli</code> atau <code>contoh</code>; sumber di <code>sumber_url</code> (pisahkan dengan <code>|</code>).</p>
      <div class="baris-aksi"><button class="btn btn-garis btn-kecil" id="btn-templat">${U.ikon('unduh')} Unduh templat (data saat ini)</button></div>
      <label class="zona-unggah" id="zona-unggah" tabindex="0"><input type="file" id="berkas-unggah" accept=".csv,.xlsx,.xls,text/csv" class="sr-only">
        <div style="font-size:40px;line-height:1;color:var(--hijau-padi)">⬆</div><b>Seret berkas ke sini atau klik untuk memilih</b><div class="catatan">CSV (koma/titik koma) atau Excel (lembar pertama)</div></label>
      <div id="hasil-unggah"></div>`;
    U.$('#btn-templat').addEventListener('click', () => ZT.E.simpanBerkas('zakatani-simpul-templat.csv', D.eksporSimpulCSV(), 'text/csv'));
    const zona = U.$('#zona-unggah'), inp = U.$('#berkas-unggah');
    inp.addEventListener('change', () => inp.files[0] && baca(inp.files[0]));
    zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('seret'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('seret'));
    zona.addEventListener('drop', (e) => { e.preventDefault(); zona.classList.remove('seret'); if (e.dataTransfer.files[0]) baca(e.dataTransfer.files[0]); });
    zona.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
    if (K.unggahan) laporan(bolehTulis);

    async function baca(f) {
      try {
        const tabel = /\.xlsx?$/i.test(f.name) ? await D.parseExcel(await f.arrayBuffer()) : D.parseCSV(await f.text());
        K.unggahan = { nama: f.name, ...D.validasi(tabel), jumlah: tabel.baris.length };
        laporan(bolehTulis);
      } catch (e) { U.toast('Berkas tidak bisa dibaca: ' + e.message, 5000); }
    }
  }

  function laporan(bolehTulis) {
    const u = K.unggahan, box = U.$('#hasil-unggah');
    const galat = u.galat.slice(0, 30).map((g) => `<div class="galat">✕ ${U.esc(g)}</div>`).join('') + (u.galat.length > 30 ? `<div class="galat">… dan ${u.galat.length - 30} galat lain</div>` : '');
    const per = u.peringatan.slice(0, 20).map((g) => `<div class="peringatan">! ${U.esc(g)}</div>`).join('') + (u.peringatan.length > 20 ? `<div class="peringatan">… dan ${u.peringatan.length - 20} peringatan lain</div>` : '');
    const ok = !u.galat.length;
    const hitung = (j) => u.simpul.filter((s) => s.jenis === j).length;
    box.innerHTML = `<h3 style="margin-top:24px;font-size:19px">Hasil pemeriksaan: ${U.esc(u.nama)}</h3>
      <div class="laporan">${ok ? `<div class="ok">✓ ${u.jumlah} baris lolos pemeriksaan kolom wajib (${hitung('lumbung')} lumbung, ${hitung('penggilingan')} penggilingan, ${hitung('baznas')} BAZNAS, ${hitung('bulog')} Bulog).</div>` : ''}${galat}${per}</div>
      <h4>Pratinjau (${Math.min(30, u.simpul.length)} dari ${u.simpul.length} baris)</h4>
      <div class="gulir-tabel"><table class="tabel"><thead><tr><th>id</th><th>jenis</th><th>nama</th><th>provinsi</th><th class="angka">lat</th><th class="angka">lon</th><th>presisi</th><th class="angka">kapasitas</th><th class="angka">kebutuhan</th><th>angka contoh</th></tr></thead><tbody>
      ${u.simpul.slice(0, 30).map((s) => `<tr><td>${U.esc(s.id)}</td><td>${U.esc(s.jenis)}</td><td>${U.esc(s.nama)}</td><td>${U.esc(s.provinsi || '')}</td><td class="angka">${s.lat ?? ''}</td><td class="angka">${s.lon ?? ''}</td><td>${U.esc(s.presisi_lokasi || '')}</td><td class="angka">${s.kapasitas_ton ?? ''}</td><td class="angka">${s.kebutuhan_ton ?? ''}</td><td>${Object.values(s.status).filter((x) => x === 'contoh').length}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="baris-aksi">
        <label class="label-cek" style="margin:0"><input type="radio" name="mode-unggah" value="gabung" checked> Gabungkan: perbarui simpul ber-id sama, tambah yang baru</label>
        <label class="label-cek" style="margin:0"><input type="radio" name="mode-unggah" value="ganti"> Ganti seluruh data simpul</label>
      </div>
      <div class="baris-aksi"><button class="btn btn-utama" id="btn-simpan-unggah" ${ok && bolehTulis ? '' : 'disabled'}>Simpan data</button><button class="btn-teks" id="btn-batal-unggah">Batal</button>
      ${!ok ? '<span class="catatan">Perbaiki galat dulu, lalu unggah ulang.</span>' : !bolehTulis ? '<span class="catatan">Anda tidak punya akses menyimpan.</span>' : ''}</div>`;
    U.$('#btn-batal-unggah').addEventListener('click', () => { K.unggahan = null; K.render(); });
    const bs = U.$('#btn-simpan-unggah');
    bs.addEventListener('click', () => {
      const mode = (U.$('input[name="mode-unggah"]:checked') || {}).value;
      if (mode === 'ganti') ZT.state.data.simpul = u.simpul;
      else {
        const peta = new Map(ZT.state.data.simpul.map((s) => [s.id, s]));
        u.simpul.forEach((s) => peta.set(s.id, Object.assign({}, peta.get(s.id) || {}, s)));
        ZT.state.data.simpul = [...peta.values()];
      }
      const ids = new Set(ZT.state.data.simpul.map((s) => s.id));
      ZT.state.data.alur = (ZT.state.data.alur || []).filter((a) => ids.has(a.dari) && ids.has(a.ke));
      K.unggahan = null;
      simpanDanSegarkan(`${u.simpul.length} simpul diterapkan (${mode}).`);
    });
  }

  /* ---------------------------------------------------------- sunting */
  function tabSunting(el, bolehTulis) {
    const q = K.cari.toLowerCase();
    const daftar = D.simpul().filter((s) => !q || [s.id, s.nama, s.provinsi, s.jenis].join(' ').toLowerCase().includes(q));
    el.innerHTML = `<div class="baris-aksi"><input type="text" id="cari-simpul" placeholder="Cari id, nama, provinsi…" value="${U.esc(K.cari)}" style="min-width:260px" aria-label="Cari simpul">
      <button class="btn btn-utama btn-kecil" id="btn-tambah" ${bolehTulis ? '' : 'disabled'}>+ Tambah simpul</button><span class="catatan">${daftar.length} simpul</span></div>
      <div class="gulir-tabel" style="max-height:560px"><table class="tabel"><thead><tr><th>id</th><th>jenis</th><th>nama</th><th>provinsi</th><th>presisi</th><th class="angka">angka asli</th><th class="angka">angka contoh</th><th>sumber</th><th></th></tr></thead><tbody>
      ${daftar.map((s) => { const st = Object.values(s.status || {}); return `<tr><td>${U.esc(s.id)}</td><td>${U.esc(s.jenis)}${s.tingkat_baznas ? ' · ' + s.tingkat_baznas : ''}</td><td>${U.esc(s.nama)}</td><td>${U.esc(s.provinsi || '')}</td><td>${U.esc(s.presisi_lokasi)}</td><td class="angka">${st.filter((x) => x === 'asli').length}</td><td class="angka">${st.filter((x) => x === 'contoh').length}</td><td>${(s.sumber || []).filter((x) => x.url).length} URL</td><td><button class="btn-teks" data-sunting="${U.esc(s.id)}">${bolehTulis ? 'Sunting' : 'Lihat'}</button></td></tr>`; }).join('')}
      </tbody></table></div>`;
    U.$('#cari-simpul').addEventListener('input', U.debounce((e) => { K.cari = e.target.value; tabSunting(el, bolehTulis); U.$('#cari-simpul').focus(); }, 250));
    U.$('#btn-tambah').addEventListener('click', () => formSimpul(null, bolehTulis));
    U.$$('[data-sunting]', el).forEach((b) => b.addEventListener('click', () => formSimpul(D.byId(b.dataset.sunting), bolehTulis)));
  }

  function formSimpul(s, bolehTulis) {
    const baru = !s;
    s = s || { id: '', jenis: 'lumbung', nama: '', presisi_lokasi: 'kabupaten', status: {}, sumber: [], perlu_verifikasi: [] };
    const teks = (k, lbl, tipe = 'text') => `<label>${lbl}<input type="${tipe}" name="${k}" value="${U.esc(s[k] == null ? '' : s[k])}" ${tipe === 'number' ? 'step="any"' : ''}></label>`;
    const pilih = (k, lbl, opsi) => `<label>${lbl}<select name="${k}">${opsi.map((o) => `<option ${String(s[k] || '') === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
    const angka = (k, lbl) => `<label>${lbl}<span class="isian-status"><input type="${k === 'musim_panen' ? 'text' : 'number'}" step="any" name="${k}" value="${U.esc(k === 'musim_panen' ? (s[k] || []).join(';') : (s[k] == null ? '' : s[k]))}" ${k === 'musim_panen' ? 'placeholder="mis. 3;4;8"' : ''}>
      <select name="status_${k}" aria-label="Status ${lbl}"><option value="contoh" ${U.statusField(s, k) !== 'asli' ? 'selected' : ''}>contoh</option><option value="asli" ${U.statusField(s, k) === 'asli' ? 'selected' : ''}>asli</option></select></span></label>`;
    U.modal(`<h3>${baru ? 'Tambah simpul' : 'Sunting ' + U.esc(s.nama)}</h3>
      <form id="form-simpul"><div class="form-grid">
        ${teks('id', 'id (unik)')}${pilih('jenis', 'jenis', C.jenisValid)}
        <div class="penuh">${teks('nama', 'nama')}</div>
        ${pilih('tingkat_baznas', 'tingkat BAZNAS (khusus BAZNAS)', ['', 'ri', 'provinsi', 'kabupaten'])}${teks('komoditas', 'komoditas (padi | jagung | hortikultura)')}
        ${teks('desa', 'desa')}${teks('kecamatan', 'kecamatan')}${teks('kabupaten', 'kabupaten/kota')}${teks('provinsi', 'provinsi')}
        ${teks('lat', 'lat', 'number')}${teks('lon', 'lon', 'number')}${pilih('presisi_lokasi', 'presisi lokasi', C.presisiValid)}${teks('pengelola', 'pengelola')}
        ${angka('petani', 'jumlah petani')}${angka('luas_ha', 'luas lahan (ha)')}${angka('panen_ton', 'hasil panen (ton)')}${angka('tahun_mulai', 'tahun mulai')}
        ${angka('kapasitas_ton', 'kapasitas pasok (ton beras)')}${angka('stok_simpan_ton', 'stok simpan (ton)')}${angka('musim_panen', 'musim panen (bulan 1–12)')}${angka('kebutuhan_ton', 'kebutuhan BAZNAS (ton)')}
        <label class="penuh">sumber (satu per baris: label | URL)<textarea name="sumber" rows="4">${U.esc((s.sumber || []).map((x) => (x.label || '') + ' | ' + (x.url || '')).join('\n'))}</textarea></label>
        <label class="penuh">kolom perlu verifikasi (pisah titik koma)<input name="perlu_verifikasi" value="${U.esc((s.perlu_verifikasi || []).join(';'))}"></label>
        <label class="penuh">catatan<textarea name="catatan" rows="2">${U.esc(s.catatan || '')}</textarea></label>
      </div>
      <div class="laporan" id="galat-form"></div>
      <div class="baris-aksi"><button class="btn btn-utama btn-kecil" type="submit" ${bolehTulis ? '' : 'disabled'}>Simpan</button>
        ${!baru && bolehTulis ? '<button class="btn btn-garis btn-kecil" type="button" id="btn-hapus-simpul">Hapus simpul</button>' : ''}<button class="btn-teks" type="button" data-tutup>Batal</button></div></form>`, (m, tutup) => {
      const f = m.querySelector('#form-simpul');
      const hapus = m.querySelector('#btn-hapus-simpul');
      if (hapus) hapus.addEventListener('click', () => {
        if (hapus.dataset.yakin !== '1') { hapus.dataset.yakin = '1'; hapus.textContent = 'Klik lagi untuk menghapus'; return; }
        ZT.state.data.simpul = ZT.state.data.simpul.filter((x) => x.id !== s.id);
        ZT.state.data.alur = (ZT.state.data.alur || []).filter((a) => a.dari !== s.id && a.ke !== s.id);
        tutup(); simpanDanSegarkan('Simpul dihapus.');
      });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(f), g = (k) => (fd.get(k) || '').toString().trim();
        // Susun ulang sebagai satu baris tabel lalu pakai validator yang sama dengan unggahan.
        const r = {}; D.KOLOM.forEach((k) => { r[k] = g(k); });
        const lines = g('sumber').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split('|').map((y) => (y || '').trim()); return { label: a, url: b }; });
        r.sumber_url = lines.map((x) => x.url || '').join(' | '); r.sumber_label = lines.map((x) => x.label || '').join(' | ');
        const v = D.validasi({ kepala: D.KOLOM, baris: [r] });
        const lain = ZT.state.data.simpul.filter((x) => x.id !== s.id);
        if (lain.some((x) => x.id === r.id)) v.galat.push('id sudah dipakai simpul lain.');
        if (v.galat.length) { m.querySelector('#galat-form').innerHTML = v.galat.map((x) => `<div class="galat">✕ ${U.esc(x.replace(/^Baris 2[^:]*: /, ''))}</div>`).join(''); return; }
        const hasil = v.simpul[0];
        if (!baru && s.id !== hasil.id) (ZT.state.data.alur || []).forEach((a) => { if (a.dari === s.id) a.dari = hasil.id; if (a.ke === s.id) a.ke = hasil.id; });
        ZT.state.data.simpul = baru ? lain.concat([hasil]) : ZT.state.data.simpul.map((x) => (x.id === s.id ? hasil : x));
        tutup(); simpanDanSegarkan(baru ? 'Simpul ditambahkan.' : 'Simpul diperbarui.' + (v.peringatan.length ? ' (' + v.peringatan.length + ' peringatan)' : ''));
      });
    });
  }

  /* ---------------------------------------------------------- parameter */
  function tabParameter(el, bolehTulis) {
    const P = ZT.state.data.parameter;
    el.innerHTML = `<p>Parameter global dipakai model alokasi dan dicatat di halaman Metodologi. Nilai di layar Simulasi dapat diubah sementara; nilai di sini menjadi nilai awal.</p>
      <form id="form-param"><table class="tabel" style="max-width:760px"><thead><tr><th>Parameter</th><th>Nilai</th><th>Satuan</th><th>Status</th></tr></thead><tbody>
      ${Object.entries(P).map(([k, p]) => `<tr><td>${U.esc(p.label || k)}<br><small class="catatan">${k}</small></td><td><input type="number" step="any" name="${k}" value="${p.nilai == null ? '' : p.nilai}" ${k === 'kapasitas_bulog_ton' ? 'placeholder="tak terbatas"' : ''} aria-label="${U.esc(p.label || k)}"></td><td>${U.esc(p.satuan || '')}</td>
        <td><select name="status_${k}" aria-label="Status ${U.esc(p.label || k)}"><option value="contoh" ${p.status === 'contoh' ? 'selected' : ''}>contoh</option><option value="asli" ${p.status === 'asli' ? 'selected' : ''}>asli</option></select></td></tr>`).join('')}
      </tbody></table><div class="baris-aksi"><button class="btn btn-utama btn-kecil" ${bolehTulis ? '' : 'disabled'}>Simpan parameter</button></div></form>`;
    U.$('#form-param').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      Object.keys(P).forEach((k) => { const v = fd.get(k); P[k].nilai = v === '' ? null : +v; P[k].status = fd.get('status_' + k); });
      simpanDanSegarkan('Parameter diperbarui.');
    });
  }

  /* ---------------------------------------------------------- ekspor */
  function tabEkspor(el, bolehTulis) {
    el.innerHTML = `<div class="grid-fitur" style="grid-template-columns:repeat(3,1fr)">
      <div class="kartu-fitur"><span class="ikon">${U.ikon('db')}</span><h3>Simpul (CSV)</h3><p>Seluruh simpul beserta status asli/contoh dan sumber. Bisa diedit di Excel lalu diunggah kembali.</p><button class="btn btn-utama btn-kecil" id="eks-csv">${U.ikon('unduh')} Unduh CSV</button></div>
      <div class="kartu-fitur"><span class="ikon">${U.ikon('buku')}</span><h3>Dataset lengkap (JSON)</h3><p>Simpul, parameter, alur, statistik, dampak. Format sama dengan <code>data/simpul.json</code>.</p><button class="btn btn-utama btn-kecil" id="eks-json">${U.ikon('unduh')} Unduh JSON</button></div>
      <div class="kartu-fitur"><span class="ikon">${U.ikon('naik')}</span><h3>Kembalikan data awal</h3><p>Buang semua perubahan dan kembali ke <code>data/simpul.json</code> bawaan.</p><button class="btn btn-garis btn-kecil" id="eks-reset" ${bolehTulis ? '' : 'disabled'}>Kembalikan</button></div></div>
      <p class="catatan" style="margin-top:16px">Hasil alokasi dan perbandingan skenario diekspor (CSV/PDF) dari halaman Simulasi Alokasi.</p>`;
    U.$('#eks-csv').addEventListener('click', () => ZT.E.simpanBerkas('zakatani-simpul.csv', D.eksporSimpulCSV(), 'text/csv'));
    U.$('#eks-json').addEventListener('click', () => ZT.E.simpanBerkas('zakatani-dataset.json', JSON.stringify(ZT.state.data, null, 1), 'application/json'));
    U.$('#eks-reset').addEventListener('click', async (e) => {
      const b = e.currentTarget;
      if (b.dataset.yakin !== '1') { b.dataset.yakin = '1'; b.textContent = 'Klik lagi untuk memastikan'; return; }
      await D.kembalikanAwal(); ZT.App.segarkanSemua(); U.toast('Data dikembalikan ke data awal.'); K.render();
    });
  }

  ZT.Kelola = K;
})(window.ZT);
