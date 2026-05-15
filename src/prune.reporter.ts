import type { PruneResult } from "./prune";

function colorize(text: string, code: number): string {
  return process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text;
}

export function formatPruneReport(results: PruneResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    const label = colorize(result.file, 36);
    if (result.removed.length === 0) {
      lines.push(`${label}: ${colorize("nothing to prune", 2)}`);
      continue;
    }
    lines.push(`${label}: removed ${result.removed.length} unused key(s)`);
    for (const key of result.removed) {
      lines.push(`  ${colorize("-", 31)} ${key}`);
    }
  }

  return lines.join("\n");
}

export function summarizePrune(
  results: PruneResult[]
): { total: number; files: number } {
  const total = results.reduce((sum, r) => sum + r.removed.length, 0);
  const files = results.filter((r) => r.removed.length > 0).length;
  return { total, files };
}

export function printPruneReport(results: PruneResult[]): void {
  const report = formatPruneReport(results);
  if (report) console.log(report);

  const { total, files } = summarizePrune(results);
  if (total > 0) {
    console.log(
      colorize(`\nPruned ${total} key(s) across ${files} file(s).`, 33)
    );
  } else {
    console.log(colorize("\nAll env files are clean.", 32));
  }
}
