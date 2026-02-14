/**
 * Color conversion utilities.
 *
 * Converts between hex, rgba, and HSL formats.
 * HSL output uses space-separated format ("H S% L%") for Tailwind compatibility.
 */

/** Convert "#RRGGBB" to "H S% L%" */
export function hexToHsl(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  return rgbToHsl(r, g, b);
}

/** Convert "rgba(R,G,B,A)" to "H S% L% / A" */
export function rgbaToValues(rgba: string): { h: number; s: number; l: number; a: number } {
  const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!match) throw new Error(`Invalid rgba value: ${rgba}`);

  const r = Number(match[1]) / 255;
  const g = Number(match[2]) / 255;
  const b = Number(match[3]) / 255;
  const a = match[4] !== undefined ? Number(match[4]) : 1;

  const hsl = rgbToHslValues(r, g, b);
  return { ...hsl, a };
}

/** Convert "rgba(R,G,B,A)" to "H S% L% / A" string */
export function rgbaToHsl(rgba: string): string {
  const { h, s, l, a } = rgbaToValues(rgba);
  const base = `${h} ${s}% ${l}%`;
  return a < 1 ? `${base} / ${a}` : base;
}

/** Check if a color string is rgba format */
export function isRgba(color: string): boolean {
  return color.startsWith('rgba(') || color.startsWith('rgb(');
}

function rgbToHsl(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHslValues(r, g, b);
  return `${h} ${s}% ${l}%`;
}

function rgbToHslValues(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
