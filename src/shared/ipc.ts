import type { Profile as OMOProfile } from './types';

export interface Config {
  agents: Record<string, unknown>;
  categories: Record<string, unknown>;
}

export type Profile = OMOProfile;

export interface Backup {
  timestamp: number;
  filename: string;
  size: number;
  profileCount: number;
}

export type IpcError = {
  code: string;
  message: string;
  details?: unknown;
};

export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: IpcError };

export enum IpcChannels {
  READ_CONFIG = 'config:read',
  WRITE_CONFIG = 'config:write',
  GET_CONFIG_PATH = 'config:get-path',
  CONFIG_EXISTS = 'config:exists',
  GET_THEME = 'theme:get',
  SET_THEME = 'theme:set',

  LIST_PROFILES = 'profiles:list',
  GET_PROFILE = 'profiles:get',
  SAVE_PROFILE = 'profiles:save',
  DELETE_PROFILE = 'profiles:delete',
  DUPLICATE_PROFILE = 'profiles:duplicate',
  GET_ACTIVE_PROFILE = 'profiles:get-active',
  SET_ACTIVE_PROFILE = 'profiles:set-active',

  LIST_BACKUPS = 'backups:list',
  RESTORE_BACKUP = 'backups:restore',

  LIST_MODELS = 'models:list',

  SHORTCUT_TRIGGERED = 'shortcut:triggered',
}

export interface ConfigApi {
  readConfig(): Promise<IpcResult<Config>>;
  writeConfig(config: Config): Promise<IpcResult<void>>;
  getConfigPath(): Promise<IpcResult<string>>;
  configExists(): Promise<IpcResult<boolean>>;
}

export interface ProfileApi {
  listProfiles(): Promise<IpcResult<Profile[]>>;
  getProfile(id: string): Promise<IpcResult<Profile | null>>;
  saveProfile(profile: Profile): Promise<IpcResult<void>>;
  deleteProfile(id: string): Promise<IpcResult<void>>;
  duplicateProfile(id: string): Promise<IpcResult<Profile>>;
  getActiveProfileId(): Promise<IpcResult<string | null>>;
  setActiveProfileId(id: string): Promise<IpcResult<void>>;
}

export interface BackupApi {
  listBackups(): Promise<IpcResult<Backup[]>>;
  restoreBackup(timestamp: number): Promise<IpcResult<void>>;
}

export interface ThemeApi {
  getTheme(): Promise<IpcResult<'light' | 'dark'>>;
  setTheme(theme: 'light' | 'dark'): Promise<IpcResult<void>>;
}

export interface ModelsApi {
  listModels(): Promise<IpcResult<string[]>>;
}

export interface ShortcutAction {
  action: string;
  index?: number;
}

export interface ShortcutsApi {
  onShortcut(callback: (action: ShortcutAction) => void): () => void;
}

export interface ElectronApi {
  config: ConfigApi;
  profiles: ProfileApi;
  backups: BackupApi;
  theme: ThemeApi;
  models: ModelsApi;
  shortcuts: ShortcutsApi;
}

declare global {
  interface Window {
    electron: ElectronApi;
  }
}
