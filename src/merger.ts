import { ResolvedEnvFile } from './resolver';
import { loadEnvChain } from './loader';

export type MergeStrategy = 'override' | 'preserve';

export interface MergeOptions {
  strategy?: MergeStrategy;
  onlyExisting?: boolean;
}

export interface MergeResult {
  env: Record<string, string>;
  sources: Array<{ filePath: string; workspace: string; keys: string[] }>;
}

/**
 * Merges env variables from multiple resolved env files.
 * - 'override': later files overwrite earlier keys (default)
 * - 'preserve': first occurrence of a key wins
 */
export function mergeEnvFiles(
  resolvedFiles: ResolvedEnvFile[],
  options: MergeOptions = {}
): MergeResult {
  const strategy = options.strategy ?? 'override';
  const candidates = options.onlyExisting
    ? resolvedFiles.filter((f) => f.exists)
    : resolvedFiles.filter((f) => f.exists);

  const merged: Record<string, string> = {};
  const sources: MergeResult['sources'] = [];

  for (const file of candidates) {
    const parsed = loadEnvChain(file.filePath);
    const addedKeys: string[] = [];

    for (const [key, value] of Object.entries(parsed)) {
      if (strategy === 'preserve' && key in merged) {
        continue;
      }
      merged[key] = value;
      addedKeys.push(key);
    }

    if (addedKeys.length > 0) {
      sources.push({
        filePath: file.filePath,
        workspace: file.workspace,
        keys: addedKeys,
      });
    }
  }

  return { env: merged, sources };
}

/**
 * Applies merged env to process.env.
 */
export function applyToProcess(
  mergeResult: MergeResult,
  overwrite = true
): void {
  for (const [key, value] of Object.entries(mergeResult.env)) {
    if (overwrite || !(key in process.env)) {
      process.env[key] = value;
    }
  }
}
