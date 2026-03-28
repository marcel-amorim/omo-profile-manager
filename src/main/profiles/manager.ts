import { app } from 'electron';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Profile } from '../../shared/types';
import { stripSharedSettingsFromConfig } from '../../shared/config-scope';
import { validateProfileSafe, ProfileSchema } from '../../shared/schemas';

const PROFILES_DIR = 'profiles';
const ACTIVE_PROFILE_FILE = 'active-profile.json';

function getProfilesDir(): string {
  const userData = app.getPath('userData');
  return join(userData, PROFILES_DIR);
}

function getProfilePath(id: string): string {
  return join(getProfilesDir(), `${id}.json`);
}

function getActiveProfilePath(): string {
  const userData = app.getPath('userData');
  return join(userData, ACTIVE_PROFILE_FILE);
}

async function ensureProfilesDir(): Promise<void> {
  const profilesDir = getProfilesDir();
  try {
    await fs.access(profilesDir);
  } catch {
    await fs.mkdir(profilesDir, { recursive: true });
  }
}

function validateProfileData(profile: unknown): profile is Profile {
  const result = validateProfileSafe(profile);
  return result.success;
}

function sanitizeProfileName(name: string): string {
  return name.trim();
}

function sanitizeStoredProfile(profile: Profile): Profile {
  return {
    ...profile,
    config: stripSharedSettingsFromConfig(profile.config),
  };
}

export async function listProfiles(): Promise<Profile[]> {
  await ensureProfilesDir();
  const profilesDir = getProfilesDir();

  try {
    const files = await fs.readdir(profilesDir);
    const profileFiles = files.filter((file) => file.endsWith('.json'));

    const profiles: Profile[] = [];
    for (const file of profileFiles) {
      try {
        const filePath = join(profilesDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (validateProfileData(data)) {
          profiles.push(sanitizeStoredProfile(data));
        }
      } catch {
        continue;
      }
    }

    return profiles.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export async function getProfile(id: string): Promise<Profile | null> {
  const profilePath = getProfilePath(id);

  try {
    const content = await fs.readFile(profilePath, 'utf-8');
    const data = JSON.parse(content);

    if (validateProfileData(data)) {
      return sanitizeStoredProfile(data);
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  const sanitizedName = sanitizeProfileName(profile.name);
  if (!sanitizedName) {
    throw new Error('Profile name cannot be empty');
  }

  const validation = ProfileSchema.safeParse(profile);
  if (!validation.success) {
    throw new Error(`Invalid profile data: ${validation.error.message}`);
  }

  const existingProfiles = await listProfiles();
  const duplicateName = existingProfiles.find(
    (p) => p.name.toLowerCase() === sanitizedName.toLowerCase() && p.id !== profile.id
  );
  if (duplicateName) {
    throw new Error(`A profile with the name "${sanitizedName}" already exists`);
  }

  await ensureProfilesDir();

  const profileToSave: Profile = {
    ...profile,
    name: sanitizedName,
    config: stripSharedSettingsFromConfig(profile.config),
    updatedAt: Date.now(),
    createdAt: profile.createdAt || Date.now(),
  };

  const profilePath = getProfilePath(profile.id);
  await fs.writeFile(profilePath, JSON.stringify(profileToSave, null, 2), 'utf-8');
}

export async function deleteProfile(id: string): Promise<void> {
  const profilePath = getProfilePath(id);

  try {
    await fs.unlink(profilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  try {
    const activeId = await getActiveProfileId();
    if (activeId === id) {
      await setActiveProfileId('');
    }
  } catch {
    return;
  }
}

export async function duplicateProfile(id: string, newName: string): Promise<Profile> {
  const sanitizedNewName = sanitizeProfileName(newName);
  if (!sanitizedNewName) {
    throw new Error('New profile name cannot be empty');
  }

  const originalProfile = await getProfile(id);
  if (!originalProfile) {
    throw new Error(`Profile with id "${id}" not found`);
  }

  const existingProfiles = await listProfiles();
  const duplicateName = existingProfiles.find(
    (p) => p.name.toLowerCase() === sanitizedNewName.toLowerCase()
  );
  if (duplicateName) {
    throw new Error(`A profile with the name "${sanitizedNewName}" already exists`);
  }

  const newProfile: Profile = {
    ...originalProfile,
    id: randomUUID(),
    name: sanitizedNewName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveProfile(newProfile);
  return newProfile;
}

export async function getActiveProfileId(): Promise<string | null> {
  const activePath = getActiveProfilePath();

  try {
    const content = await fs.readFile(activePath, 'utf-8');
    const data = JSON.parse(content);
    if (typeof data.id === 'string' && data.id) {
      const profile = await getProfile(data.id);
      return profile ? data.id : null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setActiveProfileId(id: string): Promise<void> {
  const activePath = getActiveProfilePath();
  const userData = app.getPath('userData');

  if (!id) {
    try {
      await fs.unlink(activePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    return;
  }

  const profile = await getProfile(id);
  if (!profile) {
    throw new Error(`Profile with id "${id}" not found`);
  }

  try {
    await fs.access(userData);
  } catch {
    await fs.mkdir(userData, { recursive: true });
  }

  await fs.writeFile(activePath, JSON.stringify({ id }, null, 2), 'utf-8');
}
