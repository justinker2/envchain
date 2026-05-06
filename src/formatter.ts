/**
 * formatter.ts
 * Utilities for formatting and serializing env variable sets
 * for display, debugging, and export purposes.
 */

export interface FormatOptions {
  mask?: boolean;
  maskChar?: string;
  maskKeys?: string[];
  prefix?: string;
}

const DEFAULT_SENSITIVE_KEYS = [
  'PASSWORD',
  'SECRET',
  'TOKEN',
  'KEY',
  'PRIVATE',
  'AUTH',
  'CREDENTIAL',
];

/**
 * Determines whether a key should be masked based on options and defaults.
 */
export function isSensitiveKey(key: string, maskKeys?: string[]): boolean {
  const patterns = maskKeys ?? DEFAULT_SENSITIVE_KEYS;
  const upper = key.toUpperCase();
  return patterns.some((pattern) => upper.includes(pattern));
}

/**
 * Masks the value of a sensitive env variable.
 */
export function maskValue(value: string, maskChar = '*'): string {
  if (value.length <= 4) return maskChar.repeat(value.length);
  return value.slice(0, 2) + maskChar.repeat(value.length - 4) + value.slice(-2);
}

/**
 * Formats a record of env variables into a human-readable string.
 */
export function formatEnv(
  env: Record<string, string>,
  options: FormatOptions = {}
): string {
  const { mask = true, maskChar = '*', maskKeys, prefix = '' } = options;
  const lines: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    const shouldMask = mask && isSensitiveKey(key, maskKeys);
    const displayValue = shouldMask ? maskValue(value, maskChar) : value;
    lines.push(`${prefix}${key}=${displayValue}`);
  }

  return lines.join('\n');
}

/**
 * Serializes a record of env variables to a .env file string.
 */
export function serializeEnv(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([key, value]) => {
      const needsQuotes = /\s|#|"/.test(value);
      const escaped = value.replace(/"/g, '\\"');
      return needsQuotes ? `${key}="${escaped}"` : `${key}=${value}`;
    })
    .join('\n');
}
