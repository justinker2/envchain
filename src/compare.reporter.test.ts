import { describe, it, expect } from "bun:test";
import type { CompareResult } from "./compare";
import { formatCompareReport, summarizeCompare } from "./compare.reporter";

function makeResult(overrides: Partial<CompareResult> = {}): CompareResult {
  return {
    file: "a.env vs b.env",
    onlyInA: [],
    onlyInB: [],
    changed: [],
    identical: [],
    ...overrides,
  };
}

describe("formatCompareReport", () => {
  it("shows no differences message when identical", () => {
    const result = makeResult({ identical: [{ key: "FOO", value: "bar" }] });
    const report = formatCompareReport(result, false);
    expect(report).toContain("No differences found");
    expect(report).toContain("1 identical");
  });

  it("shows keys only in A", () => {
    const result = makeResult({ onlyInA: [{ key: "ONLY_A", value: "1" }] });
    const report = formatCompareReport(result, false);
    expect(report).toContain("Only in A");
    expect(report).toContain("ONLY_A=1");
  });

  it("shows keys only in B", () => {
    const result = makeResult({ onlyInB: [{ key: "ONLY_B", value: "2" }] });
    const report = formatCompareReport(result, false);
    expect(report).toContain("Only in B");
    expect(report).toContain("ONLY_B=2");
  });

  it("shows changed values", () => {
    const result = makeResult({
      changed: [{ key: "KEY", valueA: "old", valueB: "new" }],
    });
    const report = formatCompareReport(result, false);
    expect(report).toContain("Changed");
    expect(report).toContain("old");
    expect(report).toContain("new");
  });

  it("masks sensitive keys when maskSensitive=true", () => {
    const result = makeResult({
      onlyInA: [{ key: "SECRET_KEY", value: "supersecret" }],
    });
    const report = formatCompareReport(result, true);
    expect(report).not.toContain("supersecret");
    expect(report).toContain("***");
  });

  it("shows difference count in summary", () => {
    const result = makeResult({
      onlyInA: [{ key: "A", value: "1" }],
      changed: [{ key: "B", valueA: "x", valueB: "y" }],
    });
    const report = formatCompareReport(result, false);
    expect(report).toContain("2 difference");
  });
});

describe("summarizeCompare", () => {
  it("returns correct counts", () => {
    const result = makeResult({
      onlyInA: [{ key: "A", value: "1" }],
      onlyInB: [{ key: "B", value: "2" }],
      changed: [{ key: "C", valueA: "x", valueB: "y" }],
      identical: [{ key: "D", value: "z" }, { key: "E", value: "w" }],
    });
    expect(summarizeCompare(result)).toEqual({
      onlyInA: 1,
      onlyInB: 1,
      changed: 1,
      identical: 2,
    });
  });
});
