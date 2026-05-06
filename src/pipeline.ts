import { ResolveOptions, resolveEnvFiles } from './resolver';
import { MergeOptions, MergeResult, mergeEnvFiles, applyToProcess } from './merger';
import { validateEnv } from './validator';

export interface PipelineOptions extends ResolveOptions, MergeOptions {
  /** Keys that must be present after merging */
  required?: string[];
  /** Apply merged env to process.env automatically */
  apply?: boolean;
  /** Suppress console output */
  silent?: boolean;
}

export interface PipelineResult extends MergeResult {
  missingKeys: string[];
  valid: boolean;
}

/**
 * Full pipeline: resolve → merge → validate → (optionally) apply.
 */
export function runPipeline(options: PipelineOptions = {}): PipelineResult {
  const { required = [], apply = false, silent = false, ...rest } = options;

  // 1. Resolve
  const resolved = resolveEnvFiles(rest);

  if (!silent) {
    const existing = resolved.filter((f) => f.exists);
    console.log(`[envchain] Found ${existing.length} env file(s) across ${countWorkspaces(resolved)} workspace(s).`);
  }

  // 2. Merge
  const mergeResult = mergeEnvFiles(resolved, rest);

  // 3. Validate
  const missingKeys: string[] = [];
  if (required.length > 0) {
    const validation = validateEnv(mergeResult.env, required);
    missingKeys.push(...(validation.missing ?? []));

    if (!silent && missingKeys.length > 0) {
      console.warn(`[envchain] Missing required keys: ${missingKeys.join(', ')}`);
    }
  }

  // 4. Apply
  if (apply) {
    applyToProcess(mergeResult);
    if (!silent) {
      console.log(`[envchain] Applied ${Object.keys(mergeResult.env).length} variable(s) to process.env.`);
    }
  }

  return {
    ...mergeResult,
    missingKeys,
    valid: missingKeys.length === 0,
  };
}

function countWorkspaces(files: ReturnType<typeof resolveEnvFiles>): number {
  return new Set(files.map((f) => f.workspace)).size;
}
