import { readFileSync, existsSync } from "fs";
import { parse } from "dotenv";

export interface EnvDiff {
  added: Record<string, string>;
  removed: Record<string, string>;
  changed: Record<string, { from: string; to: string }>;
  unchanged: Record<string, string>;
}

export function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, "utf-8");
  return parse(content) as Record<string, string>;
}

export function diffEnv(
  before: Record<string, string>,
  after: Record<string, string>
): EnvDiff {
  const added: Record<string, string> = {};
  const removed: Record<string, string> = {};
  const changed: Record<string, { from: string; to: string }> = {};
  const unchanged: Record<string, string> = {};

  for (const key of Object.keys(after)) {
    if (!(key in before)) {
      added[key] = after[key];
    } else if (before[key] !== after[key]) {
      changed[key] = { from: before[key], to: after[key] };
    } else {
      unchanged[key] = after[key];
    }
  }

  for (const key of Object.keys(before)) {
    if (!(key in after)) {
      removed[key] = before[key];
    }
  }

  return { added, removed, changed, unchanged };
}

export function diffEnvFiles(beforePath: string, afterPath: string): EnvDiff {
  const before = parseEnvFile(beforePath);
  const after = parseEnvFile(afterPath);
  return diffEnv(before, after);
}

export function hasDiff(diff: EnvDiff): boolean {
  return (
    Object.keys(diff.added).length > 0 ||
    Object.keys(diff.removed).length > 0 ||
    Object.keys(diff.changed).length > 0
  );
}
