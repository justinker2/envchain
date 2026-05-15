import { readFileSync, writeFileSync } from "fs";

export interface RenameRule {
  from: string;
  to: string;
}

export interface RenameResult {
  file: string;
  renamed: RenameRule[];
  skipped: RenameRule[];
  notFound: RenameRule[];
}

export function parseEnvLines(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1);
    map.set(key, value);
  }
  return map;
}

export function applyRenameRules(
  content: string,
  rules: RenameRule[]
): { content: string; renamed: RenameRule[]; skipped: RenameRule[]; notFound: RenameRule[] } {
  const existing = parseEnvLines(content);
  const renamed: RenameRule[] = [];
  const skipped: RenameRule[] = [];
  const notFound: RenameRule[] = [];
  let result = content;

  for (const rule of rules) {
    if (!existing.has(rule.from)) {
      notFound.push(rule);
      continue;
    }
    if (existing.has(rule.to)) {
      skipped.push(rule);
      continue;
    }
    result = result.replace(
      new RegExp(`^(${rule.from})(\\s*=)`, "m"),
      `${rule.to}$2`
    );
    renamed.push(rule);
  }

  return { content: result, renamed, skipped, notFound };
}

export function renameEnvFile(file: string, rules: RenameRule[]): RenameResult {
  const content = readFileSync(file, "utf-8");
  const { content: updated, renamed, skipped, notFound } = applyRenameRules(content, rules);
  if (renamed.length > 0) {
    writeFileSync(file, updated, "utf-8");
  }
  return { file, renamed, skipped, notFound };
}

export function hasRenamed(result: RenameResult): boolean {
  return result.renamed.length > 0;
}
