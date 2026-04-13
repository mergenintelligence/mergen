/**
 * Bir veri setindeki değerin persentilini (yüzdelik dilimini) hesaplar.
 * 0 ile 100 arasında bir değer döner.
 */
export function calculatePercentile(value: number, historicalValues: number[]): number {
  if (historicalValues.length === 0) return 50; // Geçmiş veri yoksa nötr kabul et

  // Mevcut değerden kesinlikle küçük olanların sayısı
  const lessThan = historicalValues.filter(v => v < value).length;
  // Mevcut değere eşit olanların sayısı
  const equalTo = historicalValues.filter(v => v === value).length;

  // Standart persentil formülü: (Küçük olanlar + (0.5 * Eşit olanlar)) / Toplam
  const percentile = ((lessThan + (0.5 * equalTo)) / historicalValues.length) * 100;

  return Math.max(0, Math.min(100, percentile));
}

/**
 * Bir metrik için normalize edilmiş skoru (0-100) hesaplar.
 * 0 = Kriz/En Kötü, 50 = Normal, 100 = İdeal/En İyi
 * 
 * @param currentValue Metriğin güncel değeri
 * @param historicalValues Metriğin tüm geçmiş değerleri
 * @param isInverse True ise yüksek değer kötüdür (örn: HY Spread). False ise yüksek değer iyidir (örn: Büyüme).
 */
export function calculateMetricScore(currentValue: number, historicalValues: number[], isInverse: boolean, symbol?: string): number {
  // 1. Özel Metrik Skorlamaları (Absolute Banding)
  
  if (symbol === 'VIXCLS') {
    if (currentValue < 10) return 85;
    if (currentValue >= 10 && currentValue < 15) return 85 - ((currentValue - 10) / 5) * 15; // 85 to 70
    if (currentValue >= 15 && currentValue < 20) return 70 - ((currentValue - 15) / 5) * 20; // 70 to 50
    if (currentValue >= 20 && currentValue < 30) return 50 - ((currentValue - 20) / 10) * 20; // 50 to 30
    if (currentValue >= 30 && currentValue < 40) return 30 - ((currentValue - 30) / 10) * 20; // 30 to 10
    if (currentValue >= 40) return Math.max(0, 10 - (currentValue - 40)); // 10 to 0
  }

  if (symbol === 'SOFR_IORB') {
    if (currentValue <= 0) return 90;
    if (currentValue > 0 && currentValue <= 0.1) return 90 - (currentValue / 0.1) * 30; // 90 to 60
    if (currentValue > 0.1 && currentValue <= 0.2) return 60 - ((currentValue - 0.1) / 0.1) * 30; // 60 to 30
    if (currentValue > 0.2) return Math.max(0, 30 - ((currentValue - 0.2) / 0.1) * 20); // 30 to 0
  }

  // 2. Standart Persentil Bazlı Skorlama (10 yıllık veri penceresi)
  const percentile = calculatePercentile(currentValue, historicalValues);

  // Eğer isInverse true ise (yüksek değer kötüyse):
  // Örn: HY Spread 90. persentildeyse (çok yüksek), skor düşük olmalı (100 - 90 = 10 -> Kriz)
  // Eğer isInverse false ise (yüksek değer iyiyse):
  // Örn: Reel Gelir 90. persentildeyse, skor yüksek olmalı (90 -> İdeal)
  const score = isInverse ? (100 - percentile) : percentile;

  return Math.round(score);
}

/**
 * Ağırlıklı metrik skorlarına göre kategori skorunu hesaplar.
 */
export function calculateCategoryScore(metrics: { score: number; weight: number }[]): number {
  if (metrics.length === 0) return 50;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const metric of metrics) {
    totalWeight += metric.weight;
    weightedSum += metric.score * metric.weight;
  }

  if (totalWeight === 0) return 50;
  return Math.round(weightedSum / totalWeight);
}

/**
 * Ağırlıklı kategori skorlarına göre genel Mergen Index skorunu hesaplar.
 */
export function calculateTotalScore(categories: { score: number; weight: number }[]): number {
  return calculateCategoryScore(categories); // Matematiksel mantık aynı
}
