export interface PruneConfig {
  dryRun: boolean;
  keepComments: boolean;
  files: string[];
  usedKeys: string[];
}

const DEFAULTS: PruneConfig = {
  dryRun: false,
  keepComments: true,
  files: [".env"],
  usedKeys: [],
};

export function resolvePruneConfig(
  partial: Partial<PruneConfig> = {}
): PruneConfig {
  return { ...DEFAULTS, ...partial };
}

export function toPruneOptions(config: PruneConfig): {
  dryRun: boolean;
  keepComments: boolean;
} {
  return {
    dryRun: config.dryRun,
    keepComments: config.keepComments,
  };
}
