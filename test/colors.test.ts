import { describe, it, expect } from 'vitest';
import { hexToHsl, rgbaToHsl, rgbaToValues, isRgba } from '../src/utils/colors.js';

describe('hexToHsl', () => {
  it('converts pure black', () => {
    expect(hexToHsl('#000000')).toBe('0 0% 0%');
  });

  it('converts pure white', () => {
    expect(hexToHsl('#FFFFFF')).toBe('0 0% 100%');
  });

  it('converts primary blue #7FA3C8', () => {
    const hsl = hexToHsl('#7FA3C8');
    // Should be roughly 210 38% 64%
    expect(hsl).toMatch(/^\d+ \d+% \d+%$/);
    const [h, s, l] = hsl.split(' ').map((v) => parseInt(v));
    expect(h).toBeGreaterThanOrEqual(205);
    expect(h).toBeLessThanOrEqual(215);
    expect(s).toBeGreaterThanOrEqual(35);
    expect(s).toBeLessThanOrEqual(42);
    expect(l).toBeGreaterThanOrEqual(62);
    expect(l).toBeLessThanOrEqual(66);
  });

  it('converts dark background #0E1014', () => {
    const hsl = hexToHsl('#0E1014');
    const [h, s, l] = hsl.split(' ').map((v) => parseInt(v));
    expect(h).toBeGreaterThanOrEqual(215);
    expect(h).toBeLessThanOrEqual(230);
    expect(l).toBeLessThanOrEqual(10);
  });

  it('converts pure red', () => {
    expect(hexToHsl('#FF0000')).toBe('0 100% 50%');
  });

  it('converts pure green', () => {
    expect(hexToHsl('#00FF00')).toBe('120 100% 50%');
  });

  it('converts pure blue', () => {
    expect(hexToHsl('#0000FF')).toBe('240 100% 50%');
  });
});

describe('rgbaToHsl', () => {
  it('converts rgba with alpha', () => {
    const result = rgbaToHsl('rgba(18,20,26,0.80)');
    expect(result).toMatch(/^\d+ \d+% \d+% \/ 0\.8$/);
  });

  it('converts rgba with full opacity', () => {
    const result = rgbaToHsl('rgba(255,255,255,1)');
    expect(result).toBe('0 0% 100%');
  });

  it('converts rgba with spaces', () => {
    const result = rgbaToHsl('rgba(255, 255, 255, 0.10)');
    expect(result).toMatch(/0 0% 100% \/ 0\.1$/);
  });
});

describe('rgbaToValues', () => {
  it('parses rgba into h/s/l/a', () => {
    const { h, s, l, a } = rgbaToValues('rgba(18,20,26,0.80)');
    expect(a).toBe(0.8);
    expect(h).toBeGreaterThanOrEqual(215);
    expect(h).toBeLessThanOrEqual(230);
  });

  it('throws on invalid input', () => {
    expect(() => rgbaToValues('not-a-color')).toThrow('Invalid rgba');
  });
});

describe('isRgba', () => {
  it('identifies rgba strings', () => {
    expect(isRgba('rgba(1,2,3,0.5)')).toBe(true);
    expect(isRgba('rgb(1,2,3)')).toBe(true);
  });

  it('rejects hex strings', () => {
    expect(isRgba('#FF0000')).toBe(false);
  });
});
