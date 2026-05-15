import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { parseEnvMap, compareEnvFiles, compareEnvMaps, hasChanges } from "./compare";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-compare-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const file = join(dir, name);
  writeFileSync(file, content);
  return file;
}

let tmpDir: string;

beforeEach(() => { tmpDir = makeTempDir(); });
afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

describe("parseEnvMap", () => {
  it("parses key=value pairs", () => {
    const file = writeEnv(tmpDir, ".env", "FOO=bar\nBAZ=qux\n");
    const map = parseEnvMap(file);
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const file = writeEnv(tmpDir, ".env", "# comment\n\nKEY=val\n");
    const map = parseEnvMap(file);
    expect(map.size).toBe(1);
    expect(map.get("KEY")).toBe("val");
  });

  it("strips surrounding quotes", () => {
    const file = writeEnv(tmpDir, ".env", 'SECRET="my secret"\n');
    const map = parseEnvMap(file);
    expect(map.get("SECRET")).toBe("my secret");
  });

  it("throws on missing file", () => {
    expect(() => parseEnvMap("/nonexistent/.env")).toThrow();
  });
});

describe("compareEnvFiles", () => {
  it("detects keys only in A", () => {
    const a = writeEnv(tmpDir, "a.env", "ONLY_A=1\nSHARED=x\n");
    const b = writeEnv(tmpDir, "b.env", "SHARED=x\n");
    const result = compareEnvFiles(a, b);
    expect(result.onlyInA.map((e) => e.key)).toContain("ONLY_A");
  });

  it("detects keys only in B", () => {
    const a = writeEnv(tmpDir, "a.env", "SHARED=x\n");
    const b = writeEnv(tmpDir, "b.env", "SHARED=x\nONLY_B=2\n");
    const result = compareEnvFiles(a, b);
    expect(result.onlyInB.map((e) => e.key)).toContain("ONLY_B");
  });

  it("detects changed values", () => {
    const a = writeEnv(tmpDir, "a.env", "KEY=old\n");
    const b = writeEnv(tmpDir, "b.env", "KEY=new\n");
    const result = compareEnvFiles(a, b);
    expect(result.changed[0]).toMatchObject({ key: "KEY", valueA: "old", valueB: "new" });
  });

  it("reports identical keys", () => {
    const a = writeEnv(tmpDir, "a.env", "SAME=value\n");
    const b = writeEnv(tmpDir, "b.env", "SAME=value\n");
    const result = compareEnvFiles(a, b);
    expect(result.identical.map((e) => e.key)).toContain("SAME");
  });
});

describe("hasChanges", () => {
  it("returns false when files are identical", () => {
    const mapA = new Map([["K", "v"]]);
    const mapB = new Map([["K", "v"]]);
    const result = compareEnvMaps("a", "b", mapA, mapB);
    expect(hasChanges(result)).toBe(false);
  });

  it("returns true when files differ", () => {
    const mapA = new Map([["K", "v1"]]);
    const mapB = new Map([["K", "v2"]]);
    const result = compareEnvMaps("a", "b", mapA, mapB);
    expect(hasChanges(result)).toBe(true);
  });
});
