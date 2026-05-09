import { isSensitiveKey, maskValue } from "./formatter.ts";

export interface RedactOptions {
  /** Keys to always redact regardless of name heuristics */
  forceRedact?: string[];
  /** Keys to never redact even if name looks sensitive */
  allowList?: string[];
  /** Replacement string for redacted values */
  placeholder?: string;
}

export type RedactedEnv = Record<string, string>;

/**
 * Returns a new env map with sensitive values replaced by a placeholder.
 */
export function redactEnv(
  env: Record<string, string>,
  options: RedactOptions = {}
): RedactedEnv {
  const {
    forceRedact = [],
    allowList = [],
    placeholder = "[REDACTED]",
  } = options;

  const forceSet = new Set(forceRedact.map((k) => k.toUpperCase()));
  const allowSet = new Set(allowList.map((k) => k.toUpperCase()));

  const result: RedactedEnv = {};

  for (const [key, value] of Object.entries(env)) {
    const upper = key.toUpperCase();
    if (allowSet.has(upper)) {
      result[key] = value;
    } else if (forceSet.has(upper) || isSensitiveKey(key)) {
      result[key] = placeholder;
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Redacts a single value by key, returning the masked string or the
 * original value when the key is not considered sensitive.
 */
export function redactValue(
  key: string,
  value: string,
  options: RedactOptions = {}
): string {
  const { forceRedact = [], allowList = [], placeholder = "[REDACTED]" } =
    options;

  const upper = key.toUpperCase();
  const forceSet = new Set(forceRedact.map((k) => k.toUpperCase()));
  const allowSet = new Set(allowList.map((k) => k.toUpperCase()));

  if (allowSet.has(upper)) return value;
  if (forceSet.has(upper) || isSensitiveKey(key)) return placeholder;
  return value;
}

/**
 * Serialize a redacted env map to a dotenv-style string, masking
 * sensitive values with partial visibility (e.g. "ab***").
 */
export function serializeRedacted(
  env: Record<string, string>,
  options: RedactOptions = {}
): string {
  const { forceRedact = [], allowList = [] } = options;
  const forceSet = new Set(forceRedact.map((k) => k.toUpperCase()));
  const allowSet = new Set(allowList.map((k) => k.toUpperCase()));

  return Object.entries(env)
    .map(([key, value]) => {
      const upper = key.toUpperCase();
      let display = value;
      if (!allowSet.has(upper) && (forceSet.has(upper) || isSensitiveKey(key))) {
        display = maskValue(value);
      }
      return `${key}=${display}`;
    })
    .join("\n");
}
