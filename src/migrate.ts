import { readFileSync, writeFileSync, existsSync } from "fs";
import { parseEnvFile } from "./diff";

export interface MigrationRule {
  from: string;
  to: string;
  transform?: (value: string) => string;
}

export interface MigrationResult {
  file: string;
  applied: MigrationRule[];
  skipped: MigrationRule[];
  output: Record<string, string>;
}

export function applyMigrationRules(
  env: Record<string, string>,
  rules: MigrationRule[]
): { result: Record<string, string>; applied: MigrationRule[]; skipped: MigrationRule[] } {
  const result: Record<string, string> = { ...env };
  const applied: MigrationRule[] = [];
  const skipped: MigrationRule[] = [];

  for (const rule of rules) {
    if (rule.from in result) {
      const raw = result[rule.from];
      const transformed = rule.transform ? rule.transform(raw) : raw;
      result[rule.to] = transformed;
      delete result[rule.from];
      applied.push(rule);
    } else {
      skipped.push(rule);
    }
  }

  return { result, applied, skipped };
}

export function migrateEnvFile(
  filePath: string,
  rules: MigrationRule[],
  dryRun = false
): MigrationResult {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = readFileSync(filePath, "utf-8");
  const env = parseEnvFile(raw);
  const { result, applied, skipped } = applyMigrationRules(env, rules);

  if (!dryRun && applied.length > 0) {
    const serialized = Object.entries(result)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    writeFileSync(filePath, serialized + "\n", "utf-8");
  }

  return { file: filePath, applied, skipped, output: result };
}
