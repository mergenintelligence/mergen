import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import YahooFinance from "yahoo-finance2";
import { GoogleGenAI } from "@google/genai";
import { supabaseNode } from "./src/lib/supabaseNode";

const yahooFinance = new (YahooFinance as any)();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });
const SOCIAL_STABILITY_CATEGORY_ID = '30000000-0000-0000-0000-000000000001';
const TECHNOLOGY_CATEGORY_ID = '30000000-0000-0000-0000-000000000002';
const ETF_FLOWS_CATEGORY_ID = '30000000-0000-0000-0000-000000000004';
const PRECIOUS_METALS_CATEGORY_ID = '30000000-0000-0000-0000-000000000005';
const AGRI_FOOD_CATEGORY_ID = '30000000-0000-0000-0000-000000000006';
const CRYPTO_CATEGORY_ID = '30000000-0000-0000-0000-000000000011';
const NEWS_FEEDS = [
  'https://news.google.com/rss/search?q=markets%20OR%20stocks%20OR%20economy%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen',
  'https://news.google.com/rss/search?q=Fed%20OR%20inflation%20OR%20tariff%20OR%20recession%20OR%20oil%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen',
  'https://news.google.com/rss/search?q=China%20OR%20Treasury%20OR%20bank%20OR%20credit%20when%3A1d&hl=en-US&gl=US&ceid=US%3Aen',
];

type NewsItem = {
  id: string;
  title: string;
  link: string;
  publishedAt: string | null;
};

function getMetricCadence(source: string): 'daily' | 'annual' {
  if ([
    'VDEM',
    'WORLD_HAPPINESS',
    'WID',
    'EDELMAN',
    'CORNELL_ILR',
    'ELECTION_DATA',
    'HYPERSCALER_CAPEX',
    'IEA',
    'TSMC_STRUCTURAL',
    'STRATEGIC_VALUE',
    'FED_SPEECH',
    'FED_MANUAL',
    'ETF_MANUAL',
  ].includes(source)) {
    return 'annual';
  }

  return 'daily';
}

function buildGenericPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" adında profesyonel bir makroekonomik ve yapısal risk analiz motorusun.
Aşağıdaki kategori ve metrik verilerini kullanarak kısa ama yoğun bir "Durum Özeti" yaz.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = Kriz/Stres, 100 = İdeal/Sağlıklı)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. simple_summary teknik jargondan kacinan, daha gundelik ama hala ciddi bir dille yazilsin.
4. Her metriğin değeri ile skorunu karıştırma.
5. Düşük skorlu metrikleri stres artırıcı, yüksek skorlu metrikleri dengeleyici olarak doğru eşleştir.
6. Kısa tarihsel bağlam ver ama kesin olmayan iddiaları kesinmiş gibi yazma.
7. Kullanıcıya ne yapması gerektiğini söyleme.
8. Sadece gecerli JSON don. Markdown, aciklama, kod blogu, baslik, ek metin donme.
9. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
10. confidence 1 ile 5 arasinda tam sayi olsun.
`;
}

function buildSocialStabilityPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" içinde sosyal ve siyasi rejim analizi yapan bir yorum katmanısın.
Bu kategori finansal piyasa zamanlaması için değil, toplumun kurumsal kalite, memnuniyet, eşitsizlik ve sosyal gerilim ekseninde hangi rejime kaydığını anlamak için yorumlanıyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = ciddi sosyal/siyasi stres, 100 = yüksek istikrar)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 5-6 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. simple_summary teknik jargondan kacinan, daha gundelik ama hala ciddi bir dille yazilsin.
4. Bu metriklerin cogunun yillik ve yapisal oldugunu dikkate al; kisa vadeli piyasa dili kullanma.
5. Degerlendirmeyi su eksenlerde kur: kurumsal kalite, toplumsal memnuniyet, servet/esitsizlik yogunlasmasi, emek gerilimi.
6. WID verilerinde Top 10% share yuksekse bu guc/esitsizlik yogunlasmasi olarak, Bottom 50% share yuksekse tabana yayilan denge olarak yorumlanmali.
7. Cornell grev verisini toplumsal gerilim ve pazarlik sertligi baglaminda oku; tek basina kriz kaniti gibi yazma.
8. V-Dem ve mutluluk skorunu dogrudan ayni sey gibi ele alma; biri kurumsal kaliteyi, digeri toplumsal deneyimi temsil eder.
9. Gerekirse bunun daha cok "yavas bozulma / yavas toparlanma" rejimi mi oldugunu belirt.
10. Kullaniciya ne yapmasi gerektigini soyleme, siyasi normatif tavsiye verme.
11. Sadece gecerli JSON don. Markdown, aciklama, kod blogu, baslik, ek metin donme.
12. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
13. confidence 1 ile 5 arasinda tam sayi olsun.
`;
}

function buildTechnologyTransformationPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde teknoloji ve yapisal donusum rejimini yorumlayan bir analiz katmanisin.
Bu kategori sadece teknoloji hisselerinin yukselip dusmesini degil; AI sermaye dongusu, yazilim genisligi, chip omurgasi, fiziksel altyapi baskisi ve stratejik teknolojik yogunlasmayi birlikte okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = kirilgan ve baskili, 100 = saglikli ve genis tabanli donusum)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 5-6 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. simple_summary teknik jargondan kacinan, daha gundelik ama hala ciddi bir dille yazilsin.
4. Degerlendirmeyi su eksenlerde kur: mega-cap liderlik, yazilim genisligi, yari iletken omurgasi, fiziksel altyapi/metaller, dijital varlik anlatisi, stratejik yogunlasma.
5. MAGS ve QQQ gibi gostergeleri ayni sey gibi yazma; biri liderlik yogunlasmasi, digeri daha genis buyume risk istahidir.
6. IGV ve CLOU tarafini yazilim genisligi ve cloud uygulama katmani olarak oku.
7. CIBR ve PLTR tarafini siber guvenlik, savunma teknolojisi ve devlet/kurumsal stratejik yazilim baglaminda yorumla.
8. ARKK ve BTC tarafini daha yuksek beta ve spekulatif/gelecek temali sermaye istahi baglaminda oku; bunlari chip veya altyapi metrikleriyle ayni sey gibi yazma.
9. SMH, NVDA ve TSM tarafini chip tedarik zinciri, hesaplama omurgasi ve uretim konsantrasyonu baglaminda birlikte degerlendir.
10. HG=F, LIT, URA ve EQIX tarafini fiziksel altyapi, enerji, veri merkezi omurgasi ve elektrifikasyon darboğazi olarak yorumla.
11. AI capex, veri merkezi elektrik talebi ve stratejik deger metrikleri varsa bunlari piyasa anlatisindan ayri, daha yapisal sinyal olarak yorumla.
12. Eger piyasa metrikleri guclu ama fiziksel/yapisal metrikler zayifsa bunu "anlati onde, altyapi geriden geliyor" gibi bir rejim farki olarak ifade edebilirsin.
13. Eger fiziksel ve yapisal metrikler guclu ama spekulatif metrikler zayifsa bunu "altyapi kuruluyor ama risk istahi secici" gibi yorumlayabilirsin.
14. Kullaniciya ne yapmasi gerektigini soyleme.
15. Sadece gecerli JSON don. Markdown, aciklama, kod blogu, baslik, ek metin donme.
16. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
17. confidence 1 ile 5 arasinda tam sayi olsun.
`;
}

function buildEtfCapitalFlowsPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde ETF ve sermaye akislarini yorumlayan bir analiz katmanisin.
Bu kategori fiyat hareketinin otesinde, sermayenin hangi tema ve sektorlere aktigini, pasif akimlarla spekulatif konumlanma arasindaki farki ve buyuk para davranisini okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = kirilgan ve daginik akislar, 100 = saglikli ve genis tabanli sermaye akisi)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 5-6 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. simple_summary teknik jargondan kacinan, daha gundelik ama hala ciddi bir dille yazilsin.
4. Degerlendirmeyi su eksenlerde kur: genis piyasa akimi, buyume/teknoloji akimi, sektor rotasyonu, spekulatif akis, opsiyon konumlanmasi, buyuk fon yogunlasmasi.
5. SPY ve QQQ gibi gostergeleri ayni sey gibi yazma; biri daha genis piyasa, digeri buyume/teknoloji akisidir.
6. XLF ve XLE gibi gostergeleri sektor rotasyonu ve risk tercihinin yonu olarak yorumla.
7. ARKK ve IBIT tarafini daha yuksek beta / tema odakli sermaye akisi olarak degerlendir.
8. ETF_FLOW_PRESSURE, OPTIONS_POSITIONING ve WHALE_13F_CONCENTRATION varsa bunlari fiyatlardan ayri, daha dogrudan konumlanma sinyali olarak kullan.
9. Eger fiyat metrikleri guclu ama manuel akis metrikleri zayifsa bunu "fiyat guclu ama sermaye tabani dar" gibi yorumlayabilirsin.
10. Eger sektor rotasyonu darsa bunu "para belirli alanlarda sikisiyor" gibi aciklayabilirsin.
11. Eger buyuk fon yogunlasmasi yuksekse bunun kirilganlik yaratabilecegini ama her zaman negatif olmadigini dengeli yaz.
12. Kullaniciya ne yapmasi gerektigini soyleme.
13. Sadece gecerli JSON don. Markdown, aciklama, kod blogu, baslik, ek metin donme.
14. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
15. confidence 1 ile 5 arasinda tam sayi olsun.
`;
}

function buildPreciousMetalsPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde degerli metaller rejimini yorumlayan bir analiz katmanisin.
Bu kategori sadece altin fiyatinin gidisini degil; parasal guven, savunma talebi, sanayi hassasiyeti ve madenci hisseleri arasindaki iliskiyi birlikte okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = zayif ve kirilgan, 100 = guclu ve genis tabanli metal rejimi)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 5-6 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. simple_summary teknik jargondan kacinan, daha gundelik ama hala ciddi bir dille yazilsin.
4. Degerlendirmeyi su eksenlerde kur: parasal guvenli liman talebi, sanayi duyarliligi, madenci hisseleri kaldiraci, metal icindeki ayrisma.
5. GLD ve SLV'yi ayni sey gibi yazma; altin daha cok parasal guven, gumus ise hem parasal hem sanayi hassasiyeti tasir.
6. PPLT ve PALL tarafini sanayi dongusune daha hassas alt metal grubu olarak yorumla.
7. GDX ve SIL tarafini metalin kendisinden ayri, kaldiracli ve operasyonel risk tasiyan madenci hisseleri olarak ele al.
8. Eger metal fiyatlari guclu ama madenciler zayifsa bunu "savunma talebi var ama riskli tasiyicilar ayni gucu teyit etmiyor" gibi yorumlayabilirsin.
9. Eger altin guclu ama platin/paladyum zayifsa bunu daha savunmaci ve buyume hassasiyeti dusuk bir rejim olarak okuyabilirsin.
10. Kullaniciya ne yapmasi gerektigini soyleme.
11. Sadece gecerli JSON don. Markdown, aciklama, kod blogu, baslik, ek metin donme.
12. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
13. confidence 1 ile 5 arasinda tam sayi olsun.
`;
}

function buildAgriFoodPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde tarimsal emtia ve gida guvenligi rejimini yorumlayan bir analiz katmanisin.
Bu kategori gida fiyat baskisini, tarimsal arz kirilganligini, iklim hassasiyetini ve temel emtia sepetindeki genis yayilimli stresi okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = yuksek gida/tarim stresi, 100 = daha dengeli ve saglikli rejim)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 5-6 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. simple_summary teknik jargondan kacinan, daha gundelik ama hala ciddi bir dille yazilsin.
4. Degerlendirmeyi su eksenlerde kur: temel tahil baskisi, genis tarim sepeti, tropikal urun hassasiyeti, gida enflasyonu riski.
5. WEAT, CORN ve SOYB tarafini ayni sey gibi yazma; bugday, misir ve soya farkli arz/tuketim zincirlerini temsil eder.
6. DBA'yi genel tarimsal baski ve yayginlik gostergesi olarak kullan.
7. JO ve CANE tarafini iklim hassasiyeti yuksek, daha oynak ve bolgesel kirilganligi yansitan urunler olarak yorumla.
8. Yuksek fiyatlar bu kategoride genel olarak stres artisi ve gida guvenligi baskisi olarak okunmali.
9. Eger tekil urunler guclu ama genis sepet daha sakinse bunu lokal/urune ozel baski gibi ifade edebilirsin.
10. Kullaniciya ne yapmasi gerektigini soyleme.
11. Sadece gecerli JSON don. Markdown, aciklama, kod blogu, baslik, ek metin donme.
12. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
13. confidence 1 ile 5 arasinda tam sayi olsun.
`;
}

