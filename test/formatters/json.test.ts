import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseTokens } from '../../src/parser.js';
import { formatJson } from '../../src/formatters/json.js';

const fixture = readFileSync(
  resolve(import.meta.dirname, '../fixtures/ravenhelm-operational-black.yaml'),
  'utf8'
);
const v1Fixture = readFileSync(resolve(import.meta.dirname, '../fixtures/ravenhelm-dark.yaml'), 'utf8');

describe('JSON formatter', () => {
  it('formats raw token files', () => {
    const parsed = JSON.parse(formatJson(parseTokens(fixture), 'raw'));

    expect(parsed.kind).toBe('v2');
    expect(parsed.roles.surface.card).toBe('{primitives.color.black_1}');
  });

  it('formats resolved token files', () => {
    const parsed = JSON.parse(formatJson(parseTokens(fixture), 'resolved'));

    expect(parsed.kind).toBe('resolved');
    expect(parsed.roles.surface.card).toBe('#0A0A0A');
    expect(parsed.legacy.colors.primary).toBe('#3B82F6');
  });

  it('formats legacy token files', () => {
    const parsed = JSON.parse(formatJson(parseTokens(fixture), 'legacy'));

    expect('kind' in parsed).toBe(false);
    expect(parsed.colors.background).toBe('#050508');
    expect(parsed.colors.status.warning).toBe('#F59E0B');
  });

  it('formats raw parsed v1 files with the old untagged JSON shape', () => {
    const parsed = JSON.parse(formatJson(parseTokens(v1Fixture), 'raw'));

    expect('kind' in parsed).toBe(false);
    expect(parsed.colors.background).toBe('#0E1014');
  });

  it('formats legacy v1 files without losing v1-only fields', () => {
    const parsed = JSON.parse(formatJson(parseTokens(v1Fixture), 'legacy'));

    expect('kind' in parsed).toBe(false);
    expect(parsed.entity_types.host).toEqual({
      color: '#1E3A5F',
      icon: 'dns',
      category: 'infrastructure',
    });
    expect(parsed.typography.display_family).toBe('Plus Jakarta Sans');
    expect(parsed.colors.primary_glow).toBe('#89C7DE');
    expect(parsed.components.entity_card).toEqual({
      border_radius: 'lg',
      padding: 'lg',
    });
  });
});
