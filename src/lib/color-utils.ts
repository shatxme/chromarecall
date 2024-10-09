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
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 70) + 30; // 30-100%
  const l = Math.floor(Math.random() * 40) + 30; // 30-70%
  return hslToHex(h, s, l);
}

export function generateColors(colorCount: number, similarity: number): { target: string, options: string[] } {
  let target;
  do {
    target = generateRandomColor();
  } while (!isContrastSufficient(target));

  const options = new Set([target]);
  
  while (options.size < colorCount) {
    let option;
    do {
      option = generateSimilarColor(target, similarity);
    } while (!isContrastSufficient(option) || options.has(option));
    
    options.add(option);
  }
  
  return { target, options: shuffleArray(Array.from(options)) };
}

function generateSimilarColor(baseColor: string, similarity: number): string {
  const [h, s, l] = hex2hsl(baseColor);
  const hueRange = 360 * (1 - similarity);
  const saturationRange = 30 * (1 - similarity);
  const lightnessRange = 20 * (1 - similarity);

  const newHue = (h + (Math.random() * 2 - 1) * hueRange + 360) % 360;
  const newSaturation = Math.max(20, Math.min(100, s + (Math.random() * 2 - 1) * saturationRange));
  const newLightness = Math.max(20, Math.min(80, l + (Math.random() * 2 - 1) * lightnessRange));

  return hslToHex(newHue, newSaturation, newLightness);
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  let x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  let y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  let z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

export function calculateColorDifference(color1: string, color2: string): number {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  
  // Convert RGB to LAB color space
  const [l1, a1, b1_] = rgbToLab(r1, g1, b1);
  const [l2, a2, b2_] = rgbToLab(r2, g2, b2);
  
  // Calculate CIEDE2000 color difference
  const L_ = (l1 + l2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1_ * b1_);
  const C2 = Math.sqrt(a2 * a2 + b2_ * b2_);
  const C_ = (C1 + C2) / 2;
  
  const G = 0.5 * (1 - Math.sqrt(Math.pow(C_, 7) / (Math.pow(C_, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  
  const C1p = Math.sqrt(a1p * a1p + b1_ * b1_);
  const C2p = Math.sqrt(a2p * a2p + b2_ * b2_);
  const C_p = (C1p + C2p) / 2;
  
  const h1p = Math.atan2(b1_, a1p) * 180 / Math.PI;
  const h2p = Math.atan2(b2_, a2p) * 180 / Math.PI;
  
  const dLp = l2 - l1;
  const dCp = C2p - C1p;
  let dhp = h2p - h1p;
  if (dhp > 180) dhp -= 360;
  else if (dhp < -180) dhp += 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);
  
  const SL = 1 + (0.015 * Math.pow(L_ - 50, 2)) / Math.sqrt(20 + Math.pow(L_ - 50, 2));
  const SC = 1 + 0.045 * C_p;
  const T = 1 - 0.17 * Math.cos((h1p - 30) * Math.PI / 180) + 0.24 * Math.cos((2 * h1p) * Math.PI / 180) + 0.32 * Math.cos((3 * h1p + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * h1p - 63) * Math.PI / 180);
  const SH = 1 + 0.015 * C_p * T;
  const RT = -2 * Math.sqrt(Math.pow(C_p, 7) / (Math.pow(C_p, 7) + Math.pow(25, 7))) * Math.sin((60 * Math.exp(-Math.pow((h1p - 275) / 25, 2))) * Math.PI / 180);
  
  const dE = Math.sqrt(
    Math.pow(dLp / SL, 2) +
    Math.pow(dCp / SC, 2) +
    Math.pow(dHp / SH, 2) +
    RT * (dCp / SC) * (dHp / SH)
  );
  
  return dE;
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function calculateDifficulty(level: number) {
  const cycleLevel = (level - 1) % 10 + 1;
  let colorCount: number;
  let similarity: number;
  const viewTime = 3;
  
  if (cycleLevel >= 1 && cycleLevel <= 7) {
    colorCount = 6;
    similarity = 0.6;
  } else if (cycleLevel >= 8 && cycleLevel <= 9) {
    colorCount = 4;
    similarity = 0.8;
  } else {
    colorCount = 2;
    similarity = 0.98;
  }

  const selectionTime = Math.max(5, 15 - Math.floor((level - 1) / 5));

  return { colorCount, similarity, viewTime, selectionTime };
}

function isContrastSufficient(color: string): boolean {
  const [, , l] = hex2hsl(color);
  // Ensure the lightness is not too high or too low
  return l >= 25 && l <= 75;
}

export function generateGameColors(level: number): { target: string, options: string[] } {
  const { colorCount, similarity } = calculateDifficulty(level);
  return generateColors(colorCount, similarity);
}