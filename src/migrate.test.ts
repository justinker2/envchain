import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  applyMigrationRules,
  migrateEnvFile,
  type MigrationRule,
} from "./migrate";
import { resolveMigrateConfig, commonMigrationRules } from "./migrate.config";
import { formatMigrationReport } from "./migrate.reporter";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-migrate-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content, "utf-8");
  return p;
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = makeTempDir();
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("applyMigrationRules", () => {
  it("renames a key", () => {
    const rules: MigrationRule[] = [{ from: "OLD_KEY", to: "NEW_KEY" }];
    const { result, applied } = applyMigrationRules({ OLD_KEY: "value" }, rules);
    expect(result["NEW_KEY"]).toBe("value");
    expect("OLD_KEY" in result).toBe(false);
    expect(applied).toHaveLength(1);
  });

  it("applies transform function", () => {
    const rules: MigrationRule[] = [
      { from: "PORT", to: "APP_PORT", transform: (v) => String(Number(v) * 2) },
    ];
    const { result } = applyMigrationRules({ PORT: "3000" }, rules);
    expect(result["APP_PORT"]).toBe("6000");
  });

  it("skips missing keys", () => {
    const rules: MigrationRule[] = [{ from: "MISSING", to: "NEW" }];
    const { skipped } = applyMigrationRules({}, rules);
    expect(skipped).toHaveLength(1);
  });
});

describe("migrateEnvFile", () => {
  it("writes migrated file to disk", () => {
    const file = writeEnv(tmpDir, ".env", "DATABASE_URL=postgres://localhost\n");
    const result = migrateEnvFile(file, [commonMigrationRules.dbUrlRename]);
    expect(result.applied).toHaveLength(1);
    const content = readFileSync(file, "utf-8");
    expect(content).toContain("DB_URL=");
    expect(content).not.toContain("DATABASE_URL=");
  });

  it("dry run does not modify file", () => {
    const file = writeEnv(tmpDir, ".env", "API_KEY=secret\n");
    migrateEnvFile(file, [commonMigrationRules.apiKeyPrefix], true);
    const content = readFileSync(file, "utf-8");
    expect(content).toContain("API_KEY=");
  });

  it("throws on missing file", () => {
    expect(() => migrateEnvFile("/nonexistent/.env", [])).toThrow();
  });
});

describe("resolveMigrateConfig", () => {
  it("merges partial config with defaults", () => {
    const cfg = resolveMigrateConfig({ dryRun: true });
    expect(cfg.dryRun).toBe(true);
    expect(cfg.files).toBeDefined();
  });
});

describe("formatMigrationReport", () => {
  it("includes applied and skipped counts", () => {
    const report = formatMigrationReport([
      {
        file: ".env",
        applied: [{ from: "A", to: "B" }],
        skipped: [{ from: "C", to: "D" }],
        output: { B: "val" },
      },
    ]);
    expect(report).toContain("A");
    expect(report).toContain("B");
    expect(report).toContain("C");
  });
});
