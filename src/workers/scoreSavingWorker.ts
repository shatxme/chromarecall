self.onmessage = async (event) => {
  const { username, score, level } = event.data;

  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, score, level }),
    });

    if (!response.ok) {
      throw new Error('Failed to save score');
    }

    const result = await response.json();
    self.postMessage(result);
  } catch (error) {
    self.postMessage({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
};