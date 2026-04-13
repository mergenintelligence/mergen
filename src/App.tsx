/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { ArrowDown, ArrowUp, Minus, RefreshCw, Home, AlertTriangle, Activity } from 'lucide-react';
import { syncMetric } from './workers/syncMetric';
import { runScoringEngine } from './workers/scoringWorker';
import { runAlertEngine } from './workers/alertWorker';
import { generateCategoryInsight, generateMarketOverview } from './workers/aiWorker';
import { supabase } from './lib/supabase';
import { useDashboardData } from './hooks/useDashboardData';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { FED_POWER_CATEGORY_ID } from './data/fedProfiles';
import { CryptoPage } from './components/CryptoPage';

const CRYPTO_CATEGORY_ID = '30000000-0000-0000-0000-000000000011';

const PLACEHOLDERS: Record<string, string> = {
  '30000000-0000-0000-0000-000000000001': 'Siyasi ve Sosyal İstikrar',
  '30000000-0000-0000-0000-000000000002': 'Teknoloji ve Yapısal Dönüşüm',
  '30000000-0000-0000-0000-000000000003': 'Fed İçi Güç Dengesi',
  '30000000-0000-0000-0000-000000000004': 'ETF ve Sermaye Akışı',
  '30000000-0000-0000-0000-000000000005': 'Değerli Metaller',
  '30000000-0000-0000-0000-000000000006': 'Tarımsal Emtia ve Gıda Güvenliği',
  '30000000-0000-0000-0000-000000000007': 'Enerji ve Enerji Güvenliği',
  '30000000-0000-0000-0000-000000000008': 'Döviz ve Kur Dinamikleri',
  '30000000-0000-0000-0000-000000000009': 'Kamu Maliyesi ve Sovereign Borç',
  '30000000-0000-0000-0000-000000000010': 'Gelişmekte Olan Piyasalar',
  '30000000-0000-0000-0000-000000000011': 'Kripto Para Piyasaları',
};
const NEWS_SECTION_ID = 'news';

