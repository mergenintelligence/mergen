import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { DashboardData } from '../hooks/useDashboardData';

const COIN_META: Record<string, { label: string; color: string; symbol: string }> = {
  BTCUSD: { label: 'Bitcoin', color: '#F7931A', symbol: 'BTC' },
  ETH:    { label: 'Ethereum', color: '#627EEA', symbol: 'ETH' },
  BNB:    { label: 'BNB', color: '#F3BA2F', symbol: 'BNB' },
  XRP:    { label: 'XRP', color: '#00AAE4', symbol: 'XRP' },
};

const MARKET_META: Record<string, { label: string; description: string }> = {
  COIN: { label: 'Coinbase (COIN)', description: 'Kurumsal kripto adaptasyonu barometresi' },
  MSTR: { label: 'MicroStrategy (MSTR)', description: 'Kaldıraçlı BTC exposure amplifikatörü' },
};

const MACRO_CORRELATIONS = [
  {
    title: 'BTC ↔ DXY',
    signal: 'Ters Korelasyon',
    color: '#F87171',
    description:
      'Dolar Endeksi (DXY) güçlenirken Bitcoin genellikle baskı altına girer. Güçlü dolar küresel risk iştahını kısar.',
  },
  {
    title: 'BTC ↔ NASDAQ',
    signal: 'Pozitif Korelasyon',
    color: '#4ADE80',
    description:
      'Bitcoin ile teknoloji hisseleri (QQQ) yüksek korelasyon gösterir. Risk iştahı açıldığında her ikisi de yükselir.',
  },
  {
    title: 'BTC ↔ Küresel M2',
    signal: 'Gecikmeli Pozitif',
    color: '#FBBF24',
    description:
      'Küresel para arzı genişlediğinde Bitcoin gecikmeli olarak tepki verir. M2 artışı → kripto likidite artışı.',
  },
];

interface FearGreedEntry {
  value: string | number;
  value_classification: string;
  timestamp: string;
}

interface CryptoPageProps {
  pilotMetrics: DashboardData['pilotMetrics'];
  aiInsight: string | null;
  aiSimpleSummary: string | null;
  aiConfidence: number | null;
}

