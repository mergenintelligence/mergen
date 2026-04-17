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
const FED_POWER_CATEGORY_ID = '30000000-0000-0000-0000-000000000003';
const ETF_FLOWS_CATEGORY_ID = '30000000-0000-0000-0000-000000000004';
const PRECIOUS_METALS_CATEGORY_ID = '30000000-0000-0000-0000-000000000005';
const AGRI_FOOD_CATEGORY_ID = '30000000-0000-0000-0000-000000000006';
const ENERGY_SECURITY_CATEGORY_ID = '30000000-0000-0000-0000-000000000007';
const CURRENCY_DYNAMICS_CATEGORY_ID = '30000000-0000-0000-0000-000000000008';
const PUBLIC_FINANCE_CATEGORY_ID = '30000000-0000-0000-0000-000000000009';
const EMERGING_MARKETS_CATEGORY_ID = '30000000-0000-0000-0000-000000000010';
const CRYPTO_CATEGORY_ID = '30000000-0000-0000-0000-000000000011';
const CREDIT_STRESS_CATEGORY_ID = '10000000-0000-0000-0000-000000000001';
const LIQUIDITY_CATEGORY_ID = '10000000-0000-0000-0000-000000000002';
const REAL_ECONOMY_CATEGORY_ID = '10000000-0000-0000-0000-000000000003';
const INFLATION_CATEGORY_ID = '10000000-0000-0000-0000-000000000004';
const GLOBAL_RISK_CATEGORY_ID = '10000000-0000-0000-0000-000000000005';
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

type TimeSeriesObservation = {
  date: string;
  value: string;
};

const STABLECOIN_IDS = [
  'tether',
  'usd-coin',
  'dai',
  'ethena-usde',
  'paypal-usd',
  'first-digital-usd',
  'true-usd',
  'usdd',
  'pax-dollar',
];

type CryptoSnapshot = {
  date: string;
  btcDominance: number;
  totalMarketCap: number;
  total2: number;
  total3: number;
  stablecoinDominance: number;
  totalStablecoinMcap: number;
  netStablecoinFlow: number;
  usdtPrinting: number;
  openInterest: number;
  fundingRates: number;
  liquidationHeatmap: number;
  googleTrendsBtc: number;
  socialMentionsScore: number;
};

type PolymarketMarket = {
  question?: string;
  title?: string;
  slug?: string;
  description?: string;
  active?: boolean;
  closed?: boolean;
  liquidity?: number | string;
  liquidity_num?: number;
  volume?: number | string;
  volume_num?: number;
  volume24hr?: number | string;
  volume1wk?: number | string;
  openInterest?: number | string;
  open_interest?: number | string;
  bestBid?: number | string;
  bestAsk?: number | string;
  outcomes?: string[] | string;
  outcomePrices?: string[] | string;
  tags?: Array<{ label?: string; slug?: string }> | string[];
};

type PredictionSnapshot = {
  date: string;
  values: Record<string, number>;
};

let cryptoSnapshotCache: { fetchedAt: number; data: CryptoSnapshot } | null = null;
let predictionSnapshotCache: { fetchedAt: number; data: PredictionSnapshot } | null = null;
let mag7SnapshotCache: { fetchedAt: number; data: any[] } | null = null;

const MAG7_SYMBOLS = ['MSFT', 'AAPL', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA'] as const;
const MAG7_META: Record<string, { name: string; accent: string }> = {
  MSFT: { name: 'Microsoft', accent: '#60A5FA' },
  AAPL: { name: 'Apple', accent: '#A3A3A3' },
  NVDA: { name: 'NVIDIA', accent: '#4ADE80' },
  GOOGL: { name: 'Alphabet', accent: '#FBBF24' },
  AMZN: { name: 'Amazon', accent: '#FB923C' },
  META: { name: 'Meta', accent: '#A78BFA' },
  TSLA: { name: 'Tesla', accent: '#F87171' },
};

function hashSeriesId(input: string) {
  return input.split('').reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);
}

function buildSingleObservation(latestValue: number) {
  return [{
    date: new Date().toISOString().split('T')[0],
    close: Number(latestValue),
  }];
}

function parseFredCsv(csv: string, observationStart?: string) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    return [] as TimeSeriesObservation[];
  }

  const observations: TimeSeriesObservation[] = [];

  for (const line of lines.slice(1)) {
    const commaIndex = line.indexOf(',');
    if (commaIndex === -1) {
      continue;
    }

    const date = line.slice(0, commaIndex).trim();
    const value = line.slice(commaIndex + 1).trim().replace(/^"|"$/g, '');

    if (!date || !value || value === '.') {
      continue;
    }

    if (observationStart && date < observationStart) {
      continue;
    }

    observations.push({ date, value });
  }

  return observations.sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json() as Promise<T>;
}

function toFiniteNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
  } catch {
    return [];
  }
}

