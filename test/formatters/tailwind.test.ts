import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseTokens } from '../../src/parser.js';
import { formatTailwind } from '../../src/formatters/tailwind.js';

const fixture = readFileSync(resolve(import.meta.dirname, '../fixtures/ravenhelm-dark.yaml'), 'utf8');

describe('Tailwind formatter', () => {
  it('produces a valid JS module export', () => {
    const tokens = parseTokens(fixture);
    const output = formatTailwind(tokens);

    expect(output).toContain('export default');
    expect(output).toContain('"theme"');
    expect(output).toContain('"extend"');
  });

  it('maps colors to CSS custom property references', () => {
    const tokens = parseTokens(fixture);
    const output = formatTailwind(tokens);

    expect(output).toContain('hsl(var(--background))');
    expect(output).toContain('hsl(var(--primary))');
    expect(output).toContain('hsl(var(--text-primary))');
  });

  it('maps spacing to CSS custom property references', () => {
    const tokens = parseTokens(fixture);
    const output = formatTailwind(tokens);

    expect(output).toContain('var(--spacing-xs)');
    expect(output).toContain('var(--spacing-xxl)');
  });

  it('maps radii to CSS custom property references', () => {
    const tokens = parseTokens(fixture);
    const output = formatTailwind(tokens);

    expect(output).toContain('var(--radius-sm)');
    expect(output).toContain('var(--radius-full)');
  });

  it('maps font families to CSS custom property references', () => {
    const tokens = parseTokens(fixture);
    const output = formatTailwind(tokens);

    expect(output).toContain('var(--font-family)');
    expect(output).toContain('var(--font-display)');
    expect(output).toContain('var(--font-mono)');
  });

  it('includes header comment with theme name and version', () => {
    const tokens = parseTokens(fixture);
    const output = formatTailwind(tokens);

    expect(output).toContain('ravenhelm-dark v1.1.0');
  });
});
