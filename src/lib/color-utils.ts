export function getThemePalette(theme: string): string[] {
  const themes: { [key: string]: string[] } = {
    Ocean: ['#003366', '#0066cc', '#66ccff', '#99ffff', '#ffffff'],
    Forest: ['#1B5E20', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B'],
    Sunset: ['#FF6F00', '#FF9800', '#FFC107', '#FFEB3B', '#FFFFFF'],
    Desert: ['#8B4513', '#D2691E', '#F4A460', '#FFD700', '#FFFAF0'],
    'Neon City': ['#FF00FF', '#00FFFF', '#FF1493', '#39FF14', '#FFFFFF'],
    // Add more themes as needed
  };
  return themes[theme] || themes.Ocean;
}

export function adjustColor(color: string, hue: number, saturation: number, brightness: number): string {
  let [h, s, l] = hex2hsl(color);
  h = (h + hue + 360) % 360;
  s = Math.max(0, Math.min(100, s + saturation));
  l = Math.max(0, Math.min(100, l + brightness));
  return hslToHex(h, s, l);
}

export function calculateHarmonyScore(colors: string[]): number {
  const hslColors = colors.map(hex2hsl);
  let score = 0;

  // Check for color progression
  const hueDiffs = hslColors.slice(1).map((color, i) => 
    Math.abs(color[0] - hslColors[i][0])
  );
  const avgHueDiff = hueDiffs.reduce((sum, diff) => sum + diff, 0) / hueDiffs.length;
  score += Math.max(0, 40 - avgHueDiff * 0.5); // More lenient scoring for hue differences

  // Check for saturation and lightness consistency
  const saturationRange = Math.max(...hslColors.map(c => c[1])) - Math.min(...hslColors.map(c => c[1]));
  const lightnessRange = Math.max(...hslColors.map(c => c[2])) - Math.min(...hslColors.map(c => c[2]));
  score += Math.max(0, 30 - saturationRange / 3);
  score += Math.max(0, 30 - lightnessRange / 3);

  // Bonus for theme-appropriate colors
  const blueHues = hslColors.filter(c => c[0] >= 180 && c[0] <= 240).length;
  score += blueHues * 5; // Bonus points for blue hues

  // Bonus for including a light color (for foam/waves)
  const hasLightColor = hslColors.some(c => c[2] > 80);
  if (hasLightColor) score += 10;

  return Math.min(100, Math.round(score));
}

export function getContrastColor(hexColor: string): string {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128 ? "#ffffff" : "#000000";
}

// Helper functions (not exported)
function hex2hsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;  // Changed from 'let' to 'const'
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateRandomColor(): string {
  return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
}

export function generateColors(colorCount: number, similarity: number): { target: string, options: string[] } {
  const target = generateRandomColor();
  const options = [target];
  
  const colorDifferenceThreshold = 1 - similarity;
  const maxAttempts = 1000; // Prevent infinite loop
  
  for (let i = 1; i < colorCount; i++) {
    let option;
    let attempts = 0;
    do {
      option = generateSimilarColor(target, similarity);
      attempts++;
    } while (calculateColorDifference(target, option) > colorDifferenceThreshold && attempts < maxAttempts);
    
    options.push(option);
  }
  
  return { target, options: shuffleArray(options) };
}

function generateSimilarColor(baseColor: string, similarity: number): string {
  const [h, s, l] = hex2hsl(baseColor);
  const hueRange = 360 * (1 - similarity);
  const saturationRange = 100 * (1 - similarity);
  const lightnessRange = 50 * (1 - similarity);

  const newHue = (h + (Math.random() * 2 - 1) * hueRange + 360) % 360;
  const newSaturation = Math.max(0, Math.min(100, s + (Math.random() * 2 - 1) * saturationRange));
  const newLightness = Math.max(0, Math.min(100, l + (Math.random() * 2 - 1) * lightnessRange));

  return hslToHex(newHue, newSaturation, newLightness);
}

export function calculateColorDifference(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const rDiff = Math.pow((rgb1.r - rgb2.r) / 255, 2);
  const gDiff = Math.pow((rgb1.g - rgb2.g) / 255, 2);
  const bDiff = Math.pow((rgb1.b - rgb2.b) / 255, 2);
  
  return Math.sqrt(rDiff + gDiff + bDiff);
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function calculateTimeForLevel(level: number): number {
  // Start with 5 seconds, decrease by 1 second every 10 levels, minimum 1 second
  return Math.max(1, 5 - Math.floor(level / 10));
}