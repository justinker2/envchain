import { readFileSync } from "fs";
import { resolve } from "path";

export interface LintRule {
  name: string;
  check: (key: string, value: string) => boolean;
  message: string;
}

export interface LintResult {
  file: string;
  violations: Array<{ line: number; key: string; rule: string; message: string }>;
}

const defaultRules: LintRule[] = [
  {
    name: "no-empty-value",
    check: (_key, value) => value.trim().length > 0,
    message: "Value must not be empty",
  },
  {
    name: "no-whitespace-key",
    check: (key) => !/\s/.test(key),
    message: "Key must not contain whitespace",
  },
  {
    name: "uppercase-key",
    check: (key) => key === key.toUpperCase(),
    message: "Key should be uppercase",
  },
  {
    name: "no-quotes-in-value",
    check: (_key, value) => !(value.startsWith('"') && value.endsWith('"')) && !(value.startsWith("'") && value.endsWith("'")),
    message: "Value should not be wrapped in quotes",
  },
];

export function parseEnvLines(content: string): Array<{ line: number; key: string; value: string }> {
  return content
    .split("\n")
    .map((raw, i) => ({ raw: raw.trim(), line: i + 1 }))
    .filter(({ raw }) => raw && !raw.startsWith("#"))
    .map(({ raw, line }) => {
      const eq = raw.indexOf("=");
      if (eq === -1) return null;
      return { line, key: raw.slice(0, eq).trim(), value: raw.slice(eq + 1).trim() };
    })
    .filter(Boolean) as Array<{ line: number; key: string; value: string }>;
}

export function lintEnvFile(filePath: string, rules: LintRule[] = defaultRules): LintResult {
  const content = readFileSync(resolve(filePath), "utf-8");
  const entries = parseEnvLines(content);
  const violations: LintResult["violations"] = [];

  for (const { line, key, value } of entries) {
    for (const rule of rules) {
      if (!rule.check(key, value)) {
        violations.push({ line, key, rule: rule.name, message: rule.message });
      }
    }
  }

  return { file: filePath, violations };
}

export function lintEnvFiles(filePaths: string[], rules?: LintRule[]): LintResult[] {
  return filePaths.map((f) => lintEnvFile(f, rules));
}

export function hasViolations(results: LintResult[]): boolean {
  return results.some((r) => r.violations.length > 0);
}
