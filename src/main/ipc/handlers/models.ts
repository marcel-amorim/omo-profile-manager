import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IpcChannels, IpcResult } from '../../../shared/ipc';

const execAsync = promisify(exec);

let cachedModels: string[] | null = null;
let isFetching = false;
let fetchPromise: Promise<string[]> | null = null;
let resolvedEnv: NodeJS.ProcessEnv | null = null;

async function getShellEnv(): Promise<NodeJS.ProcessEnv> {
  if (resolvedEnv) return resolvedEnv;

  if (process.platform === 'win32') {
    resolvedEnv = process.env;
    return resolvedEnv;
  }

  const shell = process.env.SHELL || '/bin/zsh';
  try {
    const { stdout } = await execAsync(`${shell} -ilc 'echo "___PATH_START___$PATH___PATH_END___"'`, {
      timeout: 5000,
      env: { ...process.env },
    });
    const match = stdout.match(/___PATH_START___(.+?)___PATH_END___/);
    if (match) {
      resolvedEnv = { ...process.env, PATH: match[1] };
      return resolvedEnv;
    }
  } catch (error) {
    console.warn('Failed to resolve shell PATH, falling back to process.env:', error);
  }

  resolvedEnv = process.env;
  return resolvedEnv;
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
      const env = await getShellEnv();
      const { stdout } = await execAsync('opencode models', { env });
      const models = stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith(' ') && !line.includes('[Agent Usage Reminder]'));
      
      cachedModels = models;
      return models;
    } catch (error) {
      console.error('Failed to fetch opencode models:', error);
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
