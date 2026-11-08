"""Generator data awal ZakaTani -> data/simpul.json dan data/indonesia-provinsi.geojson.

Jalankan ulang bila data awal diubah:  python3 tools/buat_data.py
Koordinat TIDAK ditebak: diambil dari titik acuan kab/kota dataset GeoJSON
(eppofahmi/geojson-indonesia) atau centroid poligon provinsi (38 provinsi).
Semua angka yang tidak bersumber diberi status "contoh".
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO = '/home/claude/geo'

kab = {}
for f in json.load(open(f'{GEO}/all_kabkota_ind.geojson'))['features']:
    p = f['properties']
    kab[(p['prov_name'], p['name'])] = (round(p['latitude'], 5), round(p['longitude'], 5))

def K(prov, name):
    return kab[(prov, name)]

prov38 = json.load(open(f'{GEO}/indonesia-38-provinces.geojson'))
def centroid(geom):
    A = Cx = Cy = 0
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    for poly in polys:
        ring = poly[0]
        for i in range(len(ring) - 1):
            x0, y0 = ring[i][:2]; x1, y1 = ring[i + 1][:2]
            c = x0 * y1 - x1 * y0; A += c; Cx += (x0 + x1) * c; Cy += (y0 + y1) * c
    A /= 2
    return round(Cy / (6 * A), 4), round(Cx / (6 * A), 4)
provc = {f['properties']['PROVINSI']: centroid(f['geometry']) for f in prov38['features']}

# ---------- sumber ----------
SRC = {
 'antara_suka': ('ANTARA Megapolitan (2025): Lumbung Pangan Baznas di Sukabumi siapkan 133,7 ton beras zakat fitrah', 'https://megapolitan.antaranews.com/berita/375489/lumbung-pangan-baznas-di-sukabumi-siapkan-1337-ton-beras-zakat-fitrah-untuk-didistribusikan'),
 'baznasjabar_16t': ('BAZNAS Jabar: Koperasi Lumbung Pangan Sukabumi kirim 3.200 karung beras zakat fitrah ke BAZNAS RI', 'https://www.baznasjabar.org/news/koperasi-lumbung-pangan-sukabumi-salurkan-3.200-karung-beras-zakat-fitrah-ke-baznas'),
 'jko_cimanggu': ('Inayah dkk. (2026), Jurnal Kommunity Online: Evaluasi CIPP Lumbung Pangan, Kelompok Berkah Tani Cimanggu', 'https://journal.uinjkt.ac.id/index.php/jko/article/view/50579'),
 'chanel_serang': ('Chanel Muslim: BAZNAS buka sekolah tani organik di Serang (pengembangan Lumbung Pangan 2019)', 'https://chanelmuslim.com/berita/tingkatkan-kualitas-petani-baznas-buka-sekolah-tani-organik-di-serang'),
 'rm_zf2026': ('RM.id (26 Feb 2026): BAZNAS siapkan beras zakat fitrah melalui lumbung pangan binaan', 'https://rm.id/baca-berita/nasional/302114/baznas-siapkan-beras-zakat-fitrah-melalui-lumbung-pangan-binaan'),
 'chanel_karawang': ('Chanel Muslim: Taswan, petani Lumbung Pangan BAZNAS di Desa Cikalong, Cilamaya Wetan', 'https://chanelmuslim.com/info/taswan-petani-lumbung-pangan-baznas-raup-rp30-juta-sekali-panen'),
 'rri_batubara': ('RRI (Juli 2026): Panen raya 150 ton padi dari 32 ha di Desa Kwala Gunung, Batu Bara', 'https://rri.co.id/regional/2596290/sukses-panen-raya-kelompok-petani-binaan-baznas-di-sumut-tunaikan-zakat-rp16-juta'),
 'rm_batubara': ('RM.id (23 Jul 2026): BAZNAS panen raya 150 ton GKP di Batu Bara; 21 lokasi di 11 provinsi', 'https://rm.id/baca-berita/humaniora/318830/baznas-panen-raya-150-ton-padi-perkuat-ketahanan-pangan-di-batu-bara'),
 'rri_lotim': ('RRI Mataram: Kelompok Tani Barokah Zakat, Desa Gunung Malang, Pringgabaya', 'https://rri.co.id/mataram/kesehatan/2609572/baznas-lotim-berikan-kartu-asuransi-perkuat-perlindungan-penerima-zakat'),
 'jrmdk_sragen': ('Khasanah & Triatmo (2025), JRMDK: Lumbung Pangan Greenhouse Melon BAZNAS Sragen', 'https://ejournal.uin-suska.ac.id/index.php/jrmdk/article/view/35858'),
 'antasari_batola': ('Shinta (2025), skripsi UIN Antasari: Lumbung Pangan Berkah BAZNAS Kalsel, Barito Kuala', 'https://idr.uin-antasari.ac.id/29883/7/BAB%20IV.pdf'),
 'puskas_siak': ('Puskas BAZNAS: zakat pertanian & panen di Bungaraya, Siak', 'https://new.puskasbaznas.com/news/649-farmers-pay-zakat-to-baznas'),
 'antara_cianjur': ('ANTARA Jogja: Baznas memberdayakan petani melalui zakat fitrah (Kelompok Tani Kelewih, Cianjur)', 'https://jogja.antaranews.com/berita/357593/baznas-memberdayakan-petani-melalui-zakat-fitrah'),
 'chanel_34prov': ('Chanel Muslim: BAZNAS salurkan zakat fitrah ke 34 provinsi (lumbung Karawang, Sukabumi, Serang, Lampung)', 'https://chanelmuslim.com/berita/baznas-salurkan-zakat-fitrah-ke-34-provinsi-se-indonesia'),
 'antara_675rb': ('ANTARA Kupang: Baznas siapkan 168.750 paket zakat fitrah, target 675.000 jiwa di 34 provinsi', 'https://kupang.antaranews.com/berita/152497/baznas-menyiapkan-168750-paket-zakat-fitrah-untuk-mustahik-se-indonesia'),
 'antara_80muzaki': ('ANTARA Megapolitan (indeks berita BAZNAS): Program Lumbung Pangan 2022–2024 cetak 80 muzaki baru', 'https://megapolitan.antaranews.com/tag/baznas/39'),
 'geo_kab': ('Titik acuan kab/kota: dataset eppofahmi/geojson-indonesia (perlu verifikasi BPS/Geoportal)', 'https://github.com/eppofahmi/geojson-indonesia'),
 'geo_prov': ('Centroid poligon provinsi: dataset 38 provinsi denyherianto (perlu verifikasi BPS/Geoportal)', 'https://github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces'),
}
def S(*keys):
    return [{'label': SRC[k][0], 'url': SRC[k][1]} for k in keys]

simpul = []
def node(**kw):
    base = dict(desa=None, kecamatan=None, kabupaten=None, provinsi=None, komoditas=None, pengelola=None,
                petani=None, luas_ha=None, panen_ton=None, tahun_mulai=None, kapasitas_ton=None,
                musim_panen=None, stok_simpan_ton=None, kebutuhan_ton=None, tingkat_baznas=None,
                status={}, sumber=[], perlu_verifikasi=[], catatan='')
    base.update(kw)
    simpul.append(base)

JABAR, BANTEN, SUMUT, NTB, JATENG = 'JAWA BARAT', 'BANTEN', 'SUMATERA UTARA', 'NUSA TENGGARA BARAT', 'JAWA TENGAH'
c = lambda f: {k: 'contoh' for k in f}
a = lambda f: {k: 'asli' for k in f}

# musim panen contoh (bulan 1-12) – pola umum rendeng (Mar–Apr) & gadu (Agu–Sep)
JAWA = [3, 4, 8]; SUMATRA = [3, 4, 8, 9]

# ---------------- LUMBUNG ----------------
L = [
 dict(id='L01', nama='Lumbung Pangan Sukabumi', desa='Cimanggu', kecamatan='Cikembar', kabupaten='Kab. Sukabumi', provinsi='Jawa Barat',
      ll=K(JABAR, 'SUKABUMI'), komoditas='padi', pengelola='BAZNAS RI', kapasitas_ton=133.7, musim_panen=JAWA, stok_simpan_ton=20,
      status={**a(['kapasitas_ton']), **c(['musim_panen', 'stok_simpan_ton'])}, sumber=S('antara_suka', 'baznasjabar_16t', 'jko_cimanggu'),
      catatan='Padi organik; penggilingan + koperasi; beras "Raos". Kapasitas = 133,7 ton beras zakat fitrah 1446 H yang disiapkan.'),
 dict(id='L02', nama='Lumbung Pangan Serang', kecamatan='Petir & Pamarayan', kabupaten='Kab. Serang', provinsi='Banten',
      ll=K(BANTEN, 'SERANG'), komoditas='padi', pengelola='BAZNAS RI', tahun_mulai=2019, kapasitas_ton=90, musim_panen=JAWA, stok_simpan_ton=15,
      status={**a(['tahun_mulai']), **c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton'])}, sumber=S('chanel_serang', 'rm_zf2026'),
      catatan='Penggilingan; lokasi awal 2019; pemasok zakat fitrah 2026.'),
 dict(id='L03', nama='Lumbung Pangan Karawang', desa='Cikalong', kecamatan='Cilamaya Wetan', kabupaten='Kab. Karawang', provinsi='Jawa Barat',
      ll=K(JABAR, 'KARAWANG'), komoditas='padi', pengelola='BAZNAS RI', petani=23, luas_ha=23.5, kapasitas_ton=50, musim_panen=JAWA, stok_simpan_ton=8,
      status={**a(['petani', 'luas_ha']), **c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton'])}, sumber=S('chanel_karawang', 'chanel_34prov'),
      perlu_verifikasi=['petani', 'luas_ha'], catatan='Kelompok Tani Bina Mandiri. Angka petani & luas dari brief tim; URL angka perlu dilengkapi.'),
 dict(id='L04', nama='Lumbung Pangan Teluknaga', desa='Kampung Melayu Barat', kecamatan='Teluknaga', kabupaten='Kab. Tangerang', provinsi='Banten',
      ll=K(BANTEN, 'TANGERANG'), komoditas='padi', pengelola='BAZNAS RI + BAZNAS Kab. Tangerang', tahun_mulai=2025, kapasitas_ton=40, musim_panen=JAWA, stok_simpan_ton=5,
      status={**a(['tahun_mulai']), **c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton'])}, perlu_verifikasi=['tahun_mulai'],
      catatan='Diresmikan Juli 2025 (brief tim; URL perlu dilengkapi).'),
 dict(id='L05', nama='Lumbung Pangan Batu Bara', desa='Kwala Gunung', kecamatan='Datuk Lima Puluh', kabupaten='Kab. Batu Bara', provinsi='Sumatera Utara',
      ll=K(SUMUT, 'BATU BARA'), komoditas='padi', pengelola='BAZNAS RI + BAZNAS Prov. Sumut + BAZNAS Kab. Batu Bara', petani=52, luas_ha=32, panen_ton=150, tahun_mulai=2018,
      kapasitas_ton=80, musim_panen=SUMATRA, stok_simpan_ton=10,
      status={**a(['petani', 'luas_ha', 'panen_ton', 'tahun_mulai']), **c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton'])}, sumber=S('rri_batubara', 'rm_batubara'),
      perlu_verifikasi=['petani'], catatan='Panen 150 ton gabah kering panen (GKP). Kapasitas beras contoh ≈ rendemen ~55% dari GKP.'),
 dict(id='L06', nama='Lumbung Pangan Lombok Timur (jagung)', desa='Gunung Malang & Seruni', kecamatan='Pringgabaya', kabupaten='Kab. Lombok Timur', provinsi='Nusa Tenggara Barat',
      ll=K(NTB, 'LOMBOK TIMUR'), komoditas='jagung', pengelola='BAZNAS RI', petani=32, luas_ha=50, panen_ton=400,
      status=a(['petani', 'luas_ha', 'panen_ton']), sumber=S('rri_lotim'), perlu_verifikasi=['petani', 'luas_ha', 'panen_ton'],
      catatan='Kelompok Tani Barokah Zakat. Panen = potensi 400 ton jagung (bukan beras; tidak masuk model beras).'),
 dict(id='L07', nama='Lumbung Pangan Lombok Timur (padi)', kecamatan='Masbagik & Sikur', kabupaten='Kab. Lombok Timur', provinsi='Nusa Tenggara Barat',
      ll=K(NTB, 'LOMBOK TIMUR'), komoditas='padi', pengelola='BAZNAS RI', petani=120, luas_ha=25, kapasitas_ton=45, musim_panen=[3, 4], stok_simpan_ton=6,
      status={**a(['petani', 'luas_ha']), **c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton'])}, perlu_verifikasi=['petani', 'luas_ha'],
      catatan='Angka petani & luas dari brief tim; URL perlu dilengkapi.'),
 dict(id='L08', nama='Lumbung Pangan Purbalingga', kabupaten='Kab. Purbalingga', provinsi='Jawa Tengah',
      ll=K(JATENG, 'PURBALINGGA'), komoditas='padi', pengelola='BAZNAS RI', kapasitas_ton=70, musim_panen=JAWA, stok_simpan_ton=10,
      status=c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton']), sumber=S('rm_zf2026'), catatan='Pemasok zakat fitrah 2026.'),
 dict(id='L09', nama='Lumbung Pangan Pesawaran', kabupaten='Kab. Pesawaran', provinsi='Lampung',
      ll=K('LAMPUNG', 'PESAWARAN'), komoditas='padi', pengelola='BAZNAS RI', kapasitas_ton=70, musim_panen=SUMATRA, stok_simpan_ton=10,
      status=c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton']), sumber=S('rm_zf2026'), catatan='Pemasok zakat fitrah 2026.'),
 dict(id='L10', nama='Lumbung Pangan Polewali Mandar', kabupaten='Kab. Polewali Mandar', provinsi='Sulawesi Barat',
      ll=K('SULAWESI BARAT', 'POLEWALI MANDAR'), komoditas='padi', pengelola='BAZNAS RI', kapasitas_ton=60, musim_panen=[4, 5, 9], stok_simpan_ton=8,
      status=c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton']), sumber=S('rm_zf2026'), catatan='Pemasok zakat fitrah 2026.'),
 dict(id='L11', nama='Lumbung Pangan Garut', kabupaten='Kab. Garut', provinsi='Jawa Barat', ll=K(JABAR, 'GARUT'), pengelola='BAZNAS RI',
      catatan='Komoditas belum ada data.'),
 dict(id='L12', nama='Lumbung Pangan Sleman', kabupaten='Kab. Sleman', provinsi='DI Yogyakarta', ll=K('DAERAH ISTIMEWA YOGYAKARTA', 'SLEMAN'), pengelola='BAZNAS RI',
      catatan='Komoditas belum ada data.'),
 dict(id='L13', nama='Lumbung Pangan Al-Ittifaq', kabupaten='Kab. Bandung', provinsi='Jawa Barat', ll=K(JABAR, 'BANDUNG'), komoditas='hortikultura', pengelola='BAZNAS RI',
      catatan='Mitra pesantren.'),
 dict(id='L14', nama='Lumbung Pangan Pandeglang', kabupaten='Kab. Pandeglang', provinsi='Banten', ll=K(BANTEN, 'PANDEGLANG'), pengelola='BAZNAS RI',
      catatan='Komoditas belum ada data.'),
 dict(id='L15', nama='Lumbung Pangan Papua', provinsi='Papua', ll=provc['Papua'], presisi='provinsi', pengelola='BAZNAS RI',
      catatan='Kabupaten belum diketahui; titik = centroid Provinsi Papua (presisi provinsi).'),
 dict(id='L16', nama='Lumbung Pangan Sragen (melon greenhouse)', kabupaten='Kab. Sragen', provinsi='Jawa Tengah', ll=K(JATENG, 'SRAGEN'), komoditas='hortikultura',
      pengelola='BAZNAS Kab. Sragen', sumber=S('jrmdk_sragen'), catatan='Melon greenhouse.'),
 dict(id='L17', nama='Lumbung Pangan Berkah Barito Kuala', kabupaten='Kab. Barito Kuala', provinsi='Kalimantan Selatan',
      ll=K('KALIMANTAN SELATAN', 'BARITO KUALA'), komoditas='padi', pengelola='BAZNAS Prov. Kalsel', luas_ha=100, panen_ton=279.4, tahun_mulai=2022,
      kapasitas_ton=120, musim_panen=[8, 9], stok_simpan_ton=25,
      status={**a(['luas_ha', 'panen_ton', 'tahun_mulai']), **c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton'])}, sumber=S('antasari_batola'),
      catatan='Lumbung Pangan Berkah, 100 ha; panen 279.442 kg (skripsi, data BAZNAS Kalsel).'),
 dict(id='L18', nama='Lumbung Pangan Siak', desa='Kemuning Muda', kecamatan='Bungaraya', kabupaten='Kab. Siak', provinsi='Riau',
      ll=K('RIAU', 'SIAK'), komoditas='padi', pengelola='BAZNAS Kab. Siak + BAZNAS Prov. Riau', kapasitas_ton=50, musim_panen=[3, 8], stok_simpan_ton=8,
      status=c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton']), sumber=S('puskas_siak')),
 dict(id='L19', nama='Lumbung Pangan Bulukumba', desa='Barombong', kabupaten='Kab. Bulukumba', provinsi='Sulawesi Selatan',
      ll=K('SULAWESI SELATAN', 'BULUKUMBA'), komoditas='padi', pengelola='BAZNAS Kab. Bulukumba', tahun_mulai=2024, kapasitas_ton=40, musim_panen=[4, 5, 9], stok_simpan_ton=5,
      status={**a(['tahun_mulai']), **c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton'])}, perlu_verifikasi=['tahun_mulai'],
      catatan='Mulai Oktober 2024 (brief tim; URL perlu dilengkapi).'),
 dict(id='L20', nama='Lumbung Pangan Sumedang', kabupaten='Kab. Sumedang', provinsi='Jawa Barat', ll=K(JABAR, 'SUMEDANG'), pengelola='BAZNAS Kab. Sumedang',
      catatan='Komoditas belum ada data.'),
 dict(id='L21', nama='Lumbung Pangan Cianjur', kabupaten='Kab. Cianjur', provinsi='Jawa Barat', ll=K(JABAR, 'CIANJUR'), komoditas='padi', pengelola='BAZNAS Kab. Cianjur',
      kapasitas_ton=50, musim_panen=JAWA, stok_simpan_ton=8, status=c(['kapasitas_ton', 'musim_panen', 'stok_simpan_ton']), sumber=S('antara_cianjur'),
      catatan='Pemasok zakat fitrah (Kelompok Tani Kelewih).'),
]
for d in L:
    lat, lon = d.pop('ll')
    pres = d.pop('presisi', 'kabupaten')
    d.setdefault('sumber', [])
    d['sumber'] = d['sumber'] + S('geo_prov' if pres == 'provinsi' else 'geo_kab')
    node(jenis='lumbung', lat=lat, lon=lon, presisi_lokasi=pres, **d)

# ---------------- PENGGILINGAN ----------------
node(jenis='penggilingan', id='G01', nama='Penggilingan & Koperasi Lumbung Pangan Sukabumi', desa='Cimanggu', kecamatan='Cikembar', kabupaten='Kab. Sukabumi',
     provinsi='Jawa Barat', lat=K(JABAR, 'SUKABUMI')[0], lon=K(JABAR, 'SUKABUMI')[1], presisi_lokasi='kabupaten', pengelola='BAZNAS RI', komoditas='padi',
     sumber=S('antara_suka', 'geo_kab'), catatan='Terkait Lumbung Pangan Sukabumi (L01).')
node(jenis='penggilingan', id='G02', nama='Penggilingan Lumbung Pangan Serang', kecamatan='Petir & Pamarayan', kabupaten='Kab. Serang',
     provinsi='Banten', lat=K(BANTEN, 'SERANG')[0], lon=K(BANTEN, 'SERANG')[1], presisi_lokasi='kabupaten', pengelola='BAZNAS RI', komoditas='padi',
     sumber=S('chanel_serang', 'geo_kab'), catatan='Terkait Lumbung Pangan Serang (L02).')

# ---------------- BAZNAS ----------------
def bz(id, nama, tingkat, prov, kabname, provname, keb, pres='kabupaten', ll=None):
    lat, lon = ll or K(prov, kabname)
    node(jenis='baznas', id=id, nama=nama, tingkat_baznas=tingkat, provinsi=provname, kabupaten=kabname.title().replace('Kota ', 'Kota '),
         lat=lat, lon=lon, presisi_lokasi=pres, pengelola=nama, kebutuhan_ton=keb, status={'kebutuhan_ton': 'contoh'}, sumber=S('geo_kab'),
         catatan='Titik = acuan kab/kota tempat kantor; alamat resmi perlu diambil dari situs *.baznas.go.id.')

bz('B00', 'BAZNAS RI', 'ri', 'DKI JAKARTA', 'KOTA JAKARTA TIMUR', 'DKI Jakarta', 320)
prov_list = [
 ('BP01', 'BAZNAS Provinsi Jawa Barat', JABAR, 'KOTA BANDUNG', 'Jawa Barat', 60),
 ('BP02', 'BAZNAS Provinsi Banten', BANTEN, 'KOTA SERANG', 'Banten', 40),
 ('BP03', 'BAZNAS Provinsi Sumatera Utara', SUMUT, 'KOTA MEDAN', 'Sumatera Utara', 35),
 ('BP04', 'BAZNAS Provinsi NTB', NTB, 'KOTA MATARAM', 'Nusa Tenggara Barat', 25),
 ('BP05', 'BAZNAS Provinsi Jawa Tengah', JATENG, 'KOTA SEMARANG', 'Jawa Tengah', 50),
 ('BP06', 'BAZNAS Provinsi Lampung', 'LAMPUNG', 'KOTA BANDAR LAMPUNG', 'Lampung', 25),
 ('BP07', 'BAZNAS Provinsi Sulawesi Barat', 'SULAWESI BARAT', 'MAMUJU', 'Sulawesi Barat', 15),
 ('BP08', 'BAZNAS Provinsi DI Yogyakarta', 'DAERAH ISTIMEWA YOGYAKARTA', 'KOTA YOGYAKARTA', 'DI Yogyakarta', 20),
 ('BP09', 'BAZNAS Provinsi Papua', 'PAPUA', 'KOTA JAYAPURA', 'Papua', 15),
 ('BP10', 'BAZNAS Provinsi Kalimantan Selatan', 'KALIMANTAN SELATAN', 'KOTA BANJAR BARU', 'Kalimantan Selatan', 25),
 ('BP11', 'BAZNAS Provinsi Riau', 'RIAU', 'KOTA PEKANBARU', 'Riau', 25),
 ('BP12', 'BAZNAS Provinsi Sulawesi Selatan', 'SULAWESI SELATAN', 'KOTA MAKASSAR', 'Sulawesi Selatan', 35),
]
for p in prov_list:
    bz(p[0], p[1], 'provinsi', p[2], p[3], p[4], p[5])
kab_list = [
 ('BK01', 'BAZNAS Kab. Sukabumi', JABAR, 'SUKABUMI', 'Jawa Barat', 25), ('BK02', 'BAZNAS Kab. Serang', BANTEN, 'SERANG', 'Banten', 20),
 ('BK03', 'BAZNAS Kab. Karawang', JABAR, 'KARAWANG', 'Jawa Barat', 25), ('BK04', 'BAZNAS Kab. Tangerang', BANTEN, 'TANGERANG', 'Banten', 30),
 ('BK05', 'BAZNAS Kab. Batu Bara', SUMUT, 'BATU BARA', 'Sumatera Utara', 12), ('BK06', 'BAZNAS Kab. Lombok Timur', NTB, 'LOMBOK TIMUR', 'Nusa Tenggara Barat', 20),
 ('BK07', 'BAZNAS Kab. Purbalingga', JATENG, 'PURBALINGGA', 'Jawa Tengah', 15), ('BK08', 'BAZNAS Kab. Pesawaran', 'LAMPUNG', 'PESAWARAN', 'Lampung', 10),
 ('BK09', 'BAZNAS Kab. Polewali Mandar', 'SULAWESI BARAT', 'POLEWALI MANDAR', 'Sulawesi Barat', 12), ('BK10', 'BAZNAS Kab. Garut', JABAR, 'GARUT', 'Jawa Barat', 25),
 ('BK11', 'BAZNAS Kab. Sleman', 'DAERAH ISTIMEWA YOGYAKARTA', 'SLEMAN', 'DI Yogyakarta', 18), ('BK12', 'BAZNAS Kab. Bandung', JABAR, 'BANDUNG', 'Jawa Barat', 30),
 ('BK13', 'BAZNAS Kab. Pandeglang', BANTEN, 'PANDEGLANG', 'Banten', 15), ('BK14', 'BAZNAS Kab. Sragen', JATENG, 'SRAGEN', 'Jawa Tengah', 15),
 ('BK15', 'BAZNAS Kab. Barito Kuala', 'KALIMANTAN SELATAN', 'BARITO KUALA', 'Kalimantan Selatan', 10), ('BK16', 'BAZNAS Kab. Siak', 'RIAU', 'SIAK', 'Riau', 12),
 ('BK17', 'BAZNAS Kab. Bulukumba', 'SULAWESI SELATAN', 'BULUKUMBA', 'Sulawesi Selatan', 12), ('BK18', 'BAZNAS Kab. Sumedang', JABAR, 'SUMEDANG', 'Jawa Barat', 15),
 ('BK19', 'BAZNAS Kab. Cianjur', JABAR, 'CIANJUR', 'Jawa Barat', 22),
]
for k in kab_list:
    bz(k[0], k[1], 'kabupaten', k[2], k[3], k[4], k[5])

# ---------------- BULOG ----------------
lat, lon = K('DKI JAKARTA', 'KOTA JAKARTA SELATAN')
node(jenis='bulog', id='BL01', nama='Perum Bulog (kantor pusat)', kabupaten='Kota Jakarta Selatan', provinsi='DKI Jakarta', lat=lat, lon=lon,
     presisi_lokasi='kabupaten', pengelola='Perum Bulog', sumber=S('chanel_34prov', 'geo_kab'),
     catatan='Pemasok cadangan dalam model. Diasumsikan memasok dari gudang setempat dengan ongkos rata per ton (parameter).')

# rapikan: nama kabupaten BAZNAS
for s in simpul:
    if s['jenis'] == 'baznas' and s['kabupaten']:
        k = s['kabupaten'].title()
        s['kabupaten'] = k if k.startswith('Kota') else 'Kab. ' + k

alur = [
 {'dari': 'L01', 'ke': 'B00', 'status': 'terdokumentasi', 'keterangan': 'Beras zakat fitrah 1446 H (133,7 ton disiapkan; 3.200 karung ≈16 ton dikirim ke BAZNAS RI)', 'sumber': S('antara_suka', 'baznasjabar_16t')},
 {'dari': 'L02', 'ke': 'B00', 'status': 'tujuan_perlu_verifikasi', 'keterangan': 'Pemasok zakat fitrah 2026; tujuan diasumsikan BAZNAS RI', 'sumber': S('rm_zf2026')},
 {'dari': 'L08', 'ke': 'B00', 'status': 'tujuan_perlu_verifikasi', 'keterangan': 'Pemasok zakat fitrah 2026; tujuan diasumsikan BAZNAS RI', 'sumber': S('rm_zf2026')},
 {'dari': 'L09', 'ke': 'B00', 'status': 'tujuan_perlu_verifikasi', 'keterangan': 'Pemasok zakat fitrah 2026; tujuan diasumsikan BAZNAS RI', 'sumber': S('rm_zf2026')},
 {'dari': 'L10', 'ke': 'B00', 'status': 'tujuan_perlu_verifikasi', 'keterangan': 'Pemasok zakat fitrah 2026; tujuan diasumsikan BAZNAS RI', 'sumber': S('rm_zf2026')},
]

parameter = {
 'tarif_per_tonkm': {'nilai': 1500, 'satuan': 'Rp/ton-km', 'status': 'contoh', 'label': 'Tarif angkut'},
 'faktor_jalan': {'nilai': 1.3, 'satuan': '×', 'status': 'contoh', 'label': 'Faktor jalan'},
 'ongkos_bulog_per_ton': {'nilai': 1000000, 'satuan': 'Rp/ton', 'status': 'contoh', 'label': 'Ongkos tambahan Bulog'},
 'radius_penggilingan_km': {'nilai': 100, 'satuan': 'km', 'status': 'contoh', 'label': 'Radius penggilingan'},
 'jendela_simpan_bulan': {'nilai': 6, 'satuan': 'bulan', 'status': 'contoh', 'label': 'Lama simpan gabah maksimum'},
 'kapasitas_bulog_ton': {'nilai': None, 'satuan': 'ton', 'status': 'contoh', 'label': 'Batas pasokan Bulog (kosong = tak terbatas)'},
}

statistik = {
 'lokasi_nasional': {'nilai': 21, 'provinsi': 11, 'label': '21 lokasi di 11 provinsi sejak 2018', 'sumber': S('rm_batubara')},
 'penerima_zakat_fitrah': {'nilai': 675000, 'label': 'Target penerima zakat fitrah BAZNAS RI (jiwa, 34 provinsi)', 'sumber': S('antara_675rb')},
 'petani_binaan_nasional': {'nilai': 735, 'label': 'Petani binaan Lumbung Pangan BAZNAS (2025)', 'sumber': S('antara_suka')},
 'petani_muzaki': {'nilai': 80, 'label': 'Petani binaan menjadi muzaki (2022–2024)', 'sumber': S('antara_80muzaki')},
}
dampak = {
 'judul': 'Petani binaan yang menjadi muzaki per lokasi (2022–2024)',
 'data': [{'lokasi': 'Sukabumi', 'nilai': 40}, {'lokasi': 'Sragen', 'nilai': 31}, {'lokasi': 'Garut', 'nilai': 5},
          {'lokasi': 'Kalimantan Selatan', 'nilai': 3}, {'lokasi': 'Sleman', 'nilai': 1}],
 'status': 'asli', 'sumber': S('antara_80muzaki'),
 'catatan': 'Rincian per lokasi dari brief tim (data publik); total 80 sesuai berita ANTARA. Tautan menuju indeks berita; URL artikel perlu dilengkapi.'
}

out = {'meta': {'versi': '0.1.0', 'diperbarui': '2026-11-08', 'catatan': 'Data awal prototipe ZakaTani. Angka berstatus "contoh" bersifat sementara.'},
       'parameter': parameter, 'simpul': simpul, 'alur': alur, 'statistik': statistik, 'dampak': dampak}
json.dump(out, open(f'{ROOT}/data/simpul.json', 'w'), ensure_ascii=False, indent=1)

# basemap provinsi (presisi 3 desimal)
def rnd(x):
    return [rnd(i) for i in x] if isinstance(x[0], list) else [round(x[0], 3), round(x[1], 3)]
for f in prov38['features']:
    f['geometry']['coordinates'] = rnd(f['geometry']['coordinates'])
    f['properties'] = {'provinsi': f['properties']['PROVINSI']}
json.dump(prov38, open(f'{ROOT}/data/indonesia-provinsi.geojson', 'w'), separators=(',', ':'))
print(len(simpul), 'simpul;', sum(s['jenis'] == 'lumbung' for s in simpul), 'lumbung')
