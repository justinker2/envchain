import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "fs";
import { join, tmpdir } from "path";
import { runAudit, printAuditReport } from "./audit.runner";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-runner-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = makeTempDir();
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("runAudit", () => {
  it("returns a report with correct totalFiles", async () => {
    const f1 = writeEnv(tmpDir, ".env", "FOO=1\nBAR=2");
    const f2 = writeEnv(tmpDir, ".env.local", "BAZ=3");
    const report = await runAudit({ files: [f1, f2], cwd: tmpDir });
    expect(report.totalFiles).toBe(2);
    expect(report.totalKeys).toBeGreaterThan(0);
  });

  it("reports missing required keys", async () => {
    const f = writeEnv(tmpDir, ".env", "FOO=1");
    const report = await runAudit({
      files: [f],
      config: { requiredKeys: ["FOO", "MISSING_KEY"] },
      cwd: tmpDir,
    });
    expect(report.warnings.some((w) => w.includes("MISSING_KEY"))).toBe(true);
  });

  it("persists report to disk when persistReport=true", async () => {
    const f = writeEnv(tmpDir, ".env", "X=1");
    const reportPath = ".envchain-audit-test.json";
    await runAudit({
      files: [f],
      config: { persistReport: true, reportPath },
      cwd: tmpDir,
    });
    expect(existsSync(join(tmpDir, reportPath))).toBe(true);
  });

  it("warns on extra keys when warnOnExtraKeys=true", async () => {
    const f = writeEnv(tmpDir, ".env", "FOO=1\nUNKNOWN=x");
    const report = await runAudit({
      files: [f],
      config: { requiredKeys: ["FOO"], warnOnExtraKeys: true },
      cwd: tmpDir,
    });
    expect(report.warnings.some((w) => w.includes("UNKNOWN"))).toBe(true);
  });
});

describe("printAuditReport", () => {
  it("does not throw", async () => {
    const f = writeEnv(tmpDir, ".env", "A=1");
    const report = await runAudit({ files: [f], cwd: tmpDir });
    expect(() => printAuditReport(report)).not.toThrow();
  });
});
