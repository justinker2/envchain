import { readFileSync, writeFileSync } from "fs";
import { parseEnvLines } from "./lint";

export interface PruneOptions {
  dryRun?: boolean;
  keepComments?: boolean;
}

export interface PruneResult {
  file: string;
  removed: string[];
  kept: string[];
  original: string;
  pruned: string;
}

export function pruneUnusedKeys(
  envContent: string,
  usedKeys: Set<string>,
  options: PruneOptions = {}
): { kept: string[]; removed: string[] } {
  const lines = parseEnvLines(envContent);
  const kept: string[] = [];
  const removed: string[] = [];

  for (const line of lines) {
    if (line.type === "comment" || line.type === "blank") {
      if (options.keepComments !== false) kept.push(line.raw);
      continue;
    }
    if (line.type === "entry" && line.key) {
      if (usedKeys.has(line.key)) {
        kept.push(line.raw);
      } else {
        removed.push(line.key);
      }
    }
  }

  return { kept, removed };
}

export function pruneEnvFile(
  filePath: string,
  usedKeys: Set<string>,
  options: PruneOptions = {}
): PruneResult {
  const original = readFileSync(filePath, "utf-8");
  const { kept, removed } = pruneUnusedKeys(original, usedKeys, options);
  const pruned = kept.join("\n").trimEnd() + "\n";

  if (!options.dryRun && removed.length > 0) {
    writeFileSync(filePath, pruned, "utf-8");
  }

  return {
    file: filePath,
    removed,
    kept: kept.filter((l) => l.trim() && !l.trim().startsWith("#")),
    original,
    pruned,
  };
}

export function hasPrunable(result: PruneResult): boolean {
  return result.removed.length > 0;
}
