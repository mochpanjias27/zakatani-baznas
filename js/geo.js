/* ZakaTani — perhitungan geografis: jarak haversine, simpul terdekat, garis lengkung. */
(function (ZT) {
  'use strict';
  const G = {};
  const R = 6371.0088; // jari-jari rata-rata bumi (km)
  const rad = (d) => (d * Math.PI) / 180;

  /** Jarak garis lurus (km) antara dua titik {lat, lon}. */
  G.haversine = (a, b) => {
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };

  /** Simpul terdekat dari `asal` di antara `kandidat`. Kembali {simpul, km} atau null. */
  G.terdekat = (asal, kandidat) => {
    let best = null;
    for (const k of kandidat) {
      if (k.id === asal.id) continue;
      const km = G.haversine(asal, k);
      if (!best || km < best.km) best = { simpul: k, km };
    }
    return best;
  };

  /** BAZNAS terdekat per tingkat (kabupaten, provinsi, RI) untuk satu lumbung. */
  G.baznasTerdekat = (lumbung, semua) => {
    const bz = semua.filter((s) => s.jenis === 'baznas');
    return {
      kabupaten: G.terdekat(lumbung, bz.filter((b) => b.tingkat_baznas === 'kabupaten')),
      provinsi: G.terdekat(lumbung, bz.filter((b) => b.tingkat_baznas === 'provinsi')),
      ri: G.terdekat(lumbung, bz.filter((b) => b.tingkat_baznas === 'ri'))
    };
  };

  /** Titik-titik kurva Bezier kuadratik antara dua koordinat (untuk garis alur). */
  G.lengkung = (a, b, tekuk = 0.18, n = 32) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[1] - a[1], dy = b[0] - a[0];
    const cx = mx - dx * tekuk, cy = my + dy * tekuk; // titik kendali tegak lurus
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push([u * u * a[0] + 2 * u * t * cx + t * t * b[0], u * u * a[1] + 2 * u * t * cy + t * t * b[1]]);
    }
    return pts;
  };

  ZT.G = G;
})(window.ZT);
