import { describe, it, expect, beforeEach } from "bun:test";
import { writeFileSync, mkdtempSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { applyRenameRules, renameEnvFile, hasRenamed, parseEnvLines } from "./rename.ts";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-rename-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const file = join(dir, name);
  writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseEnvLines", () => {
  it("parses key=value pairs", () => {
    const map = parseEnvLines("FOO=bar\nBAZ=qux\n");
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const map = parseEnvLines("# comment\n\nKEY=val");
    expect(map.size).toBe(1);
  });
});

describe("applyRenameRules", () => {
  it("renames a key in content", () => {
    const { content, renamed } = applyRenameRules("OLD_KEY=hello\n", [{ from: "OLD_KEY", to: "NEW_KEY" }]);
    expect(content).toContain("NEW_KEY=hello");
    expect(renamed).toHaveLength(1);
  });

  it("skips rename if target already exists", () => {
    const { skipped } = applyRenameRules("OLD=1\nNEW=2\n", [{ from: "OLD", to: "NEW" }]);
    expect(skipped).toHaveLength(1);
  });

  it("marks not found when source key is missing", () => {
    const { notFound } = applyRenameRules("FOO=bar\n", [{ from: "MISSING", to: "OTHER" }]);
    expect(notFound).toHaveLength(1);
  });

  it("handles multiple rules", () => {
    const input = "A=1\nB=2\n";
    const { renamed } = applyRenameRules(input, [
      { from: "A", to: "AA" },
      { from: "B", to: "BB" },
    ]);
    expect(renamed).toHaveLength(2);
  });
});

describe("renameEnvFile", () => {
  let dir: string;
  beforeEach(() => { dir = makeTempDir(); });

  it("writes renamed content to disk", () => {
    const file = writeEnv(dir, ".env", "OLD_API_KEY=secret\n");
    const result = renameEnvFile(file, [{ from: "OLD_API_KEY", to: "API_KEY" }]);
    expect(result.renamed).toHaveLength(1);
    expect(readFileSync(file, "utf-8")).toContain("API_KEY=secret");
  });

  it("does not write if nothing renamed", () => {
    const file = writeEnv(dir, ".env", "FOO=bar\n");
    const before = readFileSync(file, "utf-8");
    renameEnvFile(file, [{ from: "MISSING", to: "OTHER" }]);
    expect(readFileSync(file, "utf-8")).toBe(before);
  });
});

describe("hasRenamed", () => {
  it("returns true when renamed list is non-empty", () => {
    expect(hasRenamed({ file: ".env", renamed: [{ from: "A", to: "B" }], skipped: [], notFound: [] })).toBe(true);
  });

  it("returns false when nothing renamed", () => {
    expect(hasRenamed({ file: ".env", renamed: [], skipped: [], notFound: [] })).toBe(false);
  });
});
