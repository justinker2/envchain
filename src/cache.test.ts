import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  hashFileContent,
  readCache,
  writeCache,
  isCacheValid,
  updateCacheEntry,
  clearCache,
  CacheStore,
} from "./cache";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-cache-test-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("hashFileContent", () => {
  it("returns consistent hash for same content", () => {
    const h1 = hashFileContent("FOO=bar");
    const h2 = hashFileContent("FOO=bar");
    expect(h1).toBe(h2);
  });

  it("returns different hash for different content", () => {
    expect(hashFileContent("FOO=bar")).not.toBe(hashFileContent("FOO=baz"));
  });
});

describe("readCache / writeCache", () => {
  it("returns empty store when cache file does not exist", () => {
    const dir = makeTempDir();
    expect(readCache(dir)).toEqual({});
  });

  it("round-trips a cache store", () => {
    const dir = makeTempDir();
    const store: CacheStore = {
      "/some/file.env": { hash: "abc123", env: { FOO: "bar" }, timestamp: 1 },
    };
    writeCache(dir, store);
    expect(readCache(dir)).toEqual(store);
  });
});

describe("isCacheValid", () => {
  it("returns false when entry is missing", () => {
    const dir = makeTempDir();
    expect(isCacheValid("/nonexistent.env", {})).toBe(false);
  });

  it("returns true when file content matches cached hash", () => {
    const dir = makeTempDir();
    const filePath = writeFile(dir, ".env", "FOO=bar");
    let store: CacheStore = {};
    store = updateCacheEntry(filePath, { FOO: "bar" }, store);
    expect(isCacheValid(filePath, store)).toBe(true);
  });

  it("returns false when file content has changed", () => {
    const dir = makeTempDir();
    const filePath = writeFile(dir, ".env", "FOO=bar");
    let store: CacheStore = {};
    store = updateCacheEntry(filePath, { FOO: "bar" }, store);
    fs.writeFileSync(filePath, "FOO=changed", "utf-8");
    expect(isCacheValid(filePath, store)).toBe(false);
  });
});

describe("clearCache", () => {
  it("removes the cache file", () => {
    const dir = makeTempDir();
    writeCache(dir, { "/a.env": { hash: "x", env: {}, timestamp: 0 } });
    clearCache(dir);
    expect(readCache(dir)).toEqual({});
  });
});
