import type {
  AnyTokenFile,
  PrimitiveValue,
  ResolvedTokenSet,
  TokenKind,
  TokenMap,
  TokenFile,
  V1TokenFile,
  V2TokenFile,
} from './schema.js';

const REF_PATTERN = /^\{([^{}]+)\}$/;

interface V2Source {
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
  legacySource?: TokenFile;
}

export function resolveTokens(tokens: AnyTokenFile): ResolvedTokenSet {
  const source = isV2TokenFile(tokens) ? toV2Source(tokens) : adaptV1ToV2(tokens);
  const root: TokenMap = {
    primitives: source.primitives,
    roles: source.roles,
    states: source.states,
    density: source.density,
    components: source.components,
  };
  if (source.projections) root.projections = source.projections;
  const resolver = createResolver(root);

  const primitives = resolver.resolveSection('primitives') as TokenMap;
  const roles = resolver.resolveSection('roles') as TokenMap;
  const states = resolver.resolveSection('states') as TokenMap;
  const density = resolver.resolveSection('density') as TokenMap;
  const components = resolver.resolveSection('components') as TokenMap;
  const projections = source.projections
    ? (resolver.resolveSection('projections') as TokenMap)
    : undefined;

  const resolved: Omit<ResolvedTokenSet, 'legacy'> = {
    kind: 'resolved',
    sourceKind: source.sourceKind,
    name: source.name,
    version: source.version,
    description: source.description,
    primitives,
    roles,
    states,
    density,
    components,
    projections,
  };

  return {
    ...resolved,
    legacy:
      source.sourceKind === 'v1' && source.legacySource
        ? toLegacyShape(source.legacySource)
        : toLegacyTokenFile(resolved),
  };
}

export function toLegacyTokenFile(resolved: Omit<ResolvedTokenSet, 'legacy'> | ResolvedTokenSet): TokenFile {
  const roles = resolved.roles;
  const primitives = resolved.primitives;
  const surface = tokenMapAt(roles, 'surface');
  const text = tokenMapAt(roles, 'text');
  const border = tokenMapAt(roles, 'border');
  const action = tokenMapAt(roles, 'action');
  const primaryAction = tokenMapAt(action, 'primary');
  const status = tokenMapAt(roles, 'status');
  const data = tokenMapAt(roles, 'data');
  const primitiveSpacing = tokenMapAt(primitives, 'spacing');
  const primitiveRadii = tokenMapAt(primitives, 'radii');
  const primitiveTypography = tokenMapAt(primitives, 'typography');
  const primitiveEffects = tokenMapAt(primitives, 'effects');
  const glassSubtle = tokenMapAt(primitiveEffects, 'glass_subtle');

  return {
    name: resolved.name,
    version: resolved.version,
    description: resolved.description,
    colors: {
      background: stringAt(surface, 'canvas', '#000000'),
      surface: stringAt(surface, 'card', stringAt(surface, 'panel', '#000000')),
      surface_variant: stringAt(surface, 'card_muted', stringAt(surface, 'sidebar', '#000000')),
      edge: stringAt(border, 'default', stringAt(border, 'subtle', '#000000')),
      edge_light: stringAt(border, 'strong', stringAt(border, 'default', '#000000')),
      primary: stringAt(primaryAction, 'background', '#000000'),
      primary_light: stringAt(primaryAction, 'hover', stringAt(primaryAction, 'background', '#000000')),
      tertiary: stringAt(data, 'chart_4', stringAt(primaryAction, 'background', '#000000')),
      tertiary_light: stringAt(data, 'chart_4', stringAt(primaryAction, 'background', '#000000')),
      text: {
        primary: stringAt(text, 'primary', '#FFFFFF'),
        secondary: stringAt(text, 'secondary', '#FFFFFF'),
        muted: stringAt(text, 'muted', '#FFFFFF'),
      },
      glass: {
        background: stringAt(glassSubtle, 'background', stringAt(surface, 'panel', '#000000')),
        border: stringAt(glassSubtle, 'border', stringAt(border, 'subtle', '#000000')),
        highlight: 'rgba(255,255,255,0.05)',
      },
      status: {
        success: stringAt(status, 'success', '#000000'),
        warning: stringAt(status, 'warning', '#000000'),
        error: stringAt(status, 'error', '#000000'),
        info: stringAt(status, 'info', stringAt(primaryAction, 'background', '#000000')),
      },
      canvas: {
        background: stringAt(surface, 'canvas', '#000000'),
        grid: stringAt(surface, 'card_muted', stringAt(border, 'default', '#000000')),
      },
    },
    spacing: spacingFromPrimitives(primitiveSpacing),
    radii: radiiFromPrimitives(primitiveRadii),
    typography: typographyFromPrimitives(primitiveTypography),
    glass: {
      blur_sigma: numberAt(glassSubtle, 'blur', 0),
      border_width: 1,
    },
    components: {},
  };
}

