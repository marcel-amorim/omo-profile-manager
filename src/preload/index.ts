import { ipcRenderer, contextBridge } from 'electron'
import { IpcChannels, type IpcResult, type ShortcutAction } from '../shared/ipc'

const invoke = async <T>(channel: IpcChannels, ...args: unknown[]): Promise<IpcResult<T>> => {
  try {
    const result = await ipcRenderer.invoke(channel, ...args)
    return result as IpcResult<T>
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'IPC_ERROR',
        message: error instanceof Error ? error.message : String(error),
        details: error,
      },
    }
  }
}

contextBridge.exposeInMainWorld('electron', {
  config: {
    readConfig: () => invoke(IpcChannels.READ_CONFIG),
    writeConfig: (config: unknown) => invoke(IpcChannels.WRITE_CONFIG, config),
    getConfigPath: () => invoke(IpcChannels.GET_CONFIG_PATH),
    configExists: () => invoke(IpcChannels.CONFIG_EXISTS),
  },
  profiles: {
    listProfiles: () => invoke(IpcChannels.LIST_PROFILES),
    getProfile: (id: string) => invoke(IpcChannels.GET_PROFILE, id),
    saveProfile: (profile: unknown) => invoke(IpcChannels.SAVE_PROFILE, profile),
    deleteProfile: (id: string) => invoke(IpcChannels.DELETE_PROFILE, id),
    duplicateProfile: (id: string) => invoke(IpcChannels.DUPLICATE_PROFILE, id),
    getActiveProfileId: () => invoke(IpcChannels.GET_ACTIVE_PROFILE),
    setActiveProfileId: (id: string) => invoke(IpcChannels.SET_ACTIVE_PROFILE, id),
  },
  backups: {
    listBackups: () => invoke(IpcChannels.LIST_BACKUPS),
    restoreBackup: (timestamp: number) => invoke(IpcChannels.RESTORE_BACKUP, timestamp),
  },
  theme: {
    getTheme: () => invoke(IpcChannels.GET_THEME),
    setTheme: (theme: 'light' | 'dark') => invoke(IpcChannels.SET_THEME, theme),
  },
  models: {
    listModels: () => invoke<string[]>(IpcChannels.LIST_MODELS),
  },
  shortcuts: {
    onShortcut: (callback: (action: ShortcutAction) => void) => {
      const handler = (_: unknown, action: ShortcutAction) => callback(action);
      ipcRenderer.on(IpcChannels.SHORTCUT_TRIGGERED, handler);
      return () => {
        ipcRenderer.removeListener(IpcChannels.SHORTCUT_TRIGGERED, handler);
      };
    },
  },
})
