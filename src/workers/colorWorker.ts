import { generateColors, calculateDifficulty } from '../lib/color-utils';

console.log('Color worker initialized');

self.onmessage = async (event) => {
  const { level } = event.data;

  try {
    const { colorCount, similarity } = calculateDifficulty(level);
    
    // Implement caching for previously generated colors
    const cacheKey = `${level}`;
    const cachedColors = colorCache.get(cacheKey);
    
    if (cachedColors) {
      self.postMessage(cachedColors);
      return;
    }
    
    const colors = generateColors(colorCount, similarity);
    
    // Cache the generated colors
    addToCache(cacheKey, colors);
    
    self.postMessage(colors);
  } catch (error) {
    console.error('Error in colorWorker:', error);
    self.postMessage({ error: 'Failed to generate colors' });
  }
};

// Implement a simple LRU cache for color generation
const MAX_CACHE_SIZE = 100;
const colorCache = new Map<string, { target: string, options: string[] }>();

function addToCache(key: string, value: { target: string, options: string[] }) {
  if (colorCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = colorCache.keys().next().value;
    if (oldestKey !== undefined) {
      colorCache.delete(oldestKey);
    }
  }
  colorCache.set(key, value);
}