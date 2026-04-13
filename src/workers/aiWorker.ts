export async function generateCategoryInsight(categoryId: string) {
  const response = await fetch('/api/ai/category-insight', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ categoryId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'AI insight generation failed');
  }

  return data;
}

export async function generateMarketOverview() {
  const response = await fetch('/api/ai/market-overview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Market overview generation failed');
  }

  return data;
}
