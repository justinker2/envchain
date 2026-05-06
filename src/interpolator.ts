/**
 * interpolator.ts
 * Handles variable interpolation within .env file values.
 * Supports ${VAR} and $VAR syntax, with optional default values via ${VAR:-default}.
 */

export interface InterpolationOptions {
  /** Allow referencing variables defined earlier in the same env object */
  selfReferential?: boolean;
  /** Throw on missing variables instead of leaving them unresolved */
  strict?: boolean;
}

const INTERPOLATION_RE = /\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/gi;

/**
 * Resolve a single variable reference, supporting ${VAR:-default} syntax.
 */
function resolveReference(
  ref: string,
  env: Record<string, string>,
  strict: boolean
): string {
  const [key, defaultValue] = ref.split(':-');
  const trimmedKey = key.trim();

  if (trimmedKey in env) {
    return env[trimmedKey];
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

  if (strict) {
    throw new Error(`[envchain] Interpolation failed: variable "${trimmedKey}" is not defined`);
  }

  return `\${${ref}}`;
}

/**
 * Interpolate all variable references in a single string value.
 */
export function interpolateValue(
  value: string,
  env: Record<string, string>,
  options: InterpolationOptions = {}
): string {
  const { strict = false } = options;

  return value.replace(INTERPOLATION_RE, (match, braced?: string, bare?: string) => {
    const ref = braced ?? bare ?? '';
    return resolveReference(ref, env, strict);
  });
}

/**
 * Interpolate all values in an env record.
 * When selfReferential is true, variables resolved earlier are available to later ones.
 */
export function interpolateEnv(
  env: Record<string, string>,
  baseEnv: Record<string, string> = {},
  options: InterpolationOptions = {}
): Record<string, string> {
  const { selfReferential = true } = options;
  const context: Record<string, string> = { ...baseEnv };
  const result: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(env)) {
    const resolved = interpolateValue(rawValue, context, options);
    result[key] = resolved;
    if (selfReferential) {
      context[key] = resolved;
    }
  }

  return result;
}
