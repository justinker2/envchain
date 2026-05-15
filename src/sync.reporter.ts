import type { SyncResult } from "./sync";

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`;
}

export function formatSyncReport(results: SyncResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    const label = result.created
      ? colorize("[created]", 33)
      : colorize("[updated]", 36);
    lines.push(`${label} ${result.target}`);

    if (result.synced.length > 0) {
      for (const key of result.synced) {
        lines.push(`  ${colorize("+", 32)} ${key}`);
      }
    }

    if (result.skipped.length > 0) {
      for (const key of result.skipped) {
        lines.push(`  ${colorize("~", 33)} ${key} (skipped, already set)`);
      }
    }

    if (result.synced.length === 0 && result.skipped.length === 0) {
      lines.push(`  ${colorize("no keys matched", 90)}`);
    }
  }

  return lines.join("\n");
}

export function summarizeSync(results: SyncResult[]): string {
  const totalSynced = results.reduce((n, r) => n + r.synced.length, 0);
  const totalSkipped = results.reduce((n, r) => n + r.skipped.length, 0);
  const files = results.length;
  return colorize(
    `Synced ${totalSynced} key(s) across ${files} file(s), ${totalSkipped} skipped.`,
    90
  );
}

export function printSyncReport(results: SyncResult[]): void {
  console.log(formatSyncReport(results));
  console.log(summarizeSync(results));
}
