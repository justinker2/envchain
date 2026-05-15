import { describe, it, expect } from "bun:test";
import { encryptValue, decryptValue, encryptEnv, decryptEnv } from "./encrypt";
import { resolveEncryptConfig, toEncryptOptions } from "./encrypt.config";
import { formatEncryptReport, summarizeEncrypt } from "./encrypt.reporter";

const PASSPHRASE = "test-secret-passphrase";

describe("encryptValue / decryptValue", () => {
  it("round-trips a value correctly", () => {
    const original = "super-secret-value";
    const encrypted = encryptValue(original, PASSPHRASE);
    expect(encrypted).not.toBe(original);
    const decrypted = decryptValue(encrypted, PASSPHRASE);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext each call (random IV)", () => {
    const a = encryptValue("hello", PASSPHRASE);
    const b = encryptValue("hello", PASSPHRASE);
    expect(a).not.toBe(b);
  });

  it("throws on wrong passphrase", () => {
    const encrypted = encryptValue("secret", PASSPHRASE);
    expect(() => decryptValue(encrypted, "wrong-passphrase")).toThrow();
  });
});

describe("encryptEnv / decryptEnv", () => {
  it("encrypts all keys when no filter given", () => {
    const env = { API_KEY: "abc", DB_PASS: "xyz" };
    const result = encryptEnv(env, PASSPHRASE);
    expect(result["API_KEY"]).toMatch(/^enc:/);
    expect(result["DB_PASS"]).toMatch(/^enc:/);
  });

  it("encrypts only specified keys", () => {
    const env = { API_KEY: "abc", PUBLIC: "visible" };
    const result = encryptEnv(env, PASSPHRASE, ["API_KEY"]);
    expect(result["API_KEY"]).toMatch(/^enc:/);
    expect(result["PUBLIC"]).toBe("visible");
  });

  it("decrypts enc:-prefixed values", () => {
    const env = { API_KEY: "abc", PUBLIC: "visible" };
    const encrypted = encryptEnv(env, PASSPHRASE);
    const decrypted = decryptEnv(encrypted, PASSPHRASE);
    expect(decrypted).toEqual(env);
  });

  it("leaves non-prefixed values untouched during decrypt", () => {
    const env = { PLAIN: "hello" };
    const result = decryptEnv(env, PASSPHRASE);
    expect(result["PLAIN"]).toBe("hello");
  });
});

describe("resolveEncryptConfig", () => {
  it("uses provided passphrase", () => {
    const opts = resolveEncryptConfig({ passphrase: "my-pass" });
    expect(opts.passphrase).toBe("my-pass");
  });

  it("falls back to ENVCHAIN_PASSPHRASE env var", () => {
    const opts = resolveEncryptConfig({}, { ENVCHAIN_PASSPHRASE: "env-pass" });
    expect(opts.passphrase).toBe("env-pass");
  });

  it("throws when no passphrase available", () => {
    expect(() => resolveEncryptConfig({}, {})).toThrow();
  });
});

describe("toEncryptOptions", () => {
  it("parses comma-separated keys", () => {
    const cfg = toEncryptOptions({ keys: "API_KEY, DB_PASS" });
    expect(cfg.keys).toEqual(["API_KEY", "DB_PASS"]);
  });
});

describe("formatEncryptReport", () => {
  it("renders encrypted and skipped keys", () => {
    const report = { file: ".env", encrypted: ["API_KEY"], skipped: ["OLD_KEY"] };
    const output = formatEncryptReport(report);
    expect(output).toContain("API_KEY");
    expect(output).toContain("OLD_KEY");
  });

  it("summarizes correctly", () => {
    const report = { file: ".env", encrypted: ["A", "B"], skipped: [] };
    expect(summarizeEncrypt(report)).toContain("2 encrypted");
  });
});
