import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-cbc";
const KEY_LEN = 32;
const IV_LEN = 16;
const SALT_LEN = 16;

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, KEY_LEN) as Buffer;
}

export function encryptValue(value: string, passphrase: string): string {
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = deriveKey(passphrase, salt);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([salt, iv, encrypted]).toString("base64");
}

export function decryptValue(encoded: string, passphrase: string): string {
  const buf = Buffer.from(encoded, "base64");
  const salt = buf.subarray(0, SALT_LEN);
  const iv = buf.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const encrypted = buf.subarray(SALT_LEN + IV_LEN);
  const key = deriveKey(passphrase, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function encryptEnv(
  env: Record<string, string>,
  passphrase: string,
  keys?: string[]
): Record<string, string> {
  const targets = keys ?? Object.keys(env);
  const result: Record<string, string> = { ...env };
  for (const key of targets) {
    if (key in result) {
      result[key] = `enc:${encryptValue(result[key], passphrase)}`;
    }
  }
  return result;
}

export function decryptEnv(
  env: Record<string, string>,
  passphrase: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    result[key] = value.startsWith("enc:") ? decryptValue(value.slice(4), passphrase) : value;
  }
  return result;
}
