import { z, ZodObject, ZodRawShape } from "zod";

export type EnvSchema = ZodObject<ZodRawShape>;

export interface SchemaValidationResult {
  success: boolean;
  data?: Record<string, string>;
  errors?: Array<{ key: string; message: string }>;
}

/**
 * Validates a flat env record against a Zod schema.
 * Returns structured result instead of throwing.
 */
export function validateWithSchema(
  env: Record<string, string>,
  schema: EnvSchema
): SchemaValidationResult {
  const result = schema.safeParse(env);

  if (result.success) {
    return { success: true, data: result.data as Record<string, string> };
  }

  const errors = result.error.issues.map((issue) => ({
    key: issue.path.join("."),
    message: issue.message,
  }));

  return { success: false, errors };
}

/**
 * Builds a simple string-field Zod schema from a list of required keys.
 * Useful for quick validation without manually writing a schema.
 */
export function buildSchemaFromKeys(
  requiredKeys: string[],
  optionalKeys: string[] = []
): EnvSchema {
  const shape: ZodRawShape = {};

  for (const key of requiredKeys) {
    shape[key] = z.string().min(1, `${key} must not be empty`);
  }

  for (const key of optionalKeys) {
    shape[key] = z.string().optional();
  }

  return z.object(shape);
}
