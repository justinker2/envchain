export interface EncryptOptions {
  passphrase: string;
  keys?: string[];
  prefix?: string;
}

export interface EncryptConfig {
  passphrase?: string;
  keys?: string[];
  prefix?: string;
}

export function resolveEncryptConfig(
  config: EncryptConfig,
  env: NodeJS.ProcessEnv = process.env
): EncryptOptions {
  const passphrase =
    config.passphrase ??
    env["ENVCHAIN_PASSPHRASE"] ??
    env["ENVCHAIN_ENCRYPT_KEY"] ??
    "";

  if (!passphrase) {
    throw new Error(
      "Encryption passphrase is required. Set ENVCHAIN_PASSPHRASE or pass it via config."
    );
  }

  return {
    passphrase,
    keys: config.keys,
    prefix: config.prefix ?? "enc:",
  };
}

export function toEncryptOptions(args: {
  passphrase?: string;
  keys?: string;
  prefix?: string;
}): EncryptConfig {
  return {
    passphrase: args.passphrase,
    keys: args.keys ? args.keys.split(",").map((k) => k.trim()) : undefined,
    prefix: args.prefix,
  };
}
