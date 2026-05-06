import { loadEnvChain } from './loader';
import { validateEnv, assertEnv, ValidationResult } from './validator';
import type { ZodSchema } from 'zod';

export interface EnvChainOptions {
  files?: string[];
  cwd?: string;
  required?: string[] | ZodSchema;
  strict?: boolean;
}

export interface EnvChainResult {
  env: Record<string, string | undefined>;
  validation?: ValidationResult;
}

/**
 * Initialize envchain: load .env files in order and optionally validate the result.
 */
export function init(options: EnvChainOptions = {}): EnvChainResult {
  const {
    files = ['.env', '.env.local'],
    cwd = process.cwd(),
    required,
    strict = false,
  } = options;

  const env = loadEnvChain({ files, cwd });

  if (!required) {
    return { env };
  }

  if (strict) {
    assertEnv(env, required as string[] | ZodSchema);
    return { env };
  }

  const validation = validateEnv(env, required as string[] | ZodSchema);
  return { env, validation };
}

export { loadEnvChain } from './loader';
export { validateEnv, assertEnv } from './validator';
export type { ValidationResult } from './validator';
