# Fed Power Balance Data

Bu klasor, `Fed Ici Guc Dengesi` kategorisinin manuel import edilen veri dosyalari icindir.

Beklenen ilk dosya:

- `fed_hawk_dove_score.csv`
  - ornek kolonlar: `date,value`
  - alternatif: `year,quarter,score`

- `fed_governor_origin_score.csv`
  - ornek kolonlar: `year,score`
  - Wall Street / akademi / hukumet koken dagilimini tek skora indirger

- `fed_political_tilt.csv`
  - ornek kolonlar: `year,score`
  - daha yuksek skor daha dengeli / daha az siyasi baski

- `fed_think_tank_density.csv`
  - ornek kolonlar: `year,score`
  - daha dusuk skor daha yogun policy-network baglantisi

- `fed_revolving_door.csv`
  - ornek kolonlar: `year,score`
  - daha dusuk skor daha yuksek revolving-door etkisi

- `nyfed_wallstreet_linkage.csv`
  - ornek kolonlar: `year,score`
  - daha dusuk skor daha yogun Wall Street baglantisi

- `fed_sector_meeting_concentration.csv`
  - ornek kolonlar: `year,score`
  - daha dusuk skor gorusmelerin dar bir sektor grubunda yogunlastigini ima eder

- `fed_primary_dealer_influence.csv`
  - ornek kolonlar: `year,score`
  - daha dusuk skor primary dealer etkisinin daha yuksek oldugunu ima eder

Yorum:

- Daha yuksek skor, daha guvercin / daha genislemeci ton olarak kullanilabilir.
- Daha dusuk skor, daha sahin / daha sikilastirici ton olarak okunabilir.
- Onemli olan ayni metodolojiyle zaman serisi olusturmaktir.
- `fed_governor_origin_score.csv` icin daha yuksek skor daha bagimsiz / daha dengeli kompozisyon,
  daha dusuk skor ise Wall Street / finans agirligi olarak yorumlanabilir.
- Diger dosyalar icin de ana fikir ayni: daha yuksek skor daha dengeli / daha bagimsiz yapi,
  daha dusuk skor daha yogun baglanti / daha yuksek etki riski olarak okunabilir.

Import komutu:

```bash
npm run import:fed-power
```
