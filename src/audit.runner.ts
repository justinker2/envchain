import { writeFileSync } from "fs";
import { join } from "path";
import { auditEnvFile, buildAuditReport, AuditReport } from "./audit";
import { resolveAuditConfig, AuditConfig } from "./audit.config";
import { loadEnvChain } from "./loader";

export interface AuditRunOptions {
  files: string[];
  config?: Partial<AuditConfig>;
  cwd?: string;
}

export async function runAudit(options: AuditRunOptions): Promise<AuditReport> {
  const cfg = resolveAuditConfig(options.config);
  const cwd = options.cwd ?? process.cwd();

  const entries = await Promise.all(
    options.files.map(async (filePath) => {
      let parsed: Record<string, string> = {};
      try {
        parsed = await loadEnvChain([filePath]);
      } catch {
        // file unreadable — entry will carry empty parsed
      }
      return auditEnvFile(filePath, cfg.requiredKeys, parsed);
    })
  );

  const report = buildAuditReport(entries);

  if (!cfg.includeChecksums) {
    for (const entry of report.entries) {
      (entry as any).checksum = undefined;
    }
  }

  if (cfg.persistReport) {
    const outPath = join(cwd, cfg.reportPath);
    writeFileSync(outPath, JSON.stringify(report, null, 2));
  }

  if (cfg.warnOnExtraKeys) {
    for (const entry of entries) {
      if (entry.extraKeys.length > 0) {
        report.warnings.push(
          `[${entry.file}] Extra keys: ${entry.extraKeys.join(", ")}`
        );
      }
    }
  }

  return report;
}

export function printAuditReport(report: AuditReport): void {
  console.log(`\n📋 Audit Report — ${new Date(report.generatedAt).toISOString()}`);
  console.log(`   Files : ${report.totalFiles}`);
  console.log(`   Keys  : ${report.totalKeys}`);

  if (report.warnings.length === 0) {
    console.log("   ✅ No warnings");
  } else {
    console.log(`   ⚠️  Warnings (${report.warnings.length}):`);
    for (const w of report.warnings) {
      console.log(`      • ${w}`);
    }
  }
  console.log("");
}
