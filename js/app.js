/* ZakaTani — titik masuk aplikasi: pemuatan data, router hash, saklar "Hanya data asli". */
(function (ZT) {
  'use strict';
  const U = ZT.U;
  const HALAMAN = ['beranda', 'alur', 'peta', 'simulasi', 'profil', 'dampak', 'tentang', 'kelola'];
  const JUDUL = { beranda: 'Beranda', alur: 'Alur Rantai Pasok', peta: 'Peta', simulasi: 'Simulasi Alokasi', profil: 'Profil Lumbung', dampak: 'Dampak', tentang: 'Tentang & Metodologi', kelola: 'Kelola Data' };
  const sudah = new Set();
  let aktif = null;

  function render(h) {
    switch (h) {
      case 'beranda': ZT.Hal.beranda(); break;
      case 'alur': ZT.Hal.alur(); break;
      case 'peta': ZT.Peta.init().then(ZT.Peta.tampil); break;
      case 'simulasi': ZT.Simulasi.init().then(ZT.Simulasi.tampil); break;
      case 'profil': ZT.Hal.profil(); break;
      case 'dampak': ZT.Hal.dampak(); break;
      case 'tentang': ZT.Hal.tentang(); break;
      case 'kelola': ZT.Kelola.render(); break;
    }
  }

  function buka() {
    let h = (location.hash || '').replace('#', '');
    if (!HALAMAN.includes(h)) h = 'beranda';
    U.$$('[data-halaman]').forEach((s) => s.classList.toggle('tersembunyi', s.dataset.halaman !== h));
    U.$$('.menu a').forEach((a) => (a.getAttribute('href') === '#' + h ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    document.title = 'ZakaTani — ' + JUDUL[h];
    U.$('#menu-utama').classList.remove('buka'); U.$('.tombol-menu').setAttribute('aria-expanded', 'false');
    if (!sudah.has(h) || ['peta', 'simulasi'].includes(h)) { render(h); sudah.add(h); }
    if (aktif !== h) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    aktif = h;
  }

  /** Render ulang semua halaman yang pernah dibuka (setelah data berubah / saklar). */
  ZT.App = {
    segarkanSemua: () => {
      sudah.forEach((h) => {
        if (h === 'peta') ZT.Peta.rerender();
        else if (h === 'simulasi') ZT.Simulasi.rerender();
        else if (h !== 'kelola') render(h);
      });
    }
  };

  async function mulai() {
    // Saklar "Hanya data asli"
    const sak = U.$('#saklar-asli');
    try { ZT.state.hanyaAsli = localStorage.getItem('zakatani:hanyaAsli') === '1'; } catch (e) { /* */ }
    sak.checked = ZT.state.hanyaAsli;
    sak.addEventListener('change', () => {
      ZT.state.hanyaAsli = sak.checked;
      try { localStorage.setItem('zakatani:hanyaAsli', sak.checked ? '1' : '0'); } catch (e) { /* */ }
      sudah.forEach((h) => { if (h === 'peta') ZT.Peta.rerender(); else if (h === 'simulasi') ZT.Simulasi.toggleAsli(); else render(h); });
      U.toast(sak.checked ? 'Hanya data asli: angka contoh disembunyikan.' : 'Menampilkan data asli dan data contoh (berlabel).');
    });
    // Menu HP
    U.$('.tombol-menu').addEventListener('click', (e) => { const m = U.$('#menu-utama'); m.classList.toggle('buka'); e.currentTarget.setAttribute('aria-expanded', m.classList.contains('buka')); });

    if (!window.L || !window.solver) {
      U.$('main').insertAdjacentHTML('afterbegin', '<div class="wadah" style="padding:20px"><div class="kotak-peringatan">Pustaka peta atau optimasi gagal dimuat dari CDN. Periksa koneksi internet lalu muat ulang halaman.</div></div>');
    }
    try { await ZT.D.muat(); }
    catch (e) { U.$('main').innerHTML = `<div class="wadah" style="padding:60px 20px"><div class="kotak-peringatan"><b>Data gagal dimuat.</b> ${U.esc(e.message)}. Buka situs lewat server web (bukan file://).</div></div>`; return; }

    ZT.Hal.pasangProfil();
    window.addEventListener('hashchange', buka);
    buka();

    // Sumber data bersama (tidak menahan tampilan awal).
    const hasilSb = ZT.D.supabaseAktif() ? await ZT.D.muatSupabase() : null;
    if (hasilSb === 'dimuat') ZT.App.segarkanSemua();
    if (!ZT.D.supabaseAktif()) {
      ZT.D.hubungkanArtifact().then((r) => { if (r === 'dimuat') { ZT.App.segarkanSemua(); if (sudah.has('kelola')) ZT.Kelola.render(); } else if (sudah.has('kelola')) ZT.Kelola.render(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})(window.ZT);
