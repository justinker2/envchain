import { describe, it, expect, beforeEach } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  captureSnapshot,
  saveSnapshot,
  loadLatestSnapshot,
  checksumSnapshot,
  snapshotChanged,
} from "./snapshot.ts";

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "envchain-snapshot-"));
}

function writeEnv(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content, "utf-8");
  return p;
}

describe("checksumSnapshot", () => {
  it("returns same checksum for same values regardless of key order", () => {
    const a = checksumSnapshot({ FOO: "bar", BAZ: "qux" });
    const b = checksumSnapshot({ BAZ: "qux", FOO: "bar" });
    expect(a).toBe(b);
  });

  it("returns different checksum when values differ", () => {
    const a = checksumSnapshot({ FOO: "bar" });
    const b = checksumSnapshot({ FOO: "changed" });
    expect(a).not.toBe(b);
  });
});

describe("captureSnapshot", () => {
  it("captures keys and values from an env file", () => {
    const dir = makeTempDir();
    const file = writeEnv(dir, ".env", "API_KEY=secret\nPORT=3000\n");
    const snap = captureSnapshot(file);
    expect(snap.keys).toEqual(["API_KEY", "PORT"]);
    expect(snap.values["PORT"]).toBe("3000");
    expect(snap.checksum).toHaveLength(16);
    expect(snap.filePath).toBe(file);
  });
});

describe("saveSnapshot / loadLatestSnapshot", () => {
  it("round-trips a snapshot through disk", () => {
    const dir = makeTempDir();
    const snapshotDir = join(dir, ".snapshots");
    const file = writeEnv(dir, ".env", "NAME=envchain\n");
    const snap = captureSnapshot(file);
    saveSnapshot(snap, snapshotDir);
    const loaded = loadLatestSnapshot(file, snapshotDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.checksum).toBe(snap.checksum);
    expect(loaded!.values["NAME"]).toBe("envchain");
  });

  it("returns null when no snapshots exist", () => {
    const dir = makeTempDir();
    const result = loadLatestSnapshot("/nonexistent/.env", join(dir, "snaps"));
    expect(result).toBeNull();
  });
});

describe("snapshotChanged", () => {
  it("returns true when previous is null", () => {
    const dir = makeTempDir();
    const file = writeEnv(dir, ".env", "X=1\n");
    const snap = captureSnapshot(file);
    expect(snapshotChanged(snap, null)).toBe(true);
  });

  it("returns false when checksum matches", () => {
    const dir = makeTempDir();
    const file = writeEnv(dir, ".env", "X=1\n");
    const snap = captureSnapshot(file);
    expect(snapshotChanged(snap, { ...snap })).toBe(false);
  });
});
