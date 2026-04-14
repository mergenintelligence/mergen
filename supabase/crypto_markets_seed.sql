-- Crypto Markets category seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO categories (id, name, description, weight)
VALUES (
  '30000000-0000-0000-0000-000000000011',
  'Kripto Para Piyasaları',
  'Bitcoin, Ethereum ve ana kripto varliklari uzerinden piyasa yapisi, kurumsal adaptasyon ve makro korelasyon cercevesinde dijital varlik rejimini izler.',
  0.05
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight;

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  (
    '41000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000011',
    'Bitcoin Fiyatı (USD)',
    'BTCUSD',
    'YAHOO',
    'Bitcoin spot fiyati. Kripto piyasasinin temel reserve varlik gostergesi ve piyasa yapisi referansi.',
    false,
    3.0
  ),
  (
    '41000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000011',
    'Ethereum Fiyatı (USD)',
    'ETH',
    'YAHOO',
    'Ethereum spot fiyati. Akilli sozlesme ekosistemi genisligi ve DeFi/NFT risk istahinin proxy gostergesi.',
    false,
    2.0
  ),
  (
    '41000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000011',
    'BNB Fiyatı (USD)',
    'BNB',
    'YAHOO',
    'BNB spot fiyati. Binance ekosistemi genisligi ve merkezi borsa likiditesinin proxy gostergesi.',
    false,
    0.8
  ),
  (
    '41000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000011',
    'XRP Fiyatı (USD)',
    'XRP',
    'YAHOO',
    'XRP spot fiyati. Kurumsal odeme koridoru ve Ripple ekosistemi varlik talebi gostergesi.',
    false,
    0.8
  ),
  (
    '41000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000011',
    'Coinbase Global (COIN)',
    'COIN',
    'YAHOO',
    'Coinbase hissesi. Kripto piyasasina kurumsal sermaye girisi ve regule edilmis borsa sektorunun lider barometresi.',
    false,
    1.5
  ),
  (
    '41000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000011',
    'MicroStrategy (MSTR)',
    'MSTR',
    'YAHOO',
    'MicroStrategy hissesi. Kaldıraçlı BTC exposure proxy ve kurumsal Bitcoin birikimi anlatisinin amplifikator gostergesi.',
    false,
    1.0
  ),
  (
    '41000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000011',
    'BTC Dominance',
    'BTC.D',
    'CRYPTO_API',
    'Bitcoin piyasa degerinin toplam kripto piyasa degerine oranini gosteren piyasa liderligi metrigidir.',
    false,
    1.5
  ),
  (
    '41000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000011',
    'Stablecoin Dominance',
    'USDT.D',
    'CRYPTO_API',
    'Toplam stablecoin piyasa degerinin toplam kripto piyasa degerine oranini gosteren savunmaci likidite metrigidir.',
    true,
    1.2
  ),
  (
    '41000000-0000-0000-0000-000000000009',
    '30000000-0000-0000-0000-000000000011',
    'Toplam Kripto Piyasa Degeri',
    'TOTAL',
    'CRYPTO_API',
    'Toplam kripto piyasa degeri; risk istahinin en genis capli barometresi.',
    false,
    1.5
  ),
  (
    '41000000-0000-0000-0000-000000000010',
    '30000000-0000-0000-0000-000000000011',
    'Toplam Piyasa Degeri (BTC Haric)',
    'TOTAL2',
    'CRYPTO_API',
    'Bitcoin haric toplam piyasa degeri; altcoin genisligini olcer.',
    false,
    1.2
  ),
  (
    '41000000-0000-0000-0000-000000000011',
    '30000000-0000-0000-0000-000000000011',
    'Toplam Piyasa Degeri (BTC ve ETH Haric)',
    'TOTAL3',
    'CRYPTO_API',
    'Bitcoin ve Ethereum haric toplam piyasa degeri; spekulatif altcoin genisligini olcer.',
    false,
    1.0
  ),
  (
    '41000000-0000-0000-0000-000000000012',
    '30000000-0000-0000-0000-000000000011',
    'Open Interest',
    'OPEN_INTEREST',
    'CRYPTO_API',
    'BTC vadeli islemlerinde acik pozisyon buyuklugu; kaldirac birikimini temsil eder.',
    true,
    1.2
  ),
  (
    '41000000-0000-0000-0000-000000000013',
    '30000000-0000-0000-0000-000000000011',
    'Funding Rates',
    'FUNDING_RATES',
    'CRYPTO_API',
    'BTC perpetual kontratlarinda fonlama oranlari; long-short dengesini ve kalabalik yonlenmeyi gosterir.',
    true,
    1.2
  ),
  (
    '41000000-0000-0000-0000-000000000014',
    '30000000-0000-0000-0000-000000000011',
    'Liquidation Heatmap',
    'LIQUIDATION_HEATMAP',
    'CRYPTO_API',
    'Son tasfiye birikimini temsil eden kaldirac stresi proxy gostergesi.',
    true,
    1.0
  ),
  (
    '41000000-0000-0000-0000-000000000015',
    '30000000-0000-0000-0000-000000000011',
    'Total Stablecoin Market Cap',
    'TOTAL_STABLECOIN_MCAP',
    'CRYPTO_API',
    'Kripto ekosistemindeki toplam stablecoin likiditesini temsil eder.',
    false,
    1.3
  ),
  (
    '41000000-0000-0000-0000-000000000016',
    '30000000-0000-0000-0000-000000000011',
    'Net Stablecoin Exchange Inflow/Outflow',
    'NET_STABLECOIN_FLOW',
    'CRYPTO_API',
    'Stablecoin likiditesindeki net degisimi ve sisteme giren veya cikan taze sermaye yonunu temsil eder.',
    false,
    1.0
  ),
  (
    '41000000-0000-0000-0000-000000000017',
    '30000000-0000-0000-0000-000000000011',
    'Tether (USDT) Printing',
    'USDT_PRINTING',
    'CRYPTO_API',
    'USDT piyasa degerindeki kisa vadeli artis; sisteme eklenen yeni stablecoin likiditesi proxy gostergesi.',
    false,
    1.0
  ),
  (
    '41000000-0000-0000-0000-000000000018',
    '30000000-0000-0000-0000-000000000011',
    'Google Trends Bitcoin',
    'GOOGLE_TRENDS_BTC',
    'CRYPTO_API',
    'Google Trends uzerinden Bitcoin arama ilgisi; perakende ilgi ve anlati sicakligini temsil eder.',
    false,
    0.8
  ),
  (
    '41000000-0000-0000-0000-000000000019',
    '30000000-0000-0000-0000-000000000011',
    'Circle Internet Group',
    'CRCL',
    'YAHOO',
    'Circle hissesi. Stablecoin altyapisinin ve regule edilmis dolar token anlatısının halka acik sirket barometresi.',
    false,
    1.0
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;
