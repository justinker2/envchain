import type { ExportFormat } from "./export";

function colorize(text: string, code: number): string {
  return process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text;
}

const green = (s: string) => colorize(s, 32);
const cyan = (s: string) => colorize(s, 36);
const gray = (s: string) => colorize(s, 90);
const bold = (s: string) => colorize(s, 1);

export interface ExportSummary {
  format: ExportFormat;
  keyCount: number;
  redacted: boolean;
  outputPath?: string;
  sources: string[];
}

export function formatExportReport(summary: ExportSummary): string {
  const lines: string[] = [];

  lines.push(bold("envchain export"));
  lines.push("");
  lines.push(`  ${gray("Format:")}   ${cyan(summary.format)}`);
  lines.push(`  ${gray("Keys:")}     ${green(String(summary.keyCount))}`);
  lines.push(`  ${gray("Redacted:")} ${summary.redacted ? green("yes") : gray("no")}`);

  if (summary.outputPath) {
    lines.push(`  ${gray("Output:")}   ${summary.outputPath}`);
  } else {
    lines.push(`  ${gray("Output:")}   ${gray("stdout")}`);
  }

  if (summary.sources.length > 0) {
    lines.push("");
    lines.push(gray("  Sources:"));
    for (const src of summary.sources) {
      lines.push(`    ${gray("-")} ${src}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

export function printExportReport(summary: ExportSummary): void {
  process.stdout.write(formatExportReport(summary));
}

export function summarizeExport(
  env: Record<string, string>,
  format: ExportFormat,
  redacted: boolean,
  sources: string[],
  outputPath?: string
): ExportSummary {
  return {
    format,
    keyCount: Object.keys(env).length,
    redacted,
    outputPath,
    sources,
  };
}
