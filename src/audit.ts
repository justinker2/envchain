import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface AuditEntry {
  file: string;
  timestamp: number;
  keyCount: number;
  checksum: string;
  missingKeys: string[];
  extraKeys: string[];
}

export interface AuditReport {
  entries: AuditEntry[];
  totalFiles: number;
  totalKeys: number;
  warnings: string[];
  generatedAt: number;
}

export function checksumFile(filePath: string): string {
  if (!existsSync(filePath)) return "";
  const content = readFileSync(filePath, "utf-8");
  return createHash("sha256").update(content).digest("hex").slice(0, 12);
}

export function auditEnvFile(
  filePath: string,
  expectedKeys: string[] = [],
  parsedEnv: Record<string, string> = {}
): AuditEntry {
  const keys = Object.keys(parsedEnv);
  const missingKeys = expectedKeys.filter((k) => !(k in parsedEnv));
  const extraKeys = keys.filter((k) => !expectedKeys.includes(k));

  return {
    file: filePath,
    timestamp: Date.now(),
    keyCount: keys.length,
    checksum: checksumFile(filePath),
    missingKeys,
    extraKeys,
  };
}

export function buildAuditReport(entries: AuditEntry[]): AuditReport {
  const warnings: string[] = [];

  for (const entry of entries) {
    if (entry.missingKeys.length > 0) {
      warnings.push(
        `[${entry.file}] Missing keys: ${entry.missingKeys.join(", ")}`
      );
    }
    if (entry.checksum === "") {
      warnings.push(`[${entry.file}] File not found or unreadable`);
    }
  }

  return {
    entries,
    totalFiles: entries.length,
    totalKeys: entries.reduce((sum, e) => sum + e.keyCount, 0),
    warnings,
    generatedAt: Date.now(),
  };
}
