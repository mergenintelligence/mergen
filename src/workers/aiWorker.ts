function extractAiErrorMessage(data: any, fallback: string) {
  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }

  if (typeof data?.error?.message === 'string' && data.error.message.trim()) {
    return data.error.message.trim();
  }

  return fallback;
}

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
    throw new Error(extractAiErrorMessage(data, 'AI insight generation failed'));
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
    throw new Error(extractAiErrorMessage(data, 'Market overview generation failed'));
  }

  return data;
}
