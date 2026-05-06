import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { mergeEnvFiles, applyToProcess } from './merger';
import { ResolvedEnvFile } from './resolver';

function makeTempEnv(dir: string, name: string, content: string): ResolvedEnvFile {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return { filePath, workspace: 'test', exists: true };
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-merger-'));
}

describe('mergeEnvFiles', () => {
  it('merges keys from multiple files', () => {
    const dir = makeTempDir();
    const files = [
      makeTempEnv(dir, '.env.1', 'FOO=one\nBAR=base'),
      makeTempEnv(dir, '.env.2', 'BAZ=three'),
    ];
    const result = mergeEnvFiles(files);
    expect(result.env).toMatchObject({ FOO: 'one', BAR: 'base', BAZ: 'three' });
  });

  it('override strategy: later files win', () => {
    const dir = makeTempDir();
    const files = [
      makeTempEnv(dir, '.env.a', 'KEY=first'),
      makeTempEnv(dir, '.env.b', 'KEY=second'),
    ];
    const result = mergeEnvFiles(files, { strategy: 'override' });
    expect(result.env.KEY).toBe('second');
  });

  it('preserve strategy: first file wins', () => {
    const dir = makeTempDir();
    const files = [
      makeTempEnv(dir, '.env.a', 'KEY=first'),
      makeTempEnv(dir, '.env.b', 'KEY=second'),
    ];
    const result = mergeEnvFiles(files, { strategy: 'preserve' });
    expect(result.env.KEY).toBe('first');
  });

  it('skips non-existing files', () => {
    const dir = makeTempDir();
    const missing: ResolvedEnvFile = {
      filePath: path.join(dir, '.env.missing'),
      workspace: 'root',
      exists: false,
    };
    const result = mergeEnvFiles([missing]);
    expect(result.env).toEqual({});
    expect(result.sources).toHaveLength(0);
  });

  it('tracks sources with contributed keys', () => {
    const dir = makeTempDir();
    const files = [makeTempEnv(dir, '.env.src', 'A=1\nB=2')];
    const result = mergeEnvFiles(files);
    expect(result.sources[0].keys).toEqual(expect.arrayContaining(['A', 'B']));
  });

  it('returns empty env and sources for an empty file list', () => {
    const result = mergeEnvFiles([]);
    expect(result.env).toEqual({});
    expect(result.sources).toHaveLength(0);
  });
});

describe('applyToProcess', () => {
  it('sets values on process.env', () => {
    const key = '__ENVCHAIN_TEST_APPLY__';
    delete process.env[key];
    applyToProcess({ env: { [key]: 'applied' }, sources: [] });
    expect(process.env[key]).toBe('applied');
    delete process.env[key];
  });

  it('does not overwrite when overwrite=false', () => {
    const key = '__ENVCHAIN_TEST_PRESERVE__';
    process.env[key] = 'original';
    applyToProcess({ env: { [key]: 'new' }, sources: [] }, false);
    expect(process.env[key]).toBe('original');
    delete process.env[key];
  });

  it('sets multiple keys on process.env in a single call', () => {
    const keys = ['__ENVCHAIN_MULTI_A__', '__ENVCHAIN_MULTI_B__', '__ENVCHAIN_MULTI_C__'];
    keys.forEach((k) => delete process.env[k]);
    applyToProcess({ env: { [keys[0]]: 'a', [keys[1]]: 'b', [keys[2]]: 'c' }, sources: [] });
    expect(process.env[keys[0]]).toBe('a');
    expect(process.env[keys[1]]).toBe('b');
    expect(process.env[keys[2]]).toBe('c');
    keys.forEach((k) => delete process.env[k]);
  });
});
