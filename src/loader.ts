import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export interface LoadOptions {
  cwd?: string;
  files?: string[];
  override?: boolean;
}

export interface LoadResult {
  loaded: string[];
  skipped: string[];
  parsed: Record<string, string>;
}

/**
 * Loads and chains multiple .env files in order.
 * Later files take precedence unless override is false.
 */
export function loadEnvChain(options: LoadOptions = {}): LoadResult {
  const {
    cwd = process.cwd(),
    files = ['.env', '.env.local'],
    override = true,
  } = options;

  const loaded: string[] = [];
  const skipped: string[] = [];
  const parsed: Record<string, string> = {};

  for (const file of files) {
    const filePath = path.isAbsolute(file) ? file : path.resolve(cwd, file);

    if (!fs.existsSync(filePath)) {
      skipped.push(filePath);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const result = dotenv.parse(content);

    for (const [key, value] of Object.entries(result)) {
      if (override || !(key in parsed)) {
        parsed[key] = value;
      }
    }

    loaded.push(filePath);
  }

  if (override) {
    Object.assign(process.env, parsed);
  } else {
    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }

  return { loaded, skipped, parsed };
}
