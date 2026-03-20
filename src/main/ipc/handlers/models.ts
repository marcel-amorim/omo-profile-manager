import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IpcChannels, IpcResult } from '../../../shared/ipc';

const execAsync = promisify(exec);

let cachedModels: string[] | null = null;
let isFetching = false;
let fetchPromise: Promise<string[]> | null = null;
let resolvedBinaryPath: string | null = null;

const COMMON_BINARY_PATHS = [
  '/usr/local/bin/opencode',
  '/opt/homebrew/bin/opencode',
  '/usr/bin/opencode',
  '/bin/opencode',
  `${process.env.HOME}/.local/bin/opencode`,
  `${process.env.HOME}/.bun/bin/opencode`,
  `${process.env.HOME}/.cargo/bin/opencode`,
];

async function findOpencodeBinaryPath(): Promise<string> {
  if (resolvedBinaryPath) return resolvedBinaryPath;

  if (process.platform === 'win32') {
    resolvedBinaryPath = 'opencode';
    return resolvedBinaryPath;
  }

  for (const binPath of COMMON_BINARY_PATHS) {
    try {
      await execAsync(`test -x "${binPath}" && echo "found"`, { timeout: 2000 });
      resolvedBinaryPath = binPath;
      return resolvedBinaryPath;
    } catch {}
  }

  const shell = process.env.SHELL || '/bin/zsh';
  try {
    const { stdout } = await execAsync(
      `${shell} -lc 'command -v opencode || which opencode || echo ""'`,
      { timeout: 8000, env: { ...process.env } }
    );
    const path = stdout.trim();
    if (path && path.length > 0 && !path.includes('not found') && !path.includes('no opencode')) {
      resolvedBinaryPath = path;
      return resolvedBinaryPath;
    }
  } catch (error) {
    console.warn('Failed to find opencode via shell command -v/which:', error);
  }

  resolvedBinaryPath = 'opencode';
  return resolvedBinaryPath;
}

async function fetchModels(): Promise<string[]> {
  if (cachedModels) {
    return cachedModels;
  }

  if (isFetching && fetchPromise) {
    return fetchPromise;
  }

  isFetching = true;
  fetchPromise = (async () => {
    try {
      const binaryPath = await findOpencodeBinaryPath();
      console.log('[models] Using opencode binary:', binaryPath);

      const { stdout } = await execAsync(`"${binaryPath}" models`, {
        timeout: 15000,
        env: { ...process.env },
      });

      const models = stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith(' ') && !line.includes('[Agent Usage Reminder]'));

      console.log('[models] Found models:', models.length, models.slice(0, 3));
      cachedModels = models;
      return models;
    } catch (error) {
      console.error('[models] Failed to fetch opencode models:', error);
      return [];
    } finally {
      isFetching = false;
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function registerModelsHandlers(): void {
  fetchModels().catch(console.error);

  ipcMain.handle(
    IpcChannels.LIST_MODELS,
    async (): Promise<IpcResult<string[]>> => {
      try {
        const models = await fetchModels();
        return { success: true, data: models };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: { code: 'FETCH_FAILED', message } };
      }
    }
  );
}
