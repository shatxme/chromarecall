import { generateColors, calculateDifficulty } from '../lib/color-utils';

console.log('Color worker initialized');

self.onmessage = async (event) => {
  const { level, performanceRating } = event.data;

  try {
    const { colorCount, similarity } = calculateDifficulty(level, performanceRating);
    const { target, options } = generateColors(colorCount, similarity);
    self.postMessage({ target, options });
  } catch (error) {
    console.error('Error in colorWorker:', error);
    self.postMessage({ error: 'Failed to generate colors' });
  }
};