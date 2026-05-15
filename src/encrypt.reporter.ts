export interface EncryptReport {
  encrypted: string[];
  skipped: string[];
  file: string;
}

function colorize(text: string, code: number): string {
  return process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text;
}

const green = (s: string) => colorize(s, 32);
const yellow = (s: string) => colorize(s, 33);
const bold = (s: string) => colorize(s, 1);
const dim = (s: string) => colorize(s, 2);

export function formatEncryptReport(report: EncryptReport): string {
  const lines: string[] = [];
  lines.push(bold(`Encrypt: ${report.file}`));

  if (report.encrypted.length > 0) {
    lines.push(green(`  ✔ Encrypted (${report.encrypted.length}):`) );
    for (const key of report.encrypted) {
      lines.push(`    ${green("+")} ${key}`);
    }
  }

  if (report.skipped.length > 0) {
    lines.push(yellow(`  ⚠ Already encrypted / skipped (${report.skipped.length}):`) );
    for (const key of report.skipped) {
      lines.push(`    ${dim("-")} ${key}`);
    }
  }

  return lines.join("\n");
}

export function summarizeEncrypt(report: EncryptReport): string {
  return `${report.encrypted.length} encrypted, ${report.skipped.length} skipped in ${report.file}`;
}

export function printEncryptReport(report: EncryptReport): void {
  console.log(formatEncryptReport(report));
  console.log(dim(summarizeEncrypt(report)));
}
