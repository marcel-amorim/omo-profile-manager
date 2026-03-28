import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IpcChannels, type Config, type IpcResult } from '../../shared/ipc';
import {
  createDefaultOMOConfig,
  type OMOConfig,
  type OMOSharedSettings,
} from '../../shared/types';

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

const mockedConfig = vi.hoisted(() => {
  const createMockConfig = (): OMOConfig => ({
    agents: {},
    categories: {},
  } as OMOConfig);

  const state: { config: OMOConfig | null } = {
    config: createMockConfig(),
  };

  return {
    state,
    createMockConfig,
    readOMOConfig: vi.fn(async () => state.config),
    writeOMOConfig: vi.fn(async (config: OMOConfig) => {
      state.config = config;
    }),
    configExists: vi.fn(async () => true),
  };
});

const mockedThemeStore = vi.hoisted(() => {
  const createMockSharedSettings = (): OMOSharedSettings => ({
    $schema: 'https://example.com/schema.json',
    sisyphus_agent: {
      disabled: false,
      default_builder_enabled: true,
      planner_enabled: true,
      replace_plan: false,
    },
    browser_automation_engine: {
      provider: 'playwright',
    },
    runtime_fallback: {
      enabled: true,
      max_fallback_attempts: 3,
      cooldown_seconds: 60,
      timeout_seconds: 30,
      notify_on_fallback: true,
    },
    hashline_edit: true,
    model_fallback: true,
  });

  const data: Record<string, unknown> = {
    theme: 'light',
    sharedSettings: createMockSharedSettings(),
    sharedSettingsInitialized: false,
  };

  class MockStore<T extends Record<string, unknown>> {
    constructor(options?: { defaults?: Partial<T> }) {
      Object.assign(data, options?.defaults);
    }

    get<K extends keyof T>(key: K): T[K] {
      return data[String(key)] as T[K];
    }

    set<K extends keyof T>(key: K, value: T[K]): void {
      data[String(key)] = value;
    }
  }

  return {
    data,
    MockStore,
    createMockSharedSettings,
  };
});

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: RegisteredHandler) => {
      mockIpcHandlers.set(channel, handler);
    }),
  },
  nativeTheme: {
    shouldUseDarkColors: false,
  },
}));

vi.mock('../config/reader', () => ({
  readOMOConfig: mockedConfig.readOMOConfig,
  configExists: mockedConfig.configExists,
}));

vi.mock('../config/writer', () => ({
  writeOMOConfig: mockedConfig.writeOMOConfig,
}));

vi.mock('../config/paths', () => ({
  OMO_CONFIG_PATH: '/mock/config/path/config.json',
}));

vi.mock('electron-store', () => ({
  default: mockedThemeStore.MockStore,
}));

