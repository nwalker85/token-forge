/**
 * Token schema interfaces — mirrors Loki's YAML token structure.
 *
 * These types describe the shape of a parsed theme YAML file.
 * Optional fields match keys that may or may not appear in a given theme.
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