function formatCryptoPrice(value: number | null, symbol: string): string {
  if (value === null) return '--';
  if (symbol === 'XRP' || symbol === 'BNB') {
    return `$${value.toFixed(symbol === 'XRP' ? 4 : 2)}`;
  }
  if (value >= 1000) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${value.toFixed(2)}`;
}

function trendColor(trend: string) {
  if (trend === 'up') return '#4ADE80';
  if (trend === 'down') return '#F87171';
  return '#666666';
}

// ─── Fear & Greed gauge ────────────────────────────────────────────────────────

function fgColor(v: number) {
  if (v <= 25) return '#F87171';
  if (v <= 45) return '#FB923C';
  if (v <= 55) return '#FBBF24';
  if (v <= 75) return '#A3E635';
  return '#4ADE80';
}

function FearGreedGauge({
  value,
  classification,
  history,
}: {
  value: number;
  classification: string;
  history: FearGreedEntry[];
}) {
  const color = fgColor(value);

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-mono tabular-nums font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-sm text-[#666666]">/ 100</span>
      </div>
      <div className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color }}>
        {classification}
      </div>

      {/* Gradient progress bar */}
      <div
        className="relative h-3 rounded-full overflow-hidden mb-1"
        style={{ background: 'linear-gradient(to right, #F87171, #FB923C, #FBBF24, #A3E635, #4ADE80)' }}
      >
        <div
          className="absolute top-0 w-3 h-3 rounded-full bg-white border-2 border-[#0A0A0A]"
          style={{ left: `calc(${value}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-[#666666] uppercase tracking-wider mb-5">
        <span>Aşırı Korku</span>
        <span>Nötr</span>
        <span>Açgözlülük</span>
      </div>

      {/* 7-day bar history */}
      {history.length > 0 && (
        <div>
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-2">7 Günlük Seyir</div>
          <div className="flex items-end gap-1.5">
            {[...history].slice(0, 7).reverse().map((h, i) => {
              const v = Number(h.value);
              const c = fgColor(v);
              const barH = Math.max(10, (v / 100) * 44);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-[2px]"
                    style={{ height: `${barH}px`, backgroundColor: c, opacity: 0.75 }}
                  />
                  <div className="text-[9px] font-mono text-[#666666]">{v}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Price card ───────────────────────────────────────────────────────────────

function PriceCard({ metric }: { metric: DashboardData['pilotMetrics'][0] }) {
  const meta = COIN_META[metric.symbol];
  if (!meta) return null;
  const tc = trendColor(metric.trend);

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-sm flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
          >
            {meta.symbol[0]}
          </div>
          <div>
            <div className="text-xs font-semibold text-[#E5E5E5] uppercase tracking-wider leading-none">
              {meta.symbol}
            </div>
            <div className="text-[10px] text-[#666666] mt-0.5">{meta.label}</div>
          </div>
        </div>
        {metric.changePct !== null && (
          <div
            className="flex items-center gap-0.5 text-xs font-mono px-1.5 py-0.5 rounded-sm"
            style={{ color: tc, backgroundColor: `${tc}18` }}
          >
            {metric.trend === 'up' && <ArrowUp className="w-3 h-3" />}
            {metric.trend === 'down' && <ArrowDown className="w-3 h-3" />}
            {metric.trend === 'flat' && <Minus className="w-3 h-3" />}
            {Math.abs(metric.changePct).toFixed(2)}%
          </div>
        )}
      </div>

      {/* Price */}
      <div className="text-2xl font-mono tabular-nums font-bold text-[#E5E5E5]">
        {formatCryptoPrice(metric.value, metric.symbol)}
      </div>

      {/* Sparkline */}
      {metric.history.length > 1 && (
        <div className="h-14 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metric.history}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line type="monotone" dataKey="value" stroke={tc} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Date */}
      <div className="text-[10px] text-[#666666] font-mono">
        {metric.latestDate
          ? new Date(metric.latestDate).toLocaleDateString('tr-TR')
          : 'Veri yok'}
      </div>
    </div>
  );
}

// ─── Market barometer card ────────────────────────────────────────────────────

function BarometerCard({ metric }: { metric: DashboardData['pilotMetrics'][0] }) {
  const meta = MARKET_META[metric.symbol];
  if (!meta) return null;
  const tc = trendColor(metric.trend);

  return (
    <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-sm p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <div className="text-xs font-semibold text-[#E5E5E5] uppercase tracking-wider">
            {metric.symbol}
          </div>
          <div className="text-[10px] text-[#666666]">{meta.label}</div>
        </div>
        {metric.changePct !== null && (
          <span className="text-xs font-mono" style={{ color: tc }}>
            {metric.trend === 'up' ? '+' : ''}{metric.changePct.toFixed(2)}%
          </span>
        )}
      </div>
      <div className="text-xl font-mono tabular-nums text-[#E5E5E5] mb-1">
        {metric.value !== null ? `$${metric.value.toFixed(2)}` : '--'}
      </div>
      <div className="text-[10px] text-[#666666]">{meta.description}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CryptoPage({ pilotMetrics, aiInsight, aiSimpleSummary, aiConfidence }: CryptoPageProps) {
  const [fearGreedData, setFearGreedData] = useState<{
    value: number;
    classification: string;
    history: FearGreedEntry[];
  } | null>(null);
  const [fgLoading, setFgLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/crypto/fear-greed');
        const json = await res.json();
        if (json?.data?.length > 0) {
          setFearGreedData({
            value: Number(json.data[0].value),
            classification: json.data[0].value_classification,
            history: json.data,
          });
        }
      } catch {
        // silent — Fear & Greed is supplementary
      } finally {
        setFgLoading(false);
      }
    })();
  }, []);

  const priceMetrics   = pilotMetrics.filter((m) => COIN_META[m.symbol]);
  const marketMetrics  = pilotMetrics.filter((m) => MARKET_META[m.symbol]);
  const confidenceClamp = aiConfidence !== null ? Math.max(0, Math.min(5, aiConfidence)) : null;

  return (
    <div className="space-y-6">

      {/* ── Section 1: AI Yorum ── */}
      <div className="bg-[#111111] border border-[#1F1F1F] p-4 rounded-sm">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
              aiInsight ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#666666]'
            }`}
          />
          <div className="text-sm font-semibold text-[#E5E5E5] tracking-wide">
            MERGEN AI — Kripto Para Piyasaları Analizi
          </div>
          {confidenceClamp !== null && (
            <div className="ml-auto flex items-center gap-3 border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2 rounded-sm">
              <div className="text-sm font-semibold text-[#E5E5E5] whitespace-nowrap">
                Güven {confidenceClamp}/5
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 w-5 rounded-[2px] border ${
                      i < confidenceClamp
                        ? 'border-[#4ADE80] bg-[#4ADE80]'
                        : 'border-[#2A2A2A] bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        {aiInsight ? (
          <>
            <div className="text-sm text-[#E5E5E5] leading-relaxed">{aiInsight}</div>
            {aiSimpleSummary && (
              <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
                <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-2">
                  Sade Özet
                </div>
                <div className="text-sm text-[#D4D4D4] leading-relaxed">{aiSimpleSummary}</div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-[#666666] leading-relaxed">
            Bu kategori için henüz AI yorumu oluşmadı. Sağ üstteki{' '}
            <span className="text-[#A3A3A3]">AI Prompt</span> butonuyla üretilebilir.
          </div>
        )}
      </div>

      {/* ── Section 2: Ana Kripto Fiyatları ── */}
      <div>
        <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-3">
          Ana Kripto Fiyatları
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {priceMetrics.map((m) => (
            <PriceCard key={m.id} metric={m} />
          ))}
          {priceMetrics.length === 0 && (
            <div className="col-span-full text-sm text-[#666666] font-mono py-8 text-center border border-dashed border-[#1F1F1F]">
              Kripto fiyat verisi henüz çekilmedi. Kategoriyi Çalıştır butonunu kullanın.
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Fear & Greed + Kurumsal Barometreler ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Fear & Greed */}
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
          <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-4">
            Korku &amp; Açgözlülük Endeksi
          </div>
          {fgLoading ? (
            <div className="text-sm text-[#666666] font-mono">Yükleniyor…</div>
          ) : fearGreedData ? (
            <FearGreedGauge
              value={fearGreedData.value}
              classification={fearGreedData.classification}
              history={fearGreedData.history}
            />
          ) : (
            <div className="text-sm text-[#666666] font-mono">
              Fear &amp; Greed verisi alınamadı.
            </div>
          )}
        </div>

        {/* Market barometers */}
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
          <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-4">
            Kurumsal Piyasa Barometreleri
          </div>
          <div className="space-y-3">
            {marketMetrics.map((m) => (
              <BarometerCard key={m.id} metric={m} />
            ))}
            {marketMetrics.length === 0 && (
              <div className="text-sm text-[#666666] font-mono">Veri yok.</div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-[#1F1F1F]">
            <div className="text-[10px] text-[#666666] leading-relaxed">
              <span className="text-[#A3A3A3] font-medium">COIN</span> kurumsal kripto
              adaptasyonunun en likit borsası barometresidir.{' '}
              <span className="text-[#A3A3A3] font-medium">MSTR</span> kaldıraçlı BTC
              pozisyonu nedeniyle volatilite amplifikatörü gibi davranır.
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Makro Korelasyon Çerçevesi ── */}
      <div>
        <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-3">
          Makro Korelasyon Çerçevesi
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MACRO_CORRELATIONS.map((corr) => (
            <div key={corr.title} className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-mono font-semibold text-[#E5E5E5]">
                  {corr.title}
                </div>
                <div
                  className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                  style={{ color: corr.color, backgroundColor: `${corr.color}18` }}
                >
                  {corr.signal}
                </div>
              </div>
              <div className="text-xs text-[#A3A3A3] leading-relaxed">{corr.description}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
