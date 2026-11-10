"""Lengkapi data/simpul.json dengan DATA ILUSTRASI (perubahan No. 6, 11, 12, 13).

- Semua lumbung diberi komoditas, jumlah petani (total 735), luas lahan, dan hasil panen.
- Gudang Bulog per provinsi (ilustrasi) menggantikan satu simpul Bulog pusat.
- Parameter biaya baru: ongkos lokal minimum, biaya penyeberangan, harga beli beras.
Angka ilustrasi diberi status "contoh" di data (status tidak ditampilkan di situs).
Aman dijalankan berulang:  python3 tools/terapkan_ilustrasi.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = f'{ROOT}/data/simpul.json'
d = json.load(open(P))
S = {s['id']: s for s in d['simpul']}

def isi(id, **kw):
    s = S[id]
    for k, v in kw.items():
        if s.get(k) is None:
            s[k] = v
            if k in ('petani', 'luas_ha', 'panen_ton', 'kapasitas_ton', 'stok_simpan_ton', 'musim_panen', 'kebutuhan_ton', 'tahun_mulai'):
                s.setdefault('status', {})[k] = 'contoh'

# komoditas ilustrasi untuk lumbung yang belum berdata (13 lumbung padi berkapasitas tetap)
for id, kom in {'L11': 'hortikultura', 'L12': 'hortikultura', 'L14': 'jagung', 'L15': 'jagung', 'L20': 'hortikultura'}.items():
    if not S[id].get('komoditas'):
        S[id]['komoditas'] = kom

petani = {'L01': 50, 'L02': 40, 'L04': 25, 'L08': 35, 'L09': 35, 'L10': 30, 'L11': 28, 'L12': 22, 'L13': 40, 'L14': 25,
          'L15': 20, 'L16': 18, 'L17': 45, 'L18': 30, 'L19': 22, 'L20': 20, 'L21': 23}
for id, n in petani.items():
    isi(id, petani=n)

panen_non_padi = {'L11': 70, 'L12': 40, 'L13': 85, 'L14': 90, 'L15': 60, 'L16': 45, 'L20': 50}
RENDEMEN = 0.62  # gabah kering panen → beras (ilustrasi)
for s in d['simpul']:
    if s['jenis'] != 'lumbung':
        continue
    if s.get('luas_ha') is None and s.get('petani') is not None:
        isi(s['id'], luas_ha=round(s['petani'] * 0.45, 1))
    if s.get('panen_ton') is None:
        if s['komoditas'] == 'padi' and s.get('kapasitas_ton'):
            isi(s['id'], panen_ton=round(s['kapasitas_ton'] / RENDEMEN))
        elif s['id'] in panen_non_padi:
            isi(s['id'], panen_ton=panen_non_padi[s['id']])
    s['catatan'] = (s.get('catatan') or '').replace('Komoditas belum ada data.', 'Komoditas: data ilustrasi.')
    s['presisi_lokasi'] = s.get('presisi_lokasi') or 'kabupaten'

assert sum(s['petani'] for s in d['simpul'] if s['jenis'] == 'lumbung') == 735, 'total petani harus 735'

# ---- Gudang Bulog per provinsi (ilustrasi): titik = kota kantor BAZNAS provinsi ----
if 'BL01' in S:
    bl = S['BL01']
    bl.update(id='BLG-DKI', nama='Gudang Bulog Kanwil DKI Jakarta', catatan='Gudang cadangan (ilustrasi). Titik = acuan kab/kota.', provinsi='DKI Jakarta')
    S['BLG-DKI'] = bl; del S['BL01']
ada = {s['provinsi'] for s in d['simpul'] if s['jenis'] == 'bulog'}
for s in list(d['simpul']):
    if s['jenis'] == 'baznas' and s.get('tingkat_baznas') == 'provinsi' and s['provinsi'] not in ada:
        kode = s['id'].replace('BP', 'BLG-')
        b = {k: None for k in s}
        b.update(id=kode, jenis='bulog', nama='Gudang Bulog Kanwil ' + s['provinsi'], provinsi=s['provinsi'], kabupaten=s['kabupaten'],
                 lat=s['lat'], lon=s['lon'], presisi_lokasi='kabupaten', pengelola='Perum Bulog', status={}, sumber=[], perlu_verifikasi=[],
                 catatan='Gudang cadangan (ilustrasi). Titik = acuan kab/kota.')
        d['simpul'].append(b); ada.add(s['provinsi'])

# ---- Parameter biaya (ilustrasi) ----
par = d['parameter']
par.pop('ongkos_bulog_per_ton', None)
baru = {
    'ongkos_lokal_min_per_ton': {'nilai': 75000, 'satuan': 'Rp/ton', 'status': 'contoh', 'label': 'Ongkos lokal minimum'},
    'biaya_penyeberangan_per_ton': {'nilai': 300000, 'satuan': 'Rp/ton per penyeberangan', 'status': 'contoh', 'label': 'Biaya penyeberangan antarpulau'},
    'harga_beras_lumbung_per_ton': {'nilai': 12500000, 'satuan': 'Rp/ton', 'status': 'contoh', 'label': 'Harga beli beras lumbung'},
    'harga_beras_bulog_per_ton': {'nilai': 12000000, 'satuan': 'Rp/ton', 'status': 'contoh', 'label': 'Harga beli beras Bulog'},
}
for k, v in baru.items():
    par.setdefault(k, v)

d['meta']['catatan'] = 'Data ilustrasi prototipe ZakaTani; diganti data asli setelah proposal diterima.'
json.dump(d, open(P, 'w'), ensure_ascii=False, indent=1)
print('lumbung:', sum(s['jenis'] == 'lumbung' for s in d['simpul']), '| bulog:', sum(s['jenis'] == 'bulog' for s in d['simpul']),
      '| kapasitas padi:', round(sum(s.get('kapasitas_ton') or 0 for s in d['simpul'] if s['jenis'] == 'lumbung' and s['komoditas'] == 'padi'), 1))
