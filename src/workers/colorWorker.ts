import { generateColors, calculateDifficulty } from '../lib/color-utils';

self.onmessage = (e: MessageEvent) => {
  try {
    const { level, performanceRating } = e.data;
    const { colorCount, similarity } = calculateDifficulty(level, performanceRating);
    const { target, options } = generateColors(colorCount, similarity);
    self.postMessage({ target, options });
  } catch (error) {
    console.error('Error in colorWorker:', error);
    self.postMessage({ error: 'Failed to generate colors' });
  }
};