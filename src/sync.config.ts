export interface SyncConfig {
  source?: string;
  targets?: string[];
  keys?: string[];
  overwrite?: boolean;
  dryRun?: boolean;
}

export interface ResolvedSyncOptions {
  source: string;
  targets: string[];
  keys?: string[];
  overwrite: boolean;
  dryRun: boolean;
}

export function resolveSyncConfig(
  config: SyncConfig,
  overrides: Partial<SyncConfig> = {}
): ResolvedSyncOptions {
  const merged = { ...config, ...overrides };

  if (!merged.source) {
    throw new Error("sync: 'source' is required");
  }

  if (!merged.targets || merged.targets.length === 0) {
    throw new Error("sync: at least one 'target' is required");
  }

  return {
    source: merged.source,
    targets: merged.targets,
    keys: merged.keys,
    overwrite: merged.overwrite ?? false,
    dryRun: merged.dryRun ?? false,
  };
}

export function toSyncOptions(config: ResolvedSyncOptions) {
  return {
    source: config.source,
    targets: config.targets,
    keys: config.keys,
    overwrite: config.overwrite,
    dryRun: config.dryRun,
  };
}
