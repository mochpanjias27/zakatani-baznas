/* ZakaTani — titik masuk aplikasi: pemuatan data, router hash, mode terang/gelap. */
(function (ZT) {
  'use strict';
  const U = ZT.U;
  // #kelola tidak ada di menu, tetapi tetap bisa dibuka tim lewat alamat langsung.
  const HALAMAN = ['beranda', 'alur', 'peta', 'simulasi', 'profil', 'metodologi', 'tentang', 'kalkulator', 'kelola'];
  const ALIAS = { dampak: ['tentang', 'cerita-dampak'] }; // tautan lama
  const JUDUL = { beranda: 'Beranda', alur: 'Alur Rantai Pasok', peta: 'Peta', simulasi: 'Simulasi Alokasi', profil: 'Profil Lumbung', metodologi: 'Metodologi', tentang: 'Tentang & FAQ', kalkulator: 'Kalkulator Zakat', kelola: 'Kelola Data' };
  const SELALU_RENDER = ['peta', 'simulasi', 'kalkulator'];
  const sudah = new Set();
  let aktif = null;

  function render(h) {
    switch (h) {
      case 'beranda': ZT.Hal.beranda(); break;
      case 'alur': ZT.Hal.alur(); break;
      case 'peta': ZT.Peta.init().then(ZT.Peta.tampil); break;
      case 'simulasi': ZT.Simulasi.init().then(ZT.Simulasi.tampil); break;
      case 'profil': ZT.Hal.profil(); break;
      case 'metodologi': ZT.Hal.metodologi(); break;
      case 'tentang': ZT.Hal.tentang(); break;
      case 'kalkulator': ZT.Kalk.render(); break;
      case 'kelola': ZT.Kelola.render(); break;
    }
  }

  function buka() {
    let h = (location.hash || '').replace('#', '');
    if (ALIAS[h]) { ZT.state.gulirKe = ALIAS[h][1]; h = ALIAS[h][0]; history.replaceState(null, '', '#' + h); }
    if (!HALAMAN.includes(h)) h = 'beranda';
    U.$$('[data-halaman]').forEach((s) => s.classList.toggle('tersembunyi', s.dataset.halaman !== h));
    U.$$('.menu a').forEach((a) => (a.getAttribute('href') === '#' + h ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    document.title = 'ZakaTani — ' + JUDUL[h];
    U.$('#menu-utama').classList.remove('buka'); U.$('.tombol-menu').setAttribute('aria-expanded', 'false');
    if (!sudah.has(h) || SELALU_RENDER.includes(h)) { render(h); sudah.add(h); }
    if (ZT.state.gulirKe) {
      const id = ZT.state.gulirKe; ZT.state.gulirKe = null;
      setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
    } else if (aktif !== h) window.scrollTo({ top: 0 });
    aktif = h;
  }

  /* --------------------------- mode terang/gelap (No. 2) --------------------------- */
  function pasangTema(t, simpan) {
    document.documentElement.setAttribute('data-tema', t);
    U.$$('[data-tema-pilih]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.temaPilih === t));
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', t === 'gelap' ? '#10241A' : '#1F5E3B');
    if (simpan) { try { localStorage.setItem('zakatani:tema', t); } catch (e) { /* */ } }
    if (ZT.Peta && ZT.Peta.temaBerubah) ZT.Peta.temaBerubah();
  }

  ZT.App = {
    segarkanSemua: () => {
      ZT.state.hasilAwal = null;
      sudah.forEach((h) => {
        if (h === 'peta') ZT.Peta.rerender();
        else if (h === 'simulasi') ZT.Simulasi.rerender();
        else if (h !== 'kelola') render(h);
      });
    }
  };

  async function mulai() {
    pasangTema(document.documentElement.getAttribute('data-tema') || 'terang', false);
    U.$$('[data-tema-pilih]').forEach((b) => b.addEventListener('click', () => pasangTema(b.dataset.temaPilih, true)));
    // Ikuti perubahan pengaturan perangkat selama pengunjung belum memilih sendiri.
    try {
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { if (!localStorage.getItem('zakatani:tema')) pasangTema(e.matches ? 'gelap' : 'terang', false); });
    } catch (e) { /* */ }
    U.$('.tombol-menu').addEventListener('click', (e) => { const m = U.$('#menu-utama'); m.classList.toggle('buka'); e.currentTarget.setAttribute('aria-expanded', m.classList.contains('buka')); });
    document.addEventListener('click', (e) => { const a = e.target.closest('[data-gulir]'); if (a) ZT.state.gulirKe = a.dataset.gulir; });

    if (!window.L || !window.solver) {
      U.$('main').insertAdjacentHTML('afterbegin', '<div class="wadah" style="padding:20px"><div class="kotak-peringatan">Pustaka peta atau optimasi gagal dimuat dari CDN. Periksa koneksi internet lalu muat ulang halaman.</div></div>');
    }
    try { await ZT.D.muat(); }
    catch (e) { U.$('main').innerHTML = `<div class="wadah" style="padding:60px 20px"><div class="kotak-peringatan"><b>Data gagal dimuat.</b> ${U.esc(e.message)}. Buka situs lewat server web (bukan file://).</div></div>`; return; }

    ZT.Hal.pasangProfil();
    window.addEventListener('hashchange', buka);
    buka();

    const hasilSb = ZT.D.supabaseAktif() ? await ZT.D.muatSupabase() : null;
    if (hasilSb === 'dimuat') ZT.App.segarkanSemua();
    if (!ZT.D.supabaseAktif()) {
      ZT.D.hubungkanArtifact().then((r) => { if (r === 'dimuat') { ZT.App.segarkanSemua(); if (sudah.has('kelola')) ZT.Kelola.render(); } else if (sudah.has('kelola')) ZT.Kelola.render(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})(window.ZT);