function buildMarketOverviewPrompt(input: {
  totalScore: number | string;
  totalTrend: string;
  alertBlock: string;
  categoryBlock: string;
}) {
  return `
Sen "Mergen Intelligence" ana sayfasindaki genel piyasa yorum katmanisin.
Amacin kullaniciya alim-satim tavsiyesi vermek degil; mevcut veri setinin genel rejimini sade ama profesyonel sekilde anlatmak.

Toplam Skor: ${input.totalScore} / 100
7 Gunluk Trend: ${input.totalTrend}

Kategori Gorunumu:
${input.categoryBlock}

Aktif Uyarilar:
${input.alertBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik genel piyasa yorumu ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. simple_summary teknik jargondan kacinan, daha gundelik ama hala ciddi bir dille yazilsin.
4. Kredi stresi, likidite, buyume, enflasyon, sosyal istikrar gibi elde bulunan kategoriler arasindaki dengeyi anlat.
5. Veri eksik olan alanlari tamammis gibi yazma.
6. Uyarilar varsa genel rejim okumaya dahil et, ama felaket dili kullanma.
7. Kullaniciya ne yapmasi gerektigini soyleme.
8. Sadece gecerli JSON don. Markdown, aciklama, kod blogu, baslik, ek metin donme.
9. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
10. confidence 1 ile 5 arasinda tam sayi olsun.
`;
}

function parseStructuredInsight(raw: string): {
  expertSummary: string;
  simpleSummary: string;
  confidence: number;
} | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : trimmed;

  try {
    const parsed = JSON.parse(candidate);
    const expertSummary = typeof parsed.expert_summary === 'string' ? parsed.expert_summary.trim() : '';
    const simpleSummary = typeof parsed.simple_summary === 'string' ? parsed.simple_summary.trim() : '';
    const confidenceValue = Number(parsed.confidence);
    const confidence = Number.isFinite(confidenceValue)
      ? Math.max(1, Math.min(5, Math.round(confidenceValue)))
      : 3;

    if (!expertSummary) {
      return null;
    }

    return {
      expertSummary,
      simpleSummary,
      confidence,
    };
  } catch {
    return null;
  }
}

function buildStoredSummary(input: {
  expertSummary: string;
  simpleSummary: string;
  confidence: number;
}) {
  const parts = [
    `UZMAN YORUM:\n${input.expertSummary.trim()}`,
  ];

  if (input.simpleSummary.trim()) {
    parts.push(`SADE OZET:\n${input.simpleSummary.trim()}`);
  }

  parts.push(`[CONFIDENCE:${input.confidence}]`);
  return parts.join('\n\n');
}

function buildCryptoMarketsPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde kripto para piyasalarini yorumlayan bir analiz katmanisin.
Bu kategori Bitcoin, Ethereum ve ana kripto varliklarin fiyat rejimini; kurumsal adaptasyon barometrelerini ve makro korelasyonlar cercevesinde dijital varliklarin hangi modda oldugunu anlamak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = sert dusus / risk-off, 100 = saglikli yukselis / risk-on)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. BTC ve ETH fiyatlarini karsilastirmali yorumla. BTC dominansi gucleniyorsa "buyuk para BTC'de, altcoin rotasyonu henuz baslamadi" gibi rejim yorumu yap.
4. COIN ve MSTR hisselerini dogrudan kripto fiyatlarindan ayri degerlendir; bunlar kurumsal yapilanma ve kaldiraci temsil eder.
5. Fiyat ile skor uyusmuyorsa bunu "tarihi zirvede ama baglamsal kirilganlik" gibi bir rejim farki olarak ifade edebilirsin.
6. Makro baglamda DXY, Fed faiz politikasi ve kuresel likidite ile kripto arasindaki korelasyona kisa bir paragraf ayir.
7. Yatirim tavsiyesi verme, kullaniciya ne yapmasi gerektigini soyleme.
8. Sadece gecerli JSON don. Markdown, aciklama, kod blogu, baslik, ek metin donme.
9. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
10. confidence 1 ile 5 arasinda tam sayi olsun.
`;
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractTagValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : null;
}

function parseRssItems(xml: string): NewsItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return items.map((item, index) => ({
    id: `news-${index}-${extractTagValue(item, 'title') || 'item'}`,
    title: extractTagValue(item, 'title') || 'Baslik yok',
    link: extractTagValue(item, 'link') || '#',
    publishedAt: extractTagValue(item, 'pubDate'),
  }));
}

function isCriticalHeadline(title: string) {
  const lower = title.toLowerCase();
  return [
    'fed',
    'powell',
    'rate',
    'inflation',
    'tariff',
    'recession',
    'war',
    'oil',
    'treasury',
    'china',
    'trump',
    'bank',
    'credit',
    'jobs',
    'cpi',
    'pce',
  ].some((keyword) => lower.includes(keyword));
}

async function fetchNewsFeed(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mergen-Intelligence/1.0',
      'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status}`);
  }

  return parseRssItems(await response.text());
}

