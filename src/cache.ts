import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface CacheEntry {
  hash: string;
  env: Record<string, string>;
  timestamp: number;
}

export interface CacheStore {
  [filePath: string]: CacheEntry;
}

const DEFAULT_CACHE_DIR = ".envchain-cache";

export function getCacheDir(root: string = process.cwd()): string {
  return path.join(root, DEFAULT_CACHE_DIR);
}

export function hashFileContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function readCache(cacheDir: string): CacheStore {
  const cacheFile = path.join(cacheDir, "env.cache.json");
  if (!fs.existsSync(cacheFile)) return {};
  try {
    const raw = fs.readFileSync(cacheFile, "utf-8");
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

export function writeCache(cacheDir: string, store: CacheStore): void {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  const cacheFile = path.join(cacheDir, "env.cache.json");
  fs.writeFileSync(cacheFile, JSON.stringify(store, null, 2), "utf-8");
}

export function isCacheValid(
  filePath: string,
  store: CacheStore
): boolean {
  const entry = store[filePath];
  if (!entry) return false;
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf-8");
  return hashFileContent(content) === entry.hash;
}

export function updateCacheEntry(
  filePath: string,
  env: Record<string, string>,
  store: CacheStore
): CacheStore {
  const content = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf-8")
    : "";
  return {
    ...store,
    [filePath]: {
      hash: hashFileContent(content),
      env,
      timestamp: Date.now(),
    },
  };
}

export function clearCache(cacheDir: string): void {
  const cacheFile = path.join(cacheDir, "env.cache.json");
  if (fs.existsSync(cacheFile)) {
    fs.unlinkSync(cacheFile);
  }
}
