import { resolveEnvFiles } from "./resolver";
import { loadEnvChain } from "./loader";
import { mergeEnvFiles, applyToProcess } from "./merger";
import { validateEnv } from "./validator";
import {
  getCacheDir,
  readCache,
  writeCache,
  isCacheValid,
  updateCacheEntry,
  CacheStore,
} from "./cache";

export interface PipelineOptions {
  root?: string;
  patterns?: string[];
  required?: string[];
  applyToEnv?: boolean;
  useCache?: boolean;
}

export interface PipelineResult {
  env: Record<string, string>;
  files: string[];
  workspaces: number;
  fromCache: boolean;
}

export function countWorkspaces(files: string[]): number {
  const dirs = new Set(files.map((f) => f.replace(/[\\/][^\\/]+$/, "")));
  return dirs.size;
}

export async function runPipeline(
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const {
    root = process.cwd(),
    patterns,
    required = [],
    applyToEnv = true,
    useCache = false,
  } = options;

  const files = await resolveEnvFiles({ root, patterns });
  const cacheDir = getCacheDir(root);
  let store: CacheStore = useCache ? readCache(cacheDir) : {};

  const allCached =
    useCache &&
    files.length > 0 &&
    files.every((f) => isCacheValid(f, store));

  if (allCached) {
    const cachedEnv = files.reduce<Record<string, string>>((acc, f) => {
      return { ...acc, ...store[f].env };
    }, {});

    if (required.length > 0) validateEnv(cachedEnv, required);
    if (applyToEnv) applyToProcess(cachedEnv);

    return {
      env: cachedEnv,
      files,
      workspaces: countWorkspaces(files),
      fromCache: true,
    };
  }

  const parsed = await loadEnvChain(files);
  const env = mergeEnvFiles(parsed);

  if (required.length > 0) validateEnv(env, required);
  if (applyToEnv) applyToProcess(env);

  if (useCache) {
    for (const [filePath, fileEnv] of Object.entries(parsed)) {
      store = updateCacheEntry(filePath, fileEnv, store);
    }
    writeCache(cacheDir, store);
  }

  return {
    env,
    files,
    workspaces: countWorkspaces(files),
    fromCache: false,
  };
}
