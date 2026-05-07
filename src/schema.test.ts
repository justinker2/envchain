import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateWithSchema, buildSchemaFromKeys } from "./schema";

describe("validateWithSchema", () => {
  const schema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.string().regex(/^\d+$/, "PORT must be numeric"),
  });

  it("returns success for valid env", () => {
    const result = validateWithSchema(
      { DATABASE_URL: "http://localhost:5432", PORT: "3000" },
      schema
    );
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ PORT: "3000" });
  });

  it("returns errors for invalid env", () => {
    const result = validateWithSchema(
      { DATABASE_URL: "not-a-url", PORT: "abc" },
      schema
    );
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors?.map((e) => e.key)).toContain("DATABASE_URL");
    expect(result.errors?.map((e) => e.key)).toContain("PORT");
  });

  it("returns errors for missing required keys", () => {
    const result = validateWithSchema({}, schema);
    expect(result.success).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});

describe("buildSchemaFromKeys", () => {
  it("creates schema with required and optional keys", () => {
    const schema = buildSchemaFromKeys(["API_KEY"], ["DEBUG"]);
    expect(schema.safeParse({ API_KEY: "abc123" }).success).toBe(true);
    expect(schema.safeParse({ API_KEY: "abc123", DEBUG: "true" }).success).toBe(true);
  });

  it("fails when required key is missing", () => {
    const schema = buildSchemaFromKeys(["API_KEY"]);
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("fails when required key is empty string", () => {
    const schema = buildSchemaFromKeys(["API_KEY"]);
    const result = schema.safeParse({ API_KEY: "" });
    expect(result.success).toBe(false);
  });

  it("allows optional key to be absent", () => {
    const schema = buildSchemaFromKeys(["API_KEY"], ["OPTIONAL_VAR"]);
    const result = schema.safeParse({ API_KEY: "val" });
    expect(result.success).toBe(true);
  });
});
