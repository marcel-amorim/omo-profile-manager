import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IpcChannels, type Backup, type IpcResult } from '../../shared/ipc';

type RegisteredHandler = (...args: unknown[]) => Promise<unknown>;
type SuccessResult<T> = Extract<IpcResult<T>, { success: true }>;
type ErrorResult<T> = Extract<IpcResult<T>, { success: false }>;

const mockIpcHandlers = new Map<string, RegisteredHandler>();

function getHandler<TArgs extends unknown[], TResult>(channel: IpcChannels): (...args: TArgs) => Promise<TResult> {
  const handler = mockIpcHandlers.get(channel);
  expect(handler).toBeDefined();
  return handler as (...args: TArgs) => Promise<TResult>;
}

function expectSuccess<T>(result: IpcResult<T>): asserts result is SuccessResult<T> {
  expect(result.success).toBe(true);
}

function expectFailure<T>(result: IpcResult<T>): asserts result is ErrorResult<T> {
  expect(result.success).toBe(false);
}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: RegisteredHandler) => {
      mockIpcHandlers.set(channel, handler);
    }),
  },
}));

describe('Backup Handler', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockIpcHandlers.clear();
    const { registerBackupHandlers } = await import('../ipc/handlers/backup');
    registerBackupHandlers();
  });

  describe('LIST_BACKUPS', () => {
    it('should return list of backups', async () => {
      const handler = getHandler<[], IpcResult<Backup[]>>(IpcChannels.LIST_BACKUPS);
      const result = await handler();

      expectSuccess(result);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBe(2);
    });

    it('should return backup with correct structure', async () => {
      const handler = getHandler<[], IpcResult<Backup[]>>(IpcChannels.LIST_BACKUPS);
      const result = await handler();

      expectSuccess(result);
      expect(result.data[0]).toMatchObject({
        timestamp: expect.any(Number),
        filename: expect.any(String),
        size: expect.any(Number),
        profileCount: expect.any(Number),
      });
    });

    it('should return new array on each call', async () => {
      const handler = getHandler<[], IpcResult<Backup[]>>(IpcChannels.LIST_BACKUPS);
      const result1 = await handler();
      const result2 = await handler();

      expectSuccess(result1);
      expectSuccess(result2);
      expect(result1.data).not.toBe(result2.data);
      expect(result1.data).toEqual(result2.data);
    });

    it('should return backups sorted by timestamp', async () => {
      const handler = getHandler<[], IpcResult<Backup[]>>(IpcChannels.LIST_BACKUPS);
      const result = await handler();

      expectSuccess(result);
      const timestamps = result.data.map((backup) => backup.timestamp);
      for (let index = 1; index < timestamps.length; index += 1) {
        expect(timestamps[index]).toBeLessThan(timestamps[index - 1]);
      }
    });

    it('should have valid backup filenames', async () => {
      const handler = getHandler<[], IpcResult<Backup[]>>(IpcChannels.LIST_BACKUPS);
      const result = await handler();

      expectSuccess(result);
      result.data.forEach((backup) => {
        expect(backup.filename).toMatch(/^backup-\d{8}\.json$/);
      });
    });

    it('should have positive size values', async () => {
      const handler = getHandler<[], IpcResult<Backup[]>>(IpcChannels.LIST_BACKUPS);
      const result = await handler();

      expectSuccess(result);
      result.data.forEach((backup) => {
        expect(backup.size).toBeGreaterThan(0);
      });
    });

    it('should have positive profile counts', async () => {
      const handler = getHandler<[], IpcResult<Backup[]>>(IpcChannels.LIST_BACKUPS);
      const result = await handler();

      expectSuccess(result);
      result.data.forEach((backup) => {
        expect(backup.profileCount).toBeGreaterThan(0);
      });
    });
  });

  describe('RESTORE_BACKUP', () => {
    it('should restore backup with valid timestamp', async () => {
      const listHandler = getHandler<[], IpcResult<Backup[]>>(IpcChannels.LIST_BACKUPS);
      const restoreHandler = getHandler<[null, number], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);

      const listResult = await listHandler();
      expectSuccess(listResult);

      const result = await restoreHandler(null, listResult.data[0].timestamp);
      expectSuccess(result);
    });

    it('should restore backup with older timestamp', async () => {
      const listHandler = getHandler<[], IpcResult<Backup[]>>(IpcChannels.LIST_BACKUPS);
      const restoreHandler = getHandler<[null, number], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);

      const listResult = await listHandler();
      expectSuccess(listResult);

      const result = await restoreHandler(null, listResult.data[1].timestamp);
      expectSuccess(result);
    });

    it('should return error for non-existent backup timestamp', async () => {
      const handler = getHandler<[null, number], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);
      const result = await handler(null, 9999999999999);

      expectFailure(result);
      expect(result.error.code).toBe('BACKUP_NOT_FOUND');
    });

    it('should return error for timestamp zero', async () => {
      const handler = getHandler<[null, number], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);
      const result = await handler(null, 0);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject null timestamp', async () => {
      const handler = getHandler<[null, null], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);
      const result = await handler(null, null);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject undefined timestamp', async () => {
      const handler = getHandler<[null, undefined], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);
      const result = await handler(null, undefined);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject string timestamp', async () => {
      const handler = getHandler<[null, string], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);
      const result = await handler(null, '123456789');

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject boolean timestamp', async () => {
      const handler = getHandler<[null, boolean], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);
      const result = await handler(null, true);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject object timestamp', async () => {
      const handler = getHandler<[null, { timestamp: number }], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);
      const result = await handler(null, { timestamp: 123456 });

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_TIMESTAMP');
    });

    it('should return error with timestamp in message', async () => {
      const handler = getHandler<[null, number], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);
      const result = await handler(null, 12345);

      expectFailure(result);
      expect(result.error.message).toContain('12345');
    });

    it('should reject NaN timestamp', async () => {
      const handler = getHandler<[null, number], IpcResult<void>>(IpcChannels.RESTORE_BACKUP);
      const result = await handler(null, Number.NaN);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_TIMESTAMP');
    });
  });
});
