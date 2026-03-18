import { ipcMain } from 'electron';
import { IpcChannels, IpcResult, Backup } from '../../../shared/ipc';

const mockBackups: Backup[] = [
  {
    timestamp: Date.now() - 86400000,
    filename: 'backup-20241223.json',
    size: 1024,
    profileCount: 3,
  },
  {
    timestamp: Date.now() - 172800000,
    filename: 'backup-20241222.json',
    size: 2048,
    profileCount: 5,
  },
];

function createSuccessResult<T>(data: T): IpcResult<T> {
  return { success: true, data };
}

function createErrorResult(code: string, message: string): IpcResult<never> {
  return { success: false, error: { code, message } };
}

export function registerBackupHandlers(): void {
  ipcMain.handle(IpcChannels.LIST_BACKUPS, async (): Promise<IpcResult<Backup[]>> => {
    try {
      return createSuccessResult([...mockBackups]);
    } catch (error) {
      return createErrorResult(
        'BACKUP_LIST_ERROR',
        error instanceof Error ? error.message : 'Failed to list backups'
      );
    }
  });

  ipcMain.handle(
    IpcChannels.RESTORE_BACKUP,
    async (_event, timestamp: number): Promise<IpcResult<void>> => {
      try {
        if (!timestamp || typeof timestamp !== 'number') {
          return createErrorResult('INVALID_TIMESTAMP', 'Timestamp must be a valid number');
        }
        const backup = mockBackups.find((b) => b.timestamp === timestamp);
        if (!backup) {
          return createErrorResult('BACKUP_NOT_FOUND', `Backup with timestamp ${timestamp} not found`);
        }
        return createSuccessResult(undefined);
      } catch (error) {
        return createErrorResult(
          'BACKUP_RESTORE_ERROR',
          error instanceof Error ? error.message : 'Failed to restore backup'
        );
      }
    }
  );
}
