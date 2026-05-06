import * as fs from 'fs';
import * as path from 'path';
import { runPipeline } from './pipeline';

export interface WatchOptions {
  cwd?: string;
  debounceMs?: number;
  onReload?: (changedFile: string) => void;
  onError?: (err: Error) => void;
}

const DEFAULT_DEBOUNCE_MS = 300;

export function watchEnvFiles(
  envFiles: string[],
  options: WatchOptions = {}
): () => void {
  const {
    cwd = process.cwd(),
    debounceMs = DEFAULT_DEBOUNCE_MS,
    onReload,
    onError,
  } = options;

  const watchers: fs.FSWatcher[] = [];
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const handleChange = (filePath: string) => {
    const existing = debounceTimers.get(filePath);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      debounceTimers.delete(filePath);
      try {
        await runPipeline({ cwd });
        onReload?.(filePath);
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    }, debounceMs);

    debounceTimers.set(filePath, timer);
  };

  for (const file of envFiles) {
    const absolutePath = path.resolve(cwd, file);
    if (!fs.existsSync(absolutePath)) continue;

    try {
      const watcher = fs.watch(absolutePath, (eventType) => {
        if (eventType === 'change' || eventType === 'rename') {
          handleChange(absolutePath);
        }
      });
      watchers.push(watcher);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  return () => {
    for (const timer of debounceTimers.values()) clearTimeout(timer);
    debounceTimers.clear();
    for (const watcher of watchers) watcher.close();
    watchers.length = 0;
  };
}
