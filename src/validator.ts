import { z, ZodSchema } from 'zod';

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  errors: Record<string, string>;
}

/**
 * Validates a flat env record against a Zod schema or a list of required keys.
 */
export function validateEnv(
  env: Record<string, string | undefined>,
  schema: ZodSchema | string[]
): ValidationResult {
  const missing: string[] = [];
  const errors: Record<string, string> = {};

  if (Array.isArray(schema)) {
    for (const key of schema) {
      if (!env[key]) {
        missing.push(key);
        errors[key] = `Required key "${key}" is missing or empty.`;
      }
    }
    return { valid: missing.length === 0, missing, errors };
  }

  const result = schema.safeParse(env);

  if (result.success) {
    return { valid: true, missing: [], errors: {} };
  }

  const zodErrors = result.error.flatten().fieldErrors;
  for (const [field, messages] of Object.entries(zodErrors)) {
    errors[field] = (messages as string[]).join(', ');
    missing.push(field);
  }

  return { valid: false, missing, errors };
}

/**
 * Throws a descriptive error if validation fails.
 */
export function assertEnv(
  env: Record<string, string | undefined>,
  schema: ZodSchema | string[]
): void {
  const result = validateEnv(env, schema);
  if (!result.valid) {
    const lines = Object.entries(result.errors)
      .map(([k, v]) => `  - ${k}: ${v}`)
      .join('\n');
    throw new Error(`envchain validation failed:\n${lines}`);
  }
}
