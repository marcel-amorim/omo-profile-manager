import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IpcChannels, IpcResult } from '../../../shared/ipc';

const execAsync = promisify(exec);

let cachedModels: string[] | null = null;
let isFetching = false;
let fetchPromise: Promise<string[]> | null = null;

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
      const { stdout } = await execAsync('opencode models');
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
