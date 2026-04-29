import { resolveTokens } from '../resolver.js';
import type { AnyTokenFile } from '../schema.js';

export type JsonFormatMode = 'raw' | 'resolved' | 'legacy';

export function formatJson(tokens: AnyTokenFile, mode: JsonFormatMode): string {
  const resolved = mode === 'raw' ? undefined : resolveTokens(tokens);
  const value =
    mode === 'raw'
      ? rawJsonValue(tokens)
      : mode === 'resolved'
        ? resolved
        : resolved!.legacy;

  return `${JSON.stringify(value, null, 2)}\n`;
}

function rawJsonValue(tokens: AnyTokenFile): AnyTokenFile {
  if ('kind' in tokens && tokens.kind === 'v1') {
    const { kind: _kind, ...legacy } = tokens;
    return legacy;
  }

  return tokens;
}
