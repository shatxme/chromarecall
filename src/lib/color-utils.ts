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
  
  const colorDifferenceThreshold = (1 - similarity) * 0.1;
  const decoyThreshold = colorDifferenceThreshold * 0.5;
  const maxAttempts = 1000;
  
  // Generate a decoy color
  let decoy;
  do {
    decoy = generateSimilarColor(target, similarity + 0.05);
  } while (calculateColorDifference(target, decoy) < decoyThreshold);
  options.push(decoy);
  
  // Generate other colors
  for (let i = 2; i < colorCount; i++) {
    let option;
    let attempts = 0;
    do {
      option = generateSimilarColor(target, similarity);
      attempts++;
    } while ((calculateColorDifference(target, option) < colorDifferenceThreshold || !isContrastSufficient(option)) && attempts < maxAttempts);
    
    options.push(option);
  }
  
  // Ensure at least one noticeably different color
  if (colorCount > 3) {
    const distinctColor = generateDistinctColor(target, similarity);
    options[options.length - 1] = distinctColor;
  }
  
  return { target, options: shuffleArray(options) };
}

function generateSimilarColor(baseColor: string, similarity: number): string {
  const [h, s, l] = hex2hsl(baseColor);
  const hueRange = 360 * (1 - similarity);
  const saturationRange = 100 * (1 - similarity);
  const lightnessRange = 50 * (1 - similarity);

  const newHue = (h + (Math.random() * 2 - 1) * hueRange + 360) % 360;
  const newSaturation = Math.max(20, Math.min(100, s + (Math.random() * 2 - 1) * saturationRange));
  const newLightness = Math.max(20, Math.min(70, l + (Math.random() * 2 - 1) * lightnessRange)); // Limited lightness range

  return hslToHex(newHue, newSaturation, newLightness);
}

function generateDistinctColor(baseColor: string, similarity: number): string {
  const [h, s, l] = hex2hsl(baseColor);
  const hueShift = 180 + (Math.random() - 0.5) * 60; // Opposite hue with some variation
  const newHue = (h + hueShift) % 360;
  const newSaturation = Math.max(20, Math.min(80, s + (Math.random() - 0.5) * 40)); // Limited saturation between 20 and 80
  const newLightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 40)); // Limited lightness to 80
  
  // Use similarity to adjust the distinctness
  const adjustedHue = (newHue + (1 - similarity) * 180) % 360;
  const adjustedSaturation = Math.max(0, Math.min(100, newSaturation + (1 - similarity) * 50));
  const adjustedLightness = Math.max(0, Math.min(80, newLightness + (1 - similarity) * 50)); // Ensured lightness does not exceed 80
  
  return hslToHex(adjustedHue, adjustedSaturation, adjustedLightness);
}

export function calculateColorDifference(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  // Using CIEDE2000 color difference formula for more accurate perception
  const lab1 = rgb2lab(rgb1);
  const lab2 = rgb2lab(rgb2);
  
  return deltaE(lab1, lab2) / 100; // Normalize to 0-1 range
}

// Add these helper functions for CIEDE2000 calculation
function rgb2lab(rgb: {r: number, g: number, b: number}): [number, number, number] {
  // Implementation of RGB to LAB conversion
  let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)];
}

function deltaE(lab1: [number, number, number], lab2: [number, number, number]): number {
  // Implementation of CIEDE2000 color difference formula
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const kL = 1, kC = 1, kH = 1;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);

  const aC1C2 = (C1 + C2) / 2.0;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(aC1C2, 7.0) / (Math.pow(aC1C2, 7.0) + Math.pow(25.0, 7.0))));

  const a1p = (1.0 + G) * a1;
  const a2p = (1.0 + G) * a2;

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = Math.atan2(b1, a1p) + 2 * Math.PI * (Math.atan2(b1, a1p) < 0 ? 1 : 0);
  const h2p = Math.atan2(b2, a2p) + 2 * Math.PI * (Math.atan2(b2, a2p) < 0 ? 1 : 0);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  const dhp = (C1p * C2p) === 0 ? 0 : (h2p - h1p + 360) % 360 - (Math.abs(h2p - h1p) > 180 ? 180 : 0);
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);

  const aL = (L1 + L2) / 2.0;
  const aCp = (C1p + C2p) / 2.0;

  const aHp = (C1p * C2p) === 0 ? h1p + h2p : (h1p + h2p + 360 * (Math.abs(h1p - h2p) > 180 ? 1 : 0)) / 2;

  const T = 1 - 0.17 * Math.cos(aHp * Math.PI / 180 - Math.PI / 6) + 0.24 * Math.cos(2 * aHp * Math.PI / 180) + 0.32 * Math.cos(3 * aHp * Math.PI / 180 + Math.PI / 30) - 0.20 * Math.cos(4 * aHp * Math.PI / 180 - 7 * Math.PI / 20);

  const dRo = 30 * Math.exp(-((aHp - 275) / 25) * ((aHp - 275) / 25));

  const RC = 2 * Math.sqrt(Math.pow(aCp, 7) / (Math.pow(aCp, 7) + Math.pow(25, 7)));
  const SL = 1 + ((0.015 * (aL - 50) * (aL - 50)) / Math.sqrt(20 + (aL - 50) * (aL - 50)));
  const SC = 1 + 0.045 * aCp;
  const SH = 1 + 0.015 * aCp * T;
  const RT = -Math.sin(2 * dRo * Math.PI / 180) * RC;

  const dE = Math.sqrt(
    Math.pow(dLp / (SL * kL), 2) +
    Math.pow(dCp / (SC * kC), 2) +
    Math.pow(dHp / (SH * kH), 2) +
    RT * (dCp / (SC * kC)) * (dHp / (SH * kH))
  );

  return dE;
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

// Update the calculateDifficulty function
export function calculateDifficulty(level: number) {
  // Color count calculation
  const baseColorCount = 3;
  const additionalColors = Math.floor(level / 10);
  const colorCount = Math.min(10, baseColorCount + additionalColors);

  // Similarity calculation
  let similarity;
  if (level <= 10) {
    similarity = 0.7 + (level * 0.01); // Easier start
  } else if (level <= 30) {
    similarity = 0.8 + ((level - 10) * 0.005); // Gradual increase
  } else if (level <= 50) {
    similarity = 0.9 + ((level - 30) * 0.003); // Steeper increase
  } else {
    similarity = 0.96 + ((level - 50) * 0.0005); // Slower increase after 50
  }
  similarity = Math.min(0.99, similarity);

  // Selection time calculation
  let selectionTime;
  if (level <= 10) {
    selectionTime = 15;
  } else if (level <= 80) {
    selectionTime = Math.max(2, 15 - Math.floor((level - 10) / 5));
  } else {
    selectionTime = 2;
  }

  const viewTime = 3; // Constant view time of 3 seconds

  return { colorCount, similarity, viewTime, selectionTime };
}

function isContrastSufficient(color: string): boolean {
  const [h, s, l] = hex2hsl(color);
  // Log the hue and saturation for debugging purposes
  console.log(`Color HSL - Hue: ${h}, Saturation: ${s}, Lightness: ${l}`);
  return l <= 70; // Ensure the lightness is not too high
}