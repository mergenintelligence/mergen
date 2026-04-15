export interface Category {
  id: string;
  name: string;
  description: string;
  weight: number;
  created_at: string;
}

export interface Metric {
  id: string;
  category_id: string;
  name: string;
  symbol: string;
  source: string;
  description: string;
  is_inverse: boolean; // if true, higher value = worse score
  weight: number;
  created_at: string;
}

export interface MetricValue {
  id: string;
  metric_id: string;
  value: number;
  date: string;
  created_at: string;
}

export interface Score {
  id: string;
  entity_type: 'metric' | 'category' | 'total';
  entity_id: string; // metric_id, category_id, or 'total'
  score: number; // 0-100
  date: string;
  created_at: string;
}

export interface Alert {
  id: string;
  type: 'threshold' | 'momentum' | 'divergence';
  message: string;
  is_active: boolean;
  created_at: string;
}
