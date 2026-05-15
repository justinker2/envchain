import { readFileSync, existsSync } from "fs";

export interface EnvEntry {
  key: string;
  value: string;
}

export interface CompareResult {
  file: string;
  onlyInA: EnvEntry[];
  onlyInB: EnvEntry[];
  changed: Array<{ key: string; valueA: string; valueB: string }>;
  identical: EnvEntry[];
}

export function parseEnvMap(filePath: string): Map<string, string> {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const lines = readFileSync(filePath, "utf8").split("\n");
  const map = new Map<string, string>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    map.set(key, value);
  }
  return map;
}

export function compareEnvMaps(
  fileA: string,
  fileB: string,
  mapA: Map<string, string>,
  mapB: Map<string, string>
): CompareResult {
  const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);
  const result: CompareResult = {
    file: `${fileA} vs ${fileB}`,
    onlyInA: [],
    onlyInB: [],
    changed: [],
    identical: [],
  };

  for (const key of allKeys) {
    const inA = mapA.has(key);
    const inB = mapB.has(key);
    if (inA && !inB) {
      result.onlyInA.push({ key, value: mapA.get(key)! });
    } else if (!inA && inB) {
      result.onlyInB.push({ key, value: mapB.get(key)! });
    } else if (mapA.get(key) !== mapB.get(key)) {
      result.changed.push({ key, valueA: mapA.get(key)!, valueB: mapB.get(key)! });
    } else {
      result.identical.push({ key, value: mapA.get(key)! });
    }
  }

  return result;
}

export function compareEnvFiles(fileA: string, fileB: string): CompareResult {
  const mapA = parseEnvMap(fileA);
  const mapB = parseEnvMap(fileB);
  return compareEnvMaps(fileA, fileB, mapA, mapB);
}

export function hasChanges(result: CompareResult): boolean {
  return result.onlyInA.length > 0 || result.onlyInB.length > 0 || result.changed.length > 0;
}
