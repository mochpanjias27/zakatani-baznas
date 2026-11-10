/* ZakaTani — ekspor hasil ke CSV dan PDF.
 * Di artifact claude.ai: memakai kapabilitas `downloads` (penonton mengonfirmasi).
 * Di hosting biasa (Netlify/Vercel): unduhan lewat tautan Blob.
 * Jika keduanya gagal: tampilkan isi untuk disalin.
 */
(function (ZT) {
  'use strict';
  const E = {}, U = ZT.U;

  E.simpanBerkas = async (namaBerkas, isi, mime) => {
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        const dl = await Promise.race([window.claude.use('downloads'), new Promise((ok) => setTimeout(() => ok(null), 1500))]);
        if (dl) {
          try { await dl.save({ filename: namaBerkas, data: isi }); U.toast('Berkas disimpan: ' + namaBerkas); return true; }
          catch (e) {
            if (e && e.code === 'declined') { U.toast('Penyimpanan dibatalkan.'); return false; }
            if (e && e.code === 'rate_limited') { U.toast('Tunggu sebentar, lalu coba lagi.'); return false; }
          }
        }
      }
    } catch (e) { /* lanjut ke cara biasa */ }
    try {
      const blob = isi instanceof Blob ? isi : new Blob([isi], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = namaBerkas; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      if (window.self !== window.top && typeof isi === 'string') E.tampilSalin(namaBerkas, isi, true);
      return true;
    } catch (e) {
      if (typeof isi === 'string') E.tampilSalin(namaBerkas, isi);
      else U.toast('Unduhan tidak didukung di tampilan ini.');
      return false;
    }
  };

  E.tampilSalin = (nama, teks, cadangan) => {
    U.modal(`<h3>${U.esc(nama)}</h3><p class="catatan">${cadangan ? 'Jika unduhan tidak muncul, salin isi berikut ke editor teks atau spreadsheet.' : 'Unduhan tidak tersedia di tampilan ini. Salin isi berikut.'}</p>
      <textarea readonly style="width:100%;height:260px;font:12px monospace">${U.esc(teks)}</textarea>
      <div class="baris-aksi"><button class="btn btn-utama btn-kecil" data-salin>Salin</button><button class="btn btn-garis btn-kecil" data-tutup>Tutup</button></div>`, (m) => {
      m.querySelector('[data-salin]').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(teks); U.toast('Tersalin.'); } catch (e) { m.querySelector('textarea').select(); U.toast('Tekan Ctrl+C untuk menyalin.'); }
      });
    });
  };

  const stempel = () => new Date().toISOString().slice(0, 10);

  /* ---------------- CSV ---------------- */
  E.barisHasil = (h) => {
    const r = h.alokasi.map((a) => ({ dari: a.dari.nama, dari_id: a.dari.id, ke: a.ke.nama, ke_id: a.ke.id, lewat_penggilingan: a.via ? a.via.nama : '', ton: a.ton.toFixed(2), jarak_km: a.km.toFixed(1), ongkos_kirim_rp: Math.round(a.ongkosKirim), ongkos_rp: Math.round(a.ongkos), jenis: 'lumbung' }));
    h.bulog.forEach((b) => r.push({ dari: b.gudang ? b.gudang.nama : 'Perum Bulog', dari_id: b.gudang ? b.gudang.id : 'BULOG', ke: b.ke.nama, ke_id: b.ke.id, lewat_penggilingan: '', ton: b.ton.toFixed(2), jarak_km: b.km.toFixed(1), ongkos_kirim_rp: Math.round(b.ongkosKirim), ongkos_rp: Math.round(b.ongkos), jenis: 'bulog' }));
    h.kurang.forEach((k) => r.push({ dari: '— tak terpenuhi —', dari_id: '', ke: k.ke.nama, ke_id: k.ke.id, lewat_penggilingan: '', ton: k.ton.toFixed(2), jarak_km: '', ongkos_kirim_rp: '', ongkos_rp: '', jenis: 'kurang' }));
    return r;
  };
  E.csvHasil = (h) => {
    const kol = ['jenis', 'dari', 'dari_id', 'ke', 'ke_id', 'lewat_penggilingan', 'ton', 'jarak_km', 'ongkos_kirim_rp', 'ongkos_rp'];
    const kepala = `# ZakaTani — hasil alokasi (${stempel()}). Data ilustrasi (kapasitas, kebutuhan, ongkos); bukan data resmi BAZNAS.\n`;
    return kepala + ZT.D.keCSV(E.barisHasil(h), kol).replace(/^﻿/, '');
  };
  E.csvSkenario = (daftar) => {
    const kol = ['skenario', 'keterangan', 'total_ongkos_rp', 'ongkos_lumbung_rp', 'ongkos_bulog_rp', 'ton_lumbung', 'ton_bulog', 'ton_tak_terpenuhi', 'porsi_bulog_persen', 'skema_terpusat_rp'];
    const r = daftar.map((s) => ({ skenario: s.nama, keterangan: s.ket, total_ongkos_rp: Math.round(s.h.total), ongkos_lumbung_rp: Math.round(s.h.totalAngkut), ongkos_bulog_rp: Math.round(s.h.totalBulog), ton_lumbung: s.h.tonLumbung.toFixed(2), ton_bulog: s.h.tonBulog.toFixed(2), ton_tak_terpenuhi: s.h.tonKurang.toFixed(2), porsi_bulog_persen: (100 * s.h.tonBulog / Math.max(1e-9, s.h.totalKebutuhan)).toFixed(1), skema_terpusat_rp: s.h.pembanding ? Math.round(s.h.pembanding.total) : '' }));
    return `# ZakaTani — perbandingan skenario (${stempel()}). Data ilustrasi; bukan data resmi BAZNAS.\n` + ZT.D.keCSV(r, kol).replace(/^﻿/, '');
  };

  /* ---------------- PDF ---------------- */
  E.muatJsPDF = async () => {
    if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable) return window.jspdf.jsPDF;
    const muat = (src) => new Promise((ok, gagal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => gagal(new Error('Pustaka PDF gagal dimuat')); document.head.appendChild(s); });
    if (!window.jspdf) await muat('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await muat('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
    return window.jspdf.jsPDF;
  };

  E.pdfHasil = async (h, skenario) => {
    const JsPDF = await E.muatJsPDF();
    const doc = new JsPDF({ unit: 'pt', format: 'a4' });
    const hijau = [31, 94, 59];
    doc.setFillColor(...hijau); doc.rect(0, 0, 595, 70, 'F');
    doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('ZakaTani — Hasil Alokasi Beras Zakat Fitrah', 36, 34);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.text('Prototipe riset CRP — usulan Beasiswa Riset BAZNAS 2026. Bukan situs resmi BAZNAS. Dicetak ' + stempel(), 36, 52);
    doc.setTextColor(43); doc.setFontSize(10);
    let y = 92;
    doc.setFillColor(246, 231, 191); doc.rect(36, y - 12, 523, 30, 'F');
    doc.text('Angka kapasitas, kebutuhan, ongkos, dan hasil simulasi adalah DATA ILUSTRASI, bukan data resmi BAZNAS.', 44, y + 6);
    y += 36;
    const pBulog = h.tonBulog / Math.max(1e-9, h.totalKebutuhan);
    const ringkas = [
      ['Total ongkos', U.rupiah(h.total)], ['Ongkos kirim (lumbung + Bulog)', U.rupiah(h.kirimTotal)], ['Harga beli beras lumbung', U.rupiah(h.ongkosHarga)], ['Pasokan Bulog (kirim + harga)', U.rupiah(h.totalBulog)],
      ['Total kebutuhan', U.angka(h.totalKebutuhan, 1) + ' ton'], ['Dipenuhi lumbung', U.angka(h.tonLumbung, 1) + ' ton (' + U.persen(1 - pBulog - h.tonKurang / Math.max(1e-9, h.totalKebutuhan), 1) + ')'],
      ['Dipenuhi Bulog', U.angka(h.tonBulog, 1) + ' ton (' + U.persen(pBulog, 1) + ')'], ['Tak terpenuhi', U.angka(h.tonKurang, 1) + ' ton']
    ];
    if (h.pembanding) ringkas.push(['Skema terpusat (semua lewat BAZNAS RI)', U.rupiah(h.pembanding.total)], ['Selisih', U.rupiah(h.pembanding.total - h.total)]);
    if (skenario) ringkas.unshift(['Skenario', skenario]);
    doc.autoTable({ startY: y, head: [['Ringkasan', '']], body: ringkas, theme: 'grid', headStyles: { fillColor: hijau }, styles: { fontSize: 9.5 }, columnStyles: { 0: { cellWidth: 220, fontStyle: 'bold' } }, margin: { left: 36, right: 36 } });
    y = doc.lastAutoTable.finalY + 18;
    const body = E.barisHasil(h).map((r) => [r.dari, r.ke, r.lewat_penggilingan, U.angka(+r.ton, 2), r.jarak_km ? U.angka(+r.jarak_km, 0) : '', r.ongkos_rp !== '' ? U.rupiah(+r.ongkos_rp) : '']);
    doc.autoTable({ startY: y, head: [['Dari', 'Ke', 'Lewat penggilingan', 'Ton', 'Km', 'Ongkos']], body, theme: 'striped', headStyles: { fillColor: hijau }, styles: { fontSize: 8.2 }, margin: { left: 36, right: 36 } });
    y = doc.lastAutoTable.finalY + 16;
    doc.setFontSize(8); doc.setTextColor(90);
    doc.text(doc.splitTextToSize('Metode: model alokasi dua tahap (pemrograman linear). Tahap 1 memaksimumkan beras petani binaan terserap; tahap 2 meminimumkan ongkos (kirim + harga beli). Ongkos kirim = maks(jarak haversine × faktor jalan × tarif, ongkos lokal minimum) + biaya penyeberangan. Bulog mengisi kekurangan dari gudang provinsi. Lihat halaman Metodologi.', 520), 36, Math.min(y, 800));
    return doc.output('blob');
  };

  E.pdfSkenario = async (daftar) => {
    const JsPDF = await E.muatJsPDF();
    const doc = new JsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
    doc.setFillColor(31, 94, 59); doc.rect(0, 0, 842, 64, 'F');
    doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('ZakaTani — Perbandingan Skenario', 36, 32);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.text('Data ilustrasi, bukan data resmi BAZNAS. Dicetak ' + stempel(), 36, 50);
    const body = daftar.map((s) => [s.nama, s.ket, U.rupiah(s.h.total), U.angka(s.h.tonBulog, 1) + ' t (' + U.persen(s.h.tonBulog / Math.max(1e-9, s.h.totalKebutuhan), 1) + ')', U.angka(s.h.tonKurang, 1) + ' t', s.h.pembanding ? U.rupiah(s.h.pembanding.total) : '–']);
    doc.autoTable({ startY: 84, head: [['Skenario', 'Keterangan', 'Total ongkos', 'Porsi Bulog', 'Tak terpenuhi', 'Skema terpusat (via BAZNAS RI)']], body, theme: 'grid', headStyles: { fillColor: [31, 94, 59] }, styles: { fontSize: 9 }, columnStyles: { 1: { cellWidth: 260 } }, margin: { left: 36, right: 36 } });
    return doc.output('blob');
  };

  ZT.E = E;
})(window.ZT);
