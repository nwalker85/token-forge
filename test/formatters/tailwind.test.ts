import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseTokens } from '../../src/parser.js';
import { formatTailwind } from '../../src/formatters/tailwind.js';

const fixture = readFileSync(resolve(import.meta.dirname, '../fixtures/ravenhelm-dark.yaml'), 'utf8');
const v2Fixture = readFileSync(
  resolve(import.meta.dirname, '../fixtures/ravenhelm-operational-black.yaml'),
  'utf8'
);

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

  it('does not add v2 role and state entries for v1 tokens', () => {
    const tokens = parseTokens(fixture);
    const output = formatTailwind(tokens);

    expect(output).not.toContain('surface-card');
    expect(output).not.toContain('agent-running');
  });

  it('adds v2 role and state entries', () => {
    const tokens = parseTokens(v2Fixture);
    const output = formatTailwind(tokens);

    expect(output).toContain('"surface-card": "hsl(var(--rh-surface-card))"');
    expect(output).toContain('"surface-card-muted": "hsl(var(--rh-surface-card-muted))"');
    expect(output).toContain('"border-default": "hsl(var(--rh-border-default))"');
    expect(output).toContain('"border-focus": "hsl(var(--rh-border-focus))"');
    expect(output).toContain('"action-primary-bg": "hsl(var(--rh-action-primary-bg))"');
    expect(output).toContain('"action-primary-fg": "hsl(var(--rh-action-primary-fg))"');
    expect(output).toContain('"agent-running": "hsl(var(--rh-agent-running))"');
    expect(output).toContain('"agent-blocked": "hsl(var(--rh-agent-blocked))"');
    expect(output).toContain('"contract-pending": "hsl(var(--rh-contract-pending))"');
    expect(output).toContain('"runtime-offline": "hsl(var(--rh-runtime-offline))"');
  });

  it('uses custom prefixes for v2 role and state entries', () => {
    const tokens = parseTokens(v2Fixture);
    const output = formatTailwind(tokens, { prefix: '--tf-' });

    expect(output).toContain('"background": "hsl(var(--tf-background))"');
    expect(output).toContain('"xs": "var(--tf-spacing-xs)"');
    expect(output).toContain('"sm": "var(--tf-radius-sm)"');
    expect(output).toContain('"sans": [\n          "var(--tf-font-family)"');
    expect(output).toContain('"surface-card": "hsl(var(--tf-surface-card))"');
    expect(output).toContain('"agent-running": "hsl(var(--tf-agent-running))"');
    expect(output).not.toContain('var(--background)');
    expect(output).not.toContain('--rh-surface-card');
  });
});