async function buildNewsPayload() {
  const settled = await Promise.allSettled(NEWS_FEEDS.map((url) => fetchNewsFeed(url)));
  const allItems = settled
    .filter((result): result is PromiseFulfilledResult<NewsItem[]> => result.status === 'fulfilled')
    .flatMap((result) => result.value);

  const deduped = Array.from(
    new Map(allItems.map((item) => [`${item.link}-${item.title}`, item])).values(),
  ).sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  const critical = deduped.filter((item) => isCriticalHeadline(item.title)).slice(0, 10);
  const criticalLinks = new Set(critical.map((item) => item.link));
  const remaining = deduped.filter((item) => !criticalLinks.has(item.link));
  const daily = remaining.slice(0, 10);
  const dailyLinks = new Set(daily.map((item) => item.link));
  const other = remaining.filter((item) => !dailyLinks.has(item.link)).slice(0, 12);

  return { critical, daily, other };
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get('/api/news', async (_req, res) => {
    try {
      const payload = await buildNewsPayload();
      res.json(payload);
    } catch (error: any) {
      console.error('News feed error:', error);
      res.status(500).json({ error: error?.message || 'Failed to fetch news feeds' });
    }
  });

  app.get('/api/crypto/fear-greed', async (_req, res) => {
    try {
      const response = await fetch('https://api.alternative.me/fng/?limit=7');
      if (!response.ok) throw new Error(`Fear & Greed API error: ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Fear & Greed fetch error:', error);
      res.status(500).json({ error: error?.message || 'Failed to fetch Fear & Greed index' });
    }
  });

  // Proxy route for FRED API to bypass CORS
  app.get("/api/fred/series", async (req, res) => {
    const { series_id, observation_start, limit } = req.query;
    
    // Check for API key in environment variables (both with and without VITE_ prefix for compatibility)
    const apiKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "FRED_API_KEY is missing in environment variables" });
    }

    try {
      let url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series_id}&api_key=${apiKey}&file_type=json&sort_order=desc`;
      
      if (observation_start) {
        url += `&observation_start=${observation_start}`;
      }
      if (limit) {
        url += `&limit=${limit}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching from FRED:", error);
      res.status(500).json({ error: "Failed to fetch from FRED API" });
    }
  });

  // Proxy route for Yahoo Finance to bypass CORS
  app.get("/api/yahoo/historical", async (req, res) => {
    try {
      const { symbol, period1 } = req.query;
      
      if (!symbol || !period1) {
        return res.status(400).json({ error: "symbol and period1 are required" });
      }

      const queryOptions = { period1: String(period1) };
      const result = await yahooFinance.chart(String(symbol), queryOptions);
      
      res.json({ observations: result.quotes });
    } catch (error: any) {
      console.error("Yahoo Finance Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/category-insight", async (req, res) => {
    const { categoryId } = req.body ?? {};

    if (!categoryId) {
      return res.status(400).json({ error: "categoryId is required" });
    }

    if (!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
    }

    try {
      const { data: category } = await supabaseNode
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const { data: categoryScore } = await supabaseNode
        .from('scores')
        .select('score')
        .eq('entity_type', 'category')
        .eq('entity_id', categoryId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      const { data: metrics } = await supabaseNode
        .from('metrics')
        .select('*')
        .eq('category_id', categoryId);

      if (!metrics || metrics.length === 0) {
        return res.status(200).json({ skipped: true, reason: "no_metrics" });
      }

      const metricDetails = [];
      for (const metric of metrics) {
        const { data: latestValue } = await supabaseNode
          .from('metric_values')
          .select('value, date')
          .eq('metric_id', metric.id)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        const { data: latestScore } = await supabaseNode
          .from('scores')
          .select('score')
          .eq('entity_type', 'metric')
          .eq('entity_id', metric.id)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        if (latestValue && latestScore) {
          metricDetails.push({
            name: metric.name,
            symbol: metric.symbol,
            value: latestValue.value,
            date: latestValue.date,
            score: latestScore.score,
            source: metric.source,
            cadence: getMetricCadence(metric.source),
            isInverse: metric.is_inverse,
          });
        }
      }

      if (metricDetails.length === 0) {
        return res.status(200).json({ skipped: true, reason: "no_metric_data" });
      }

      const metricBlock = metricDetails.map((m) => `
- Metrik: ${m.name} (${m.symbol})
  Kaynak: ${m.source}
  Frekans: ${m.cadence === 'annual' ? 'yillik/yapisal' : 'daha sik'}
  Son Veri Tarihi: ${m.date}
  Guncel Deger: ${m.value}
  Metrik Skoru: ${m.score} / 100
  Yon: ${m.isInverse ? 'Yuksek deger daha kotu' : 'Yuksek deger daha iyi'}
`).join('\n');

      const prompt = categoryId === SOCIAL_STABILITY_CATEGORY_ID
        ? buildSocialStabilityPrompt({
            categoryName: category.name,
            categoryDescription: category.description,
            categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
            metricBlock,
          })
        : categoryId === TECHNOLOGY_CATEGORY_ID
          ? buildTechnologyTransformationPrompt({
              categoryName: category.name,
              categoryDescription: category.description,
              categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
              metricBlock,
            })
          : categoryId === ETF_FLOWS_CATEGORY_ID
            ? buildEtfCapitalFlowsPrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : categoryId === PRECIOUS_METALS_CATEGORY_ID
            ? buildPreciousMetalsPrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : categoryId === AGRI_FOOD_CATEGORY_ID
            ? buildAgriFoodPrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : categoryId === CRYPTO_CATEGORY_ID
            ? buildCryptoMarketsPrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : buildGenericPrompt({
              categoryName: category.name,
              categoryDescription: category.description,
              categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
              metricBlock,
            });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawSummary = response.text;
      if (!rawSummary) {
        return res.status(500).json({ error: "Gemini returned empty response" });
      }

      const structuredInsight = parseStructuredInsight(rawSummary);
      const summary = structuredInsight
        ? buildStoredSummary(structuredInsight)
        : rawSummary;

      const today = new Date().toISOString().split('T')[0];
      const { error: upsertError } = await supabaseNode
        .from('ai_insights')
        .upsert({
          category_id: categoryId,
          summary,
          date: today,
        }, { onConflict: 'category_id, date' });

      if (upsertError) {
        console.error("AI insight save error:", upsertError);
        return res.status(500).json({ error: upsertError.message });
      }

      res.json({ ok: true, summary });
    } catch (error: any) {
      console.error("AI category insight error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate AI insight" });
    }
  });

  app.post("/api/ai/market-overview", async (req, res) => {
    if (!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
    }

    try {
      const { data: totalScore } = await supabaseNode
        .from('scores')
        .select('score, date')
        .eq('entity_type', 'total')
        .order('date', { ascending: false })
        .limit(2);

      const { data: categories } = await supabaseNode
        .from('categories')
        .select('id, name');

      const { data: categoryScores } = await supabaseNode
        .from('scores')
        .select('entity_id, score, date')
        .eq('entity_type', 'category')
        .order('date', { ascending: false });

      const { data: alerts } = await supabaseNode
        .from('alerts')
        .select('type, message')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      const latestTotalScore = totalScore?.[0] ? Number(totalScore[0].score) : 'Bilinmiyor';
      const totalTrend = totalScore && totalScore.length > 1
        ? Number(totalScore[0].score) > Number(totalScore[1].score)
          ? 'Yukari'
          : Number(totalScore[0].score) < Number(totalScore[1].score)
            ? 'Asagi'
            : 'Yatay'
        : 'Bilinmiyor';

      const categoryBlock = (categories || []).map((category) => {
        const scoreRow = categoryScores?.find((entry) => entry.entity_id === category.id);
        return `- ${category.name}: ${scoreRow ? `${Number(scoreRow.score)} / 100` : 'Veri yok'}`;
      }).join('\n');

      const alertBlock = alerts && alerts.length > 0
        ? alerts.map((alert) => `- [${alert.type}] ${alert.message}`).join('\n')
        : '- Aktif uyari yok';

      const prompt = buildMarketOverviewPrompt({
        totalScore: latestTotalScore,
        totalTrend,
        categoryBlock,
        alertBlock,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawSummary = response.text;
      if (!rawSummary) {
        return res.status(500).json({ error: "Gemini returned empty response" });
      }

      const structuredInsight = parseStructuredInsight(rawSummary);
      const summary = structuredInsight
        ? buildStoredSummary(structuredInsight)
        : rawSummary;

      const today = new Date().toISOString().split('T')[0];
      const { error: insertError } = await supabaseNode
        .from('ai_insights')
        .insert({
          category_id: null,
          summary,
          date: today,
        });

      if (insertError) {
        console.error("Market overview save error:", insertError);
        return res.status(500).json({ error: insertError.message });
      }

      res.json({ ok: true, summary });
    } catch (error: any) {
      console.error("AI market overview error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate market overview" });
    }
  });

  app.get("/api/ai/market-overview/latest", async (_req, res) => {
    try {
      const { data, error } = await supabaseNode
        .from('ai_insights')
        .select('summary, date, created_at')
        .is('category_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ data });
    } catch (error: any) {
      console.error("Latest market overview fetch error:", error);
      res.status(500).json({ error: error?.message || "Failed to fetch latest market overview" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
