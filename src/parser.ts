import { parse } from 'yaml';
import type { ParsedTokenFile } from './schema.js';

/**
 * Parse a YAML string into a TokenFile.
 *
 * Validates required top-level keys and returns the parsed structure.
 * Color values, spacing, etc. are kept as raw strings/numbers — formatters
 * handle conversion to platform-specific formats.
 */
export function parseTokens(yamlContent: string): ParsedTokenFile {
  const raw = parse(yamlContent) as Record<string, unknown>;

  const baseRequired = ['name', 'version'] as const;
  const missingBase = baseRequired.filter((key) => !(key in raw));
  if (missingBase.length > 0) {
    throw new Error(`Missing required keys in token YAML: ${missingBase.join(', ')}`);
  }

  const v1Required = ['colors', 'spacing', 'radii', 'typography', 'glass'] as const;
  const v2Required = ['primitives', 'roles', 'states', 'density', 'components'] as const;
  const isV1 = v1Required.every((key) => key in raw);
  const isV2 = v2Required.every((key) => key in raw);

  if (isV1) {
    return { ...raw, kind: 'v1' } as unknown as ParsedTokenFile;
  }

  if (isV2) {
    return { ...raw, kind: 'v2' } as unknown as ParsedTokenFile;
  }

  const missingV1 = v1Required.filter((key) => !(key in raw));
  const missingV2 = v2Required.filter((key) => !(key in raw));
  throw new Error(
    `Missing required keys in token YAML: v1 missing ${missingV1.join(', ')}; v2 missing ${missingV2.join(', ')}`
  );
}
