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
  )
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;
