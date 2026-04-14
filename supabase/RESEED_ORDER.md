# Supabase Reseed Order

Bu repo icin en temiz kurulum akisi:

1. `reset_app_data.sql`
   Mevcut kategori, metric, metric_values, score, alert ve ai_insights verilerini temizler.

2. `schema.sql`
   Tablolari ve temel kategorileri/temel metrikleri kurar.

3. Sonra su seed dosyalarini sirayla calistir:

- `pilot_credit_stress_seed.sql`
- `social_stability_seed.sql`
- `social_stability_wid_shares_seed.sql`
- `social_stability_extension_seed.sql`
- `real_economy_extension_seed.sql`
- `inflation_extension_seed.sql`
- `global_risk_extension_seed.sql`
- `technology_transformation_seed.sql`
- `technology_transformation_extension_seed.sql`
- `fed_power_balance_seed.sql`
- `fed_power_balance_extension_seed.sql`
- `etf_capital_flows_seed.sql`
- `etf_capital_flows_extension_seed.sql`
- `precious_metals_seed.sql`
- `precious_metals_extension_seed.sql`
- `agri_food_security_seed.sql`
- `agri_food_security_extension_seed.sql`
- `agri_food_security_second_extension_seed.sql`
- `energy_security_seed.sql`
- `energy_security_extension_seed.sql`
- `currency_dynamics_seed.sql`
- `currency_dynamics_extension_seed.sql`
- `public_finance_seed.sql`
- `public_finance_extension_seed.sql`
- `emerging_markets_seed.sql`
- `emerging_markets_extension_seed.sql`
- `crypto_markets_seed.sql`
- `liquidity_extension_seed.sql`
- `first_wave_extension_seed.sql`

4. Sonra manuel importlari yeniden kos:

- `npm run import:social-stability`
- `npm run import:technology-transformation`
- `npm run import:fed-power`
- `npm run import:etf-capital-flows`

5. En sonda uygulamada kategori bazli veya tum sistem icin sync calistir.

## Onemli Notlar

- `schema.sql` su anda hem tablo hem de bir kisim temel kategori/metric insertlerini iceriyor.
- Bu nedenle `schema.sql` calistiktan sonra diger seed dosyalarini calistirmak dogru akistir.
- SQL Editor'de ad hoc / gecici tablar yerine bu repo altindaki dosyalari tek kaynak dogrusu olarak kullan.
- Reset sonrasi manuel import edilen datasetler tekrar yuklenmelidir; aksi halde bazi kategoriler bos gorunur.
