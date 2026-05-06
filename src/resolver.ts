import * as path from 'path';
import * as fs from 'fs';

export interface ResolveOptions {
  root?: string;
  workspaces?: string[];
  envFiles?: string[];
}

export interface ResolvedEnvFile {
  filePath: string;
  workspace: string;
  exists: boolean;
}

const DEFAULT_ENV_FILES = ['.env', '.env.local', '.env.production', '.env.development'];

/**
 * Resolves env file paths across monorepo workspaces.
 */
export function resolveEnvFiles(options: ResolveOptions = {}): ResolvedEnvFile[] {
  const root = options.root ?? process.cwd();
  const workspaces = options.workspaces ?? detectWorkspaces(root);
  const envFiles = options.envFiles ?? DEFAULT_ENV_FILES;

  const resolved: ResolvedEnvFile[] = [];

  // Always include root-level env files first
  for (const envFile of envFiles) {
    const filePath = path.resolve(root, envFile);
    resolved.push({
      filePath,
      workspace: 'root',
      exists: fs.existsSync(filePath),
    });
  }

  // Include workspace-level env files
  for (const workspace of workspaces) {
    const workspaceDir = path.resolve(root, workspace);
    for (const envFile of envFiles) {
      const filePath = path.resolve(workspaceDir, envFile);
      resolved.push({
        filePath,
        workspace,
        exists: fs.existsSync(filePath),
      });
    }
  }

  return resolved;
}

/**
 * Detects workspaces from package.json workspaces field.
 */
export function detectWorkspaces(root: string): string[] {
  const pkgPath = path.resolve(root, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const workspaces: string[] = Array.isArray(pkg.workspaces)
      ? pkg.workspaces
      : pkg.workspaces?.packages ?? [];

    return workspaces.flatMap((pattern) => expandGlob(root, pattern));
  } catch {
    return [];
  }
}

function expandGlob(root: string, pattern: string): string[] {
  // Basic glob: supports trailing /* wildcard
  if (pattern.endsWith('/*')) {
    const dir = path.resolve(root, pattern.slice(0, -2));
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((entry) => fs.statSync(path.join(dir, entry)).isDirectory())
      .map((entry) => path.join(pattern.slice(0, -2), entry));
  }
  return [pattern];
}
