import { ipcMain, nativeTheme } from 'electron';
import { IpcChannels, IpcResult } from '../../../shared/ipc';
import Store from 'electron-store';
import { configExists } from '../../config/reader';
import { writeOMOConfig } from '../../config/writer';
import type { OMOConfig } from '../../../shared/types';
import { ZodError } from 'zod';

interface SettingsStore {
  theme: 'light' | 'dark';
}

const store = new Store<SettingsStore>({
  name: 'settings',
  defaults: {
    theme: 'light',
  },
});

function createSuccessResult<T>(data: T): IpcResult<T> {
  return { success: true, data };
}

function createErrorResult(code: string, message: string): IpcResult<never> {
  return { success: false, error: { code, message } };
}

function formatError(error: unknown): { code: string; message: string } {
  if (error instanceof ZodError) {
    const issues = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { code: 'VALIDATION_ERROR', message: `Validation failed: ${issues}` };
  }
  
  if (error instanceof Error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'EACCES') {
      return { code: 'PERMISSION_DENIED', message: 'Permission denied. Please check file permissions.' };
    }
    if (error.name === 'SyntaxError') {
      return { code: 'PARSE_ERROR', message: `Invalid JSON format: ${error.message}` };
    }
    return { code: 'UNKNOWN_ERROR', message: error.message };
  }
  
  return { code: 'UNKNOWN_ERROR', message: String(error) };
}

function getSystemTheme(): 'light' | 'dark' {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
}

export function registerConfigHandlers(): void {
  ipcMain.handle(IpcChannels.CONFIG_EXISTS, async (): Promise<IpcResult<boolean>> => {
    try {
      const exists = await configExists();
      return createSuccessResult(exists);
    } catch (error) {
      const formatted = formatError(error);
      return createErrorResult(formatted.code, formatted.message);
    }
  });

  ipcMain.handle(
    IpcChannels.WRITE_CONFIG,
    async (_event, config: OMOConfig): Promise<IpcResult<void>> => {
      try {
        await writeOMOConfig(config);
        return createSuccessResult(undefined);
      } catch (error) {
        const formatted = formatError(error);
        return createErrorResult(formatted.code, formatted.message);
      }
    }
  );

  ipcMain.handle(IpcChannels.GET_THEME, async (): Promise<IpcResult<'light' | 'dark'>> => {
    try {
      const savedTheme = store.get('theme');
      if (!savedTheme) {
        return createSuccessResult(getSystemTheme());
      }
      return createSuccessResult(savedTheme);
    } catch (error) {
      const formatted = formatError(error);
      return createErrorResult(formatted.code, formatted.message);
    }
  });

  ipcMain.handle(
    IpcChannels.SET_THEME,
    async (_event, theme: 'light' | 'dark'): Promise<IpcResult<void>> => {
      try {
        if (theme !== 'light' && theme !== 'dark') {
          return createErrorResult('INVALID_THEME', 'Theme must be "light" or "dark"');
        }
        store.set('theme', theme);
        return createSuccessResult(undefined);
      } catch (error) {
        const formatted = formatError(error);
        return createErrorResult(formatted.code, formatted.message);
      }
    }
  );
}
