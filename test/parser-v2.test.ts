import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseTokens } from '../src/parser.js';
import { resolveTokens, toLegacyTokenFile } from '../src/resolver.js';

const v1Fixture = readFileSync(resolve(import.meta.dirname, 'fixtures/ravenhelm-dark.yaml'), 'utf8');
const v2Fixture = readFileSync(
  resolve(import.meta.dirname, 'fixtures/ravenhelm-operational-black.yaml'),
  'utf8'
);

describe('Token parser v2', () => {
  it('detects v1 token files', () => {
    const tokens = parseTokens(v1Fixture);

    expect(tokens.kind).toBe('v1');
    expect(tokens.name).toBe('ravenhelm-dark');
  });

  it('detects v2 token files', () => {
    const tokens = parseTokens(v2Fixture);

    expect(tokens.kind).toBe('v2');
    expect(tokens.name).toBe('ravenhelm-operational-black');
    expect(tokens.roles.surface.card).toBe('{primitives.color.black_1}');
  });

  it('resolves v2 references recursively', () => {
    const resolved = resolveTokens(parseTokens(v2Fixture));

    expect(resolved.kind).toBe('resolved');
    expect(resolved.sourceKind).toBe('v2');
    expect(resolved.roles.surface.card).toBe('#0A0A0A');
    expect(resolved.components.button.variants.primary.background).toBe('#3B82F6');
    expect(resolved.components.metric_tile.value_typography).toEqual({
      size: 18,
      weight: 600,
      line_height: 26,
      letter_spacing: 0,
    });
  });

  it('adapts v1 files into a resolved v2-like shape', () => {
    const resolved = resolveTokens(parseTokens(v1Fixture));

    expect(resolved.sourceKind).toBe('v1');
    expect(resolved.roles.surface.card).toBe('#12141A');
    expect(resolved.roles.action.primary.background).toBe('#7FA3C8');
    expect(resolved.legacy.colors.background).toBe('#0E1014');
  });

  it('resolves old plain v1 token objects without a kind tag', () => {
    const parsed = parseTokens(v1Fixture);
    const { kind: _kind, ...plainV1 } = parsed;
    const resolved = resolveTokens(plainV1);

    expect(resolved.sourceKind).toBe('v1');
    expect(resolved.roles.surface.card).toBe('#12141A');
  });

  it('derives a legacy token file from resolved v2 roles', () => {
    const legacy = toLegacyTokenFile(resolveTokens(parseTokens(v2Fixture)));

    expect('kind' in legacy).toBe(false);
    expect(legacy.colors.background).toBe('#050508');
    expect(legacy.colors.surface).toBe('#0A0A0A');
    expect(legacy.colors.primary).toBe('#3B82F6');
    expect(legacy.colors.status.success).toBe('#10B981');
  });

  it('throws a clear error for missing token references', () => {
    const tokens = parseTokens(v2Fixture);

    expect(() =>
      resolveTokens({
        ...tokens,
        roles: {
          ...tokens.roles,
          surface: {
            ...tokens.roles.surface,
            card: '{roles.status.missing}',
          },
        },
      })
    ).toThrow('Unresolved token reference: roles.status.missing');
  });

  it('detects circular token references', () => {
    const tokens = parseTokens(v2Fixture);

    expect(() =>
      resolveTokens({
        ...tokens,
        roles: {
          ...tokens.roles,
          status: {
            success: '{roles.status.warning}',
            warning: '{roles.status.success}',
            error: '{primitives.color.red_1}',
          },
        },
      })
    ).toThrow(/Circular token reference:/);
  });
});
