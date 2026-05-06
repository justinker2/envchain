export { loadEnvChain } from './loader';
export type { LoadOptions, LoadResult } from './loader';

/**
 * Convenience function: load env chain with sensible defaults for monorepos.
 * Loads from workspace root and current package directory in order.
 */
export function init(options: {
  root?: string;
  cwd?: string;
  env?: string;
  override?: boolean;
} = {}): import('./loader').LoadResult {
  const { loadEnvChain } = require('./loader');

  const cwd = options.cwd ?? process.cwd();
  const root = options.root ?? cwd;
  const env = options.env ?? process.env.NODE_ENV ?? 'development';
  const override = options.override ?? true;

  const files: string[] = [
    // Root-level base env
    `${root}/.env`,
    `${root}/.env.${env}`,
    // Package-level overrides (only added if different from root)
    ...(cwd !== root
      ? [
          `${cwd}/.env`,
          `${cwd}/.env.${env}`,
          `${cwd}/.env.local`,
        ]
      : [`${root}/.env.local`]),
  ];

  return loadEnvChain({ files, override });
}
