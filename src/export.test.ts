import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { exportEnv, serializeEnvAs, serializeAsJson, serializeAsYaml, serializeAsShell } from "./export";
import { resolveExportConfig, toExportOptions } from "./export.config";
import { formatExportReport, summarizeExport } from "./export.reporter";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-export-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const file = path.join(dir, name);
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("serializeEnvAs", () => {
  const env = { API_KEY: "secret", PORT: "3000" };

  it("serializes as dotenv", () => {
    const out = serializeEnvAs(env, "dotenv");
    expect(out).toContain("API_KEY=");
    expect(out).toContain("PORT=");
  });

  it("serializes as json", () => {
    const out = serializeAsJson(env);
    const parsed = JSON.parse(out);
    expect(parsed.API_KEY).toBe("secret");
    expect(parsed.PORT).toBe("3000");
  });

  it("serializes as yaml", () => {
    const out = serializeAsYaml(env);
    expect(out).toContain("API_KEY:");
    expect(out).toContain("PORT:");
  });

  it("serializes as shell", () => {
    const out = serializeAsShell(env);
    expect(out).toContain("export API_KEY=");
    expect(out).toContain("export PORT=");
  });
});

describe("exportEnv", () => {
  let dir: string;

  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("exports merged env as dotenv string", () => {
    const f = writeEnv(dir, ".env", "FOO=bar\nBAZ=qux\n");
    const out = exportEnv([f], { format: "dotenv" });
    expect(out).toContain("FOO=");
    expect(out).toContain("BAZ=");
  });

  it("writes output to file when outputPath provided", () => {
    const f = writeEnv(dir, ".env", "X=1\n");
    const outFile = path.join(dir, "out", "result.env");
    exportEnv([f], { format: "json", outputPath: outFile });
    expect(fs.existsSync(outFile)).toBe(true);
    const content = fs.readFileSync(outFile, "utf-8");
    expect(JSON.parse(content).X).toBe("1");
  });
});

describe("resolveExportConfig", () => {
  it("returns defaults", () => {
    const cfg = resolveExportConfig();
    expect(cfg.format).toBe("dotenv");
    expect(cfg.redact).toBe(false);
  });

  it("applies overrides", () => {
    const cfg = resolveExportConfig({ format: "json", redact: true });
    expect(cfg.format).toBe("json");
    expect(cfg.redact).toBe(true);
  });
});

describe("formatExportReport", () => {
  it("includes key count and format", () => {
    const summary = summarizeExport({ A: "1", B: "2" }, "json", false, ["a.env"]);
    const report = formatExportReport(summary);
    expect(report).toContain("json");
    expect(report).toContain("2");
    expect(report).toContain("a.env");
  });
});
