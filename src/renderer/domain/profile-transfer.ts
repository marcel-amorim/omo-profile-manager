import type { Profile } from '../../shared/types';
import { validateProfileSafe } from '../../shared/schemas';

export type ImportableProfileData = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>;

type ParseImportedProfileResult =
  | { success: true; data: ImportableProfileData }
  | { success: false; message: string };

export const sanitizeProfileFilename = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
};

export const createProfileExportPayload = (profile: Profile): ImportableProfileData => {
  return {
    name: profile.name,
    description: profile.description,
    config: profile.config,
  };
};

interface CreateImportedProfileOptions {
  descriptionFallback?: string;
  idFactory?: () => string;
  now?: number;
}

export const createImportedProfile = (
  profileData: ImportableProfileData,
  options?: CreateImportedProfileOptions
): Profile => {
  const now = options?.now ?? Date.now();
  const id = options?.idFactory?.() ?? `${now}-${Math.random().toString(36).slice(2, 11)}`;

  return {
    ...profileData,
    id,
    description: profileData.description ?? options?.descriptionFallback,
    createdAt: now,
    updatedAt: now,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getValidationMessage = (result: ReturnType<typeof validateProfileSafe>): string => {
  if (result.success) {
    return '';
  }

  const issues = result.error.issues
    .slice(0, 3)
    .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`);

  return `Validation failed: ${issues.join(', ')}`;
};

export const parseImportedProfileText = (text: string): ParseImportedProfileResult => {
  let parsedData: unknown;

  try {
    parsedData = JSON.parse(text);
  } catch {
    return { success: false, message: 'Invalid JSON format. Please check your file.' };
  }

  if (!isRecord(parsedData)) {
    return { success: false, message: 'Invalid profile format. Expected a JSON object.' };
  }

  const now = Date.now();
  const profileForValidation: Record<string, unknown> = {
    id: typeof parsedData.id === 'string' ? parsedData.id : `${now}`,
    name: typeof parsedData.name === 'string' ? parsedData.name : 'Imported Profile',
    description: typeof parsedData.description === 'string' ? parsedData.description : undefined,
    config: parsedData.config,
    createdAt: typeof parsedData.createdAt === 'number' ? parsedData.createdAt : now,
    updatedAt: typeof parsedData.updatedAt === 'number' ? parsedData.updatedAt : now,
  };

  const validation = validateProfileSafe(profileForValidation);
  if (!validation.success) {
    return {
      success: false,
      message: getValidationMessage(validation),
    };
  }

  return {
    success: true,
    data: createProfileExportPayload(validation.data),
  };
};
