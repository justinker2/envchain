import type { RenameResult } from "./rename.ts";

function colorize(text: string, code: number): string {
  return `\x1b[${code}m${text}\x1b[0m`;
}

export function formatRenameReport(results: RenameResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    lines.push(colorize(`\n📄 ${result.file}`, 1));

    if (result.renamed.length > 0) {
      lines.push(colorize("  Renamed:", 32));
      for (const r of result.renamed) {
        lines.push(`    ${colorize(r.from, 33)} → ${colorize(r.to, 36)}`);
      }
    }

    if (result.skipped.length > 0) {
      lines.push(colorize("  Skipped (target key already exists):", 33));
      for (const r of result.skipped) {
        lines.push(`    ${r.from} → ${r.to}`);
      }
    }

    if (result.notFound.length > 0) {
      lines.push(colorize("  Not found:", 31));
      for (const r of result.notFound) {
        lines.push(`    ${r.from}`);
      }
    }

    if (result.renamed.length === 0 && result.skipped.length === 0 && result.notFound.length === 0) {
      lines.push(colorize("  No changes.", 90));
    }
  }

  return lines.join("\n");
}

export function summarizeRename(results: RenameResult[]): string {
  const total = results.reduce((n, r) => n + r.renamed.length, 0);
  const skipped = results.reduce((n, r) => n + r.skipped.length, 0);
  const notFound = results.reduce((n, r) => n + r.notFound.length, 0);
  return [
    colorize(`${total} renamed`, total > 0 ? 32 : 90),
    colorize(`${skipped} skipped`, skipped > 0 ? 33 : 90),
    colorize(`${notFound} not found`, notFound > 0 ? 31 : 90),
  ].join("  ");
}

export function printRenameReport(results: RenameResult[]): void {
  console.log(formatRenameReport(results));
  console.log("\n" + summarizeRename(results) + "\n");
}
