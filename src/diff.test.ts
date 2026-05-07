import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { diffEnv, diffEnvFiles, hasDiff, parseEnvFile } from "./diff";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-diff-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const filePath = join(dir, name);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = makeTempDir();
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("diffEnv", () => {
  it("detects added keys", () => {
    const diff = diffEnv({ A: "1" }, { A: "1", B: "2" });
    expect(diff.added).toEqual({ B: "2" });
    expect(Object.keys(diff.removed)).toHaveLength(0);
  });

  it("detects removed keys", () => {
    const diff = diffEnv({ A: "1", B: "2" }, { A: "1" });
    expect(diff.removed).toEqual({ B: "2" });
  });

  it("detects changed keys", () => {
    const diff = diffEnv({ A: "old" }, { A: "new" });
    expect(diff.changed).toEqual({ A: { from: "old", to: "new" } });
  });

  it("tracks unchanged keys", () => {
    const diff = diffEnv({ A: "1" }, { A: "1" });
    expect(diff.unchanged).toEqual({ A: "1" });
  });
});

describe("diffEnvFiles", () => {
  it("diffs two env files", () => {
    const a = writeEnv(tmpDir, ".env.a", "FOO=bar\nBAZ=qux\n");
    const b = writeEnv(tmpDir, ".env.b", "FOO=changed\nNEW=val\n");
    const diff = diffEnvFiles(a, b);
    expect(diff.changed["FOO"]).toEqual({ from: "bar", to: "changed" });
    expect(diff.added["NEW"]).toBe("val");
    expect(diff.removed["BAZ"]).toBe("qux");
  });

  it("returns all added when before file missing", () => {
    const b = writeEnv(tmpDir, ".env.b", "X=1\n");
    const diff = diffEnvFiles(join(tmpDir, "nonexistent"), b);
    expect(diff.added["X"]).toBe("1");
  });
});

describe("hasDiff", () => {
  it("returns false when no changes", () => {
    const diff = diffEnv({ A: "1" }, { A: "1" });
    expect(hasDiff(diff)).toBe(false);
  });

  it("returns true when there are changes", () => {
    const diff = diffEnv({ A: "1" }, { A: "2" });
    expect(hasDiff(diff)).toBe(true);
  });
});
