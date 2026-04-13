import { supabase } from '../lib/supabase';

/**
 * Fetches historical observations for a given FRED series and saves them to Supabase.
 * Uses the local API proxy to bypass CORS.
 */
export async function fetchFredSeries(seriesId: string, metricId: string) {
  try {
    // Anlamlı bir persentil hesaplamak için son 10 yılın verisini çekiyoruz
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const startDate = tenYearsAgo.toISOString().split('T')[0];

    // Özel Kompozit Metrik: SOFR - IORB Spread
    if (seriesId === 'SOFR_IORB') {
      console.log('Fetching composite metric SOFR_IORB...');
      const [sofrRes, iorbRes] = await Promise.all([
        fetch(`/api/fred/series?series_id=SOFR&observation_start=${startDate}`),
        fetch(`/api/fred/series?series_id=IORB&observation_start=${startDate}`)
      ]);

      if (!sofrRes.ok) throw new Error(`Failed to fetch SOFR: ${sofrRes.statusText}`);
      if (!iorbRes.ok) throw new Error(`Failed to fetch IORB: ${iorbRes.statusText}`);

      const sofrData = await sofrRes.json();
      const iorbData = await iorbRes.json();

      const iorbMap = new Map<string, number>();
      for (const obs of iorbData.observations) {
        if (obs.value !== '.') iorbMap.set(obs.date, Number(obs.value));
      }

      const valuesToInsert = [];
      for (const obs of sofrData.observations) {
        if (obs.value !== '.' && iorbMap.has(obs.date)) {
          const sofrVal = Number(obs.value);
          const iorbVal = iorbMap.get(obs.date)!;
          valuesToInsert.push({
            metric_id: metricId,
            date: obs.date,
            value: sofrVal - iorbVal
          });
        }
      }

      if (valuesToInsert.length === 0) {
        console.log('No valid composite data found for SOFR_IORB');
        return;
      }

      const batchSize = 1000;
      for (let i = 0; i < valuesToInsert.length; i += batchSize) {
        const batch = valuesToInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from('metric_values')
          .upsert(batch, { onConflict: 'metric_id, date' });
        
        if (error) {
          console.error(`Error saving chunk to Supabase:`, error);
        }
      }
      console.log(`Successfully saved historical data for SOFR_IORB`);
      return;
    }

    // Özel Kompozit Metrik: Altın/Gümüş Ortak Endeksi
    if (seriesId === 'GOLD_SILVER_INDEX') {
      console.log('Fetching composite metric GOLD_SILVER_INDEX...');
      const [gldRes, slvRes] = await Promise.all([
        fetch(`/api/yahoo/historical?symbol=GLD&period1=${startDate}`),
        fetch(`/api/yahoo/historical?symbol=SLV&period1=${startDate}`)
      ]);

      if (!gldRes.ok) throw new Error(`Failed to fetch GLD: ${gldRes.statusText}`);
      if (!slvRes.ok) throw new Error(`Failed to fetch SLV: ${slvRes.statusText}`);

      const gldData = await gldRes.json();
      const slvData = await slvRes.json();

      if (gldData.error) throw new Error(`Yahoo API Error for GLD: ${gldData.error}`);
      if (slvData.error) throw new Error(`Yahoo API Error for SLV: ${slvData.error}`);

      const slvMap = new Map<string, number>();
      for (const obs of slvData.observations || []) {
        if (obs.close !== null && obs.close !== undefined) {
          const dateStr = new Date(obs.date).toISOString().split('T')[0];
          slvMap.set(dateStr, Number(obs.close));
        }
      }

      const alignedSeries = [];
      for (const obs of gldData.observations || []) {
        if (obs.close !== null && obs.close !== undefined) {
          const dateStr = new Date(obs.date).toISOString().split('T')[0];
          const slvClose = slvMap.get(dateStr);
          if (slvClose !== undefined) {
            alignedSeries.push({
              date: dateStr,
              gld: Number(obs.close),
              slv: slvClose,
            });
          }
        }
      }

      if (alignedSeries.length === 0) {
        console.log('No valid composite data found for GOLD_SILVER_INDEX');
        return;
      }

      const base = alignedSeries[0];
      const valuesToInsert = alignedSeries.map((entry) => {
        const gldRebased = (entry.gld / base.gld) * 100;
        const slvRebased = (entry.slv / base.slv) * 100;
        return {
          metric_id: metricId,
          date: entry.date,
          value: (gldRebased + slvRebased) / 2,
        };
      });

      for (let i = 0; i < valuesToInsert.length; i += 1000) {
        const chunk = valuesToInsert.slice(i, i + 1000);
        const { error } = await supabase
          .from('metric_values')
          .upsert(chunk, { onConflict: 'metric_id, date' });

        if (error) {
          console.error('Error saving chunk to Supabase:', error);
        }
      }

      console.log('Successfully saved historical data for GOLD_SILVER_INDEX');
      return;
    }

    // Özel Metrik: Yahoo Finance üzerinden çekilecekler
    const yahooSymbols = ['MOVE', 'DX-Y.NYB', 'GC=F', 'CL=F', 'MAGS', 'IGV', 'BTC', 'SMH', 'QQQ', 'HG=F', 'TSM', 'LIT', 'CLOU', 'CIBR', 'ARKK', 'NVDA', 'URA', 'EQIX', 'PLTR', 'SPY', 'XLF', 'XLE', 'IBIT', 'GLD', 'SLV', 'PPLT', 'PALL', 'GDX', 'SIL', 'WEAT', 'CORN', 'SOYB', 'DBA', 'JO', 'CANE', 'BZ=F', 'NG=F', 'USO', 'UNG', 'FXY', 'EEM', 'EMB', 'FXI', 'EWZ', 'BTCUSD', 'ETH', 'BNB', 'XRP', 'COIN', 'MSTR'];
    
    if (yahooSymbols.includes(seriesId)) {
      const symbolMap: Record<string, string> = {
        'MOVE': '^MOVE',
        'DX-Y.NYB': 'DX-Y.NYB',
        'GC=F': 'GC=F',
        'CL=F': 'CL=F',
        'MAGS': 'MAGS',
        'IGV': 'IGV',
        'BTC': 'BTC-USD',
        'SMH': 'SMH',
        'QQQ': 'QQQ',
        'HG=F': 'HG=F',
        'TSM': 'TSM',
        'LIT': 'LIT',
        'CLOU': 'CLOU',
        'CIBR': 'CIBR',
        'ARKK': 'ARKK',
        'NVDA': 'NVDA',
        'URA': 'URA',
        'EQIX': 'EQIX',
        'PLTR': 'PLTR',
        'SPY': 'SPY',
        'XLF': 'XLF',
        'XLE': 'XLE',
        'IBIT': 'IBIT',
        'GLD': 'GLD',
        'SLV': 'SLV',
        'PPLT': 'PPLT',
        'PALL': 'PALL',
        'GDX': 'GDX',
        'SIL': 'SIL',
        'WEAT': 'WEAT',
        'CORN': 'CORN',
        'SOYB': 'SOYB',
        'DBA': 'DBA',
        'JO': 'JO',
        'CANE': 'CANE',
        // Enerji ve Enerji Güvenliği
        'BZ=F': 'BZ=F',
        'NG=F': 'NG=F',
        'USO': 'USO',
        'UNG': 'UNG',
        // Döviz ve Kur Dinamikleri
        'FXY': 'FXY',
        // Gelişmekte Olan Piyasalar
        'EEM': 'EEM',
        'EMB': 'EMB',
        'FXI': 'FXI',
        'EWZ': 'EWZ',
        // Kripto Para Piyasaları
        'BTCUSD': 'BTC-USD',
        'ETH': 'ETH-USD',
        'BNB': 'BNB-USD',
        'XRP': 'XRP-USD',
        'COIN': 'COIN',
        'MSTR': 'MSTR',
      };
      
      const yfSymbol = symbolMap[seriesId];
      console.log(`Fetching ${seriesId} (${yfSymbol}) from Yahoo Finance...`);
      const url = `/api/yahoo/historical?symbol=${yfSymbol}&period1=${startDate}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error || data.error_code) {
        console.error(`Yahoo API Error for ${seriesId}: ${data.error || data.error_message}`);
        return;
      }

      if (!data.observations || data.observations.length === 0) {
        console.error(`No data found for series ${seriesId}`);
        return;
      }

      console.log(`Fetched ${data.observations.length} historical records for ${seriesId}`);

      const validObservations = data.observations
        .filter((obs: any) => obs.close !== null && obs.close !== undefined)
        .map((obs: any) => {
          const dateStr = new Date(obs.date).toISOString().split('T')[0];
          return {
            metric_id: metricId,
            value: Number(obs.close),
            date: dateStr
          };
        });

      for (let i = 0; i < validObservations.length; i += 1000) {
        const chunk = validObservations.slice(i, i + 1000);
        const { error } = await supabase
          .from('metric_values')
          .upsert(chunk, { onConflict: 'metric_id, date' });

        if (error) {
          console.error(`Error saving chunk to Supabase:`, error);
        }
      }
      
      console.log(`Successfully saved historical data for ${seriesId}`);
      return;
    }

    // Call our local proxy API instead of FRED directly
    const url = `/api/fred/series?series_id=${seriesId}&observation_start=${startDate}`;
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error(`HTTP ${response.status} for FRED series ${seriesId}: ${text}`);
      return;
    }

    const data = await response.json();

    if (data.error || data.error_code) {
      console.error(`FRED API Error for ${seriesId}: ${data.error || data.error_message}`);
      return;
    }

    if (!data.observations || data.observations.length === 0) {
      console.error(`No data found for FRED series ${seriesId}`);
      return;
    }

    console.log(`Fetched ${data.observations.length} historical records for ${seriesId}`);

    // FRED bazen eksik veriler için '.' döner, bunları filtreliyoruz
    const validObservations = data.observations
      .filter((obs: any) => obs.value !== '.')
      .map((obs: any) => ({
        metric_id: metricId,
        value: parseFloat(obs.value),
        date: obs.date
      }));

    // Supabase limitlerine takılmamak için 1000'erli chunklar halinde upsert yapıyoruz
    for (let i = 0; i < validObservations.length; i += 1000) {
      const chunk = validObservations.slice(i, i + 1000);
      const { error } = await supabase
        .from('metric_values')
        .upsert(chunk, { onConflict: 'metric_id, date' });

      if (error) {
        console.error(`Error saving chunk to Supabase:`, error);
      }
    }
    
    console.log(`Successfully saved historical data for ${seriesId}`);

  } catch (error) {
    console.error(`Error fetching FRED series ${seriesId}:`, error);
    throw error;
  }
}