function formatNewsTimestamp(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function App() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('home');
  const { data, loading, refetch } = useDashboardData(selectedCategoryId);
  const visiblePlaceholders = Object.entries(PLACEHOLDERS).filter(
    ([id]) => !data?.categories.some((category) => category.id === id),
  );
  const selectedCategory = data?.categories.find((category) => category.id === selectedCategoryId) || null;
  const topPanelLabel = selectedCategoryId === 'home'
    ? 'Mergen Index'
    : selectedCategoryId === NEWS_SECTION_ID
      ? 'Haberler'
      : selectedCategory?.name || PLACEHOLDERS[selectedCategoryId] || 'Kategori Endeksi';
  const topPanelScore = selectedCategoryId === 'home'
    ? data?.totalScore ?? null
    : selectedCategoryId === NEWS_SECTION_ID
      ? null
      : selectedCategory?.score ?? null;
  const topPanelTrend = selectedCategoryId === 'home'
    ? data?.totalScoreTrend ?? 'flat'
    : selectedCategoryId === NEWS_SECTION_ID
      ? 'flat'
      : selectedCategory?.trend ?? 'flat';
  const topPanelChange7d = selectedCategoryId === 'home'
    ? data?.totalScoreChange7d ?? null
    : selectedCategoryId === NEWS_SECTION_ID
      ? null
      : selectedCategory?.change7d ?? null;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      if (selectedCategoryId === NEWS_SECTION_ID) {
        throw new Error('Haberler bolumu icin sistem calistirma gerekmez.');
      }

      const metricsQuery = supabase
        .from('metrics')
        .select('*');

      const { data: metrics, error } = selectedCategoryId === 'home'
        ? await metricsQuery
        : await metricsQuery.eq('category_id', selectedCategoryId);

      if (error || !metrics || metrics.length === 0) {
        throw new Error(
          selectedCategoryId === 'home'
            ? 'No metrics found in database. Please run schema.sql in Supabase.'
            : 'Bu kategori icin metric bulunamadi.',
        );
      }

      console.log(
        selectedCategoryId === 'home'
          ? `Found ${metrics.length} metrics to fetch.`
          : `Found ${metrics.length} metrics to fetch for category ${selectedCategoryId}.`,
      );

      for (const metric of metrics) {
        console.log(`Fetching ${metric.name} (${metric.symbol})...`);
        try {
          const result = await syncMetric(metric);
          console.log(result.message);
        } catch (e: any) {
          console.error(`Failed: ${metric.name} - ${e.message}`);
        }
      }

      console.log('Running Scoring Engine...');
      await runScoringEngine();

      console.log('Running Alert Engine...');
      await runAlertEngine();
      
      // Veriler güncellendikten sonra arayüzü yenile
      await refetch();

      alert(
        selectedCategoryId === 'home'
          ? 'Tum sistem icin senkronizasyon, skorlama ve alert hesaplamasi tamamlandi.'
          : 'Bu kategori icin senkronizasyon, skorlama ve alert hesaplamasi tamamlandi.',
      );
    } catch (e: any) {
      console.error(e);
      alert(`Bir hata oluştu: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      if (selectedCategoryId === NEWS_SECTION_ID) {
        throw new Error('Haberler bolumu icin AI prompt tanimli degil.');
      }

      if (selectedCategoryId === 'home') {
        await generateMarketOverview();
      } else {
        await generateCategoryInsight(selectedCategoryId);
      }

      await refetch();
      alert(
        selectedCategoryId === 'home'
          ? 'Genel piyasa AI yorumu guncellendi.'
          : 'Bu kategori icin AI yorumu guncellendi.',
      );
    } catch (e: any) {
      console.error(e);
      alert(`AI yorumu olusturulamadi: ${e.message}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (loading && !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full text-[#666666] font-mono text-sm">
          Sistem başlatılıyor...
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      lastUpdate={data?.lastUpdate}
      categories={data?.categories}
      alertCount={data?.alerts.length ?? 0}
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={setSelectedCategoryId}
    >
      <div className="space-y-6">
        {/* Top Row: General Score + Categories */}
        <div className="flex items-start gap-8">
          {selectedCategoryId !== NEWS_SECTION_ID && (
            <div className="shrink-0">
            <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider mb-1">{topPanelLabel}</div>
            <div className="flex items-baseline gap-2">
              <div className="text-5xl font-mono tabular-nums leading-none">
                {topPanelScore !== null ? topPanelScore : '--'}
              </div>
              <div className="text-sm text-[#666666] font-mono">/100</div>
            </div>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                <span className="text-[#666666]">7 gün</span>
                {topPanelChange7d !== null ? (
                  <span
                    className={`flex items-center ${
                      topPanelTrend === 'up'
                        ? 'text-[#4ADE80]'
                        : topPanelTrend === 'down'
                          ? 'text-[#F87171]'
                          : 'text-[#666666]'
                    }`}
                  >
                    {topPanelTrend === 'up' && <ArrowUp className="w-3 h-3 mr-1" />}
                    {topPanelTrend === 'down' && <ArrowDown className="w-3 h-3 mr-1" />}
                    {topPanelTrend === 'flat' && <Minus className="w-3 h-3 mr-1" />}
                    {Math.abs(topPanelChange7d).toFixed(1)}
                  </span>
                ) : (
                  <span className="text-[#666666] flex items-center">
                    <Minus className="w-3 h-3 mr-1" /> --
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex-1">
              <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-1 mb-2">
                <div className="text-[11px] text-[#A3A3A3] uppercase tracking-wider">
                  Uyarı ({data?.alerts.length ?? 0} Aktif)
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi || isSyncing}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#111111] transition-colors disabled:opacity-50"
                  >
                    <Activity className={`w-3 h-3 ${isGeneratingAi ? 'animate-pulse' : ''}`} />
                    {isGeneratingAi
                      ? 'AI...'
                      : selectedCategoryId === 'home'
                        ? 'Genel AI Prompt'
                        : selectedCategoryId === NEWS_SECTION_ID
                          ? 'AI Kapalı'
                          : 'AI Prompt'}
                  </button>
                  <button 
                    onClick={handleSync} 
                    disabled={isSyncing || isGeneratingAi}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-1 border border-[#1F1F1F] text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#111111] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing
                      ? 'İşleniyor...'
                      : selectedCategoryId === 'home'
                        ? 'Sistemi Çalıştır (Test)'
                        : selectedCategoryId === NEWS_SECTION_ID
                          ? 'Çalıştırma Yok'
                          : 'Kategoriyi Çalıştır'}
                  </button>
                </div>
            </div>
            <ul className="space-y-1 text-xs font-mono text-[#666666]">
              <li className="flex items-center gap-2">
                Sistem normal parametrelerde çalışıyor.
              </li>
            </ul>
          </div>
        </div>

        {selectedCategoryId === 'home' ? (
          <div className="space-y-8">
            {/* Alerts & Divergences Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data?.homeInsight && (
                <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4 lg:col-span-2">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-pulse mt-1.5 shrink-0"></div>
                    <div className="text-sm md:text-base font-semibold text-[#E5E5E5] tracking-wide leading-snug">
                      Piyasalar Genel Yorum
                    </div>
                    {data?.homeConfidence !== null && data?.homeConfidence !== undefined && (
                      <ConfidenceBadge confidence={data.homeConfidence} />
                    )}
                  </div>
                  <div className="text-sm text-[#E5E5E5] leading-relaxed">
                    {data.homeInsight}
                  </div>
                  {data.homeSimpleSummary && (
                    <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
                      <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-2">
                        Sade Özet
                      </div>
                      <div className="text-sm text-[#D4D4D4] leading-relaxed">
                        {data.homeSimpleSummary}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Alerts */}
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1F1F1F] pb-2">
                  <AlertTriangle className="w-4 h-4 text-[#FBBF24]" />
                  <span className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3]">Aktif Uyarılar</span>
                </div>
                {data?.alerts && data.alerts.length > 0 ? (
                  <ul className="space-y-3">
                    {data.alerts.map(alert => (
                      <li key={alert.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${alert.type === 'red' ? 'bg-[#F87171]' : 'bg-[#FBBF24]'}`}></div>
                        <span className="text-sm text-[#E5E5E5]">{alert.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[#666666] font-mono">Sistem normal parametrelerde çalışıyor. Aktif uyarı yok.</div>
                )}
              </div>

              {/* Divergences */}
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1F1F1F] pb-2">
                  <Activity className="w-4 h-4 text-[#A3A3A3]" />
                  <span className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3]">Son Sapmalar (Divergences)</span>
                </div>
                <div className="text-sm text-[#666666] font-mono">
                  Henüz tespit edilen bir sapma yok.
                </div>
              </div>
            </div>

            {/* Categories Grid */}
            <div>
              <div className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3] mb-4">Kategori Durumları</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data?.categories.map(cat => (
                  <ScoreCircle 
                    key={cat.id} 
                    name={cat.name} 
                    score={cat.score} 
                    trend={cat.trend} 
                    onClick={() => setSelectedCategoryId(cat.id)} 
                  />
                ))}
                {visiblePlaceholders.map(([id, name]) => (
                  <ScoreCircle 
                    key={id} 
                    name={name} 
                    score={null} 
                    trend="flat" 
                    onClick={() => setSelectedCategoryId(id)} 
                  />
                ))}
              </div>
            </div>

          </div>
        ) : selectedCategoryId === NEWS_SECTION_ID ? (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1F1F1F] pb-2">
                  <AlertTriangle className="w-4 h-4 text-[#F87171]" />
                  <span className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3]">Kritik Haberler</span>
                </div>
                {data?.news.critical && data.news.critical.length > 0 ? (
                  <ul className="space-y-3">
                    {data.news.critical.map((item) => (
                      <li key={item.id} className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="block hover:bg-[#101010] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-medium text-[#F5F5F5] leading-relaxed">
                              {item.title}
                            </div>
                            {formatNewsTimestamp(item.publishedAt) && (
                              <div className="shrink-0 text-[10px] font-mono text-[#666666] tabular-nums">
                                {formatNewsTimestamp(item.publishedAt)}
                              </div>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[#666666] font-mono">
                    Henüz kritik haber eklenmedi.
                  </div>
                )}
              </div>

              <div className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                <div className="flex items-center gap-2 mb-4 border-b border-[#1F1F1F] pb-2">
                  <Home className="w-4 h-4 text-[#A3A3A3]" />
                  <span className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3]">Günlük Güncel Haberler</span>
                </div>
                {data?.news.daily && data.news.daily.length > 0 ? (
                  <ul className="space-y-3">
                    {data.news.daily.map((item) => (
                      <li key={item.id} className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="block hover:bg-[#101010] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm text-[#E5E5E5] leading-relaxed">
                              {item.title}
                            </div>
                            {formatNewsTimestamp(item.publishedAt) && (
                              <div className="shrink-0 text-[10px] font-mono text-[#666666] tabular-nums">
                                {formatNewsTimestamp(item.publishedAt)}
                              </div>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-[#666666] font-mono">
                    Henüz günlük haber eklenmedi.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
              <div className="flex items-center gap-2 mb-4 border-b border-[#1F1F1F] pb-2">
                <Activity className="w-4 h-4 text-[#A3A3A3]" />
                <span className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3]">Ekonomi ile İlgili Diğer Haberler</span>
              </div>
              {data?.news.other && data.news.other.length > 0 ? (
                <ul className="space-y-3">
                  {data.news.other.map((item) => (
                    <li key={item.id} className="rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] p-3">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="block hover:bg-[#101010] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm text-[#E5E5E5] leading-relaxed">
                            {item.title}
                          </div>
                          {formatNewsTimestamp(item.publishedAt) && (
                            <div className="shrink-0 text-[10px] font-mono text-[#666666] tabular-nums">
                              {formatNewsTimestamp(item.publishedAt)}
                            </div>
                          )}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-[#666666] font-mono">
                  Henüz ek ekonomi haberi bulunamadı.
                </div>
              )}
            </div>
          </div>
        ) : selectedCategoryId === CRYPTO_CATEGORY_ID ? (
          <CryptoPage
            pilotMetrics={data?.pilotMetrics ?? []}
            aiInsight={data?.aiInsight ?? null}
            aiSimpleSummary={data?.aiSimpleSummary ?? null}
            aiConfidence={data?.aiConfidence ?? null}
          />
        ) : (
          <div>
            {/* AI Insight Card */}
            <div className="bg-[#111111] border border-[#1F1F1F] p-4 rounded-sm mb-6">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${data?.aiInsight ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#666666]'}`}></div>
                <div className="text-sm md:text-base font-semibold text-[#E5E5E5] tracking-wide leading-snug">
                  MERGEN AI {data?.categories.find(c => c.id === selectedCategoryId)?.name || PLACEHOLDERS[selectedCategoryId] || 'Kategori'} Analizi
                </div>
                {data?.aiConfidence !== null && data?.aiConfidence !== undefined && (
                  <ConfidenceBadge confidence={data.aiConfidence} />
                )}
              </div>
              {data?.aiInsight ? (
                <>
                  <div className="text-sm text-[#E5E5E5] leading-relaxed">
                    {data.aiInsight}
                  </div>
                  {data.aiSimpleSummary && (
                    <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
                      <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-2">
                        Sade Özet
                      </div>
                      <div className="text-sm text-[#D4D4D4] leading-relaxed">
                        {data.aiSimpleSummary}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-[#666666] leading-relaxed">
                  Bu kategori icin henuz AI yorumu olusmadi. Sag ustteki <span className="text-[#A3A3A3]">AI Prompt</span> butonuyla uretilebilir. Gemini kotasi doluysa kart bos kalabilir.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium">
                {data?.categories.find(c => c.id === selectedCategoryId)?.name || PLACEHOLDERS[selectedCategoryId] || 'Kategori'} Metrikleri
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data?.pilotMetrics.map(metric => (
                <MetricCard 
                  key={metric.id}
                  name={metric.name} 
                  symbol={metric.symbol}
                  source={metric.source}
                  latestDate={metric.latestDate}
                  cadence={metric.cadence}
                  value={metric.value} 
                  unit={metric.symbol === 'BAMLH0A0HYM2' ? '%' : ''} 
                  change={metric.change} 
                  changePct={metric.changePct} 
                  trend={metric.trend} 
                  history={metric.history}
                />
              ))}
              {/* Eğer hiç metrik yoksa */}
              {(!data?.pilotMetrics || data.pilotMetrics.length === 0) && (
                <div className="col-span-full text-sm text-[#666666] font-mono py-8 text-center border border-dashed border-[#1F1F1F]">
                  Bu kategori için henüz metrik eklenmemiş veya veri çekilmemiş.
                </div>
              )}
            </div>

            {selectedCategoryId === FED_POWER_CATEGORY_ID && data?.fedProfiles.length > 0 && (
              <div className="mt-8">
                <div className="text-sm font-medium uppercase tracking-wider text-[#A3A3A3] mb-4">
                  Fed Güç Haritası
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {data.fedProfiles.map((profile) => (
                    <div key={profile.name} className="bg-[#111111] border border-[#1F1F1F] rounded-sm p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="text-sm font-semibold text-[#E5E5E5]">{profile.name}</div>
                          <div className="text-[11px] uppercase tracking-wider text-[#A3A3A3] mt-1">{profile.role}</div>
                        </div>
                        <div className="text-[10px] text-[#A3A3A3] border border-[#1F1F1F] px-2 py-1 rounded-sm">
                          {profile.origin}
                        </div>
                      </div>
                      <div className="space-y-3 text-sm text-[#D4D4D4]">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Önceki Kurumlar</div>
                          <div>{profile.priorInstitutions.join(', ')}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Siyasi Eğilim</div>
                          <div>{profile.politicalTilt}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Faiz Bakışı</div>
                          <div>{profile.rateView}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">Bilinen Bağlantılar</div>
                          <div>{profile.knownLinks.join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const clamped = Math.max(0, Math.min(5, confidence));

  return (
    <div className="ml-auto flex items-center gap-3 border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2 rounded-sm">
      <div className="text-sm font-semibold text-[#E5E5E5] whitespace-nowrap">
        Güven {clamped}/5
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={`h-2.5 w-5 rounded-[2px] border ${
              index < clamped
                ? 'border-[#4ADE80] bg-[#4ADE80]'
                : 'border-[#2A2A2A] bg-transparent'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ScoreCircle({ score, name, trend, onClick }: { key?: React.Key; score: number | null, name: string, trend: string, onClick: () => void }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = score !== null ? circumference - (score / 100) * circumference : circumference;
  const color = score === null ? '#333' : score >= 75 ? '#4ADE80' : score >= 50 ? '#FBBF24' : score >= 25 ? '#FB923C' : '#F87171';

  return (
    <div onClick={onClick} className="flex flex-col items-center p-4 bg-[#111111] border border-[#1F1F1F] rounded-sm cursor-pointer hover:bg-[#141414] transition-colors group">
      <div className="relative flex items-center justify-center w-24 h-24 mb-3">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle cx="48" cy="48" r={radius} stroke="#1F1F1F" strokeWidth="6" fill="none" />
          {score !== null && (
            <circle 
              cx="48" cy="48" r={radius} 
              stroke={color} 
              strokeWidth="6" 
              fill="none" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              className="transition-all duration-1000 ease-out" 
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-mono font-bold" style={{ color }}>{score !== null ? score : '--'}</span>
        </div>
      </div>
      <div className="text-xs text-center font-medium text-[#A3A3A3] group-hover:text-[#E5E5E5] transition-colors h-8 flex items-center justify-center">
        {name}
      </div>
      <div className="mt-2">
        {score !== null && trend === 'up' && <ArrowUp className="w-4 h-4 text-[#4ADE80]" />}
        {score !== null && trend === 'down' && <ArrowDown className="w-4 h-4 text-[#F87171]" />}
        {(score === null || trend === 'flat') && <Minus className="w-4 h-4 text-[#666666]" />}
      </div>
    </div>
  );
}

interface MetricCardProps {
  key?: React.Key;
  name: string;
  symbol: string;
  source: string;
  latestDate: string | null;
  cadence: 'daily' | 'annual';
  value: number | null;
  unit: string;
  change: number | null;
  changePct: number | null;
  trend: 'up' | 'down' | 'flat';
  history?: { date: string; value: number }[];
}

function MetricCard({ name, symbol, source, latestDate, cadence, value, unit, change, changePct, trend, history }: MetricCardProps) {
  const isChangePositive = change !== null && change > 0;
  const isChangeNegative = change !== null && change < 0;
  const changeColor = isChangePositive ? 'text-[#4ADE80]' : isChangeNegative ? 'text-[#F87171]' : 'text-[#666666]';
  const strokeColor = isChangePositive ? '#4ADE80' : isChangeNegative ? '#F87171' : '#666666';
  const isAnnual = cadence === 'annual';

  const formatValue = (val: number | null) => {
    if (val === null) return '--';
    if (symbol.startsWith('WID_')) return `${(val * 100).toFixed(1)}`;
    if (source === 'VDEM') return val.toFixed(3);
    return val.toFixed(2);
  };
  const formatChange = (val: number | null) => {
    if (val === null) return '--';
    const prefix = val > 0 ? '+' : '';
    if (symbol.startsWith('WID_')) return `${prefix}${(val * 100).toFixed(1)} pp`;
    if (source === 'VDEM') return `${prefix}${val.toFixed(3)}`;
    return `${prefix}${val.toFixed(2)}`;
  };
  const formatChangePct = (val: number | null) => {
    if (val === null) return '--';
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toFixed(2)}%`;
  };
  const latestLabel = latestDate
    ? (isAnnual ? new Date(latestDate).getFullYear().toString() : latestDate)
    : '--';
  const periodLabel = isAnnual ? 'Yillik degisim' : 'Son degisim';
  const emptyChartLabel = isAnnual ? 'Yillik seri bekleniyor' : 'Yeterli veri yok';

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] p-4 rounded-sm hover:bg-[#141414] transition-colors group flex flex-col justify-between">
      <div>
        <div className="text-[10px] text-[#A3A3A3] uppercase tracking-wider mb-2 truncate" title={name}>{name}</div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono tabular-nums">{formatValue(value)}</span>
            {unit && value !== null && <span className="text-xs text-[#666666] font-mono">{unit}</span>}
            {!unit && symbol.startsWith('WID_') && value !== null && <span className="text-xs text-[#666666] font-mono">%</span>}
          </div>
          <div className={`flex items-center gap-1 text-xs font-mono tabular-nums ${changeColor}`}>
            {isChangePositive && <ArrowUp className="w-3 h-3" />}
            {isChangeNegative && <ArrowDown className="w-3 h-3" />}
            {(!isChangePositive && !isChangeNegative) && <Minus className="w-3 h-3" />}
            {formatChange(change)}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-[#666666] font-mono">
          <span>{periodLabel}</span>
          <span className="tabular-nums">{formatChangePct(changePct)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-[#666666] font-mono">
          <span>Son veri</span>
          <span className="tabular-nums">{latestLabel}</span>
        </div>
      </div>
      
      {/* Sparkline Chart */}
      <div className="h-10 mt-4 w-full opacity-50 group-hover:opacity-100 transition-opacity">
        {history && history.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={strokeColor} 
                strokeWidth={1.5} 
                dot={false} 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[9px] text-[#333333] font-mono">
            {emptyChartLabel}
          </div>
        )}
      </div>
    </div>
  );
}
