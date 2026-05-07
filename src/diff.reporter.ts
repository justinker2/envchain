import { EnvDiff, hasDiff } from "./diff";
import { maskValue, isSensitiveKey } from "./formatter";

export interface DiffReportOptions {
  maskSecrets?: boolean;
  color?: boolean;
}

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";

function colorize(text: string, code: string, useColor: boolean): string {
  return useColor ? `${code}${text}${RESET}` : text;
}

function safeValue(key: string, value: string, mask: boolean): string {
  return mask && isSensitiveKey(key) ? maskValue(value) : value;
}

export function formatDiffReport(
  diff: EnvDiff,
  options: DiffReportOptions = {}
): string {
  const { maskSecrets = true, color = true } = options;
  const lines: string[] = [];

  if (!hasDiff(diff)) {
    return colorize("No changes detected.", DIM, color);
  }

  for (const [key, value] of Object.entries(diff.added)) {
    const val = safeValue(key, value, maskSecrets);
    lines.push(colorize(`+ ${key}=${val}`, GREEN, color));
  }

  for (const [key, value] of Object.entries(diff.removed)) {
    const val = safeValue(key, value, maskSecrets);
    lines.push(colorize(`- ${key}=${val}`, RED, color));
  }

  for (const [key, { from, to }] of Object.entries(diff.changed)) {
    const fromVal = safeValue(key, from, maskSecrets);
    const toVal = safeValue(key, to, maskSecrets);
    lines.push(colorize(`~ ${key}: ${fromVal} → ${toVal}`, YELLOW, color));
  }

  return lines.join("\n");
}

export function printDiffReport(
  diff: EnvDiff,
  options: DiffReportOptions = {}
): void {
  const report = formatDiffReport(diff, options);
  console.log(report);
}

export function summarizeDiff(diff: EnvDiff): string {
  const parts: string[] = [];
  const a = Object.keys(diff.added).length;
  const r = Object.keys(diff.removed).length;
  const c = Object.keys(diff.changed).length;
  if (a > 0) parts.push(`${a} added`);
  if (r > 0) parts.push(`${r} removed`);
  if (c > 0) parts.push(`${c} changed`);
  return parts.length > 0 ? parts.join(", ") : "no changes";
}
