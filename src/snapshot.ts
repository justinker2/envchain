import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseEnvFile } from "./diff.ts";

export interface EnvSnapshot {
  timestamp: number;
  filePath: string;
  checksum: string;
  keys: string[];
  values: Record<string, string>;
}

export function checksumSnapshot(values: Record<string, string>): string {
  const sorted = Object.keys(values)
    .sort()
    .map((k) => `${k}=${values[k]}`)
    .join("\n");
  return createHash("sha256").update(sorted).digest("hex").slice(0, 16);
}

export function captureSnapshot(filePath: string): EnvSnapshot {
  const raw = readFileSync(filePath, "utf-8");
  const values = parseEnvFile(raw);
  return {
    timestamp: Date.now(),
    filePath,
    checksum: checksumSnapshot(values),
    keys: Object.keys(values).sort(),
    values,
  };
}

export function saveSnapshot(snapshot: EnvSnapshot, snapshotDir: string): string {
  if (!existsSync(snapshotDir)) {
    mkdirSync(snapshotDir, { recursive: true });
  }
  const slug = snapshot.filePath.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${slug}_${snapshot.timestamp}.json`;
  const outPath = join(snapshotDir, filename);
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2), "utf-8");
  return outPath;
}

export function loadLatestSnapshot(
  filePath: string,
  snapshotDir: string
): EnvSnapshot | null {
  if (!existsSync(snapshotDir)) return null;
  const slug = filePath.replace(/[^a-zA-Z0-9]/g, "_");
  const { readdirSync } = await import("node:fs") as never as typeof import("node:fs");
  // Use sync version directly
  const { readdirSync: readdir } = require("node:fs") as typeof import("node:fs");
  const files = readdir(snapshotDir)
    .filter((f) => f.startsWith(slug) && f.endsWith(".json"))
    .sort()
    .reverse();
  if (files.length === 0) return null;
  const raw = readFileSync(join(snapshotDir, files[0]), "utf-8");
  return JSON.parse(raw) as EnvSnapshot;
}

export function snapshotChanged(
  current: EnvSnapshot,
  previous: EnvSnapshot | null
): boolean {
  if (!previous) return true;
  return current.checksum !== previous.checksum;
}
