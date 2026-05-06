import { describe, it, expect } from 'vitest';
import { interpolateValue, interpolateEnv } from './interpolator';

describe('interpolateValue', () => {
  it('returns plain strings unchanged', () => {
    expect(interpolateValue('hello world', {})).toBe('hello world');
  });

  it('resolves ${VAR} syntax', () => {
    expect(interpolateValue('Hello ${NAME}', { NAME: 'Alice' })).toBe('Hello Alice');
  });

  it('resolves $VAR bare syntax', () => {
    expect(interpolateValue('Hello $NAME', { NAME: 'Bob' })).toBe('Hello Bob');
  });

  it('resolves ${VAR:-default} with defined variable', () => {
    expect(interpolateValue('${PORT:-3000}', { PORT: '8080' })).toBe('8080');
  });

  it('resolves ${VAR:-default} with missing variable', () => {
    expect(interpolateValue('${PORT:-3000}', {})).toBe('3000');
  });

  it('leaves unresolved references intact in non-strict mode', () => {
    expect(interpolateValue('${MISSING}', {})).toBe('${MISSING}');
  });

  it('throws on missing variable in strict mode', () => {
    expect(() =>
      interpolateValue('${MISSING}', {}, { strict: true })
    ).toThrow('[envchain] Interpolation failed: variable "MISSING" is not defined');
  });

  it('resolves multiple references in one value', () => {
    const env = { HOST: 'localhost', PORT: '5432' };
    expect(interpolateValue('${HOST}:${PORT}', env)).toBe('localhost:5432');
  });
});

describe('interpolateEnv', () => {
  it('interpolates all values in a record', () => {
    const env = { GREETING: 'Hello ${NAME}', NAME: 'World' };
    const result = interpolateEnv(env);
    expect(result.GREETING).toBe('Hello World');
  });

  it('supports self-referential resolution (later keys see earlier resolved values)', () => {
    const env = { BASE_URL: 'http://${HOST}', HOST: 'example.com', FULL: '${BASE_URL}/api' };
    const result = interpolateEnv(env);
    expect(result.FULL).toBe('http://example.com/api');
  });

  it('uses baseEnv for resolution', () => {
    const env = { DSN: 'postgres://${DB_USER}:${DB_PASS}@localhost/db' };
    const base = { DB_USER: 'admin', DB_PASS: 'secret' };
    const result = interpolateEnv(env, base);
    expect(result.DSN).toBe('postgres://admin:secret@localhost/db');
  });

  it('does not mutate the original env object', () => {
    const env = { KEY: '${VAL}', VAL: 'resolved' };
    const original = { ...env };
    interpolateEnv(env);
    expect(env).toEqual(original);
  });

  it('respects strict mode across all values', () => {
    const env = { A: '${UNDEFINED_VAR}' };
    expect(() => interpolateEnv(env, {}, { strict: true })).toThrow();
  });
});
