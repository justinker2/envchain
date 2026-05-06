import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { resolveEnvFiles, detectWorkspaces } from './resolver';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envchain-resolver-'));
}

function writeFile(dir: string, name: string, content = ''): void {
  fs.writeFileSync(path.join(dir, name), content);
}

describe('detectWorkspaces', () => {
  it('returns empty array when no package.json exists', () => {
    const dir = makeTempDir();
    expect(detectWorkspaces(dir)).toEqual([]);
  });

  it('returns empty array when package.json has no workspaces', () => {
    const dir = makeTempDir();
    writeFile(dir, 'package.json', JSON.stringify({ name: 'root' }));
    expect(detectWorkspaces(dir)).toEqual([]);
  });

  it('detects array-style workspaces', () => {
    const dir = makeTempDir();
    const pkgs = path.join(dir, 'packages');
    fs.mkdirSync(pkgs);
    fs.mkdirSync(path.join(pkgs, 'app-a'));
    fs.mkdirSync(path.join(pkgs, 'app-b'));
    writeFile(
      dir,
      'package.json',
      JSON.stringify({ workspaces: ['packages/*'] })
    );
    const result = detectWorkspaces(dir);
    expect(result).toContain('packages/app-a');
    expect(result).toContain('packages/app-b');
  });
});

describe('resolveEnvFiles', () => {
  it('resolves root env files even when they do not exist', () => {
    const dir = makeTempDir();
    const result = resolveEnvFiles({ root: dir, workspaces: [], envFiles: ['.env'] });
    expect(result).toHaveLength(1);
    expect(result[0].workspace).toBe('root');
    expect(result[0].exists).toBe(false);
  });

  it('marks existing files correctly', () => {
    const dir = makeTempDir();
    writeFile(dir, '.env', 'FOO=bar');
    const result = resolveEnvFiles({ root: dir, workspaces: [], envFiles: ['.env'] });
    expect(result[0].exists).toBe(true);
  });

  it('includes workspace env files', () => {
    const dir = makeTempDir();
    const ws = path.join(dir, 'packages', 'api');
    fs.mkdirSync(ws, { recursive: true });
    writeFile(ws, '.env', 'API_KEY=secret');
    const result = resolveEnvFiles({
      root: dir,
      workspaces: ['packages/api'],
      envFiles: ['.env'],
    });
    expect(result).toHaveLength(2);
    const wsEntry = result.find((r) => r.workspace === 'packages/api');
    expect(wsEntry?.exists).toBe(true);
  });
});
