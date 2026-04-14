-- Inflation pressures category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '20000000-0000-0000-0000-000000000033',
    '10000000-0000-0000-0000-000000000004',
    'ÜFE (PPI)',
    'PPIACO',
    'FRED',
    'Uretici fiyat endeksi. Maliyet enflasyonunun oncu sinyalidir.',
    true,
    1.7
  ),
  (
    '20000000-0000-0000-0000-000000000034',
    '10000000-0000-0000-0000-000000000004',
    '10-Yıllık Başabaş Enflasyon Oranı',
    'T10YIE',
    'FRED',
    'Tahvil piyasasinin gelecek 10 yila dair bekledigi enflasyon orani.',
    true,
    1.6
  ),
  (
    '20000000-0000-0000-0000-000000000035',
    '10000000-0000-0000-0000-000000000004',
    'Yapışkan Fiyat TÜFE',
    'STICKCPIM158SFRBATL',
    'FRED',
    'Fiyati seyrek degisen kalemlerdeki enflasyonun yilliklandirilmis hizi.',
    true,
    1.5
  ),
  (
    '20000000-0000-0000-0000-000000000036',
    '10000000-0000-0000-0000-000000000004',
    'Ortalama Saatlik Kazançlar',
    'CES0500000003',
    'FRED',
    'Ozel sektor saatlik kazanc artis hizi. Ucret-fiyat sarmali riskini izler.',
    true,
    1.4
  ),
  (
    '20000000-0000-0000-0000-000000000037',
    '10000000-0000-0000-0000-000000000004',
    'Michigan Tüketici Enflasyon Beklentileri',
    'MICH',
    'FRED',
    'Hanehalkinin 12 aylik enflasyon beklentisi.',
    true,
    1.4
  ),
  (
    '20000000-0000-0000-0000-000000000038',
    '10000000-0000-0000-0000-000000000004',
    'Küresel Tedarik Zinciri Basınç Endeksi',
    'GSCPI',
    'INFLATION_MANUAL',
    'New York Fed kaynakli tedarik zinciri ve lojistik baski gostergesi.',
    true,
    1.3
  ),
  (
    '20000000-0000-0000-0000-000000000039',
    '10000000-0000-0000-0000-000000000004',
    'Supercore Enflasyon',
    'STICKCPIXSHLTRM158SFRBATL',
    'FRED',
    'Barinma haric yapiskan fiyat enflasyonu; hizmetler kaynakli daha kalici baskiyi okumak icin kullanilir.',
    true,
    1.7
  ),
  (
    '20000000-0000-0000-0000-000000000040',
    '10000000-0000-0000-0000-000000000004',
    'Cleveland Fed Medyan TÜFE',
    'MEDCPIM158SFRBCLE',
    'FRED',
    'Uctaki fiyat hareketlerini ayiklayarak enflasyonun genele yayilimini olcer.',
    true,
    1.5
  ),
  (
    '20000000-0000-0000-0000-000000000041',
    '10000000-0000-0000-0000-000000000004',
    'Zillow Kira Endeksi (ZORI)',
    'ZORI',
    'INFLATION_MANUAL',
    'Piyasadaki guncel kira degisimini gosteren ozel sektor oncu gostergesi.',
    true,
    1.2
  ),
  (
    '20000000-0000-0000-0000-000000000042',
    '10000000-0000-0000-0000-000000000004',
    'İthalat Fiyat Endeksi',
    'IR',
    'FRED',
    'Kur ve tedarik kanali uzerinden ithal edilen maliyet enflasyonunu gosterir.',
    true,
    1.3
  ),
  (
    '20000000-0000-0000-0000-000000000043',
    '10000000-0000-0000-0000-000000000004',
    'Atlanta Fed Ücret Takipçisi',
    'FRBATLWGTUMHWGO',
    'FRED',
    'Ayni kisilerin ucret artis hizina odaklanan daha hassas ucret enflasyonu gostergesi.',
    true,
    1.4
  ),
  (
    '20000000-0000-0000-0000-000000000044',
    '10000000-0000-0000-0000-000000000004',
    'CRB Emtia Endeksi',
    'CRB_COMMODITY',
    'INFLATION_MANUAL',
    'Genis emtia sepeti uzerinden maliyet enflasyonunun erken uyari gostergesi.',
    true,
    1.2
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;
