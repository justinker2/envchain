import type { CompareResult } from "./compare";
import { isSensitiveKey, maskValue } from "./formatter";

function colorize(text: string, code: number): string {
  return process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text;
}

function safeVal(key: string, value: string, mask: boolean): string {
  if (mask && isSensitiveKey(key)) return maskValue(value);
  return value;
}

export function formatCompareReport(
  result: CompareResult,
  maskSensitive = true
): string {
  const lines: string[] = [];
  lines.push(colorize(`Comparing: ${result.file}`, 1));
  lines.push("");

  if (result.onlyInA.length > 0) {
    lines.push(colorize("Only in A:", 33));
    for (const { key, value } of result.onlyInA) {
      lines.push(`  - ${key}=${safeVal(key, value, maskSensitive)}`);
    }
    lines.push("");
  }

  if (result.onlyInB.length > 0) {
    lines.push(colorize("Only in B:", 36));
    for (const { key, value } of result.onlyInB) {
      lines.push(`  + ${key}=${safeVal(key, value, maskSensitive)}`);
    }
    lines.push("");
  }

  if (result.changed.length > 0) {
    lines.push(colorize("Changed:", 35));
    for (const { key, valueA, valueB } of result.changed) {
      lines.push(`  ~ ${key}`);
      lines.push(`      A: ${safeVal(key, valueA, maskSensitive)}`);
      lines.push(`      B: ${safeVal(key, valueB, maskSensitive)}`);
    }
    lines.push("");
  }

  const total = result.onlyInA.length + result.onlyInB.length + result.changed.length;
  const summary = total === 0
    ? colorize(`✔ No differences found (${result.identical.length} identical keys)`, 32)
    : colorize(`✖ ${total} difference(s) found`, 31);
  lines.push(summary);

  return lines.join("\n");
}

export function printCompareReport(result: CompareResult, maskSensitive = true): void {
  console.log(formatCompareReport(result, maskSensitive));
}

export function summarizeCompare(result: CompareResult): Record<string, number> {
  return {
    onlyInA: result.onlyInA.length,
    onlyInB: result.onlyInB.length,
    changed: result.changed.length,
    identical: result.identical.length,
  };
}
