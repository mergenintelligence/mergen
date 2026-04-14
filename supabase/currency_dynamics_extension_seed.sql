-- Currency dynamics category extension seed for Mergen Intelligence
-- Safe to run multiple times.

INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES
  ('38000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000008','Euro / ABD Doları','EURUSD','YAHOO','Kuresel ticaretin ana paritesi olan EUR/USD kurunu temsil eder.',false,1.4),
  ('38000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000008','JPMorgan VXY Index','JPM_VXY_INDEX','FX_MANUAL','Doviz piyasalarindaki toplu oynaklik seviyesini temsil eder.',true,1.3),
  ('38000000-0000-0000-0000-000000000008','30000000-0000-0000-0000-000000000008','Cross-Currency Basis Swaps','CROSS_CURRENCY_BASIS','FX_MANUAL','Dolar likiditesine erisim maliyetini temsil eden basis swap baskisini gosterir.',true,1.3),
  ('38000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000008','Meksika Pesosu / ABD Doları Kuru','DEXMXUS','FRED','Risk-on/risk-off hassasiyeti yuksek olan Meksika pesosunu temsil eder.',false,1.1),
  ('38000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000008','Altın / Gümüş Rasyosu','GOLD_SILVER_RATIO','FRED_COMPOSITE','Altin ve gumus arasindaki goreli guven-sanayi ayrismasini temsil eder.',true,1.2),
  ('38000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000008','Döviz Rezervi Aşınma Hızı','FX_RESERVE_DEPLETION_VELOCITY','FX_MANUAL','Merkez bankalarinin kuru savunmak icin harcadigi rezerv hizini temsil eder.',true,1.2),
  ('38000000-0000-0000-0000-000000000012','30000000-0000-0000-0000-000000000008','Bitcoin / USD','BTCUSD_FX','YAHOO','Kuresel fiat likiditesine karsi dijital alternatifin fiyat tepkisini temsil eder.',false,1.0),
  ('38000000-0000-0000-0000-000000000013','30000000-0000-0000-0000-000000000008','Dolar Endeksi (DXY)','DXY_FX','YAHOO','ABD dolarinin genis ana para birimleri sepetine karsi gucunu temsil eder.',true,1.5),
  ('38000000-0000-0000-0000-000000000014','30000000-0000-0000-0000-000000000008','İsviçre Frangı / ABD Doları Kuru','CHFUSD','YAHOO','Guvenli liman franginin dolar karsisindaki seyrini temsil eder.',false,1.0),
  ('38000000-0000-0000-0000-000000000015','30000000-0000-0000-0000-000000000008','Avustralya Doları / Japon Yeni Kuru','AUDJPY','YAHOO','Kuresel carry trade ve emtia risk istahinin hassas capraz kur gostergesidir.',false,1.2),
  ('38000000-0000-0000-0000-000000000016','30000000-0000-0000-0000-000000000008','Güney Kore Wonu / ABD Doları Kuru','DEXKOUS','FRED','Asya teknoloji dongusu ve dis ticaret hassasiyeti uzerinden KRW/USD kurunu temsil eder.',true,1.0),
  ('38000000-0000-0000-0000-000000000017','30000000-0000-0000-0000-000000000008','Singapur Doları / ABD Doları Kuru','SGDUSD','YAHOO','Asya ticaret merkezi Singapur uzerinden bolgesel kur dengesini temsil eder.',false,0.9),
  ('38000000-0000-0000-0000-000000000018','30000000-0000-0000-0000-000000000008','Norveç Kronu / ABD Doları Kuru','NOKUSD','YAHOO','Enerji ihracatcisi bir G10 para birimi olarak NOK/USD kurunu temsil eder.',false,0.9),
  ('38000000-0000-0000-0000-000000000019','30000000-0000-0000-0000-000000000008','Offshore Yuan / Onshore Yuan Spreadi','CNH_CNY_SPREAD_FX','FX_MANUAL','Offshore ve onshore yuan ayrismasi uzerinden sermaye kontrol baskisini temsil eder.',true,1.1),
  ('38000000-0000-0000-0000-000000000020','30000000-0000-0000-0000-000000000008','3 Ay EUR/USD İmplied Volatilite','EURUSD_3M_IV','FX_MANUAL','EUR/USD opsiyon piyasasindaki uc aylik zımni oynakligi temsil eder.',true,1.0),
  ('38000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000008','3 Ay USD/JPY İmplied Volatilite','USDJPY_3M_IV','FX_MANUAL','USD/JPY opsiyon piyasasindaki uc aylik zımni oynakligi temsil eder.',true,1.0),
  ('38000000-0000-0000-0000-000000000022','30000000-0000-0000-0000-000000000008','USD/JPY Risk Reversal','USDJPY_RISK_REVERSAL','FX_MANUAL','Yatirimcilarin JPY yonundeki kuyruk risk tercihini temsil eden opsiyon egimini gosterir.',true,1.0),
  ('38000000-0000-0000-0000-000000000023','30000000-0000-0000-0000-000000000008','EUR/USD Risk Reversal','EURUSD_RISK_REVERSAL','FX_MANUAL','Yatirimcilarin EUR yonundeki kuyruk risk tercihini temsil eden opsiyon egimini gosterir.',true,1.0),
  ('38000000-0000-0000-0000-000000000024','30000000-0000-0000-0000-000000000008','G10 Carry Trade Sepet Getirisi','G10_CARRY_BASKET_RETURN','FX_MANUAL','Faiz farklarina dayali G10 carry stratejisinin ortak getirisini temsil eder.',false,1.1),
  ('38000000-0000-0000-0000-000000000025','30000000-0000-0000-0000-000000000008','Reel Faiz Farkları (US vs G10)','REAL_RATE_DIFF_US_G10','FX_MANUAL','ABD ile G10 arasindaki reel faiz farkinin kur baskisina etkisini temsil eder.',true,1.0),
  ('38000000-0000-0000-0000-000000000026','30000000-0000-0000-0000-000000000008','FX Forward Points Eğrisi','FX_FORWARD_POINTS_CURVE','FX_MANUAL','Forward puan egimi uzerinden fonlama ve carry dengesini temsil eder.',true,0.9),
  ('38000000-0000-0000-0000-000000000027','30000000-0000-0000-0000-000000000008','Merkez Bankası Müdahale Proksi Endeksi','CB_INTERVENTION_PROXY','FX_MANUAL','Kur savunmasi ve sterilize olmayan mudahale baskisini temsil eden proksi endekstir.',true,1.0)
ON CONFLICT (symbol) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  source = EXCLUDED.source,
  description = EXCLUDED.description,
  is_inverse = EXCLUDED.is_inverse,
  weight = EXCLUDED.weight;
