import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IpcChannels, Config } from '../../shared/ipc';

const mockIpcHandlers = new Map<string, Function>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
      mockIpcHandlers.set(channel, handler);
    }),
  },
}));

describe('Config Handler', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockIpcHandlers.clear();
    const { registerConfigHandlers } = await import('../ipc/handlers/config');
    registerConfigHandlers();
  });

  describe('READ_CONFIG', () => {
    it('should return config with success', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.READ_CONFIG);
      expect(handler).toBeDefined();

      const result = await handler!() as any;

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        agents: {},
        categories: {},
      });
    });
  });

  describe('WRITE_CONFIG', () => {
    it('should update config successfully', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.WRITE_CONFIG);
      expect(handler).toBeDefined();

      const newConfig: Config = {
        agents: {},
        categories: {},
      };

      const result = await handler!(null, newConfig) as any;

      expect(result.success).toBe(true);

      const readHandler = mockIpcHandlers.get(IpcChannels.READ_CONFIG);
      const readResult = await readHandler!() as any;
      expect(readResult.data).toMatchObject(newConfig);
    });

    it('should reject null config', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.WRITE_CONFIG);

      const result = await handler!(null, null) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIG');
      expect(result.error?.message).toBe('Config must be a valid object');
    });

    it('should reject undefined config', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.WRITE_CONFIG);

      const result = await handler!(null, undefined) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIG');
    });

    it('should reject string config', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.WRITE_CONFIG);

      const result = await handler!(null, 'invalid') as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIG');
    });

    it('should reject number config', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.WRITE_CONFIG);

      const result = await handler!(null, 123) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIG');
    });

    it('should handle partial config updates', async () => {
      const writeHandler = mockIpcHandlers.get(IpcChannels.WRITE_CONFIG);
      const readHandler = mockIpcHandlers.get(IpcChannels.READ_CONFIG);

      await writeHandler!(null, { agents: { test: { model: 'test' } } });
      const result = await readHandler!() as any;

      expect((result.data?.agents as any)?.test?.model).toBe('test');
    });
  });

  describe('GET_CONFIG_PATH', () => {
    it('should return config path', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.GET_CONFIG_PATH);

      const result = await handler!() as any;

      expect(result.success).toBe(true);
      expect(result.data).toBe('/mock/config/path/config.json');
    });
  });
});
