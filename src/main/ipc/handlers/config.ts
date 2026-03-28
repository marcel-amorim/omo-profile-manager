import { ipcMain, nativeTheme } from 'electron';
import { Config, IpcChannels, IpcResult } from '../../../shared/ipc';
import Store from 'electron-store';
import { configExists, readOMOConfig } from '../../config/reader';
import { writeOMOConfig } from '../../config/writer';
import type { OMOConfig, OMOSharedSettings } from '../../../shared/types';
import { createDefaultSharedSettings, extractSharedSettings } from '../../../shared/config-scope';
import { OMO_CONFIG_PATH } from '../../config/paths';
import { OMOGlobalSettingsSchema } from '../../../shared/schemas';
import { ZodError } from 'zod';

interface SettingsStore {
  theme: 'light' | 'dark';
  sharedSettings: OMOSharedSettings;
  sharedSettingsInitialized: boolean;
}

const store = new Store<SettingsStore>({
  cwd: 'omo-profile-manager',
  name: 'settings',
  defaults: {
    theme: 'light',
    sharedSettings: createDefaultSharedSettings(),
    sharedSettingsInitialized: false,
  },
});

function isValidConfigPayload(config: unknown): config is Config {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return false;
  }

  const payload = config as Record<string, unknown>;
  return (
    typeof payload.agents === 'object' &&
    payload.agents !== null &&
    typeof payload.categories === 'object' &&
    payload.categories !== null
  );
}

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

function isValidSharedSettingsPayload(settings: unknown): settings is OMOSharedSettings {
  return OMOGlobalSettingsSchema.safeParse(settings).success;
}

async function getSharedSettings(): Promise<OMOSharedSettings> {
  const hasInitializedSharedSettings = store.get('sharedSettingsInitialized');

  if (!hasInitializedSharedSettings) {
    let nextSharedSettings = createDefaultSharedSettings();

    try {
      const currentConfig = await readOMOConfig();
      nextSharedSettings = extractSharedSettings(currentConfig);
    } catch {
      nextSharedSettings = createDefaultSharedSettings();
    }

    store.set('sharedSettings', nextSharedSettings);
    store.set('sharedSettingsInitialized', true);
    return nextSharedSettings;
  }

  return extractSharedSettings(store.get('sharedSettings'));
}

export function registerConfigHandlers(): void {
  ipcMain.handle(IpcChannels.READ_CONFIG, async (): Promise<IpcResult<Config>> => {
    try {
      const config = await readOMOConfig();
      if (!config) {
        return createSuccessResult({ agents: {}, categories: {} });
      }
      return createSuccessResult({
        agents: config.agents,
        categories: config.categories,
      });
    } catch (error) {
      const formatted = formatError(error);
      return createErrorResult(formatted.code, formatted.message);
    }
  });

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
    async (_event, config: unknown): Promise<IpcResult<void>> => {
      try {
        if (!isValidConfigPayload(config)) {
          return createErrorResult('INVALID_CONFIG', 'Config must be a valid object');
        }

        await writeOMOConfig(config as OMOConfig);
        return createSuccessResult(undefined);
      } catch (error) {
        const formatted = formatError(error);
        return createErrorResult(formatted.code, formatted.message);
      }
    }
  );

  ipcMain.handle(IpcChannels.READ_SHARED_SETTINGS, async (): Promise<IpcResult<OMOSharedSettings>> => {
    try {
      const sharedSettings = await getSharedSettings();
      return createSuccessResult(sharedSettings);
    } catch (error) {
      const formatted = formatError(error);
      return createErrorResult(formatted.code, formatted.message);
    }
  });

  ipcMain.handle(
    IpcChannels.WRITE_SHARED_SETTINGS,
    async (_event, settings: unknown): Promise<IpcResult<void>> => {
      try {
        if (!isValidSharedSettingsPayload(settings)) {
          return createErrorResult('INVALID_SHARED_SETTINGS', 'Shared settings must be a valid object');
        }

        store.set('sharedSettings', extractSharedSettings(settings));
        store.set('sharedSettingsInitialized', true);
        return createSuccessResult(undefined);
      } catch (error) {
        const formatted = formatError(error);
        return createErrorResult(formatted.code, formatted.message);
      }
    }
  );

  ipcMain.handle(IpcChannels.GET_CONFIG_PATH, async (): Promise<IpcResult<string>> => {
    try {
      return createSuccessResult(OMO_CONFIG_PATH);
    } catch (error) {
      const formatted = formatError(error);
      return createErrorResult(formatted.code, formatted.message);
    }
  });

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
