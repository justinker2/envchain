import type { ExportFormat, ExportOptions } from "./export";

export interface ExportConfig {
  format: ExportFormat;
  redact: boolean;
  outputPath?: string;
  includeComments: boolean;
}

const VALID_FORMATS: ExportFormat[] = ["dotenv", "json", "yaml", "shell"];

export function resolveExportConfig(
  overrides: Partial<ExportConfig> = {}
): ExportConfig {
  const formatEnv = process.env.ENVCHAIN_EXPORT_FORMAT as ExportFormat | undefined;
  const redactEnv = process.env.ENVCHAIN_EXPORT_REDACT;
  const outputEnv = process.env.ENVCHAIN_EXPORT_OUTPUT;

  const format: ExportFormat =
    overrides.format ??
    (formatEnv && VALID_FORMATS.includes(formatEnv) ? formatEnv : "dotenv");

  const redact: boolean =
    overrides.redact ?? (redactEnv === "true" ? true : false);

  const outputPath: string | undefined =
    overrides.outputPath ?? outputEnv ?? undefined;

  const includeComments: boolean = overrides.includeComments ?? false;

  return { format, redact, outputPath, includeComments };
}

export function toExportOptions(config: ExportConfig): ExportOptions {
  return {
    format: config.format,
    redact: config.redact,
    outputPath: config.outputPath,
    includeComments: config.includeComments,
  };
}
