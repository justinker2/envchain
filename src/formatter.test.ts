import { describe, it, expect } from 'bun:test';
import {
  isSensitiveKey,
  maskValue,
  formatEnv,
  serializeEnv,
} from './formatter';

describe('isSensitiveKey', () => {
  it('detects common sensitive key patterns', () => {
    expect(isSensitiveKey('DB_PASSWORD')).toBe(true);
    expect(isSensitiveKey('API_SECRET')).toBe(true);
    expect(isSensitiveKey('AUTH_TOKEN')).toBe(true);
    expect(isSensitiveKey('PRIVATE_KEY')).toBe(true);
  });

  it('returns false for non-sensitive keys', () => {
    expect(isSensitiveKey('PORT')).toBe(false);
    expect(isSensitiveKey('NODE_ENV')).toBe(false);
    expect(isSensitiveKey('APP_NAME')).toBe(false);
  });

  it('supports custom mask keys', () => {
    expect(isSensitiveKey('MY_PIN', ['PIN'])).toBe(true);
    expect(isSensitiveKey('DB_PASSWORD', ['PIN'])).toBe(false);
  });
});

describe('maskValue', () => {
  it('masks middle characters of a long value', () => {
    const result = maskValue('supersecret123');
    expect(result).toMatch(/^su\*+23$/);
  });

  it('fully masks short values', () => {
    expect(maskValue('abc')).toBe('***');
    expect(maskValue('ab')).toBe('**');
  });

  it('supports custom mask character', () => {
    const result = maskValue('hello_world', '#');
    expect(result).toMatch(/^he#+ld$/);
  });
});

describe('formatEnv', () => {
  const env = {
    PORT: '3000',
    DB_PASSWORD: 'hunter2',
    NODE_ENV: 'development',
  };

  it('masks sensitive keys by default', () => {
    const output = formatEnv(env);
    expect(output).toContain('PORT=3000');
    expect(output).not.toContain('DB_PASSWORD=hunter2');
    expect(output).toContain('DB_PASSWORD=');
  });

  it('shows all values when mask is disabled', () => {
    const output = formatEnv(env, { mask: false });
    expect(output).toContain('DB_PASSWORD=hunter2');
  });

  it('applies a prefix to each line', () => {
    const output = formatEnv({ PORT: '3000' }, { prefix: '  ' });
    expect(output).toBe('  PORT=3000');
  });
});

describe('serializeEnv', () => {
  it('serializes simple key-value pairs', () => {
    const result = serializeEnv({ PORT: '3000', NODE_ENV: 'test' });
    expect(result).toContain('PORT=3000');
    expect(result).toContain('NODE_ENV=test');
  });

  it('quotes values with spaces', () => {
    const result = serializeEnv({ APP_NAME: 'my app' });
    expect(result).toBe('APP_NAME="my app"');
  });

  it('escapes double quotes inside values', () => {
    const result = serializeEnv({ GREETING: 'say "hello"' });
    expect(result).toContain('\\"hello\\"');
  });
});
