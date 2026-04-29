export type TokenKind = 'v1' | 'v2';

export type PrimitiveValue =
  | string
  | number
  | boolean
  | null
  | PrimitiveValue[]
  | { [key: string]: PrimitiveValue };

export type TokenMap = Record<string, PrimitiveValue>;

export type AnyTokenFile = TokenFile | V1TokenFile | V2TokenFile;
export type ParsedTokenFile = V1TokenFile | V2TokenFile;

/**
 * Token Forge v1 schema — mirrors Loki's YAML token structure.
 */
export interface TokenFile {
  name: string;
  version: string;
  description?: string;
  colors: ColorTokens;
  spacing: SpacingTokens;
  radii: RadiiTokens;
  typography: TypographyTokens;
  glass: GlassTokens;
  entity_types?: Record<string, EntityTypeToken>;
  components?: Record<string, unknown>;
}

export type V1TokenFile = TokenFile & { kind: 'v1' };

export interface V2TokenFile {
  kind: 'v2';
  name: string;
  version: string;
  description?: string;
  primitives: TokenMap;
  roles: TokenMap;
  states: TokenMap;
  density: TokenMap;
  components: TokenMap;
  projections?: TokenMap;
}

export interface ResolvedTokenSet {
  kind: 'resolved';
  sourceKind: TokenKind;
  name: string;
  version: string;
  description?: string;
  primitives: TokenMap;
  roles: TokenMap;
  states: TokenMap;
  density: TokenMap;
  components: TokenMap;
  projections?: TokenMap;
  legacy: TokenFile;
}

export interface ColorTokens {
  background: string;
  surface: string;
  surface_variant?: string;
  edge?: string;
  edge_light?: string;
  primary: string;
  primary_light?: string;
  primary_glow?: string;
  tertiary?: string;
  tertiary_light?: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  glass: {
    background: string;
    border: string;
    highlight: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info?: string;
  };
  canvas?: {
    background: string;
    grid: string;
  };
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl?: number;
}

export interface RadiiTokens {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface TypographyTokens {
  family: string;
  display_family?: string;
  mono_family?: string;
  scales?: Record<string, TypeScale>;
}

export interface TypeScale {
  size: number;
  weight: number;
  spacing?: number;
}

export interface GlassTokens {
  blur_sigma: number;
  border_width: number;
}

export interface EntityTypeToken {
  color: string;
  icon: string;
  category: string;
}
