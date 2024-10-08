import {
  adjustColor,
  calculateHarmonyScore,
  getContrastColor,
  generateColors,
  calculateColorDifference,
  calculateTimeForLevel,
  calculateDifficulty,
  generateGameColors,
} from '../../lib/color-utils';

describe('color-utils', () => {
  describe('adjustColor', () => {
    it('should adjust color correctly', () => {
      expect(adjustColor('#FF0000', 60, 10, 5)).toBe('#ffff00');
      expect(adjustColor('#00FF00', -60, -10, -5)).toBe('#0000ff');
    });
  });

  describe('calculateHarmonyScore', () => {
    it('should calculate harmony score correctly', () => {
      const score = calculateHarmonyScore(['#FF0000', '#00FF00', '#0000FF']);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getContrastColor', () => {
    it('should return white for dark colors', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff');
      expect(getContrastColor('#123456')).toBe('#ffffff');
    });

    it('should return black for light colors', () => {
      expect(getContrastColor('#FFFFFF')).toBe('#000000');
      expect(getContrastColor('#EEEEEE')).toBe('#000000');
    });
  });

  describe('generateColors', () => {
    it('should generate correct number of colors', () => {
      const { target, options } = generateColors(4, 0.8);
      expect(options).toContain(target);
      expect(options.length).toBe(4);
    });

    it('should generate colors with specified similarity', () => {
      const { target, options } = generateColors(4, 0.9);
      options.forEach(color => {
        if (color !== target) {
          const difference = calculateColorDifference(target, color);
          expect(difference).toBeLessThan(50); // Adjust this threshold as needed
        }
      });
    });
  });

  describe('calculateColorDifference', () => {
    it('should return 0 for identical colors', () => {
      expect(calculateColorDifference('#FF0000', '#FF0000')).toBe(0);
    });

    it('should return a positive value for different colors', () => {
      expect(calculateColorDifference('#FF0000', '#00FF00')).toBeGreaterThan(0);
    });
  });

  describe('calculateTimeForLevel', () => {
    it('should return correct time for different levels', () => {
      expect(calculateTimeForLevel(1)).toBe(5);
      expect(calculateTimeForLevel(15)).toBe(4);
      expect(calculateTimeForLevel(50)).toBe(1);
    });
  });

  describe('calculateDifficulty', () => {
    it('should calculate difficulty correctly for different levels', () => {
      const level1 = calculateDifficulty(1);
      expect(level1.colorCount).toBe(3);
      expect(level1.similarity).toBeCloseTo(0.6, 1);
      expect(level1.viewTime).toBe(3);
      expect(level1.selectionTime).toBe(15);

      const level50 = calculateDifficulty(50);
      expect(level50.colorCount).toBe(6);
      expect(level50.similarity).toBeCloseTo(0.85, 1);
      expect(level50.viewTime).toBe(3);
      expect(level50.selectionTime).toBe(5);
    });
  });

  describe('generateGameColors', () => {
    it('should generate correct number of colors for different levels', () => {
      const level1 = generateGameColors(1);
      expect(level1.options.length).toBe(3);
      expect(level1.options).toContain(level1.target);

      const level50 = generateGameColors(50);
      expect(level50.options.length).toBe(6);
      expect(level50.options).toContain(level50.target);
    });

    it('should generate unique colors', () => {
      const { options } = generateGameColors(10);
      const uniqueColors = new Set(options);
      expect(uniqueColors.size).toBe(options.length);
    });
  });
});