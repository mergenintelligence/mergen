# ETF And Capital Flows Data

Bu klasor, `ETF ve Sermaye Akisi` kategorisinin manuel import edilen veri dosyalari icindir.

Beklenen dosyalar:

- `etf_flow_pressure.csv`
  - ornek kolonlar: `year,quarter,score`
  - daha yuksek skor daha saglikli ve genis tabanli ETF akisi

- `options_positioning.csv`
  - ornek kolonlar: `year,quarter,score`
  - daha yuksek skor daha dengeli / destekleyici opsiyon konumlanmasi

- `whale_13f_concentration.csv`
  - ornek kolonlar: `year,quarter,score`
  - daha yuksek skor daha daginik / daha az kirilgan buyuk fon yogunlasmasi

Import komutu:

```bash
npm run import:etf-capital-flows
```