function createResolver(root: TokenMap) {
  const cache = new Map<string, PrimitiveValue>();
  const resolving = new Set<string>();

  const resolvePath = (path: string): PrimitiveValue => {
    if (cache.has(path)) return clonePrimitive(cache.get(path)!);
    if (resolving.has(path)) {
      throw new Error(`Circular token reference: ${[...resolving, path].join(' -> ')}`);
    }

    const raw = getPath(root, path);
    if (raw === undefined) {
      throw new Error(`Unresolved token reference: ${path}`);
    }

    resolving.add(path);
    let resolved: PrimitiveValue;
    try {
      resolved = resolveValue(raw, path);
    } finally {
      resolving.delete(path);
    }
    cache.set(path, clonePrimitive(resolved));
    return clonePrimitive(resolved);
  };

  const resolveValue = (value: PrimitiveValue, path: string): PrimitiveValue => {
    if (typeof value === 'string') {
      const ref = value.match(REF_PATTERN);
      return ref ? resolvePath(ref[1]) : value;
    }

    if (Array.isArray(value)) {
      return value.map((item, index) => resolveValue(item, `${path}.${index}`));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [key, resolveValue(nested, `${path}.${key}`)])
      );
    }

    return value;
  };

  return {
    resolveSection(section: string): PrimitiveValue {
      return resolvePath(section);
    },
  };
}

function adaptV1ToV2(tokens: TokenFile | V1TokenFile): V2Source {
  return {
    sourceKind: 'v1',
    name: tokens.name,
    version: tokens.version,
    description: tokens.description,
    primitives: {
      color: {
        background: tokens.colors.background,
        surface: tokens.colors.surface,
        surface_variant: tokens.colors.surface_variant ?? tokens.colors.surface,
        edge: tokens.colors.edge ?? tokens.colors.glass.border,
        edge_light: tokens.colors.edge_light ?? tokens.colors.edge ?? tokens.colors.glass.border,
        primary: tokens.colors.primary,
        primary_light: tokens.colors.primary_light ?? tokens.colors.primary,
        primary_glow: tokens.colors.primary_glow ?? tokens.colors.primary,
        tertiary: tokens.colors.tertiary ?? tokens.colors.primary,
        tertiary_light: tokens.colors.tertiary_light ?? tokens.colors.tertiary ?? tokens.colors.primary,
        text_primary: tokens.colors.text.primary,
        text_secondary: tokens.colors.text.secondary,
        text_muted: tokens.colors.text.muted,
        status_success: tokens.colors.status.success,
        status_warning: tokens.colors.status.warning,
        status_error: tokens.colors.status.error,
        status_info: tokens.colors.status.info ?? tokens.colors.primary,
      },
      spacing: tokens.spacing as unknown as TokenMap,
      radii: tokens.radii as unknown as TokenMap,
      typography: tokens.typography as unknown as TokenMap,
      glass: tokens.glass as unknown as TokenMap,
    },
    roles: {
      surface: {
        canvas: tokens.colors.canvas?.background ?? tokens.colors.background,
        panel: tokens.colors.surface,
        card: tokens.colors.surface,
        card_muted: tokens.colors.surface_variant ?? tokens.colors.surface,
        sidebar: tokens.colors.surface_variant ?? tokens.colors.surface,
        rail: tokens.colors.surface,
        overlay: tokens.colors.surface,
        input: tokens.colors.surface,
      },
      text: tokens.colors.text as unknown as TokenMap,
      border: {
        subtle: tokens.colors.glass.border,
        default: tokens.colors.edge ?? tokens.colors.glass.border,
        strong: tokens.colors.edge_light ?? tokens.colors.edge ?? tokens.colors.glass.border,
        focus: tokens.colors.primary,
      },
      action: {
        primary: {
          background: tokens.colors.primary,
          foreground: tokens.colors.text.primary,
          hover: tokens.colors.primary_light ?? tokens.colors.primary,
        },
        secondary: {
          background: tokens.colors.surface_variant ?? tokens.colors.surface,
          foreground: tokens.colors.text.primary,
          border: tokens.colors.edge ?? tokens.colors.glass.border,
        },
        ghost: {
          background: 'transparent',
          foreground: tokens.colors.text.secondary,
          hover_background: tokens.colors.surface_variant ?? tokens.colors.surface,
        },
        destructive: {
          background: tokens.colors.status.error,
          foreground: tokens.colors.text.primary,
        },
      },
      status: tokens.colors.status as unknown as TokenMap,
      data: {
        chart_1: tokens.colors.primary,
        chart_2: tokens.colors.status.success,
        chart_3: tokens.colors.status.warning,
        chart_4: tokens.colors.tertiary ?? tokens.colors.primary,
        chart_5: tokens.colors.status.error,
      },
    },
    states: {
      agent: {
        running: { color: tokens.colors.status.success, label: 'Running' },
        blocked: { color: tokens.colors.status.warning, label: 'Blocked' },
      },
      contract: {
        pending: { color: tokens.colors.status.warning, label: 'Pending' },
      },
      runtime: {
        offline: { color: tokens.colors.status.error, label: 'Offline' },
      },
    },
    density: {
      compact: {
        control_height: 32,
        card_padding: tokens.spacing.md,
        row_height: 36,
        gap: tokens.spacing.sm,
      },
    },
    components: (tokens.components ?? {}) as TokenMap,
    legacySource: tokens,
  };
}

