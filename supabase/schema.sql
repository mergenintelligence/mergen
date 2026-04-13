-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metrics Table
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  description TEXT,
  is_inverse BOOLEAN NOT NULL DEFAULT false,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metric Values Table
CREATE TABLE metric_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID REFERENCES metrics(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_id, date)
);

-- Scores Table
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('metric', 'category', 'total')),
  entity_id TEXT NOT NULL,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, date)
);

-- Alerts Table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('yellow', 'red', 'category', 'cross_risk')),
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Insights Table
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, date)
);

-- Insert remaining categories
INSERT INTO categories (id, name, description, weight) 
VALUES 
  ('10000000-0000-0000-0000-000000000002', 'Piyasa Likiditesi', 'Para arzı, merkez bankası bilançosu ve getiri eğrisi', 0.25),
  ('10000000-0000-0000-0000-000000000003', 'Reel Ekonomi ve Büyüme', 'İstihdam, üretim ve tüketim göstergeleri', 0.20),
  ('10000000-0000-0000-0000-000000000004', 'Enflasyon Baskıları', 'Tüketici fiyatları ve enflasyon beklentileri', 0.15),
  ('10000000-0000-0000-0000-000000000005', 'Küresel Riskler', 'Emtia fiyatları ve belirsizlik endeksleri', 0.15);

-- Insert metrics for remaining categories
INSERT INTO metrics (id, category_id, name, symbol, source, description, is_inverse, weight)
VALUES 
  -- Likidite
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'M2 Para Arzı', 'M2SL', 'FRED', 'M2 Real Money Stock', false, 1.0),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'Fed Bilançosu', 'WALCL', 'FRED', 'Total Assets of the Federal Reserve', false, 1.0),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '10Y-2Y Makası', 'T10Y2Y', 'FRED', '10-Year Treasury Constant Maturity Minus 2-Year', false, 1.5),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 'Dolar Endeksi', 'DX-Y.NYB', 'YAHOO', 'US Dollar Index', true, 1.0),
  
  -- Büyüme
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 'İşsizlik Oranı', 'UNRATE', 'FRED', 'Unemployment Rate', true, 2.0),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', 'Tarım Dışı İstihdam', 'PAYEMS', 'FRED', 'All Employees, Total Nonfarm', false, 1.5),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', 'Sanayi Üretimi', 'INDPRO', 'FRED', 'Industrial Production', false, 1.0),
  
  -- Enflasyon
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000004', 'TÜFE', 'CPIAUCSL', 'FRED', 'Consumer Price Index', true, 1.5),
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000004', 'Çekirdek PCE', 'PCEPILFE', 'FRED', 'Core Personal Consumption Expenditures', true, 1.5),
  ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000004', '5Y Enflasyon Beklentisi', 'T5YIFR', 'FRED', '5-Year Forward Inflation Expectation Rate', true, 1.0),
  
  -- Jeopolitik
  ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000005', 'Altın (Ons)', 'GC=F', 'YAHOO', 'Gold Futures', false, 1.0),
  ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000005', 'Petrol (WTI)', 'CL=F', 'YAHOO', 'Crude Oil Futures', true, 1.0),
  ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000005', 'Politik Belirsizlik', 'USEPUINDXD', 'FRED', 'Economic Policy Uncertainty Index for US', true, 1.5);
