import { z } from "zod";
import { buildSchemaFromKeys, EnvSchema } from "./schema";

/**
 * Registry of named env schemas for common workspace roles.
 * Consumers can extend or compose these as needed.
 */
export const schemaPresets: Record<string, EnvSchema> = {
  base: buildSchemaFromKeys(["NODE_ENV"], ["LOG_LEVEL", "DEBUG"]),

  server: buildSchemaFromKeys(
    ["NODE_ENV", "PORT", "HOST"],
    ["LOG_LEVEL", "CORS_ORIGIN"]
  ),

  database: z.object({
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
    DB_POOL_SIZE: z
      .string()
      .regex(/^\d+$/, "DB_POOL_SIZE must be numeric")
      .optional(),
  }),

  auth: z.object({
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().optional(),
    SESSION_SECRET: z.string().min(16).optional(),
  }),
};

/**
 * Merges multiple named presets into a single composed schema.
 * Useful for workspaces that require multiple concerns.
 *
 * @example
 *   const schema = composePresets("base", "server", "database");
 */
export function composePresets(...names: (keyof typeof schemaPresets)[]): EnvSchema {
  if (names.length === 0) {
    throw new Error("composePresets requires at least one preset name");
  }

  const schemas = names.map((name) => {
    const preset = schemaPresets[name];
    if (!preset) throw new Error(`Unknown schema preset: "${name}"`);
    return preset;
  });

  return schemas.reduce((acc, schema) => acc.merge(schema));
}
