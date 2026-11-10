/* ZakaTani — utilitas umum: format angka, label status data, DOM, notifikasi. */
(function (ZT) {
  'use strict';
  const U = {};

  const nf = (d) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  U.angka = (v, d = 1) => (v == null || isNaN(v) ? '–' : nf(d).format(v));
  U.rupiah = (v) => (v == null || isNaN(v) ? '–' : 'Rp ' + nf(0).format(Math.round(v)));
  U.rupiahRingkas = (v) => {
    if (v == null || isNaN(v)) return '–';
    const a = Math.abs(v);
    if (a >= 1e12) return 'Rp ' + nf(2).format(v / 1e12) + ' T';
    if (a >= 1e9) return 'Rp ' + nf(2).format(v / 1e9) + ' M';
    if (a >= 1e6) return 'Rp ' + nf(1).format(v / 1e6) + ' jt';
    return U.rupiah(v);
  };
  U.persen = (v, d = 0) => (v == null || isNaN(v) ? '–' : nf(d).format(v * 100) + '%');

  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  U.ikon = (id, cls = '') => `<svg class="${cls}" width="1.1em" height="1.1em" aria-hidden="true" style="vertical-align:-0.15em"><use href="#i-${id}"/></svg>`;
  U.debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* ---------- nilai simpul ----------
   * Status asli/contoh tetap disimpan di data (untuk tim di Kelola Data), tetapi tidak
   * ditampilkan: seluruh angka di situs saat ini adalah data ilustrasi (lihat pita atas). */
  U.hanyaAsli = () => false;
  U.statusField = (s, f) => (s.status && s.status[f]) || (s[f] == null ? null : 'asli');
  U.isContoh = (s, f) => U.statusField(s, f) === 'contoh';
  U.lencanaContoh = () => '';
  U.lencanaVerif = () => '';
  U.nilai = (s, f, opsi = {}) => {
    const v = s[f];
    if (v == null || (Array.isArray(v) && !v.length)) return '<span class="kosong">–</span>';
    if (f === 'musim_panen') return U.esc(v.map((b) => ZT.BULAN[b - 1].slice(0, 3)).join(', '));
    if (f === 'tahun_mulai') return U.esc(String(v));
    return U.esc(U.angka(v, opsi.d != null ? opsi.d : 1) + (opsi.satuan ? ' ' + opsi.satuan : ''));
  };
  U.nilaiRingkas = (s, f, d = 0) => (s[f] == null ? '–' : U.esc(U.angka(s[f], d)));

  /** Kartu ringkas berikon dengan garis warna (Beranda, Peta, Simulasi). */
  U.kartuRingkas = (k) => {
    const angka = k.nilai != null
      ? `${k.awalan || ''}<span data-hitung="${k.nilai}" data-desimal="${k.desimal || 0}">${U.angka(k.nilai, k.desimal || 0)}</span>${k.akhiran ? ' <small style="font-size:.62em">' + k.akhiran + '</small>' : ''}`
      : (k.angka || '–');
    return `<div class="kartu-ringkas ${k.warna || 'w-hijau'}${k.sorot ? ' sorot' : ''}"${k.id ? ` id="${k.id}"` : ''}><span class="ikon">${U.ikon(k.ikon)}</span>
    <span class="label">${k.label}</span><span class="angka">${angka}</span><span class="ket">${k.ket || ''}</span></div>`;
  };

  U.toast = (pesan, ms = 3200) => {
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = pesan;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), ms);
  };

  U.modal = (html, onOpen) => {
    const m = document.createElement('div');
    m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="kotak">${html}</div>`;
    const tutup = () => { m.remove(); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') tutup(); };
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-tutup]')) tutup(); });
    document.addEventListener('keydown', esc);
    document.body.appendChild(m);
    if (onOpen) onOpen(m, tutup);
    const f = m.querySelector('input,select,textarea,button'); if (f) f.focus();
    return tutup;
  };

  /** Animasi hitung naik singkat saat elemen terlihat di layar. */
  U.hitungNaik = (root) => {
    const els = U.$$('[data-hitung]', root);
    const jalankan = (el) => {
      const target = +el.dataset.hitung, d = +(el.dataset.desimal || 0), dur = 900, t0 = performance.now();
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { el.textContent = U.angka(target, d); return; }
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = U.angka(target * e, d);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(jalankan); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { jalankan(en.target); io.unobserve(en.target); } }), { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  };

  U.sumberHTML = (arr) => {
    if (!arr || !arr.length) return '<p class="kosong">belum ada sumber</p>';
    return '<ol class="sumber-list">' + arr.map((s) => `<li>${s.url ? `<a href="${U.esc(s.url)}" target="_blank" rel="noopener">${U.esc(s.label || s.url)}</a>` : U.esc(s.label)}</li>`).join('') + '</ol>';
  };

  ZT.U = U;
})(window.ZT);
