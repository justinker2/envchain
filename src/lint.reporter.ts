import type { LintResult } from "./lint";

function colorize(text: string, code: number): string {
  return process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text;
}

const red = (t: string) => colorize(t, 31);
const yellow = (t: string) => colorize(t, 33);
const green = (t: string) => colorize(t, 32);
const bold = (t: string) => colorize(t, 1);
const dim = (t: string) => colorize(t, 2);

export function formatLintReport(results: LintResult[]): string {
  const lines: string[] = [];
  let totalViolations = 0;

  for (const result of results) {
    if (result.violations.length === 0) {
      lines.push(`${green("✔")} ${bold(result.file)} — no issues`);
      continue;
    }

    lines.push(`\n${red("✖")} ${bold(result.file)}`);
    for (const v of result.violations) {
      lines.push(
        `  ${dim(`line ${v.line}`)}  ${yellow(v.key)}  ${red(v.rule)}  ${v.message}`
      );
      totalViolations++;
    }
  }

  lines.push("");
  if (totalViolations === 0) {
    lines.push(green(`All ${results.length} file(s) passed lint checks.`));
  } else {
    lines.push(red(`Found ${totalViolations} violation(s) across ${results.length} file(s).`));
  }

  return lines.join("\n");
}

export function printLintReport(results: LintResult[]): void {
  console.log(formatLintReport(results));
}

export function summarizeLint(results: LintResult[]): { files: number; violations: number; passed: number } {
  const violations = results.reduce((sum, r) => sum + r.violations.length, 0);
  const passed = results.filter((r) => r.violations.length === 0).length;
  return { files: results.length, violations, passed };
}
