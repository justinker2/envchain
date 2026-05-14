import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { lintEnvFile, lintEnvFiles, hasViolations, parseEnvLines } from "./lint";
import { formatLintReport, summarizeLint } from "./lint.reporter";

function makeTempDir(): string {
  const dir = join("/tmp", `lint-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeEnv(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}

let tmpDir: string;
beforeAll(() => { tmpDir = makeTempDir(); });
afterAll(() => { rmSync(tmpDir, { recursive: true, force: true }); });

describe("parseEnvLines", () => {
  it("parses valid lines", () => {
    const result = parseEnvLines("FOO=bar\nBAZ=qux\n");
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ key: "FOO", value: "bar" });
  });

  it("ignores comments and blank lines", () => {
    const result = parseEnvLines("# comment\n\nFOO=bar");
    expect(result).toHaveLength(1);
  });
});

describe("lintEnvFile", () => {
  it("returns no violations for a clean file", () => {
    const f = writeEnv(tmpDir, "clean.env", "FOO=bar\nBAZ=hello\n");
    const result = lintEnvFile(f);
    expect(result.violations).toHaveLength(0);
  });

  it("detects empty value", () => {
    const f = writeEnv(tmpDir, "empty.env", "FOO=\n");
    const result = lintEnvFile(f);
    expect(result.violations.some((v) => v.rule === "no-empty-value")).toBe(true);
  });

  it("detects lowercase key", () => {
    const f = writeEnv(tmpDir, "lower.env", "foo=bar\n");
    const result = lintEnvFile(f);
    expect(result.violations.some((v) => v.rule === "uppercase-key")).toBe(true);
  });

  it("detects quoted value", () => {
    const f = writeEnv(tmpDir, "quoted.env", 'FOO="bar"\n');
    const result = lintEnvFile(f);
    expect(result.violations.some((v) => v.rule === "no-quotes-in-value")).toBe(true);
  });
});

describe("lintEnvFiles + hasViolations", () => {
  it("aggregates results across files", () => {
    const a = writeEnv(tmpDir, "a.env", "FOO=bar\n");
    const b = writeEnv(tmpDir, "b.env", "bad key=val\n");
    const results = lintEnvFiles([a, b]);
    expect(results).toHaveLength(2);
    expect(hasViolations(results)).toBe(true);
  });
});

describe("formatLintReport + summarizeLint", () => {
  it("summarizes results correctly", () => {
    const f = writeEnv(tmpDir, "sum.env", "FOO=bar\n");
    const results = lintEnvFiles([f]);
    const summary = summarizeLint(results);
    expect(summary.files).toBe(1);
    expect(summary.passed).toBe(1);
    expect(summary.violations).toBe(0);
  });

  it("formats report as string", () => {
    const f = writeEnv(tmpDir, "rep.env", "foo=\n");
    const results = lintEnvFiles([f]);
    const report = formatLintReport(results);
    expect(typeof report).toBe("string");
    expect(report.length).toBeGreaterThan(0);
  });
});
