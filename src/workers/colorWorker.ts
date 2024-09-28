import { generateColors, calculateDifficulty } from '../lib/color-utils';

self.onmessage = (e: MessageEvent) => {
  const { level, performanceRating } = e.data;
  const { colorCount, similarity } = calculateDifficulty(level, performanceRating);
  const colors = generateColors(colorCount, similarity);
  self.postMessage(colors);
};