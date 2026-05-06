import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateEnv, assertEnv } from './validator';

describe('validateEnv — array mode', () => {
  it('returns valid when all required keys are present', () => {
    const env = { DATABASE_URL: 'postgres://localhost/db', API_KEY: 'secret' };
    const result = validateEnv(env, ['DATABASE_URL', 'API_KEY']);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('reports missing keys', () => {
    const env = { DATABASE_URL: 'postgres://localhost/db' };
    const result = validateEnv(env, ['DATABASE_URL', 'API_KEY']);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('API_KEY');
    expect(result.errors['API_KEY']).toMatch(/missing/);
  });
});

describe('validateEnv — zod schema mode', () => {
  const schema = z.object({
    PORT: z.string().regex(/^\d+$/, 'Must be a number string'),
    NODE_ENV: z.enum(['development', 'production', 'test']),
  });

  it('returns valid for a correct env object', () => {
    const env = { PORT: '3000', NODE_ENV: 'production' };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(true);
  });

  it('returns errors for invalid values', () => {
    const env = { PORT: 'abc', NODE_ENV: 'staging' };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(false);
    expect(result.errors['PORT']).toBeDefined();
    expect(result.errors['NODE_ENV']).toBeDefined();
  });
});

describe('assertEnv', () => {
  it('does not throw when env is valid', () => {
    expect(() => assertEnv({ TOKEN: 'abc' }, ['TOKEN'])).not.toThrow();
  });

  it('throws with a descriptive message on failure', () => {
    expect(() => assertEnv({}, ['TOKEN', 'SECRET'])).toThrowError(
      /envchain validation failed/
    );
  });
});
