export async function saveScore(username: string, score: number, level: number) {
  const response = await fetch('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, score, level }),
  });

  if (!response.ok) {
    throw new Error('Failed to save score');
  }

  return response.json();
}

export async function awardCoins(username: string, selectionTime: number, maxSelectionTime: number): Promise<number> {
  console.log('awardCoins called with:', username, selectionTime, maxSelectionTime);
  const response = await fetch('/api/award-coins', {
    method: 'POST',  // Changed from PATCH to POST
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, selectionTime, maxSelectionTime }),
  });

  if (!response.ok) {
    console.error('Failed to award coins. Status:', response.status);
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to award coins');
  }

  const data = await response.json();
  console.log('Coins awarded:', data.awardedCoins);
  return data.awardedCoins;
}