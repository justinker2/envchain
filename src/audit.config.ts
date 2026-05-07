export interface AuditConfig {
  /** Keys that must be present in every resolved env file */
  requiredKeys: string[];
  /** Emit warnings for keys not listed in requiredKeys */
  warnOnExtraKeys: boolean;
  /** Write audit report to disk */
  persistReport: boolean;
  /** Path to write the JSON report (relative to cwd) */
  reportPath: string;
  /** Include file checksums in the report */
  includeChecksums: boolean;
}

export const defaultAuditConfig: AuditConfig = {
  requiredKeys: [],
  warnOnExtraKeys: false,
  persistReport: false,
  reportPath: ".envchain-audit.json",
  includeChecksums: true,
};

export function resolveAuditConfig(
  partial: Partial<AuditConfig> = {}
): AuditConfig {
  return { ...defaultAuditConfig, ...partial };
}

export const auditPresets = {
  strict: resolveAuditConfig({
    warnOnExtraKeys: true,
    persistReport: true,
    includeChecksums: true,
  }),
  ci: resolveAuditConfig({
    warnOnExtraKeys: false,
    persistReport: true,
    includeChecksums: false,
  }),
  silent: resolveAuditConfig({
    warnOnExtraKeys: false,
    persistReport: false,
    includeChecksums: false,
  }),
} satisfies Record<string, AuditConfig>;
