import { ipcMain } from 'electron';
import { IpcChannels, IpcResult, Profile } from '../../../shared/ipc';
import { 
  listProfiles, 
  getProfile, 
  saveProfile, 
  deleteProfile, 
  duplicateProfile, 
  getActiveProfileId,
  setActiveProfileId 
} from '../../profiles/manager';
import { validateProfileSafe } from '../../../shared/schemas';
import { ZodError } from 'zod';

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

export function registerProfileHandlers(): void {
  ipcMain.handle(IpcChannels.LIST_PROFILES, async (): Promise<IpcResult<Profile[]>> => {
    try {
      const profiles = await listProfiles();
      return createSuccessResult(profiles);
    } catch (error) {
      const formatted = formatError(error);
      return createErrorResult(formatted.code, formatted.message);
    }
  });

  ipcMain.handle(
    IpcChannels.GET_PROFILE,
    async (_event, id: string): Promise<IpcResult<Profile | null>> => {
      try {
        if (!id || typeof id !== 'string') {
          return createErrorResult('INVALID_ID', 'Profile ID must be a valid string');
        }
        const profile = await getProfile(id);
        return createSuccessResult(profile);
      } catch (error) {
        const formatted = formatError(error);
        return createErrorResult(formatted.code, formatted.message);
      }
    }
  );

  ipcMain.handle(
    IpcChannels.SAVE_PROFILE,
    async (_event, profile: unknown): Promise<IpcResult<void>> => {
      try {
        const validation = validateProfileSafe(profile);
        if (!validation.success) {
          return createErrorResult('INVALID_PROFILE', 'Profile must be a valid object');
        }

        await saveProfile(validation.data);
        return createSuccessResult(undefined);
      } catch (error) {
        const formatted = formatError(error);
        return createErrorResult(formatted.code, formatted.message);
      }
    }
  );

  ipcMain.handle(
    IpcChannels.DELETE_PROFILE,
    async (_event, id: string): Promise<IpcResult<void>> => {
      try {
        if (!id || typeof id !== 'string') {
          return createErrorResult('INVALID_ID', 'Profile ID must be a valid string');
        }
        await deleteProfile(id);
        return createSuccessResult(undefined);
      } catch (error) {
        const formatted = formatError(error);
        return createErrorResult(formatted.code, formatted.message);
      }
    }
  );

  ipcMain.handle(
    IpcChannels.DUPLICATE_PROFILE,
    async (_event, id: string): Promise<IpcResult<Profile>> => {
      try {
        if (!id || typeof id !== 'string') {
          return createErrorResult('INVALID_ID', 'Profile ID must be a valid string');
        }
        const original = await getProfile(id);
        if (!original) {
          return createErrorResult('PROFILE_NOT_FOUND', `Profile with ID ${id} not found`);
        }
        const duplicated = await duplicateProfile(id, `${original.name} (Copy)`);
        return createSuccessResult(duplicated);
      } catch (error) {
        const formatted = formatError(error);
        return createErrorResult(formatted.code, formatted.message);
      }
    }
  );

  ipcMain.handle(
    IpcChannels.GET_ACTIVE_PROFILE,
    async (): Promise<IpcResult<string | null>> => {
      try {
        const activeProfileId = await getActiveProfileId();
        return createSuccessResult(activeProfileId);
      } catch (error) {
        const formatted = formatError(error);
        return createErrorResult(formatted.code, formatted.message);
      }
    }
  );

  ipcMain.handle(
    IpcChannels.SET_ACTIVE_PROFILE,
    async (_event, id: string): Promise<IpcResult<void>> => {
      try {
        if (!id || typeof id !== 'string') {
          return createErrorResult('INVALID_ID', 'Profile ID must be a valid string');
        }
        await setActiveProfileId(id);
        return createSuccessResult(undefined);
      } catch (error) {
        const formatted = formatError(error);
        return createErrorResult(formatted.code, formatted.message);
      }
    }
  );
}
