import type { MigrationResult } from "./migrate";

function colorize(text: string, code: number): string {
  return process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text;
}

const green = (s: string) => colorize(s, 32);
const yellow = (s: string) => colorize(s, 33);
const gray = (s: string) => colorize(s, 90);
const bold = (s: string) => colorize(s, 1);

export function formatMigrationReport(results: MigrationResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    lines.push(bold(`\nFile: ${result.file}`));

    if (result.applied.length === 0) {
      lines.push(gray("  No rules applied."));
    } else {
      for (const rule of result.applied) {
        lines.push(green(`  ✔ Renamed: ${rule.from} → ${rule.to}`));
      }
    }

    if (result.skipped.length > 0) {
      for (const rule of result.skipped) {
        lines.push(yellow(`  ⚠ Skipped (not found): ${rule.from}`));
      }
    }
  }

  const totalApplied = results.reduce((n, r) => n + r.applied.length, 0);
  const totalSkipped = results.reduce((n, r) => n + r.skipped.length, 0);

  lines.push(
    `\nSummary: ${green(String(totalApplied))} applied, ${yellow(String(totalSkipped))} skipped across ${results.length} file(s).`
  );

  return lines.join("\n");
}

export function printMigrationReport(results: MigrationResult[]): void {
  console.log(formatMigrationReport(results));
}
