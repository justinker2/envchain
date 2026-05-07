import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join, tmpdir } from "path";
import {
  checksumFile,
  auditEnvFile,
  buildAuditReport,
  AuditEntry,
} from "./audit";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-audit-"));
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

describe("checksumFile", () => {
  it("returns a 12-char hex string for existing file", () => {
    const p = writeEnv(tmpDir, ".env", "FOO=bar");
    const cs = checksumFile(p);
    expect(cs).toHaveLength(12);
    expect(cs).toMatch(/^[a-f0-9]+$/);
  });

  it("returns empty string for missing file", () => {
    expect(checksumFile(join(tmpDir, "nonexistent"))).toBe("");
  });
});

describe("auditEnvFile", () => {
  it("detects missing keys", () => {
    const p = writeEnv(tmpDir, ".env", "FOO=1");
    const entry = auditEnvFile(p, ["FOO", "BAR"], { FOO: "1" });
    expect(entry.missingKeys).toEqual(["BAR"]);
    expect(entry.extraKeys).toEqual([]);
    expect(entry.keyCount).toBe(1);
  });

  it("detects extra keys", () => {
    const p = writeEnv(tmpDir, ".env", "FOO=1\nSECRET=x");
    const entry = auditEnvFile(p, ["FOO"], { FOO: "1", SECRET: "x" });
    expect(entry.extraKeys).toEqual(["SECRET"]);
  });
});

describe("buildAuditReport", () => {
  it("aggregates entries and generates warnings", () => {
    const entries: AuditEntry[] = [
      {
        file: "a.env",
        timestamp: Date.now(),
        keyCount: 2,
        checksum: "abc123",
        missingKeys: ["DB_URL"],
        extraKeys: [],
      },
    ];
    const report = buildAuditReport(entries);
    expect(report.totalFiles).toBe(1);
    expect(report.totalKeys).toBe(2);
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]).toContain("DB_URL");
  });
});
