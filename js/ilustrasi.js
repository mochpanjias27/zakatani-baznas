/* ZakaTani — ilustrasi vektor buatan tim (bukan foto stok) dan ikon penanda peta. */
(function (ZT) {
  'use strict';
  const W = ZT.CONFIG.warna;
  const I = {};

  // Batang padi dengan bulir menunduk
  function batangPadi(x, y, h, s = 1, warna = '#E3B23C', batang = '#6FA34E') {
    let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
    g += `<path d="M0 0 C 2 ${-h * 0.5} 6 ${-h * 0.85} 22 ${-h}" stroke="${batang}" stroke-width="3" fill="none"/>`;
    g += `<path d="M0 0 C -8 ${-h * 0.3} -26 ${-h * 0.45} -40 ${-h * 0.42}" stroke="${batang}" stroke-width="2.4" fill="none"/>`;
    for (let i = 0; i < 9; i++) {
      const t = i / 8, bx = 22 * t * t + 2, by = -h * (0.6 + 0.4 * t);
      g += `<ellipse cx="${bx + 8 + i * 1.5}" cy="${by + i * 4}" rx="4.2" ry="7.5" transform="rotate(${30 + i * 6} ${bx + 8 + i * 1.5} ${by + i * 4})" fill="${warna}"/>`;
    }
    return g + '</g>';
  }

  I.hero = () => {
    let terasering = '';
    const warnaT = ['#2E6B3E', '#357746', '#3C8250', '#448C57', '#4E975F', '#5AA066'];
    for (let i = 0; i < 6; i++) {
      const y = 470 + i * 58;
      terasering += `<path d="M0 ${y + 14} L560 ${y} C 820 ${y - 70 + i * 6} 1140 ${y - 40} 1600 ${y - 90 + i * 8} L1600 900 L0 900 Z" fill="${warnaT[i]}"/>`;
      terasering += `<path d="M560 ${y} C 820 ${y - 70 + i * 6} 1140 ${y - 40} 1600 ${y - 90 + i * 8}" stroke="#9DCB7E" stroke-opacity=".55" stroke-width="3" fill="none"/>`;
      // garis tanam
      for (let k = 0; k < 14; k++) {
        const x = 640 + k * 70 + (i % 2) * 30;
        terasering += `<path d="M${x} ${y + 18 - k * 1.5} l6 -12 M${x + 12} ${y + 18 - k * 1.5} l0 -14 M${x + 24} ${y + 18 - k * 1.5} l-6 -12" stroke="#A9D58A" stroke-opacity=".5" stroke-width="2" fill="none"/>`;
      }
    }
    let padi = '';
    [[1180, 900, 300, 1.15], [1260, 900, 340, 1.25], [1340, 900, 280, 1.1], [1430, 900, 360, 1.3], [1520, 900, 300, 1.15], [1110, 900, 250, 1]].forEach((p) => { padi += batangPadi(...p); });
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="langit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#153F28"/><stop offset=".55" stop-color="#2F6A43"/><stop offset="1" stop-color="#C9A24A"/></linearGradient>
        <radialGradient id="matahari" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FCE7A8"/><stop offset=".6" stop-color="#E3B23C"/><stop offset="1" stop-color="#E3B23C" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#langit)"/>
      <circle cx="1130" cy="330" r="190" fill="url(#matahari)" opacity=".9"/>
      <circle cx="1130" cy="330" r="78" fill="#F5D57A"/>
      <path d="M0 500 C 220 488 420 478 520 470 C 700 330 860 300 1020 380 C 1150 300 1300 260 1600 340 L1600 640 L0 640Z" fill="#24573A"/>
      <path d="M700 520 C 860 420 1000 410 1160 460 C 1300 400 1450 400 1600 430 L1600 640 L700 640Z" fill="#2A6141"/>
      <!-- lumbung (rumah panggung) -->
      <g transform="translate(860 380)">
        <path d="M-70 40 L0 -20 L70 40Z" fill="#8A6440"/><path d="M-78 44 L0 -26 L78 44" stroke="#5E4329" stroke-width="6" fill="none"/>
        <rect x="-52" y="40" width="104" height="62" fill="#B08455"/><path d="M-52 58h104M-52 76h104" stroke="#8A6440" stroke-width="3"/>
        <rect x="-14" y="62" width="28" height="40" fill="#5E4329"/>
        <path d="M-46 102v34M46 102v34M0 102v34" stroke="#5E4329" stroke-width="7"/><path d="M-62 136h124" stroke="#5E4329" stroke-width="5"/>
      </g>
      ${terasering}
      <!-- karung beras -->
      <g transform="translate(980 760)">
        <path d="M0 0 C -6 -40 6 -70 18 -78 L62 -78 C 74 -70 86 -40 80 0 Z" fill="#F3EDDF"/><path d="M18 -78 l6 -10 h32 l6 10" fill="#E5DDCA"/>
        <path d="M24 -40 h32" stroke="#1F5E3B" stroke-width="5"/><circle cx="40" cy="-22" r="8" fill="#E3B23C"/>
        <path d="M70 6 C 64 -30 76 -58 88 -64 L126 -64 C 138 -58 150 -30 144 6 Z" fill="#EDE5D3"/><path d="M92 -32 h30" stroke="#1F5E3B" stroke-width="5"/>
      </g>
      ${padi}
    </svg>`;
  };

  I.cerita = () => `<svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="500" height="400" fill="#F3EDDF"/>
      <circle cx="390" cy="96" r="54" fill="#F6E7BF"/><circle cx="390" cy="96" r="30" fill="#E3B23C"/>
      <path d="M0 250 C 120 200 260 210 500 180 L500 400 L0 400Z" fill="#4E8F3A"/>
      <path d="M0 290 C 140 250 300 262 500 230 L500 400 L0 400Z" fill="#3C7A45"/>
      <path d="M0 330 C 160 300 320 310 500 285 L500 400 L0 400Z" fill="#1F5E3B"/>
      <g transform="translate(110 150)"><path d="M-60 40 L0 -14 L60 40Z" fill="#8A6440"/><rect x="-44" y="40" width="88" height="54" fill="#B08455"/><rect x="-12" y="58" width="24" height="36" fill="#5E4329"/><path d="M-38 94v28M38 94v28" stroke="#5E4329" stroke-width="6"/></g>
      <!-- petani bercaping memanggul karung -->
      <g transform="translate(300 300)">
        <path d="M-58 -116 L0 -146 L58 -116Z" fill="#E3B23C"/><circle cx="0" cy="-100" r="18" fill="#B57F55"/>
        <path d="M-26 -78 h52 l10 70 h-72Z" fill="#2B5A8C"/><path d="M-22 -8 l-6 60 M22 -8 l6 60" stroke="#2B2B2B" stroke-width="12" stroke-linecap="round"/>
        <path d="M24 -70 C 70 -96 96 -70 84 -40 C 70 -20 40 -30 26 -40Z" fill="#FAF7EF" stroke="#E5DDCA" stroke-width="2"/><path d="M44 -64 h26" stroke="#1F5E3B" stroke-width="4"/>
        <path d="M-26 -70 l-24 40" stroke="#B57F55" stroke-width="9" stroke-linecap="round"/>
      </g>
      <g opacity=".95">${batangPadi(430, 400, 150, .8)}${batangPadi(470, 400, 170, .85)}${batangPadi(40, 400, 140, .75)}</g>
    </svg>`;

  // Sampul kartu/panel per jenis & komoditas
  I.sampul = (s) => {
    const kom = s.jenis === 'lumbung' ? (s.komoditas || 'kosong') : s.jenis;
    const latar = { padi: '#2F6A43', jagung: '#5B6E2A', hortikultura: '#2F6A55', kosong: '#3E5A48', penggilingan: '#6E4F31', baznas: '#1F5E3B', bulog: '#555A52' }[kom] || '#2F6A43';
    let isi = '';
    if (kom === 'padi' || kom === 'kosong') {
      for (let i = 0; i < 9; i++) isi += batangPadi(30 + i * 48, 150, 70 + (i % 3) * 14, .55, kom === 'kosong' ? '#C9C2A8' : '#E3B23C');
    } else if (kom === 'jagung') {
      for (let i = 0; i < 7; i++) isi += `<g transform="translate(${40 + i * 62} 150)"><path d="M0 0 V-80" stroke="#8DB65A" stroke-width="4"/><path d="M0 -40 C -20 -50 -34 -70 -38 -86 M0 -56 C 20 -66 32 -86 34 -100" stroke="#8DB65A" stroke-width="4" fill="none"/><ellipse cx="8" cy="-70" rx="9" ry="22" fill="#E3B23C"/></g>`;
    } else if (kom === 'hortikultura') {
      for (let i = 0; i < 6; i++) isi += `<g transform="translate(${44 + i * 72} 150)"><path d="M0 0 V-30" stroke="#8DB65A" stroke-width="4"/><path d="M0 -30 C -30 -40 -36 -70 -10 -80 C 6 -60 6 -44 0 -30Z" fill="#7BB05A"/><path d="M0 -30 C 30 -40 36 -70 10 -80 C -6 -60 -6 -44 0 -30Z" fill="#5E9A45"/><circle cx="22" cy="-18" r="13" fill="#E3B23C" opacity=".9"/></g>`;
    } else if (kom === 'penggilingan') {
      isi = `<g transform="translate(220 150)"><path d="M-90 0 V-60 L-30 -96 L30 -60 V0Z" fill="#B08455"/><circle cx="-30" cy="-46" r="20" fill="none" stroke="#FAF7EF" stroke-width="5"/><path d="M-30 -66v40M-50 -46h40" stroke="#FAF7EF" stroke-width="5"/><g transform="translate(60 0)"><path d="M0 0 C -4 -30 4 -50 12 -54 L42 -54 C 50 -50 58 -30 54 0Z" fill="#FAF7EF"/><path d="M60 0 C 56 -24 64 -40 72 -44 L98 -44 C 106 -40 112 -24 108 0Z" fill="#EDE5D3"/></g></g>`;
    } else if (kom === 'baznas') {
      isi = `<g transform="translate(220 150)"><rect x="-90" y="-56" width="180" height="56" fill="#FAF7EF"/><path d="M-50 -56 C -50 -90 -24 -110 0 -110 C 24 -110 50 -90 50 -56Z" fill="#E3B23C"/><path d="M0 -110 V-128" stroke="#E3B23C" stroke-width="4"/><rect x="-14" y="-36" width="28" height="36" fill="#1F5E3B"/><rect x="-70" y="-40" width="22" height="20" fill="#4E8F3A"/><rect x="48" y="-40" width="22" height="20" fill="#4E8F3A"/></g>`;
    } else {
      isi = `<g transform="translate(220 150)"><rect x="-100" y="-70" width="200" height="70" fill="#D7D4CB"/><path d="M-110 -70 L0 -110 L110 -70Z" fill="#A9A69D"/><rect x="-30" y="-50" width="60" height="50" fill="#6B6F68"/></g>`;
    }
    return `<svg viewBox="0 0 440 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><rect width="440" height="150" fill="${latar}"/><circle cx="380" cy="34" r="22" fill="#F5D57A" opacity=".7"/><path d="M0 120 C 120 100 300 110 440 96 L440 150 L0 150Z" fill="#000" opacity=".12"/>${isi}</svg>`;
  };

  /* ---------------- Ikon penanda peta (bentuk berbeda per jenis) ---------------- */
  const glyph = {
    padi: '<path d="M0 6V-5M0-5c0-2.5 1.2-4.2 3.4-5-.2 2.5-1.4 4.2-3.4 5Zm0 3.4c-2.2-.2-3.7-1.5-4.2-3.8 2.2.3 3.7 1.5 4.2 3.8Zm0 3.4c2.2-.2 3.7-1.5 4.2-3.8-2.2.3-3.7 1.5-4.2 3.8Z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>',
    jagung: '<path d="M0-8c2.4 0 3.4 3 3.4 6.8S2 5 0 5s-3.4-3-3.4-6.8S-2.4-8 0-8Z" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M-3 -2h6M-3 1.4h6M0-8v13" stroke="#fff" stroke-width="1.1"/>',
    hortikultura: '<path d="M-6 6c0-7.5 4.2-11.6 12.5-12.5C5.7 1.8 1.5 6-6 6Zm0 0 7.5-7.5" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>',
    kosong: '<text x="0" y="4" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="sans-serif">?</text>',
    penggilingan: '<path d="M-6 6V-1l6-4 6 4v7" fill="none" stroke="#fff" stroke-width="1.5"/><circle cx="0" cy="1.6" r="2.4" fill="none" stroke="#fff" stroke-width="1.3"/>',
    baznas: '<path d="M-6 5h12M-5 5V0h10v5M-3.6 0c0-2.4 1.6-4.2 3.6-4.2S3.6-2.4 3.6 0M0-4.2v-2.8" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>',
    calon: '<path d="M0-5v10M-5 0h10" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>'
  };

  /** HTML ikon penanda Leaflet. `presisiKasar` → garis tepi putus-putus. */
  I.penanda = (s, opsi = {}) => {
    const kasar = false; // keterangan presisi lokasi tidak ditampilkan (No. 11)
    const dash = kasar ? 'stroke-dasharray="3 2.2"' : '';
    let svg, ukuran;
    if (s.jenis === 'lumbung') {
      ukuran = 30; const g = glyph[s.komoditas] || glyph.padi;
      svg = `<svg width="30" height="30" viewBox="-15 -15 30 30"><circle r="12.5" fill="${W.hijauPadi}" stroke="#fff" stroke-width="2.2" ${dash}/>${g}</svg>`;
    } else if (s.jenis === 'penggilingan' || s.jenis === 'calon') {
      ukuran = 26; const warna = s.jenis === 'calon' ? W.gabah : W.tanah;
      svg = `<svg width="26" height="26" viewBox="-13 -13 26 26"><rect x="-10.5" y="-10.5" width="21" height="21" rx="3" fill="${warna}" stroke="#fff" stroke-width="2.2" ${s.jenis === 'calon' ? 'stroke-dasharray="4 2"' : dash}/>${glyph[s.jenis === 'calon' ? 'calon' : 'penggilingan']}</svg>`;
    } else if (s.jenis === 'baznas') {
      const sk = { ri: 1.5, provinsi: 1.15, kabupaten: 0.88 }[s.tingkat_baznas] || 1;
      ukuran = Math.round(30 * sk);
      const h = Math.round(38 * sk);
      svg = `<svg width="${ukuran}" height="${h}" viewBox="-15 -17 30 38"><path d="M0 20C0 20-13 8.5-13-2.2A13 13 0 0 1 13-2.2C13 8.5 0 20 0 20Z" fill="${W.hijauTua}" stroke="#fff" stroke-width="2" ${dash}/>${s.tingkat_baznas === 'ri' ? '<circle cx="0" cy="-2.5" r="9.5" fill="none" stroke="#E3B23C" stroke-width="1.6"/>' : ''}<g transform="translate(0 -2)">${glyph.baznas}</g></svg>`;
      return { html: svg, size: [ukuran, h], anchor: [ukuran / 2 + (opsi.dx || 0), h - 1 + (opsi.dy || 0)] };
    } else { // bulog: belah ketupat abu
      ukuran = 26;
      svg = `<svg width="26" height="26" viewBox="-13 -13 26 26"><rect x="-8.5" y="-8.5" width="17" height="17" transform="rotate(45)" fill="${W.bulog}" stroke="#fff" stroke-width="2" ${dash}/><text x="0" y="3.6" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" font-family="sans-serif">B</text></svg>`;
    }
    return { html: svg, size: [ukuran, ukuran], anchor: [ukuran / 2 + (opsi.dx || 0), ukuran / 2 + (opsi.dy || 0)] };
  };

  ZT.I = I;
})(window.ZT);