function marketText(market: PolymarketMarket) {
  return [market.question, market.title, market.slug, market.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function marketTags(market: PolymarketMarket) {
  const tags = Array.isArray(market.tags) ? market.tags : [];
  return tags
    .map((tag) => typeof tag === 'string' ? tag : `${tag.label || ''} ${tag.slug || ''}`)
    .join(' ')
    .toLowerCase();
}

function getYesProbability(market: PolymarketMarket): number {
  const outcomes = parseJsonArray(market.outcomes).map((entry) => entry.toLowerCase());
  const outcomePrices = parseJsonArray(market.outcomePrices).map((entry) => toFiniteNumber(entry));
  const yesIndex = outcomes.findIndex((entry) => ['yes', 'evet'].includes(entry.trim()));
  if (yesIndex >= 0 && Number.isFinite(outcomePrices[yesIndex])) {
    const price = outcomePrices[yesIndex];
    return price <= 1 ? price * 100 : price;
  }

  if (outcomePrices.length === 2 && Number.isFinite(outcomePrices[0]) && Number.isFinite(outcomePrices[1])) {
    const total = outcomePrices[0] + outcomePrices[1];
    if (total > 0) {
      const normalized = outcomePrices[0] / total;
      return normalized <= 1 ? normalized * 100 : normalized;
    }
  }

  return Number.NaN;
}

function getVolume24h(market: PolymarketMarket) {
  return toFiniteNumber(market.volume24hr ?? market.volume_num ?? market.volume);
}

function getVolume7d(market: PolymarketMarket) {
  return toFiniteNumber(market.volume1wk ?? market.volume_num ?? market.volume);
}

function getLiquidity(market: PolymarketMarket) {
  return toFiniteNumber(market.liquidity_num ?? market.liquidity);
}

function getOpenInterest(market: PolymarketMarket) {
  return toFiniteNumber(market.openInterest ?? market.open_interest ?? market.liquidity_num ?? market.liquidity);
}

function getSpread(market: PolymarketMarket) {
  const bestBid = toFiniteNumber(market.bestBid);
  const bestAsk = toFiniteNumber(market.bestAsk);
  if (Number.isFinite(bestBid) && Number.isFinite(bestAsk) && bestAsk >= bestBid) {
    const spread = bestAsk - bestBid;
    return spread <= 1 ? spread * 100 : spread;
  }
  return Number.NaN;
}

function scoreMarket(market: PolymarketMarket) {
  const liquidity = Number.isFinite(getLiquidity(market)) ? getLiquidity(market) : 0;
  const volume = Number.isFinite(getVolume24h(market)) ? getVolume24h(market) : 0;
  return liquidity + volume * 0.5;
}

function normalizeMarketKey(value: string | undefined) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findStrictMarket(
  markets: PolymarketMarket[],
  config: {
    exactTitles?: string[];
    slugIncludes?: string[];
    textIncludes?: string[];
    allTextIncludes?: string[];
    excludeText?: string[];
  },
) {
  const exactTitles = (config.exactTitles || []).map(normalizeMarketKey);
  const slugIncludes = (config.slugIncludes || []).map((entry) => entry.toLowerCase());
  const textIncludes = (config.textIncludes || []).map((entry) => entry.toLowerCase());
  const allTextIncludes = (config.allTextIncludes || []).map((entry) => entry.toLowerCase());
  const excludeText = (config.excludeText || []).map((entry) => entry.toLowerCase());

  const matches = markets.filter((market) => {
    const title = normalizeMarketKey(market.question || market.title);
    const slug = (market.slug || '').toLowerCase();
    const text = `${marketText(market)} ${marketTags(market)}`;

    const exactTitleOk = exactTitles.length === 0 || exactTitles.includes(title);
    const slugOk = slugIncludes.length === 0 || slugIncludes.some((entry) => slug.includes(entry));
    const textAnyOk = textIncludes.length === 0 || textIncludes.some((entry) => text.includes(entry));
    const textAllOk = allTextIncludes.every((entry) => text.includes(entry));
    const excludeOk = !excludeText.some((entry) => text.includes(entry));

    return exactTitleOk && slugOk && textAnyOk && textAllOk && excludeOk;
  });

  return matches.sort((a, b) => scoreMarket(b) - scoreMarket(a))[0];
}

async function fetchPolymarketMarkets(): Promise<PolymarketMarket[]> {
  const pageSize = 200;
  const pages = [0, 200, 400];
  const results = await Promise.all(pages.map(async (offset) => {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      active: 'true',
      closed: 'false',
      order: 'volume',
      ascending: 'false',
    });
    return fetchJson<PolymarketMarket[]>(`https://gamma-api.polymarket.com/markets?${params.toString()}`);
  }));

  return results.flat().filter((market) => market && market.active !== false && market.closed !== true);
}

