import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadEnvChain } from './loader';

function writeTempEnv(dir: string, filename: string, content: string): string {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('loadEnvChain', () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    // Restore process.env
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  it('loads a single .env file', () => {
    writeTempEnv(tmpDir, '.env', 'FOO=bar\nBAZ=qux');
    const result = loadEnvChain({ cwd: tmpDir, files: ['.env'] });
    expect(result.loaded).toHaveLength(1);
    expect(result.parsed).toEqual({ FOO: 'bar', BAZ: 'qux' });
    expect(process.env.FOO).toBe('bar');
  });

  it('chains multiple files with later files taking precedence', () => {
    writeTempEnv(tmpDir, '.env', 'FOO=base\nSHARED=from-base');
    writeTempEnv(tmpDir, '.env.local', 'FOO=local\nEXTRA=yes');
    const result = loadEnvChain({ cwd: tmpDir, files: ['.env', '.env.local'] });
    expect(result.loaded).toHaveLength(2);
    expect(result.parsed.FOO).toBe('local');
    expect(result.parsed.SHARED).toBe('from-base');
    expect(result.parsed.EXTRA).toBe('yes');
  });

  it('skips missing files without throwing', () => {
    writeTempEnv(tmpDir, '.env', 'KEY=value');
    const result = loadEnvChain({ cwd: tmpDir, files: ['.env', '.env.missing'] });
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]).toContain('.env.missing');
  });

  it('respects override=false by not overwriting existing env vars', () => {
    process.env.EXISTING = 'original';
    writeTempEnv(tmpDir, '.env', 'EXISTING=overwritten');
    loadEnvChain({ cwd: tmpDir, files: ['.env'], override: false });
    expect(process.env.EXISTING).toBe('original');
  });
});