function toV2Source(tokens: V2TokenFile): V2Source {
  return {
    sourceKind: 'v2',
    name: tokens.name,
    version: tokens.version,
    description: tokens.description,
    primitives: tokens.primitives,
    roles: tokens.roles,
    states: tokens.states,
    density: tokens.density,
    components: tokens.components,
    projections: tokens.projections,
  };
}

function isV2TokenFile(tokens: AnyTokenFile): tokens is V2TokenFile {
  return (
    ('kind' in tokens && tokens.kind === 'v2') ||
    ('primitives' in tokens &&
      'roles' in tokens &&
      'states' in tokens &&
      'density' in tokens &&
      'components' in tokens)
  );
}

function toLegacyShape(tokens: TokenFile | V1TokenFile): TokenFile {
  const { kind: _kind, ...legacy } = tokens as V1TokenFile;
  return cloneValue(legacy);
}

function getPath(root: TokenMap, path: string): PrimitiveValue | undefined {
  return path.split('.').reduce<PrimitiveValue | undefined>((current, segment) => {
    if (current && typeof current === 'object' && !Array.isArray(current) && segment in current) {
      return current[segment];
    }
    return undefined;
  }, root);
}

function tokenMapAt(map: TokenMap, key: string): TokenMap {
  const value = map[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function stringAt(map: TokenMap, key: string, fallback: string): string {
  const value = map[key];
  return typeof value === 'string' ? value : fallback;
}

function numberAt(map: TokenMap, key: string, fallback: number): number {
  const value = map[key];
  return typeof value === 'number' ? value : fallback;
}

function spacingFromPrimitives(spacing: TokenMap): V1TokenFile['spacing'] {
  return {
    xs: numberAt(spacing, 'xs', numberAt(spacing, '2', 4)),
    sm: numberAt(spacing, 'sm', numberAt(spacing, '4', 8)),
    md: numberAt(spacing, 'md', numberAt(spacing, '5', 12)),
    lg: numberAt(spacing, 'lg', numberAt(spacing, '6', 16)),
    xl: numberAt(spacing, 'xl', numberAt(spacing, '8', 24)),
    xxl: numberAt(spacing, 'xxl', numberAt(spacing, '9', 32)),
    xxxl: numberAt(spacing, 'xxxl', numberAt(spacing, '10', 40)),
  };
}

function radiiFromPrimitives(radii: TokenMap): V1TokenFile['radii'] {
  return {
    sm: numberAt(radii, 'sm', 4),
    md: numberAt(radii, 'md', 6),
    lg: numberAt(radii, 'lg', 8),
    xl: numberAt(radii, 'xl', numberAt(radii, 'lg', 8)),
    full: numberAt(radii, 'full', 999),
  };
}

function typographyFromPrimitives(typography: TokenMap): V1TokenFile['typography'] {
  const family = tokenMapAt(typography, 'family');
  const scale = tokenMapAt(typography, 'scale');
  const scales = Object.fromEntries(
    Object.entries(scale).map(([key, value]) => {
      const typeScale = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      return [
        key,
        {
          size: numberAt(typeScale, 'size', 14),
          weight: numberAt(typeScale, 'weight', 400),
          spacing: numberAt(typeScale, 'letter_spacing', 0),
        },
      ];
    })
  );

  return {
    family: stringAt(family, 'sans', stringAt(typography, 'family', 'Inter')),
    mono_family: stringAt(family, 'mono', 'JetBrains Mono'),
    scales,
  };
}

function clonePrimitive<T extends PrimitiveValue>(value: T): T {
  return cloneValue(value);
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
