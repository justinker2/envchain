import { describe, it, expect } from "vitest";
import { redactEnv, redactValue, serializeRedacted } from "./redactor.ts";

describe("redactEnv", () => {
  it("redacts sensitive keys by name heuristic", () => {
    const env = { API_KEY: "secret123", APP_NAME: "myapp" };
    const result = redactEnv(env);
    expect(result.API_KEY).toBe("[REDACTED]");
    expect(result.APP_NAME).toBe("myapp");
  });

  it("uses custom placeholder", () => {
    const env = { SECRET: "topsecret" };
    const result = redactEnv(env, { placeholder: "***" });
    expect(result.SECRET).toBe("***");
  });

  it("respects forceRedact list", () => {
    const env = { MY_CUSTOM_VAR: "value" };
    const result = redactEnv(env, { forceRedact: ["MY_CUSTOM_VAR"] });
    expect(result.MY_CUSTOM_VAR).toBe("[REDACTED]");
  });

  it("respects allowList for normally sensitive keys", () => {
    const env = { API_KEY: "public-key-ok" };
    const result = redactEnv(env, { allowList: ["API_KEY"] });
    expect(result.API_KEY).toBe("public-key-ok");
  });

  it("returns a new object without mutating the original", () => {
    const env = { TOKEN: "abc" };
    const result = redactEnv(env);
    expect(result).not.toBe(env);
    expect(env.TOKEN).toBe("abc");
  });
});

describe("redactValue", () => {
  it("redacts a sensitive key", () => {
    expect(redactValue("DB_PASSWORD", "hunter2")).toBe("[REDACTED]");
  });

  it("passes through a non-sensitive key", () => {
    expect(redactValue("PORT", "3000")).toBe("3000");
  });

  it("uses custom placeholder", () => {
    expect(redactValue("SECRET", "val", { placeholder: "<hidden>" })).toBe(
      "<hidden>"
    );
  });

  it("allowList overrides sensitive heuristic", () => {
    expect(
      redactValue("API_SECRET", "visible", { allowList: ["API_SECRET"] })
    ).toBe("visible");
  });
});

describe("serializeRedacted", () => {
  it("produces dotenv-style output with masked sensitive values", () => {
    const env = { API_KEY: "abcdefgh", APP_NAME: "envchain" };
    const output = serializeRedacted(env);
    const lines = output.split("\n");
    const keyLine = lines.find((l) => l.startsWith("API_KEY="))?? "";
    const nameLine = lines.find((l) => l.startsWith("APP_NAME=")) ?? "";
    expect(keyLine).not.toContain("abcdefgh");
    expect(nameLine).toContain("envchain");
  });

  it("keeps allowList values visible", () => {
    const env = { TOKEN: "plaintoken" };
    const output = serializeRedacted(env, { allowList: ["TOKEN"] });
    expect(output).toContain("plaintoken");
  });
});
