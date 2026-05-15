import { describe, it, expect, beforeEach } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { pruneUnusedKeys, pruneEnvFile, hasPrunable } from "./prune";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-prune-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content, "utf-8");
  return p;
}

describe("pruneUnusedKeys", () => {
  it("removes keys not in usedKeys set", () => {
    const content = "FOO=1\nBAR=2\nBAZ=3\n";
    const { removed, kept } = pruneUnusedKeys(content, new Set(["FOO", "BAZ"]));
    expect(removed).toContain("BAR");
    expect(removed).not.toContain("FOO");
    expect(kept.some((l) => l.includes("FOO"))).toBe(true);
  });

  it("keeps comments when keepComments is true", () => {
    const content = "# comment\nFOO=1\n";
    const { kept } = pruneUnusedKeys(content, new Set(["FOO"]), {
      keepComments: true,
    });
    expect(kept.some((l) => l.startsWith("#"))).toBe(true);
  });

  it("drops comments when keepComments is false", () => {
    const content = "# comment\nFOO=1\n";
    const { kept } = pruneUnusedKeys(content, new Set(["FOO"]), {
      keepComments: false,
    });
    expect(kept.some((l) => l.startsWith("#"))).toBe(false);
  });
});

describe("pruneEnvFile", () => {
  let dir: string;
  beforeEach(() => { dir = makeTempDir(); });

  it("writes pruned content to file", () => {
    const p = writeEnv(dir, ".env", "FOO=1\nBAR=2\nBAZ=3\n");
    const result = pruneEnvFile(p, new Set(["FOO"]));
    const written = readFileSync(p, "utf-8");
    expect(written).toContain("FOO=1");
    expect(written).not.toContain("BAR");
    expect(result.removed).toEqual(["BAR", "BAZ"]);
  });

  it("does not write in dryRun mode", () => {
    const p = writeEnv(dir, ".env", "FOO=1\nBAR=2\n");
    pruneEnvFile(p, new Set(["FOO"]), { dryRun: true });
    const written = readFileSync(p, "utf-8");
    expect(written).toContain("BAR");
  });

  it("hasPrunable returns true when keys removed", () => {
    const p = writeEnv(dir, ".env", "FOO=1\nBAR=2\n");
    const result = pruneEnvFile(p, new Set(["FOO"]), { dryRun: true });
    expect(hasPrunable(result)).toBe(true);
  });

  it("hasPrunable returns false when nothing removed", () => {
    const p = writeEnv(dir, ".env", "FOO=1\n");
    const result = pruneEnvFile(p, new Set(["FOO"]), { dryRun: true });
    expect(hasPrunable(result)).toBe(false);
  });
});
