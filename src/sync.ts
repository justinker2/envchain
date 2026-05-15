import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { parseEnvFile } from "./diff";

export interface SyncOptions {
  source: string;
  targets: string[];
  keys?: string[];
  dryRun?: boolean;
  overwrite?: boolean;
}

export interface SyncResult {
  source: string;
  target: string;
  synced: string[];
  skipped: string[];
  created: boolean;
}

export function syncEnvKeys(
  sourceMap: Record<string, string>,
  targetMap: Record<string, string>,
  keys: string[],
  overwrite = false
): { merged: Record<string, string>; synced: string[]; skipped: string[] } {
  const merged = { ...targetMap };
  const synced: string[] = [];
  const skipped: string[] = [];

  for (const key of keys) {
    if (!(key in sourceMap)) continue;
    if (key in targetMap && !overwrite) {
      skipped.push(key);
    } else {
      merged[key] = sourceMap[key];
      synced.push(key);
    }
  }

  return { merged, synced, skipped };
}

export function syncEnvFile(options: SyncOptions): SyncResult[] {
  const sourcePath = resolve(options.source);
  if (!existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }

  const sourceContent = readFileSync(sourcePath, "utf-8");
  const sourceMap = parseEnvFile(sourceContent);
  const keysToSync = options.keys ?? Object.keys(sourceMap);

  return options.targets.map((target) => {
    const targetPath = resolve(target);
    const created = !existsSync(targetPath);
    const targetMap = created ? {} : parseEnvFile(readFileSync(targetPath, "utf-8"));

    const { merged, synced, skipped } = syncEnvKeys(
      sourceMap,
      targetMap,
      keysToSync,
      options.overwrite ?? false
    );

    if (!options.dryRun) {
      const serialized = Object.entries(merged)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n") + "\n";
      writeFileSync(targetPath, serialized, "utf-8");
    }

    return { source: sourcePath, target: targetPath, synced, skipped, created };
  });
}
