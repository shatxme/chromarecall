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