async function fetchPredictionSnapshot(): Promise<PredictionSnapshot> {
  const today = new Date().toISOString().split('T')[0];
  if (predictionSnapshotCache && Date.now() - predictionSnapshotCache.fetchedAt < 60_000) {
    return predictionSnapshotCache.data;
  }

  const markets = await fetchPolymarketMarkets();
  const macroMarkets = markets.filter((market) => {
    const haystack = `${marketText(market)} ${marketTags(market)}`;
    return [
      'fed', 'fomc', 'rates', 'cpi', 'inflation', 'recession', 'economy', 'gdp',
      'oil', 'gold', 'bitcoin', 'btc', 'war', 'tariff', 'debt ceiling',
      'china', 'europe', 'euro', 'crypto regulation', 'equity', 'stock market', 'dollar',
    ].some((term) => haystack.includes(term));
  });

  const directProbability = (config: Parameters<typeof findStrictMarket>[1], fallback = Number.NaN) => {
    const market = findStrictMarket(markets, config) || findStrictMarket(macroMarkets, config);
    const probability = market ? getYesProbability(market) : Number.NaN;
    return Number.isFinite(probability) ? probability : fallback;
  };

  const fedCut = directProbability({
    slugIncludes: ['fed-rate-cut'],
    textIncludes: ['fed rate cut'],
    excludeText: ['2025'],
  });
  const rateHike = directProbability({
    exactTitles: ['Fed rate hike in 2026?'],
    slugIncludes: ['fed-rate-hike-in-2026'],
  });
  const fedPause = directProbability({
    textIncludes: ['fed pause'],
    excludeText: ['2025'],
  });
  const inflationUpside = directProbability({
    textIncludes: ['inflation'],
    allTextIncludes: ['higher'],
    excludeText: ['2025'],
  });
  const usRecession = directProbability({
    exactTitles: ['US recession by end of 2026?'],
    slugIncludes: ['us-recession-by-end-of-2026'],
  });
  const softLanding = directProbability({
    textIncludes: ['soft landing'],
    excludeText: ['2025'],
  });
  const euRecession = directProbability({
    textIncludes: ['eurozone recession', 'europe recession', 'eu recession'],
    excludeText: ['2025'],
  });
  const chinaHardLanding = directProbability({
    textIncludes: ['china hard landing', 'china recession'],
    excludeText: ['2025'],
  });
  const emContagion = directProbability({
    textIncludes: ['emerging market crisis', 'em contagion', 'developing markets crisis'],
    excludeText: ['2025'],
  });
  const oecdDowngrade = directProbability({
    textIncludes: ['oecd', 'growth downgrade'],
    excludeText: ['2025'],
  });
  const warEscalation = directProbability({
    textIncludes: ['war escalation', 'middle east war', 'world war'],
    excludeText: ['ceasefire', '2025'],
  });
  const oilShock = directProbability({
    textIncludes: ['oil shock'],
    excludeText: ['2025'],
  });
  const debtCeiling = directProbability({
    textIncludes: ['debt ceiling', 'government shutdown'],
    excludeText: ['2025'],
  });
  const tradeWar = directProbability({
    textIncludes: ['trade war', 'tariff war'],
    excludeText: ['2025'],
  });
  const tariffShock = directProbability({
    textIncludes: ['tariff increase', 'tariffs increase'],
    excludeText: ['2025'],
  });
  const btcAbove100k = directProbability({
    textIncludes: ['bitcoin above $100k', 'btc above 100k'],
    excludeText: ['2025'],
  });
  const goldAbove3000 = directProbability({
    textIncludes: ['gold above 3000', 'gold over 3000'],
    excludeText: ['2025'],
  });
  const oilAbove100 = directProbability({
    textIncludes: ['oil above 100', 'crude above 100'],
    excludeText: ['2025'],
  });
  const dollarStrength = directProbability({
    textIncludes: ['dollar stronger', 'usd stronger', 'dxy higher'],
    excludeText: ['2025'],
  });
  const cryptoRegulation = directProbability({
    textIncludes: ['crypto regulation', 'crypto ban', 'sec crypto'],
    excludeText: ['2025'],
  });
  const equityCorrection = directProbability({
    textIncludes: ['stock market correction', 's&p 500 correction', 'equity correction'],
    excludeText: ['2025'],
  });

  const averageConsensus = average(
    macroMarkets
      .map((market) => getYesProbability(market))
      .filter(Number.isFinite)
      .map((probability) => Math.abs(probability - 50) * 2),
  );

  const spreads = macroMarkets.map(getSpread).filter(Number.isFinite);
  const liquidities = macroMarkets.map(getLiquidity).filter(Number.isFinite);
  const openInterests = macroMarkets.map(getOpenInterest).filter(Number.isFinite);
  const volumes24h = macroMarkets.map(getVolume24h).filter(Number.isFinite);
  const volumes7d = macroMarkets.map(getVolume7d).filter(Number.isFinite);

  const totalOpenInterest = openInterests.reduce((sum, value) => sum + value, 0);
  const totalVolume24h = volumes24h.reduce((sum, value) => sum + value, 0);
  const totalVolume7d = volumes7d.reduce((sum, value) => sum + value, 0);
  const avgSpread = average(spreads);
  const avgDepth = average(liquidities);
  const consensusStrength = Number.isFinite(averageConsensus) ? averageConsensus : Number.NaN;
  const uncertaintyDensity = Number.isFinite(consensusStrength) ? clamp(100 - consensusStrength) : Number.NaN;
  const liquidityScore = Number.isFinite(avgDepth) ? clamp(Math.log10(avgDepth + 1) * 18) : Number.NaN;
  const confidenceScore = Number.isFinite(liquidityScore) && Number.isFinite(consensusStrength)
    ? clamp(liquidityScore * 0.45 + consensusStrength * 0.55)
    : Number.NaN;

  const fallbackAverage = (...values: number[]) => average(values.filter(Number.isFinite));

  const rateHikeDerived = Number.isFinite(rateHike)
    ? rateHike
    : clamp(fallbackAverage(
        Number.isFinite(fedCut) ? 100 - fedCut : Number.NaN,
        dollarStrength,
        inflationUpside,
      ));

  const fedCutDerived = Number.isFinite(fedCut)
    ? fedCut
    : clamp(fallbackAverage(
        Number.isFinite(rateHikeDerived) ? 100 - rateHikeDerived : Number.NaN,
        softLanding,
        Number.isFinite(usRecession) ? 100 - usRecession : Number.NaN,
      ));

  const fedPauseDerived = Number.isFinite(fedPause)
    ? fedPause
    : clamp(fallbackAverage(
        Number.isFinite(fedCutDerived) ? 100 - fedCutDerived : Number.NaN,
        Number.isFinite(rateHikeDerived) ? 100 - rateHikeDerived : Number.NaN,
        confidenceScore,
      ));

  const inflationUpsideDerived = Number.isFinite(inflationUpside)
    ? inflationUpside
    : clamp(fallbackAverage(oilShock, tariffShock, uncertaintyDensity));

  const tariffShockDerived = Number.isFinite(tariffShock)
    ? tariffShock
    : clamp(fallbackAverage(tradeWar, inflationUpsideDerived));

  const warEscalationDerived = Number.isFinite(warEscalation)
    ? warEscalation
    : clamp(fallbackAverage(oilShock, tradeWar, uncertaintyDensity));

  const oilShockDerived = Number.isFinite(oilShock)
    ? oilShock
    : clamp(fallbackAverage(oilAbove100, warEscalationDerived, inflationUpsideDerived));

  const debtCeilingDerived = Number.isFinite(debtCeiling)
    ? debtCeiling
    : clamp(fallbackAverage(uncertaintyDensity, Number.isFinite(confidenceScore) ? 100 - confidenceScore : Number.NaN));

  const dollarStrengthDerived = Number.isFinite(dollarStrength)
    ? dollarStrength
    : clamp(fallbackAverage(rateHikeDerived, Number.isFinite(fedCutDerived) ? 100 - fedCutDerived : Number.NaN, tradeWar));

  const euRecessionDerived = Number.isFinite(euRecession)
    ? euRecession
    : clamp(fallbackAverage(usRecession, oecdDowngrade, macroRisk));

  const chinaHardLandingDerived = Number.isFinite(chinaHardLanding)
    ? chinaHardLanding
    : clamp(fallbackAverage(oecdDowngrade, emContagion, tradeWar));

  const emContagionDerived = Number.isFinite(emContagion)
    ? emContagion
    : clamp(fallbackAverage(chinaHardLandingDerived, euRecessionDerived, macroRisk));

  const oecdDowngradeDerived = Number.isFinite(oecdDowngrade)
    ? oecdDowngrade
    : clamp(fallbackAverage(usRecession, euRecessionDerived, chinaHardLandingDerived));

  const equityCorrectionDerived = Number.isFinite(equityCorrection)
    ? equityCorrection
    : clamp(fallbackAverage(usRecession, warEscalationDerived, debtCeilingDerived));

  const creditSpreadDerived = Number.isFinite(fallbackAverage(usRecession, debtCeilingDerived, equityCorrectionDerived, macroRisk))
    ? clamp(fallbackAverage(usRecession, debtCeilingDerived, equityCorrectionDerived, warEscalationDerived))
    : Number.NaN;

  const cryptoRegulationDerived = Number.isFinite(cryptoRegulation)
    ? cryptoRegulation
    : clamp(fallbackAverage(tradeWar, equityCorrectionDerived, Number.isFinite(confidenceScore) ? 100 - confidenceScore : Number.NaN));

  const usRecessionDerived = Number.isFinite(usRecession)
    ? usRecession
    : clamp(fallbackAverage(euRecessionDerived, oecdDowngradeDerived, Number.isFinite(softLanding) ? 100 - softLanding : Number.NaN));

  const softLandingDerived = Number.isFinite(softLanding)
    ? softLanding
    : clamp(fallbackAverage(Number.isFinite(usRecessionDerived) ? 100 - usRecessionDerived : Number.NaN, fedCutDerived, confidenceScore));

  const tradeWarDerived = Number.isFinite(tradeWar)
    ? tradeWar
    : clamp(fallbackAverage(tariffShockDerived, chinaHardLandingDerived, dollarStrengthDerived));

  const btcAbove100kDerived = Number.isFinite(btcAbove100k)
    ? btcAbove100k
    : clamp(fallbackAverage(softLandingDerived, confidenceScore, Number.isFinite(warEscalationDerived) ? 100 - warEscalationDerived : Number.NaN));

  const goldAbove3000Derived = Number.isFinite(goldAbove3000)
    ? goldAbove3000
    : clamp(fallbackAverage(warEscalationDerived, inflationUpsideDerived, Number.isFinite(softLandingDerived) ? 100 - softLandingDerived : Number.NaN));

  const oilAbove100Derived = Number.isFinite(oilAbove100)
    ? oilAbove100
    : clamp(fallbackAverage(oilShockDerived, warEscalationDerived, inflationUpsideDerived));

  const stagflationDerived = clamp(fallbackAverage(inflationUpsideDerived, usRecession, oilShockDerived));
  const inflationTargetBreachDerived = clamp(fallbackAverage(inflationUpsideDerived, tariffShockDerived, oilShockDerived));
  const powellDovishDerived = clamp(fallbackAverage(fedCutDerived, Number.isFinite(rateHikeDerived) ? 100 - rateHikeDerived : Number.NaN, fedPauseDerived));
  const yearEndFedPathDerived = Number.isFinite(fedCutDerived) && Number.isFinite(rateHikeDerived)
    ? Number((4.25 - fedCutDerived / 100 + rateHikeDerived / 200).toFixed(2))
    : Number.isFinite(fedCutDerived)
      ? Number((4.25 - fedCutDerived / 100).toFixed(2))
      : Number.NaN;

  const recessionPricingDerived = average([usRecessionDerived, euRecessionDerived, chinaHardLandingDerived, emContagionDerived].filter(Number.isFinite));
  const inflationPricingDerived = average([inflationUpsideDerived, oilShockDerived, tariffShockDerived].filter(Number.isFinite));
  const macroRiskDerived = average([warEscalationDerived, debtCeilingDerived, tradeWarDerived, equityCorrectionDerived, cryptoRegulationDerived].filter(Number.isFinite));
  const regimeCoherenceDerived = Number.isFinite(confidenceScore) && Number.isFinite(uncertaintyDensity)
    ? clamp(confidenceScore - uncertaintyDensity * 0.25 + 15)
    : Number.NaN;
  const surpriseRiskDerived = average([uncertaintyDensity, macroRiskDerived, tradeWarDerived].filter(Number.isFinite));
  const generalScoreDerived = average([
    softLandingDerived,
    confidenceScore,
    Number.isFinite(recessionPricingDerived) ? 100 - recessionPricingDerived : Number.NaN,
    Number.isFinite(macroRiskDerived) ? 100 - macroRiskDerived : Number.NaN,
  ].filter(Number.isFinite));
  const bondsDivergenceDerived = Number.isFinite(recessionPricingDerived) && Number.isFinite(fedCutDerived)
    ? Math.abs(recessionPricingDerived - fedCutDerived)
    : Number.NaN;
  const goldDivergenceDerived = Number.isFinite(goldAbove3000Derived) && Number.isFinite(warEscalationDerived)
    ? Math.abs(goldAbove3000Derived - warEscalationDerived)
    : Number.NaN;

  const values: Record<string, number> = {
    PM_TOTAL_OPEN_INTEREST: totalOpenInterest,
    PM_VOLUME_24H: totalVolume24h,
    PM_VOLUME_7D: totalVolume7d,
    PM_ACTIVE_MARKET_COUNT: markets.length,
    PM_MACRO_MARKET_COUNT: macroMarkets.length,
    PM_AVG_BID_ASK_SPREAD: avgSpread,
    PM_AVG_MARKET_DEPTH: avgDepth,
    PM_CONSENSUS_STRENGTH: consensusStrength,
    PM_UNCERTAINTY_DENSITY: uncertaintyDensity,
    PM_MARKET_CONFIDENCE_SCORE: confidenceScore,
    PM_FED_CUT_PROB: fedCutDerived,
    PM_YEAR_END_FED_PATH: yearEndFedPathDerived,
    PM_US_INFLATION_UPSURPRISE_PROB: inflationUpsideDerived,
    PM_RATE_HIKE_PROB: rateHikeDerived,
    PM_POWELL_DOVISH_PIVOT_PROB: powellDovishDerived,
    PM_FED_PAUSE_EXTENSION_PROB: fedPauseDerived,
    PM_STAGFLATION_PROB: stagflationDerived,
    PM_INFLATION_TARGET_BREACH_PROB: inflationTargetBreachDerived,
    PM_US_RECESSION_PROB: usRecessionDerived,
    PM_SOFT_LANDING_PROB: softLandingDerived,
    PM_EU_RECESSION_PROB: euRecessionDerived,
    PM_CHINA_HARD_LANDING_PROB: chinaHardLandingDerived,
    PM_EM_CONTAGION_PROB: emContagionDerived,
    PM_OECD_GROWTH_DOWNGRADE_PROB: oecdDowngradeDerived,
    PM_WAR_ESCALATION_PROB: warEscalationDerived,
    PM_OIL_SHOCK_PROB: oilShockDerived,
    PM_DEBT_CEILING_CRISIS_PROB: debtCeilingDerived,
    PM_CREDIT_SPREAD_WIDENING_PROB: creditSpreadDerived,
    PM_TRADE_WAR_ESCALATION_PROB: tradeWarDerived,
    PM_TARIFF_SHOCK_PROB: tariffShockDerived,
    PM_BTC_ABOVE_100K_PROB: btcAbove100kDerived,
    PM_GOLD_ABOVE_3000_PROB: goldAbove3000Derived,
    PM_OIL_ABOVE_100_PROB: oilAbove100Derived,
    PM_DOLLAR_STRENGTH_PROB: dollarStrengthDerived,
    PM_CRYPTO_REGULATION_STRICT_PROB: cryptoRegulationDerived,
    PM_EQUITY_CORRECTION_PROB: equityCorrectionDerived,
    PM_GENERAL_SCORE: generalScoreDerived,
    PM_MACRO_RISK_SCORE: macroRiskDerived,
    PM_RECESSION_PRICING_SCORE: recessionPricingDerived,
    PM_INFLATION_PRICING_SCORE: inflationPricingDerived,
    PM_VS_BONDS_DIVERGENCE: bondsDivergenceDerived,
    PM_VS_GOLD_DIVERGENCE: goldDivergenceDerived,
    PM_REGIME_COHERENCE_SCORE: regimeCoherenceDerived,
    PM_SURPRISE_RISK_SCORE: surpriseRiskDerived,
  };

  const snapshot: PredictionSnapshot = { date: today, values };
  predictionSnapshotCache = {
    fetchedAt: Date.now(),
    data: snapshot,
  };
  return snapshot;
}

