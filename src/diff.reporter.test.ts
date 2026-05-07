import { describe, it, expect } from "bun:test";
import { formatDiffReport, summarizeDiff } from "./diff.reporter";
import { EnvDiff } from "./diff";

function makeDiff(overrides: Partial<EnvDiff> = {}): EnvDiff {
  return {
    added: {},
    removed: {},
    changed: {},
    unchanged: {},
    ...overrides,
  };
}

describe("formatDiffReport", () => {
  it("returns no-change message for empty diff", () => {
    const result = formatDiffReport(makeDiff(), { color: false });
    expect(result).toBe("No changes detected.");
  });

  it("formats added keys with +", () => {
    const diff = makeDiff({ added: { NEW_KEY: "hello" } });
    const result = formatDiffReport(diff, { color: false, maskSecrets: false });
    expect(result).toContain("+ NEW_KEY=hello");
  });

  it("formats removed keys with -", () => {
    const diff = makeDiff({ removed: { OLD_KEY: "bye" } });
    const result = formatDiffReport(diff, { color: false, maskSecrets: false });
    expect(result).toContain("- OLD_KEY=bye");
  });

  it("formats changed keys with ~", () => {
    const diff = makeDiff({ changed: { HOST: { from: "localhost", to: "prod.host" } } });
    const result = formatDiffReport(diff, { color: false, maskSecrets: false });
    expect(result).toContain("~ HOST: localhost → prod.host");
  });

  it("masks sensitive values when maskSecrets is true", () => {
    const diff = makeDiff({ added: { SECRET_KEY: "super-secret" } });
    const result = formatDiffReport(diff, { color: false, maskSecrets: true });
    expect(result).not.toContain("super-secret");
    expect(result).toContain("SECRET_KEY");
  });

  it("does not mask non-sensitive values", () => {
    const diff = makeDiff({ added: { APP_NAME: "myapp" } });
    const result = formatDiffReport(diff, { color: false, maskSecrets: true });
    expect(result).toContain("myapp");
  });
});

describe("summarizeDiff", () => {
  it("returns no changes for empty diff", () => {
    expect(summarizeDiff(makeDiff())).toBe("no changes");
  });

  it("summarizes counts correctly", () => {
    const diff = makeDiff({
      added: { A: "1", B: "2" },
      removed: { C: "3" },
      changed: { D: { from: "x", to: "y" } },
    });
    const summary = summarizeDiff(diff);
    expect(summary).toContain("2 added");
    expect(summary).toContain("1 removed");
    expect(summary).toContain("1 changed");
  });
});
