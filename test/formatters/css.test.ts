import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseTokens } from '../../src/parser.js';
import { formatCss } from '../../src/formatters/css.js';

const fixture = readFileSync(resolve(import.meta.dirname, '../fixtures/ravenhelm-dark.yaml'), 'utf8');

describe('CSS formatter', () => {
  it('produces valid CSS with :root selector', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens);

    expect(css).toContain(':root {');
    expect(css).toContain('}');
    expect(css).toContain('/* ravenhelm-dark v1.1.0');
  });

  it('outputs HSL color values by default', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens);

    // #0E1014 → HSL(222, 17%, 7%) approximately
    expect(css).toMatch(/--background:\s*\d+ \d+% \d+%/);
    expect(css).toMatch(/--primary:\s*\d+ \d+% \d+%/);
  });

  it('outputs hex color values when format=hex', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens, { format: 'hex' });

    expect(css).toContain('--background: #0E1014');
    expect(css).toContain('--primary: #7FA3C8');
  });

  it('includes spacing tokens with px units', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens);

    expect(css).toContain('--spacing-xs: 4px');
    expect(css).toContain('--spacing-md: 12px');
    expect(css).toContain('--spacing-xxxl: 48px');
  });

  it('includes radii tokens', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens);

    expect(css).toContain('--radius-sm: 4px');
    expect(css).toContain('--radius-full: 999px');
  });

  it('includes typography tokens', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens);

    expect(css).toContain("--font-family: 'Inter', sans-serif");
    expect(css).toContain("--font-display: 'Plus Jakarta Sans', serif");
    expect(css).toContain("--font-mono: 'JetBrains Mono', monospace");
  });

  it('includes type scales', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens);

    expect(css).toContain('--font-size-display-large: 32px');
    expect(css).toContain('--font-weight-display-large: 700');
    expect(css).toContain('--letter-spacing-display-large: -0.5px');
  });

  it('includes glass tokens', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens);

    expect(css).toContain('--glass-blur: 12px');
    expect(css).toContain('--glass-border-width: 1px');
  });

  it('handles glass colors (rgba values)', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens);

    // Glass colors should appear in HSL with alpha
    expect(css).toMatch(/--glass-bg:/);
    expect(css).toMatch(/--glass-border:/);
  });

  it('supports custom prefix', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens, { prefix: '--rh-' });

    expect(css).toContain('--rh-background:');
    expect(css).toContain('--rh-spacing-xs:');
  });

  it('supports custom selector', () => {
    const tokens = parseTokens(fixture);
    const css = formatCss(tokens, { selector: '.theme-dark' });

    expect(css).toContain('.theme-dark {');
    expect(css).not.toContain(':root');
  });
});
