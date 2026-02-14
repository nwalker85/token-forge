import { parse } from 'yaml';
import type { TokenFile } from './schema.js';

/**
 * Parse a YAML string into a TokenFile.
 *
 * Validates required top-level keys and returns the parsed structure.
 * Color values, spacing, etc. are kept as raw strings/numbers — formatters
 * handle conversion to platform-specific formats.
 */
export function parseTokens(yamlContent: string): TokenFile {
  const raw = parse(yamlContent) as Record<string, unknown>;

  const required = ['name', 'version', 'colors', 'spacing', 'radii', 'typography', 'glass'] as const;
  const missing = required.filter((key) => !(key in raw));
  if (missing.length > 0) {
    throw new Error(`Missing required keys in token YAML: ${missing.join(', ')}`);
  }

  return raw as unknown as TokenFile;
}
