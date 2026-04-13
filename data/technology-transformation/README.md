# Technology Transformation Data

Bu klasor, `Teknoloji ve Yapisal Donusum` kategorisinin manuel import edilen veri dosyalari icindir.

Beklenen dosyalar:

- `hyperscaler_ai_capex.csv`
  - ornek kolonlar: `date,value`
  - alternatif: `year,quarter,capex`
- `iea_data_center_power.csv`
  - ornek kolonlar: `year,value`
- `tsmc_dependency.csv`
  - ornek kolonlar: `year,share`
- `strategic_value_index.csv`
  - ornek kolonlar: `year,index`

Hazir doldurulabilir sablonlar:

- `hyperscaler_ai_capex.csv`
- `iea_data_center_power.csv`
- `tsmc_dependency.csv`
- `strategic_value_index.csv`

Bu dosyalar su an ornek sayilarla olusturuldu.
Istersen bunlari dogrudan gercek verilerle degistirip import edebilirsin.

Yorumlama notu:

- `hyperscaler_ai_capex.csv`
  - toplam capex ya da AI ilgili capex proxy olabilir
  - ayni metodolojiyle devam edilmesi en onemli nokta
- `iea_data_center_power.csv`
  - elektrik talep baskisi arttikca metrik daha zorlayici yorumlanir
- `tsmc_dependency.csv`
  - daha yuksek pay = daha yuksek yogunlasma/kirilganlik
- `strategic_value_index.csv`
  - burada kendi ic metodolojini kullanabilirsin; ana fikir yillar boyunca tutarlilik

Notlar:

- `date` kullaniliyorsa `YYYY-MM-DD` tercih edilir.
- `year` + `quarter` kullaniliyorsa quarter `Q1/Q2/Q3/Q4` olabilir.
- Yuzdeler `%` ile yazilsa da importer temizler.

Import komutu:

```bash
npm run import:technology-transformation
```
