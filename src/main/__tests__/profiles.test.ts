import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { IpcChannels, type Profile, type IpcResult } from '../../shared/ipc';
import { createDefaultOMOConfig } from '../../shared/types';

type RegisteredHandler = (...args: unknown[]) => Promise<unknown>;
type SuccessResult<T> = Extract<IpcResult<T>, { success: true }>;
type ErrorResult<T> = Extract<IpcResult<T>, { success: false }>;

const mockIpcHandlers = new Map<string, RegisteredHandler>();
let userDataDir = '';

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
  app: {
    getPath: vi.fn(() => userDataDir),
  },
}));

describe('Profile Handler', () => {
  beforeEach(async () => {
    vi.resetModules();
    mockIpcHandlers.clear();

    userDataDir = await fs.mkdtemp(join(tmpdir(), 'omo-profile-manager-tests-'));
    const profilesDir = join(userDataDir, 'profiles');
    await fs.mkdir(profilesDir, { recursive: true });

    const defaultProfile: Profile = {
      id: 'profile-1',
      name: 'Default Profile',
      description: 'Default configuration profile',
      createdAt: 1000,
      updatedAt: 1000,
      config: createDefaultOMOConfig(),
    };

    await fs.writeFile(join(profilesDir, 'profile-1.json'), JSON.stringify(defaultProfile, null, 2), 'utf-8');

    const { registerProfileHandlers } = await import('../ipc/handlers/profiles');
    registerProfileHandlers();
  });

  afterEach(async () => {
    if (userDataDir) {
      await fs.rm(userDataDir, { recursive: true, force: true });
      userDataDir = '';
    }
  });

  describe('LIST_PROFILES', () => {
    it('should return list of profiles', async () => {
      const handler = getHandler<[], IpcResult<Profile[]>>(IpcChannels.LIST_PROFILES);
      const result = await handler();

      expectSuccess(result);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toMatchObject({
        id: 'profile-1',
        name: 'Default Profile',
        description: 'Default configuration profile',
      });
    });

    it('should return new array on each call', async () => {
      const handler = getHandler<[], IpcResult<Profile[]>>(IpcChannels.LIST_PROFILES);
      const result1 = await handler();
      const result2 = await handler();

      expectSuccess(result1);
      expectSuccess(result2);
      expect(result1.data).not.toBe(result2.data);
      expect(result1.data).toEqual(result2.data);
    });
  });

  describe('GET_PROFILE', () => {
    it('should return existing profile by id', async () => {
      const handler = getHandler<[null, string], IpcResult<Profile | null>>(IpcChannels.GET_PROFILE);
      const result = await handler(null, 'profile-1');

      expectSuccess(result);
      expect(result.data).toMatchObject({
        id: 'profile-1',
        name: 'Default Profile',
      });
    });

    it('should return null for non-existent profile', async () => {
      const handler = getHandler<[null, string], IpcResult<Profile | null>>(IpcChannels.GET_PROFILE);
      const result = await handler(null, 'non-existent-id');

      expectSuccess(result);
      expect(result.data).toBeNull();
    });

    it('should reject null id', async () => {
      const handler = getHandler<[null, null], IpcResult<Profile | null>>(IpcChannels.GET_PROFILE);
      const result = await handler(null, null);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });

    it('should reject undefined id', async () => {
      const handler = getHandler<[null, undefined], IpcResult<Profile | null>>(IpcChannels.GET_PROFILE);
      const result = await handler(null, undefined);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });

    it('should reject number id', async () => {
      const handler = getHandler<[null, number], IpcResult<Profile | null>>(IpcChannels.GET_PROFILE);
      const result = await handler(null, 123);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });

    it('should reject empty string id', async () => {
      const handler = getHandler<[null, string], IpcResult<Profile | null>>(IpcChannels.GET_PROFILE);
      const result = await handler(null, '');

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });
  });

  describe('SAVE_PROFILE', () => {
    it('should create new profile', async () => {
      const handler = getHandler<[null, Profile], IpcResult<void>>(IpcChannels.SAVE_PROFILE);
      const listHandler = getHandler<[], IpcResult<Profile[]>>(IpcChannels.LIST_PROFILES);

      const newProfile: Profile = {
        id: 'profile-new',
        name: 'New Profile',
        description: 'Test profile',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      };

      const result = await handler(null, newProfile);
      expectSuccess(result);

      const listResult = await listHandler();
      expectSuccess(listResult);
      const found = listResult.data.find((profile) => profile.id === 'profile-new');
      expect(found).toBeDefined();
      expect(found?.name).toBe('New Profile');
    });

    it('should update existing profile', async () => {
      const handler = getHandler<[null, Profile], IpcResult<void>>(IpcChannels.SAVE_PROFILE);
      const getHandlerById = getHandler<[null, string], IpcResult<Profile | null>>(IpcChannels.GET_PROFILE);

      const updatedProfile: Profile = {
        id: 'profile-1',
        name: 'Updated Profile Name',
        description: 'Updated description',
        createdAt: 1000,
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      };

      const saveResult = await handler(null, updatedProfile);
      expectSuccess(saveResult);

      const afterResult = await getHandlerById(null, 'profile-1');
      expectSuccess(afterResult);
      expect(afterResult.data?.name).toBe('Updated Profile Name');
      expect(afterResult.data?.description).toBe('Updated description');
    });

    it('should reject invalid profile without id', async () => {
      const handler = getHandler<[null, { name: string; createdAt: number; updatedAt: number; config: ReturnType<typeof createDefaultOMOConfig> }], IpcResult<void>>(
        IpcChannels.SAVE_PROFILE
      );

      const result = await handler(null, {
        name: 'Invalid',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      });

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_PROFILE');
    });

    it('should reject invalid profile without name', async () => {
      const handler = getHandler<[null, { id: string; createdAt: number; updatedAt: number; config: ReturnType<typeof createDefaultOMOConfig> }], IpcResult<void>>(
        IpcChannels.SAVE_PROFILE
      );

      const result = await handler(null, {
        id: 'test-id',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      });

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_PROFILE');
    });

    it('should reject invalid profile without createdAt', async () => {
      const handler = getHandler<[null, { id: string; name: string; updatedAt: number; config: ReturnType<typeof createDefaultOMOConfig> }], IpcResult<void>>(
        IpcChannels.SAVE_PROFILE
      );

      const result = await handler(null, {
        id: 'test-id',
        name: 'Test',
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      });

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_PROFILE');
    });

    it('should reject invalid profile without updatedAt', async () => {
      const handler = getHandler<[null, { id: string; name: string; createdAt: number; config: ReturnType<typeof createDefaultOMOConfig> }], IpcResult<void>>(
        IpcChannels.SAVE_PROFILE
      );

      const result = await handler(null, {
        id: 'test-id',
        name: 'Test',
        createdAt: Date.now(),
        config: createDefaultOMOConfig(),
      });

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_PROFILE');
    });

    it('should reject null profile', async () => {
      const handler = getHandler<[null, null], IpcResult<void>>(IpcChannels.SAVE_PROFILE);
      const result = await handler(null, null);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_PROFILE');
    });

    it('should reject string profile', async () => {
      const handler = getHandler<[null, string], IpcResult<void>>(IpcChannels.SAVE_PROFILE);
      const result = await handler(null, 'invalid');

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_PROFILE');
    });

    it('should update updatedAt timestamp when saving existing profile', async () => {
      const saveHandler = getHandler<[null, Profile], IpcResult<void>>(IpcChannels.SAVE_PROFILE);
      const getHandlerById = getHandler<[null, string], IpcResult<Profile | null>>(IpcChannels.GET_PROFILE);
      const beforeSave = Date.now();

      const profile: Profile = {
        id: 'profile-1',
        name: 'Profile Name',
        createdAt: 1000,
        updatedAt: 2000,
        config: createDefaultOMOConfig(),
      };

      await saveHandler(null, profile);

      const result = await getHandlerById(null, 'profile-1');
      expectSuccess(result);
      expect(result.data?.updatedAt).toBeGreaterThanOrEqual(beforeSave);
    });

    it('should strip shared settings when saving profile data', async () => {
      const saveHandler = getHandler<[null, Profile], IpcResult<void>>(IpcChannels.SAVE_PROFILE);
      const getHandlerById = getHandler<[null, string], IpcResult<Profile | null>>(IpcChannels.GET_PROFILE);

      const profile: Profile = {
        id: 'profile-1',
        name: 'Profile With Shared Settings',
        createdAt: 1000,
        updatedAt: 2000,
        config: {
          ...createDefaultOMOConfig(),
          hashline_edit: false,
          runtime_fallback: {
            enabled: false,
          },
        },
      };

      await saveHandler(null, profile);

      const result = await getHandlerById(null, 'profile-1');
      expectSuccess(result);
      expect(result.data?.config.hashline_edit).toBeUndefined();
      expect(result.data?.config.runtime_fallback).toBeUndefined();
    });
  });

  describe('DELETE_PROFILE', () => {
    it('should delete existing profile', async () => {
      const saveHandler = getHandler<[null, Profile], IpcResult<void>>(IpcChannels.SAVE_PROFILE);
      const deleteHandler = getHandler<[null, string], IpcResult<void>>(IpcChannels.DELETE_PROFILE);
      const getHandlerById = getHandler<[null, string], IpcResult<Profile | null>>(IpcChannels.GET_PROFILE);

      const newProfile: Profile = {
        id: 'to-delete',
        name: 'To Delete',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      };

      await saveHandler(null, newProfile);

      const deleteResult = await deleteHandler(null, 'to-delete');
      expectSuccess(deleteResult);

      const getResult = await getHandlerById(null, 'to-delete');
      expectSuccess(getResult);
      expect(getResult.data).toBeNull();
    });

    it('should succeed when deleting non-existent profile', async () => {
      const handler = getHandler<[null, string], IpcResult<void>>(IpcChannels.DELETE_PROFILE);
      const result = await handler(null, 'non-existent');

      expectSuccess(result);
    });

    it('should reject null id', async () => {
      const handler = getHandler<[null, null], IpcResult<void>>(IpcChannels.DELETE_PROFILE);
      const result = await handler(null, null);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });

    it('should reject undefined id', async () => {
      const handler = getHandler<[null, undefined], IpcResult<void>>(IpcChannels.DELETE_PROFILE);
      const result = await handler(null, undefined);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });

    it('should reject number id', async () => {
      const handler = getHandler<[null, number], IpcResult<void>>(IpcChannels.DELETE_PROFILE);
      const result = await handler(null, 123);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });
  });

  describe('DUPLICATE_PROFILE', () => {
    it('should duplicate existing profile', async () => {
      const handler = getHandler<[null, string], IpcResult<Profile>>(IpcChannels.DUPLICATE_PROFILE);
      const result = await handler(null, 'profile-1');

      expectSuccess(result);
      expect(result.data.name).toBe('Default Profile (Copy)');
      expect(result.data.id).not.toBe('profile-1');
      expect(result.data.id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(result.data.createdAt).toBeGreaterThan(0);
      expect(result.data.updatedAt).toBeGreaterThan(0);
    });

    it('should add duplicated profile to list', async () => {
      const duplicateHandler = getHandler<[null, string], IpcResult<Profile>>(IpcChannels.DUPLICATE_PROFILE);
      const listHandler = getHandler<[], IpcResult<Profile[]>>(IpcChannels.LIST_PROFILES);

      const beforeResult = await listHandler();
      expectSuccess(beforeResult);
      const beforeCount = beforeResult.data.length;

      await duplicateHandler(null, 'profile-1');

      const afterResult = await listHandler();
      expectSuccess(afterResult);
      expect(afterResult.data.length).toBe(beforeCount + 1);
    });

    it('should return error for non-existent profile', async () => {
      const handler = getHandler<[null, string], IpcResult<Profile>>(IpcChannels.DUPLICATE_PROFILE);
      const result = await handler(null, 'non-existent-id');

      expectFailure(result);
      expect(result.error.code).toBe('PROFILE_NOT_FOUND');
      expect(result.error.message).toContain('non-existent-id');
    });

    it('should reject null id', async () => {
      const handler = getHandler<[null, null], IpcResult<Profile>>(IpcChannels.DUPLICATE_PROFILE);
      const result = await handler(null, null);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });

    it('should reject undefined id', async () => {
      const handler = getHandler<[null, undefined], IpcResult<Profile>>(IpcChannels.DUPLICATE_PROFILE);
      const result = await handler(null, undefined);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });

    it('should reject number id', async () => {
      const handler = getHandler<[null, number], IpcResult<Profile>>(IpcChannels.DUPLICATE_PROFILE);
      const result = await handler(null, 123);

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });

    it('should reject empty string id', async () => {
      const handler = getHandler<[null, string], IpcResult<Profile>>(IpcChannels.DUPLICATE_PROFILE);
      const result = await handler(null, '');

      expectFailure(result);
      expect(result.error.code).toBe('INVALID_ID');
    });
  });
});