async function fetchPredictionSeries(seriesId: string): Promise<TimeSeriesObservation[]> {
  const snapshot = await fetchPredictionSnapshot();
  const latestValue = snapshot.values[seriesId];
  if (!Number.isFinite(latestValue)) {
    return [];
  }
  return [{
    date: snapshot.date,
    value: String(latestValue),
  }];
}

async function fetchCryptoSnapshot(): Promise<CryptoSnapshot> {
  const today = new Date().toISOString().split('T')[0];
  if (cryptoSnapshotCache && Date.now() - cryptoSnapshotCache.fetchedAt < 60_000) {
    return cryptoSnapshotCache.data;
  }
  const globalData = await fetchJson<any>('https://api.coingecko.com/api/v3/global');
  const totalMarketCap = Number(globalData?.data?.total_market_cap?.usd);
  const btcDominance = Number(globalData?.data?.market_cap_percentage?.btc);
  const ethDominance = Number(globalData?.data?.market_cap_percentage?.eth);
  if (!Number.isFinite(totalMarketCap) || !Number.isFinite(btcDominance) || !Number.isFinite(ethDominance)) {
    throw new Error('Crypto global snapshot is unavailable');
  }

  const stablecoinMarkets = await fetchJson<any[]>(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(STABLECOIN_IDS.join(','))}&price_change_percentage=24h`,
  );
  const totalStablecoinMcap = stablecoinMarkets.reduce((sum, coin) => sum + Number(coin.market_cap || 0), 0);
  const totalStablecoinFlow = stablecoinMarkets.reduce((sum, coin) => sum + Number(coin.market_cap_change_24h || 0), 0);
  const usdtCoin = stablecoinMarkets.find((coin) => coin.id === 'tether');

  const btcMarketCap = totalMarketCap * (btcDominance / 100);
  const ethMarketCap = totalMarketCap * (ethDominance / 100);
  let socialMentionsScore = Number.NaN;
  let openInterest = Number.NaN;
  let fundingRates = Number.NaN;

  try {
    const btcDetail = await fetchJson<any>(
      'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=false&community_data=true&developer_data=false&sparkline=false',
    );
    const twitterFollowers = Number(btcDetail?.community_data?.twitter_followers || 0);
    const redditSubscribers = Number(btcDetail?.community_data?.reddit_subscribers || 0);
    const telegramUsers = Number(btcDetail?.community_data?.telegram_channel_user_count || 0);
    const combinedSocial = twitterFollowers + redditSubscribers + telegramUsers;

    if (combinedSocial > 0) {
      socialMentionsScore = Math.max(0, Math.min(100, Number((Math.log10(combinedSocial + 1) * 14).toFixed(1))));
    }
  } catch (error) {
    console.warn('Social mentions fetch failed:', error);
  }

  try {
    const oi = await fetchJson<any>('https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT');
    openInterest = Number(oi?.openInterest || 0);
  } catch (error) {
    console.warn('Open interest fetch failed:', error);
  }

  try {
    const funding = await fetchJson<any[]>('https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1');
    fundingRates = Number(funding?.[0]?.fundingRate || 0) * 100;
  } catch (error) {
    console.warn('Funding rate fetch failed:', error);
  }

  let googleTrendsBtc = Number.NaN;
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://trends.google.com/',
    };
    const exploreReq = {
      comparisonItem: [{ keyword: 'Bitcoin', geo: '', time: 'today 12-m' }],
      category: 0,
      property: '',
    };
    const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=0&req=${encodeURIComponent(JSON.stringify(exploreReq))}`;
    const exploreText = await (await fetch(exploreUrl, { headers })).text();
    const exploreJson = JSON.parse(exploreText.replace(/^\)\]\}',?\n/, ''));
    const widget = (exploreJson.widgets || []).find((item: any) => item.id === 'TIMESERIES');

    if (widget) {
      const widgetReq = typeof widget.request === 'string' ? widget.request : JSON.stringify(widget.request);
      const timelineUrl = `https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=0&req=${encodeURIComponent(widgetReq)}&token=${encodeURIComponent(widget.token)}`;
      const timelineText = await (await fetch(timelineUrl, { headers })).text();
      const timelineJson = JSON.parse(timelineText.replace(/^\)\]\}',?\n/, ''));
      const timelineData = timelineJson?.default?.timelineData || [];
      const lastPoint = timelineData[timelineData.length - 1];
      googleTrendsBtc = Array.isArray(lastPoint?.value) ? Number(lastPoint.value[0]) : 0;
    }
  } catch (error) {
    console.warn('Google Trends fetch failed:', error);
  }

  const snapshot: CryptoSnapshot = {
    date: today,
    btcDominance,
    totalMarketCap,
    total2: Math.max(totalMarketCap - btcMarketCap, 0),
    total3: Math.max(totalMarketCap - btcMarketCap - ethMarketCap, 0),
    stablecoinDominance: totalMarketCap > 0 ? (totalStablecoinMcap / totalMarketCap) * 100 : 0,
    totalStablecoinMcap,
    netStablecoinFlow: totalStablecoinFlow,
    usdtPrinting: Number(usdtCoin?.market_cap_change_24h || 0),
    openInterest,
    fundingRates,
    liquidationHeatmap: Number.isFinite(openInterest) && Number.isFinite(fundingRates) ? Math.abs(openInterest * fundingRates) : Number.NaN,
    googleTrendsBtc,
    socialMentionsScore,
  };

  cryptoSnapshotCache = {
    fetchedAt: Date.now(),
    data: snapshot,
  };

  return snapshot;
}

