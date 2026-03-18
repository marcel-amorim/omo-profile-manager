import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { IpcChannels, Profile } from '../../shared/ipc';
import { createDefaultOMOConfig } from '../../shared/types';

const mockIpcHandlers = new Map<string, Function>();
let userDataDir = '';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
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

    await fs.writeFile(
      join(profilesDir, 'profile-1.json'),
      JSON.stringify(defaultProfile, null, 2),
      'utf-8'
    );

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
      const handler = mockIpcHandlers.get(IpcChannels.LIST_PROFILES);
      expect(handler).toBeDefined();

      const result = await handler!() as any;

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data?.length).toBeGreaterThan(0);
      expect(result.data?.[0]).toMatchObject({
        id: 'profile-1',
        name: 'Default Profile',
        description: 'Default configuration profile',
      });
    });

    it('should return new array on each call', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.LIST_PROFILES);

      const result1 = await handler!() as any;
      const result2 = await handler!() as any;

      expect(result1.data).not.toBe(result2.data);
      expect(result1.data).toEqual(result2.data);
    });
  });

  describe('GET_PROFILE', () => {
    it('should return existing profile by id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.GET_PROFILE);

      const result = await handler!(null, 'profile-1') as any;

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 'profile-1',
        name: 'Default Profile',
      });
    });

    it('should return null for non-existent profile', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.GET_PROFILE);

      const result = await handler!(null, 'non-existent-id') as any;

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should reject null id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.GET_PROFILE);

      const result = await handler!(null, null) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });

    it('should reject undefined id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.GET_PROFILE);

      const result = await handler!(null, undefined) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });

    it('should reject number id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.GET_PROFILE);

      const result = await handler!(null, 123) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });

    it('should reject empty string id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.GET_PROFILE);

      const result = await handler!(null, '') as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });
  });

  describe('SAVE_PROFILE', () => {
    it('should create new profile', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.SAVE_PROFILE);
      const listHandler = mockIpcHandlers.get(IpcChannels.LIST_PROFILES);

      const newProfile: Profile = {
        id: 'profile-new',
        name: 'New Profile',
        description: 'Test profile',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      };

      const result = await handler!(null, newProfile) as any;

      expect(result.success).toBe(true);

      const listResult = await listHandler!() as any;
      const found = listResult.data?.find((p: any) => p.id === 'profile-new');
      expect(found).toBeDefined();
      expect(found?.name).toBe('New Profile');
    });

    it('should update existing profile', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.SAVE_PROFILE);

      const updatedProfile: Profile = {
        id: 'profile-1',
        name: 'Updated Profile Name',
        description: 'Updated description',
        createdAt: 1000,
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      };

      const beforeResult = await handler!(null, updatedProfile) as any;
      expect(beforeResult.success).toBe(true);

      const getHandler = mockIpcHandlers.get(IpcChannels.GET_PROFILE);
      const afterResult = await getHandler!(null, 'profile-1') as any;

      expect(afterResult.data?.name).toBe('Updated Profile Name');
      expect(afterResult.data?.description).toBe('Updated description');
    });

    it('should reject invalid profile without id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.SAVE_PROFILE);

      const invalidProfile = {
        name: 'Invalid',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      };

      const result = await handler!(null, invalidProfile) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PROFILE');
    });

    it('should reject invalid profile without name', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.SAVE_PROFILE);

      const invalidProfile = {
        id: 'test-id',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      };

      const result = await handler!(null, invalidProfile) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PROFILE');
    });

    it('should reject invalid profile without createdAt', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.SAVE_PROFILE);

      const invalidProfile = {
        id: 'test-id',
        name: 'Test',
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      };

      const result = await handler!(null, invalidProfile) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PROFILE');
    });

    it('should reject invalid profile without updatedAt', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.SAVE_PROFILE);

      const invalidProfile = {
        id: 'test-id',
        name: 'Test',
        createdAt: Date.now(),
        config: createDefaultOMOConfig(),
      };

      const result = await handler!(null, invalidProfile) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PROFILE');
    });

    it('should reject null profile', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.SAVE_PROFILE);

      const result = await handler!(null, null) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PROFILE');
    });

    it('should reject string profile', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.SAVE_PROFILE);

      const result = await handler!(null, 'invalid') as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PROFILE');
    });

    it('should update updatedAt timestamp when saving existing profile', async () => {
      const saveHandler = mockIpcHandlers.get(IpcChannels.SAVE_PROFILE);
      const getHandler = mockIpcHandlers.get(IpcChannels.GET_PROFILE);

      const beforeSave = Date.now();

      const profile: Profile = {
        id: 'profile-1',
        name: 'Profile Name',
        createdAt: 1000,
        updatedAt: 2000,
        config: createDefaultOMOConfig(),
      };

      await saveHandler!(null, profile);

      const result = await getHandler!(null, 'profile-1') as any;

      expect(result.data?.updatedAt).toBeGreaterThanOrEqual(beforeSave);
    });
  });

  describe('DELETE_PROFILE', () => {
    it('should delete existing profile', async () => {
      const saveHandler = mockIpcHandlers.get(IpcChannels.SAVE_PROFILE);
      const deleteHandler = mockIpcHandlers.get(IpcChannels.DELETE_PROFILE);
      const getHandler = mockIpcHandlers.get(IpcChannels.GET_PROFILE);

      const newProfile: Profile = {
        id: 'to-delete',
        name: 'To Delete',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config: createDefaultOMOConfig(),
      };

      await saveHandler!(null, newProfile);

      const deleteResult = await deleteHandler!(null, 'to-delete') as any;
      expect(deleteResult.success).toBe(true);

      const getResult = await getHandler!(null, 'to-delete') as any;
      expect(getResult.data).toBeNull();
    });

    it('should succeed when deleting non-existent profile', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.DELETE_PROFILE);

      const result = await handler!(null, 'non-existent') as any;

      expect(result.success).toBe(true);
    });

    it('should reject null id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.DELETE_PROFILE);

      const result = await handler!(null, null) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });

    it('should reject undefined id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.DELETE_PROFILE);

      const result = await handler!(null, undefined) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });

    it('should reject number id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.DELETE_PROFILE);

      const result = await handler!(null, 123) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });
  });

  describe('DUPLICATE_PROFILE', () => {
    it('should duplicate existing profile', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.DUPLICATE_PROFILE);

      const result = await handler!(null, 'profile-1') as any;

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Default Profile (Copy)');
      expect(result.data?.id).not.toBe('profile-1');
      expect(result.data?.id).toMatch(/^[0-9a-f-]{36}$/i);
      expect(result.data?.createdAt).toBeGreaterThan(0);
      expect(result.data?.updatedAt).toBeGreaterThan(0);
    });

    it('should add duplicated profile to list', async () => {
      const duplicateHandler = mockIpcHandlers.get(IpcChannels.DUPLICATE_PROFILE);
      const listHandler = mockIpcHandlers.get(IpcChannels.LIST_PROFILES);

      const beforeResult = await listHandler!() as any;
      const beforeCount = beforeResult.data?.length || 0;

      await duplicateHandler!(null, 'profile-1');

      const afterResult = await listHandler!() as any;
      const afterCount = afterResult.data?.length || 0;

      expect(afterCount).toBe(beforeCount + 1);
    });

    it('should return error for non-existent profile', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.DUPLICATE_PROFILE);

      const result = await handler!(null, 'non-existent-id') as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROFILE_NOT_FOUND');
      expect(result.error?.message).toContain('non-existent-id');
    });

    it('should reject null id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.DUPLICATE_PROFILE);

      const result = await handler!(null, null) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });

    it('should reject undefined id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.DUPLICATE_PROFILE);

      const result = await handler!(null, undefined) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });

    it('should reject number id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.DUPLICATE_PROFILE);

      const result = await handler!(null, 123) as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });

    it('should reject empty string id', async () => {
      const handler = mockIpcHandlers.get(IpcChannels.DUPLICATE_PROFILE);

      const result = await handler!(null, '') as any;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ID');
    });
  });
});