describe('Config Handler', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockIpcHandlers.clear();
    mockedConfig.state.config = mockedConfig.createMockConfig();
    mockedConfig.readOMOConfig.mockClear();
    mockedConfig.writeOMOConfig.mockClear();
    mockedConfig.configExists.mockClear();
    mockedThemeStore.data.theme = 'light';
    mockedThemeStore.data.sharedSettings = mockedThemeStore.createMockSharedSettings();
    mockedThemeStore.data.sharedSettingsInitialized = false;

    const { registerConfigHandlers } = await import('../ipc/handlers/config');
    registerConfigHandlers();
  });

  describe('READ_CONFIG', () => {
    it('should return config with success', async () => {
      const handler = getHandler<[], IpcResult<Config>>(IpcChannels.READ_CONFIG);
      const result = await handler();

      expectSuccess(result);
      expect(result.data).toMatchObject({
        agents: {},
        categories: {},
      });
    });
  });

  describe('WRITE_CONFIG', () => {
    it('should update config successfully', async () => {
      const handler = getHandler<[null, Config], IpcResult<void>>(IpcChannels.WRITE_CONFIG);
      const readHandler = getHandler<[], IpcResult<Config>>(IpcChannels.READ_CONFIG);

      const newConfig: Config = {
        agents: {},
        categories: {},
      };

      const result = await handler(null, newConfig);
      expectSuccess(result);

      const readResult = await readHandler();
      expectSuccess(readResult);
      expect(readResult.data).toMatchObject(newConfig);
    });

    it('should reject null config', async () => {
      const handler = getHandler<[null, null], IpcResult<void>>(IpcChannels.WRITE_CONFIG);
      const result = await handler(null, null);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_CONFIG');
      expect(result.error.message).toBe('Config must be a valid object');
    });

    it('should reject undefined config', async () => {
      const handler = getHandler<[null, undefined], IpcResult<void>>(IpcChannels.WRITE_CONFIG);
      const result = await handler(null, undefined);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_CONFIG');
    });

    it('should reject string config', async () => {
      const handler = getHandler<[null, string], IpcResult<void>>(IpcChannels.WRITE_CONFIG);
      const result = await handler(null, 'invalid');

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_CONFIG');
    });

    it('should reject number config', async () => {
      const handler = getHandler<[null, number], IpcResult<void>>(IpcChannels.WRITE_CONFIG);
      const result = await handler(null, 123);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_CONFIG');
    });

    it('should handle partial config updates', async () => {
      const writeHandler = getHandler<[null, Config], IpcResult<void>>(IpcChannels.WRITE_CONFIG);
      const readHandler = getHandler<[], IpcResult<Config>>(IpcChannels.READ_CONFIG);

      await writeHandler(null, {
        agents: { test: { model: 'test' } },
        categories: {},
      });

      const result = await readHandler();
      expectSuccess(result);
      expect(result.data).toMatchObject({
        agents: { test: { model: 'test' } },
      });
    });
  });

  describe('GET_CONFIG_PATH', () => {
    it('should return config path', async () => {
      const handler = getHandler<[], IpcResult<string>>(IpcChannels.GET_CONFIG_PATH);
      const result = await handler();

      expectSuccess(result);
      expect(result.data).toBe('/mock/config/path/config.json');
    });
  });

  describe('READ_SHARED_SETTINGS', () => {
    it('should bootstrap shared settings from current config', async () => {
      mockedConfig.state.config = {
        ...createDefaultOMOConfig(),
        hashline_edit: false,
        browser_automation_engine: { provider: 'agent-browser' },
      };

      const handler = getHandler<[], IpcResult<OMOSharedSettings>>(IpcChannels.READ_SHARED_SETTINGS);
      const result = await handler();

      expectSuccess(result);
      expect(result.data.hashline_edit).toBe(false);
      expect(result.data.browser_automation_engine?.provider).toBe('agent-browser');
      expect(mockedThemeStore.data.sharedSettingsInitialized).toBe(true);
    });
  });

  describe('WRITE_SHARED_SETTINGS', () => {
    it('should persist shared settings successfully', async () => {
      const handler = getHandler<[null, OMOSharedSettings], IpcResult<void>>(IpcChannels.WRITE_SHARED_SETTINGS);
      const readHandler = getHandler<[], IpcResult<OMOSharedSettings>>(IpcChannels.READ_SHARED_SETTINGS);

      const result = await handler(null, {
        hashline_edit: false,
        sisyphus_agent: {
          disabled: true,
          default_builder_enabled: false,
          planner_enabled: false,
          replace_plan: true,
        },
      });

      expectSuccess(result);

      const readResult = await readHandler();
      expectSuccess(readResult);
      expect(readResult.data.hashline_edit).toBe(false);
      expect(readResult.data.sisyphus_agent?.disabled).toBe(true);
      expect(mockedThemeStore.data.sharedSettingsInitialized).toBe(true);
    });

    it('should reject invalid shared settings payload', async () => {
      const handler = getHandler<[null, { runtime_fallback: { max_fallback_attempts: number } }], IpcResult<void>>(
        IpcChannels.WRITE_SHARED_SETTINGS
      );

      const result = await handler(null, {
        runtime_fallback: { max_fallback_attempts: 0 },
      });

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_SHARED_SETTINGS');
    });
  });
});