async function fetchCryptoSeries(seriesId: string): Promise<TimeSeriesObservation[]> {
  const snapshot = await fetchCryptoSnapshot();
  const seriesMap: Record<string, number> = {
    'BTC.D': snapshot.btcDominance,
    'USDT.D': snapshot.stablecoinDominance,
    TOTAL: snapshot.totalMarketCap,
    TOTAL2: snapshot.total2,
    TOTAL3: snapshot.total3,
    OPEN_INTEREST: snapshot.openInterest,
    FUNDING_RATES: snapshot.fundingRates,
    LIQUIDATION_HEATMAP: snapshot.liquidationHeatmap,
    TOTAL_STABLECOIN_MCAP: snapshot.totalStablecoinMcap,
    NET_STABLECOIN_FLOW: snapshot.netStablecoinFlow,
    USDT_PRINTING: snapshot.usdtPrinting,
    GOOGLE_TRENDS_BTC: snapshot.googleTrendsBtc,
    SOCIAL_DOMINANCE_SCORE: snapshot.socialMentionsScore,
  };

  if (!(seriesId in seriesMap)) {
    throw new Error(`Unsupported crypto series: ${seriesId}`);
  }

  const latestValue = seriesMap[seriesId];
  if (!Number.isFinite(latestValue)) {
    return [];
  }

  return [{
    date: snapshot.date,
    value: String(latestValue),
  }];
}

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

function buildCreditStressPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde kredi ve finansal stres rejimini yorumlayan bir analiz katmanisin.
Bu kategori sistemin genel tansiyonunu, kredi spreadlerini, getiri egrisindeki bozulmayi ve fonlama kosullarini birlikte okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = yuksek stres, 100 = dengeli ve saglikli finansal zemin)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. STLFSI4, NFCI ve high-yield spread tarafini sistem tansiyonu olarak birlikte yorumla.
4. Getiri egrisi ve banka kredisi tarafini resesyon/kredi daralmasi baglaminda oku.
5. SOFR, IORB ve fonlama maliyetlerini likidite kalitesi olarak ayri degerlendir.
6. Sadece gecerli JSON don. Markdown veya ek metin verme.
7. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
`;
}

function buildLiquidityPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde piyasa likiditesini yorumlayan bir analiz katmanisin.
Bu kategori Fed bilancosu, TGA, RRP, banka rezervleri ve net likidite ivmesi uzerinden piyasadaki gercek dolar akisinin rejimini okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = daralan/sikisan likidite, 100 = destekleyici likidite rejimi)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. Net likidite, ivme, TGA ve RRP farkini acik secik ayir.
4. WALCL yukseliyor diye tek basina olumlu yazma; TGA ve RRP drenajini hesaba kat.
5. Banka rezervlerini finansal tampon olarak oku.
6. Sadece gecerli JSON don. Markdown veya ek metin verme.
7. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
`;
}

function buildRealEconomyPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde reel ekonomi ve buyume rejimini yorumlayan bir analiz katmanisin.
Bu kategori isgucu piyasasi, sanayi dongusu, tuketim ve reel gelir uzerinden ekonominin gercek ivmesini okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = zayiflama/daralma, 100 = saglikli buyume)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. Istihdam, haftalik basvurular, PMI ve kapasite kullanimini birbirine baglayarak yaz.
4. Reel perakende satis ve reel geliri hanehalki talebinin cekirdegi olarak yorumla.
5. Tek bir veriyle kesin resesyon veya boom dili kurma; genel rejimi anlat.
6. Sadece gecerli JSON don. Markdown veya ek metin verme.
7. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
`;
}

function buildInflationPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde enflasyon rejimini yorumlayan bir analiz katmanisin.
Bu kategori sadece baslik enflasyonu degil; kalicilik, yayilim, ucret baskisi, beklentiler ve maliyet kanallarini birlikte okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = yuksek ve kalici enflasyon baskisi, 100 = daha sakin fiyat rejimi)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 5-6 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. Baslik enflasyon, sticky/median CPI ve supercore farkini net ayir.
4. Ucret metriklerini beklentilerden ayri ele al.
5. GSCPI, ZORI, ithalat fiyatlari ve CRB tarafini maliyet kanali olarak yorumla.
6. Sadece gecerli JSON don. Markdown veya ek metin verme.
7. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
`;
}

function buildGlobalRiskPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde kuresel risk rejimini yorumlayan bir analiz katmanisin.
Bu kategori jeopolitik stres, tedarik zinciri tikanikligi, kuyruk riski, ticaret navlunu ve yapisal kirilganliklari birlikte okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = yuksek kuresel risk, 100 = daha dengeli dis ortam)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. Jeopolitik, navlun/tedarik ve spread risklerini ayri ama bagli anlat.
4. Copper/Gold oranini buyume-korku dengesi olarak yorumla.
5. Yapisal riskleri anlik kriz diliyle karistirma.
6. Sadece gecerli JSON don. Markdown veya ek metin verme.
7. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
`;
}

function buildFedPowerPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde Fed ici guc dengesini yorumlayan bir analiz katmanisin.
Bu kategori Fed'in sadece faiz durusunu degil; kurulun kurumsal kokenini, siyasi baskiyi, soylem kaymasini ve ic fikir ayriliklarini okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = kirilgan ve catisan guc yapisi, 100 = daha tutarli ve dengeli ic zemin)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 5-6 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. Governor kokeni, siyasi tilt, revolving door ve think-tank baglarini ayni sey gibi yazma.
4. Hawk-dove ton, dissent ve congressional aggression tarafini "karar cevresindeki baski" olarak oku.
5. Policy deviation ve shadow rate gap varsa bunu burokratik/politik sapma baglaminda yorumla.
6. Sadece gecerli JSON don. Markdown veya ek metin verme.
7. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
`;
}

function buildEnergyPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde enerji ve enerji guvenligi rejimini yorumlayan bir analiz katmanisin.
Bu kategori petrol, dogal gaz, stratejik rezerv ve enerji enflasyonu uzerinden arz guvenligi ile fiyat baskisini birlikte okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = yuksek enerji stresi, 100 = dengeli enerji rejimi)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. Brent/WTI, dogal gaz ve stratejik rezerv tarafini ayni sey gibi yazma.
4. Enerji TUFE baskisini tuketiciye yansiyan kisim olarak ayri vurgula.
5. Sadece gecerli JSON don. Markdown veya ek metin verme.
6. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
`;
}

function buildCurrencyPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde doviz ve kur dinamiklerini yorumlayan bir analiz katmanisin.
Bu kategori majör kurlar, dolar rejimi ve ticaret agirlikli rekabet gucu uzerinden dis denge ve finansman baskisini okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = yuksek kur baskisi, 100 = daha dengeli dis kur rejimi)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. Yen, yuan ve real tarafini ayni kategoriye sıkıştırma; her biri farkli stres kanalidir.
4. REER ve ticaret agirlikli dolar endeksini dolar rejimi olarak ayri degerlendir.
5. Sadece gecerli JSON don. Markdown veya ek metin verme.
6. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
`;
}

function buildPublicFinancePrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde kamu maliyesi ve sovereign borc rejimini yorumlayan bir analiz katmanisin.
Bu kategori butce dengesi, borc yukü, nominal/reel faiz ve getiri egrisi uzerinden devlet finansman stresini okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = mali baski ve borclanma stresi, 100 = daha dengeli mali zemin)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. Bütce ve borc metriklerini faiz seviyesinden ayri yorumla.
4. Reel faiz ile nominal faizi karistirma.
5. Sadece gecerli JSON don. Markdown veya ek metin verme.
6. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
`;
}

function buildEmergingMarketsPrompt(input: {
  categoryName: string;
  categoryDescription: string | null;
  categoryScore: number | string;
  metricBlock: string;
}) {
  return `
Sen "Mergen Intelligence" icinde gelismekte olan piyasalar rejimini yorumlayan bir analiz katmanisin.
Bu kategori EM hisse ve tahvil risk istahini, bolgesel ayrismayi ve dis finansman kirilganligini okumak icin kullaniliyor.

Kategori: ${input.categoryName}
Kategori Açıklaması: ${input.categoryDescription || 'Yok'}
Kategori Güncel Skoru: ${input.categoryScore} / 100 (0 = yuksek EM stresi, 100 = destekleyici EM rejimi)

Metrikler:
${input.metricBlock}

Kurallar:
1. expert_summary alaninda 4-5 cumlelik profesyonel yorum ver.
2. simple_summary alaninda bunu normal bir insanin kolay anlayacagi sekilde 3-4 cumlede yeniden anlat.
3. EEM ve EMB tarafini hisse/tahvil ayrisimi olarak oku.
4. Cin ve Brezilya eksenini bolgesel hikaye olarak ayri degerlendir.
5. Sadece gecerli JSON don. Markdown veya ek metin verme.
6. JSON su sekilde olsun: {"expert_summary":"...","simple_summary":"...","confidence":4}
`;
}

function parseEiaSprObservations(html: string, observationStart?: string) {
  const monthDates = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const observations: TimeSeriesObservation[] = [];
  const lines = html
    .split(/\r?\n/)
    .map((line) => line.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!/^\d{4}\b/.test(line)) {
      continue;
    }

    const parts = line.split(/\s+/);
    const year = Number(parts[0]);
    const rawValues = parts.slice(1, 13);

    if (!Number.isFinite(year) || rawValues.length === 0) {
      continue;
    }

    rawValues.forEach((rawValue, index) => {
      if (!rawValue || ['-', '--', 'NA', 'W'].includes(rawValue)) {
        return;
      }

      const numeric = Number(rawValue.replace(/,/g, ''));
      if (!Number.isFinite(numeric)) {
        return;
      }

      observations.push({
        date: `${year}-${monthDates[index]}-01`,
        value: String(numeric),
      });
    });
  }

  return observationStart
    ? observations.filter((entry) => entry.date >= observationStart)
    : observations;
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

function normalizeAiError(error: any) {
  const rawMessage =
    typeof error?.message === 'string'
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Failed to generate AI insight';

  const normalized = rawMessage.toLowerCase();
  if (
    normalized.includes('429') ||
    normalized.includes('quota') ||
    normalized.includes('rate limit') ||
    normalized.includes('resource_exhausted') ||
    normalized.includes('generate_content_free_tier_requests')
  ) {
    return {
      status: 429,
      message:
        'Gemini kotasi dolu. Yeni AI yorumu simdi uretemiyorum. Biraz sonra tekrar deneyebilir ya da mevcut kayitli yorumu kullanabilirsin.',
    };
  }

  if (
    normalized.includes('503') ||
    normalized.includes('unavailable') ||
    normalized.includes('high demand')
  ) {
    return {
      status: 503,
      message:
        'Gemini su anda yogunluk altinda. Sistem birkaç kez denese de yanit alamadi. Biraz sonra tekrar dene.',
    };
  }

  return {
    status: 500,
    message: rawMessage,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateGeminiJson(prompt: string) {
  let lastError: any = null;
  const retryDelays = [0, 1200, 2500];
  const turkishInstruction = `
