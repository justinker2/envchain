import { mergeEnvFiles } from "./merger";
import { serializeEnv, formatEnv } from "./formatter";
import { redactEnv } from "./redactor";
import * as fs from "fs";
import * as path from "path";

export type ExportFormat = "dotenv" | "json" | "yaml" | "shell";

export interface ExportOptions {
  format?: ExportFormat;
  redact?: boolean;
  outputPath?: string;
  includeComments?: boolean;
}

export function serializeAsJson(env: Record<string, string>): string {
  return JSON.stringify(env, null, 2);
}

export function serializeAsYaml(env: Record<string, string>): string {
  const lines = Object.entries(env).map(
    ([k, v]) => `${k}: ${JSON.stringify(v)}`
  );
  return lines.join("\n") + "\n";
}

export function serializeAsShell(env: Record<string, string>): string {
  const lines = Object.entries(env).map(
    ([k, v]) => `export ${k}=${JSON.stringify(v)}`
  );
  return lines.join("\n") + "\n";
}

export function serializeEnvAs(
  env: Record<string, string>,
  format: ExportFormat
): string {
  switch (format) {
    case "json":
      return serializeAsJson(env);
    case "yaml":
      return serializeAsYaml(env);
    case "shell":
      return serializeAsShell(env);
    case "dotenv":
    default:
      return serializeEnv(env);
  }
}

export function exportEnv(
  envFiles: string[],
  options: ExportOptions = {}
): string {
  const { format = "dotenv", redact = false, outputPath, includeComments = false } = options;

  let env = mergeEnvFiles(envFiles);

  if (redact) {
    const redacted = redactEnv(env);
    env = Object.fromEntries(
      Object.entries(redacted).map(([k, v]) => [k, v.value])
    );
  }

  const output = serializeEnvAs(env, format);

  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, output, "utf-8");
  }

  return output;
}
