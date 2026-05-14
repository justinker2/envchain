import type { MigrationRule } from "./migrate";

export interface MigrateConfig {
  rules: MigrationRule[];
  dryRun?: boolean;
  files?: string[];
}

export const defaultMigrateConfig: MigrateConfig = {
  rules: [],
  dryRun: false,
  files: [".env", ".env.local"],
};

export function resolveMigrateConfig(
  partial: Partial<MigrateConfig> = {}
): MigrateConfig {
  return {
    ...defaultMigrateConfig,
    ...partial,
    rules: [
      ...(defaultMigrateConfig.rules ?? []),
      ...(partial.rules ?? []),
    ],
  };
}

export const commonMigrationRules: Record<string, MigrationRule> = {
  dbUrlRename: {
    from: "DATABASE_URL",
    to: "DB_URL",
  },
  apiKeyPrefix: {
    from: "API_KEY",
    to: "SERVICE_API_KEY",
  },
  portToNumber: {
    from: "PORT",
    to: "APP_PORT",
    transform: (v) => String(parseInt(v, 10) || 3000),
  },
};