Tum ciktilari, ozellikle expert_summary ve simple_summary alanlarini, akici ve dogal Turkce yaz.
Ingilizce cumle kurma.
Ingilizce finansal terim gerekiyorsa sadece kisaltma veya yerlesik piyasa terimi olarak kullan; aciklayici cumleler mutlaka Turkce olsun.
JSON icindeki metinlerin dili tamamen Turkce olmalidir.
`;

  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt] > 0) {
      await sleep(retryDelays[attempt]);
    }

    try {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${turkishInstruction}\n${prompt}`,
        config: {
          responseMimeType: 'application/json',
        },
      });
    } catch (error: any) {
      lastError = error;
      const normalized = String(error?.message || error).toLowerCase();
      const retryable =
        normalized.includes('503') ||
        normalized.includes('unavailable') ||
        normalized.includes('high demand');

      if (!retryable || attempt === retryDelays.length - 1) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Gemini request failed');
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

  app.get('/api/crypto/series', async (req, res) => {
    const { series_id } = req.query;

    if (!series_id || typeof series_id !== 'string') {
      return res.status(400).json({ error: 'series_id is required' });
    }

    try {
      const observations = await fetchCryptoSeries(series_id);
      res.json({ observations });
    } catch (error: any) {
      console.error('Crypto series fetch error:', series_id, error);
      res.status(500).json({ error: error?.message || 'Failed to fetch crypto series' });
    }
  });

  app.get('/api/prediction/series', async (req, res) => {
    const { series_id } = req.query;

    if (!series_id || typeof series_id !== 'string') {
      return res.status(400).json({ error: 'series_id is required' });
    }

    try {
      const observations = await fetchPredictionSeries(series_id);
      res.json({ observations });
    } catch (error: any) {
      console.error('Prediction series fetch error:', series_id, error);
      res.status(500).json({ error: error?.message || 'Failed to fetch prediction market series' });
    }
  });

  // Proxy route for FRED API to bypass CORS
  app.get("/api/fred/series", async (req, res) => {
    const { series_id, observation_start, limit } = req.query;
    const apiKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
    const seriesId = String(series_id || '');
    const observationStart = typeof observation_start === 'string' ? observation_start : undefined;
    const limitValue = typeof limit === 'string' ? Number(limit) : undefined;

    if (!seriesId) {
      return res.status(400).json({ error: "series_id is required" });
    }

    try {
      if (apiKey) {
        let url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc`;

        if (observationStart) {
          url += `&observation_start=${observationStart}`;
        }
        if (limitValue) {
          url += `&limit=${limitValue}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && Array.isArray(data?.observations) && data.observations.length > 0) {
          return res.json(data);
        }

        console.warn(`FRED API fallback activated for ${seriesId}`, data);
      }

      const csvUrl = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`;
      const csvResponse = await fetch(csvUrl);

      if (!csvResponse.ok) {
        return res.status(csvResponse.status).json({ error: `Failed to fetch FRED CSV for ${seriesId}` });
      }

      const csv = await csvResponse.text();
      const observations = parseFredCsv(csv, observationStart);
      const slicedObservations = limitValue ? observations.slice(0, limitValue) : observations;

      return res.json({
        observations: slicedObservations,
        source: 'fred_csv_fallback',
      });
    } catch (error) {
      console.error("Error fetching from FRED:", error);
      res.status(500).json({ error: "Failed to fetch from FRED API" });
    }
  });

  app.get("/api/eia/spr", async (req, res) => {
    const { observation_start } = req.query;

    try {
      const response = await fetch('https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?f=M&n=PET&s=MCSSTUS1');
      if (!response.ok) {
        return res.status(response.status).json({ error: `EIA SPR fetch failed with ${response.status}` });
      }

      const html = await response.text();
      const observations = parseEiaSprObservations(
        html,
        typeof observation_start === 'string' ? observation_start : undefined,
      );

      res.json({ observations });
    } catch (error) {
      console.error("Error fetching EIA SPR data:", error);
      res.status(500).json({ error: "Failed to fetch EIA SPR data" });
    }
  });

  // Proxy route for Yahoo Finance to bypass CORS
  app.get("/api/yahoo/historical", async (req, res) => {
    try {
      const { symbol, period1 } = req.query;
      
      if (!symbol || !period1) {
        return res.status(400).json({ error: "symbol and period1 are required" });
      }

      const normalizedSymbol = String(symbol);

      if (normalizedSymbol === 'HYPE-USD') {
        const candidateIds = ['hyperliquid', 'hyperliquid-hype', 'hype'];

        for (const coinId of candidateIds) {
          try {
            const cg = await fetchJson<any>(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=365&interval=daily`);
            const observations = (cg?.prices || [])
              .map((entry: [number, number]) => ({
                date: new Date(entry[0]).toISOString().split('T')[0],
                close: Number(entry[1]),
              }))
              .filter((entry: { close: number }) => Number.isFinite(entry.close) && entry.close > 0);

            if (observations.length > 0) {
              return res.json({ observations });
            }
          } catch (error) {
            console.warn(`HYPE fallback fetch failed for ${coinId}:`, error);
          }
        }

        try {
          const search = await fetchJson<any>('https://api.coingecko.com/api/v3/search?query=hyperliquid');
          const dynamicIds = (search?.coins || []).map((coin: any) => coin.id).filter(Boolean);
          const ids = Array.from(new Set([...candidateIds, ...dynamicIds])).join(',');
          const simple = await fetchJson<any>(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
          const latest = Object.values(simple || {})
            .map((entry: any) => Number(entry?.usd))
            .find((value) => Number.isFinite(value) && value > 0);

          if (latest) {
            return res.json({ observations: buildSingleObservation(latest) });
          }
        } catch (error) {
          console.warn('HYPE simple price fallback failed:', error);
        }

        return res.status(404).json({ error: 'No live HYPE market data found' });
      }

      const queryOptions = { period1: String(period1) };
      const result = await yahooFinance.chart(normalizedSymbol, queryOptions);
      
      res.json({ observations: result.quotes });
    } catch (error: any) {
      console.error("Yahoo Finance Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/market/mag7", async (_req, res) => {
    try {
      if (mag7SnapshotCache && Date.now() - mag7SnapshotCache.fetchedAt < 5 * 60 * 1000) {
        return res.json({ data: mag7SnapshotCache.data, cached: true });
      }

      const data = await Promise.all(
        MAG7_SYMBOLS.map(async (symbol) => {
          const quote = await yahooFinance.quote(symbol);
          const chart = await yahooFinance.chart(symbol, { range: '1mo', interval: '1d' });
          const history = (chart?.quotes || [])
            .map((entry: any) => Number(entry?.close))
            .filter((value: number) => Number.isFinite(value) && value > 0)
            .slice(-20);

          return {
            symbol,
            name: MAG7_META[symbol].name,
            accent: MAG7_META[symbol].accent,
            price: Number(quote?.regularMarketPrice ?? 0) || null,
            changePct: Number(quote?.regularMarketChangePercent ?? 0) || null,
            marketCap: Number(quote?.marketCap ?? 0) || null,
            history,
          };
        }),
      );

      const sorted = data.sort((left, right) => (right.marketCap ?? 0) - (left.marketCap ?? 0));
      mag7SnapshotCache = { fetchedAt: Date.now(), data: sorted };

      res.json({ data: sorted, cached: false });
    } catch (error: any) {
      console.error("MAG7 snapshot error:", error);
      res.status(500).json({ error: error?.message || "Failed to fetch MAG7 snapshot" });
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
          : categoryId === FED_POWER_CATEGORY_ID
            ? buildFedPowerPrompt({
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
          : categoryId === ENERGY_SECURITY_CATEGORY_ID
            ? buildEnergyPrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : categoryId === CURRENCY_DYNAMICS_CATEGORY_ID
            ? buildCurrencyPrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : categoryId === PUBLIC_FINANCE_CATEGORY_ID
            ? buildPublicFinancePrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : categoryId === EMERGING_MARKETS_CATEGORY_ID
            ? buildEmergingMarketsPrompt({
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
          : categoryId === CREDIT_STRESS_CATEGORY_ID
            ? buildCreditStressPrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : categoryId === LIQUIDITY_CATEGORY_ID
            ? buildLiquidityPrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : categoryId === REAL_ECONOMY_CATEGORY_ID
            ? buildRealEconomyPrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : categoryId === INFLATION_CATEGORY_ID
            ? buildInflationPrompt({
                categoryName: category.name,
                categoryDescription: category.description,
                categoryScore: categoryScore ? categoryScore.score : 'Bilinmiyor',
                metricBlock,
              })
          : categoryId === GLOBAL_RISK_CATEGORY_ID
            ? buildGlobalRiskPrompt({
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

      const response = await generateGeminiJson(prompt);

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
      const normalized = normalizeAiError(error);
      res.status(normalized.status).json({ error: normalized.message });
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

      const response = await generateGeminiJson(prompt);

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
      const normalized = normalizeAiError(error);
      res.status(normalized.status).json({ error: normalized.message });
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
