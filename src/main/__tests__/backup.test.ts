import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IpcChannels } from '../../shared/ipc';

const mockIpcHandlers = new Map<string, Function>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
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
      const handler = mockIpcHandlers.get(IpcChannels.LIST_BACKUPS);
      expect(handler).toBeDefined();

      const result = await handler!() as any;

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data?.length).toBe(2);
    });

    it('should return backup with correct structure', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.LIST_BACKUPS);

      const result = await handler!() as any;

      expect(result.data?.[0]).toMatchObject({
        timestamp: expect.any(Number),
        filename: expect.any(String),
        size: expect.any(Number),
        profileCount: expect.any(Number),
      });
    });

    it('should return new array on each call', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.LIST_BACKUPS);

      const result1 = await handler!() as any;
      const result2 = await handler!() as any;

      expect(result1.data).not.toBe(result2.data);
      expect(result1.data).toEqual(result2.data);
    });

    it('should return backups sorted by timestamp', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.LIST_BACKUPS);

      const result = await handler!() as any;

      const timestamps = result.data?.map((b: any) => b.timestamp) || [];
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeLessThan(timestamps[i - 1]);
      }
    });

    it('should have valid backup filenames', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.LIST_BACKUPS);

      const result = await handler!() as any;

      result.data?.forEach((backup: any) => {
        expect(backup.filename).toMatch(/^backup-\d{8}\.json$/);
      });
    });

    it('should have positive size values', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.LIST_BACKUPS);

      const result = await handler!() as any;

      result.data?.forEach((backup: any) => {
        expect(backup.size).toBeGreaterThan(0);
      });
    });

    it('should have positive profile counts', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.LIST_BACKUPS);

      const result = await handler!() as any;

      result.data?.forEach((backup: any) => {
        expect(backup.profileCount).toBeGreaterThan(0);
      });
    });
  });

  describe('RESTORE_BACKUP', () => {
    it('should restore backup with valid timestamp', async () => {
      const listHandler = mockIpcHandlers.get(IpcChannels.LIST_BACKUPS);
      const restoreHandler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const listResult = await listHandler!() as any;
      const timestamp = listResult.data![0].timestamp;

      const result = await restoreHandler!(null, timestamp) as any;

      expect(result.success).toBe(true);
    });

    it('should restore backup with older timestamp', async () => {
      const listHandler = mockIpcHandlers.get(IpcChannels.LIST_BACKUPS);
      const restoreHandler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const listResult = await listHandler!() as any;
      const timestamp = listResult.data![1].timestamp;

      const result = await restoreHandler!(null, timestamp) as any;

      expect(result.success).toBe(true);
    });

    it('should return error for non-existent backup timestamp', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const result = await handler!(null, 9999999999999) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BACKUP_NOT_FOUND');
    });

    it('should return error for timestamp zero', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const result = await handler!(null, 0) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject null timestamp', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const result = await handler!(null, null) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject undefined timestamp', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const result = await handler!(null, undefined) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject string timestamp', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const result = await handler!(null, '123456789') as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject boolean timestamp', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const result = await handler!(null, true) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject object timestamp', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const result = await handler!(null, { timestamp: 123456 }) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TIMESTAMP');
    });

    it('should return error with timestamp in message', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const result = await handler!(null, 12345) as any;

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('12345');
    });

    it('should reject NaN timestamp', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.RESTORE_BACKUP);

      const result = await handler!(null, NaN) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TIMESTAMP');
    });
  });
});
