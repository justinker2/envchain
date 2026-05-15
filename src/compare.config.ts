export interface CompareOptions {
  maskSensitive: boolean;
  ignoreKeys: string[];
  outputFormat: "text" | "json";
}

const DEFAULTS: CompareOptions = {
  maskSensitive: true,
  ignoreKeys: [],
  outputFormat: "text",
};

export function resolveCompareConfig(
  overrides: Partial<CompareOptions> = {}
): CompareOptions {
  const ignoreEnv = process.env.ENVCHAIN_COMPARE_IGNORE
    ? process.env.ENVCHAIN_COMPARE_IGNORE.split(",").map((k) => k.trim())
    : [];

  const formatEnv = process.env.ENVCHAIN_COMPARE_FORMAT as CompareOptions["outputFormat"] | undefined;

  return {
    ...DEFAULTS,
    ignoreKeys: [...ignoreEnv, ...(overrides.ignoreKeys ?? [])],
    outputFormat: overrides.outputFormat ?? formatEnv ?? DEFAULTS.outputFormat,
    maskSensitive: overrides.maskSensitive ?? DEFAULTS.maskSensitive,
  };
}

export function applyIgnoreKeys<T extends { key: string }>(
  entries: T[],
  ignoreKeys: string[]
): T[] {
  if (ignoreKeys.length === 0) return entries;
  return entries.filter((e) => !ignoreKeys.includes(e.key));
}
