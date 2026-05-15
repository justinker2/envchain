import { describe, it, expect, beforeEach } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { syncEnvKeys, syncEnvFile } from "./sync";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-sync-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const path = join(dir, name);
  writeFileSync(path, content, "utf-8");
  return path;
}

describe("syncEnvKeys", () => {
  it("syncs keys from source to target", () => {
    const source = { FOO: "1", BAR: "2", BAZ: "3" };
    const target = { FOO: "old" };
    const { synced, skipped, merged } = syncEnvKeys(source, target, ["FOO", "BAR"], true);
    expect(synced).toContain("FOO");
    expect(synced).toContain("BAR");
    expect(merged.FOO).toBe("1");
    expect(merged.BAR).toBe("2");
    expect(skipped).toHaveLength(0);
  });

  it("skips existing keys when overwrite is false", () => {
    const source = { FOO: "new" };
    const target = { FOO: "old" };
    const { synced, skipped } = syncEnvKeys(source, target, ["FOO"], false);
    expect(skipped).toContain("FOO");
    expect(synced).toHaveLength(0);
  });

  it("ignores keys not present in source", () => {
    const source = { FOO: "1" };
    const target = {};
    const { synced } = syncEnvKeys(source, target, ["MISSING"], true);
    expect(synced).toHaveLength(0);
  });
});

describe("syncEnvFile", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  it("syncs keys from source to existing target", () => {
    const source = writeEnv(dir, ".env.source", "FOO=1\nBAR=2\n");
    const target = writeEnv(dir, ".env.target", "FOO=old\n");
    const results = syncEnvFile({ source, targets: [target], overwrite: true });
    expect(results[0].synced).toContain("FOO");
    const content = readFileSync(target, "utf-8");
    expect(content).toContain("FOO=1");
  });

  it("creates target file if it does not exist", () => {
    const source = writeEnv(dir, ".env.source", "KEY=value\n");
    const newTarget = join(dir, ".env.new");
    const results = syncEnvFile({ source, targets: [newTarget] });
    expect(results[0].created).toBe(true);
    expect(results[0].synced).toContain("KEY");
  });

  it("respects dryRun and does not write files", () => {
    const source = writeEnv(dir, ".env.source", "X=1\n");
    const target = writeEnv(dir, ".env.target", "");
    syncEnvFile({ source, targets: [target], dryRun: true, overwrite: true });
    const content = readFileSync(target, "utf-8");
    expect(content).toBe("");
  });
});
