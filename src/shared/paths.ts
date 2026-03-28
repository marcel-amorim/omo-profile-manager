import { createRequire } from 'module';
import { join } from 'path';
import { existsSync, mkdirSync, accessSync, constants } from 'fs';
import { homedir } from 'os';

const requireModule = createRequire(import.meta.url);

let app: { getPath: (name: string) => string } | null = null;

try {
  if (typeof require !== 'undefined') {
    const electron = requireModule('electron') as { app?: { getPath: (name: string) => string } };
    app = electron.app ?? null;
  }
} catch {
  app = null;
}

export function getProfilesDir(): string {
  if (app) {
    return join(app.getPath('userData'), 'profiles');
  }
  return join(homedir(), '.config', 'opencode', 'profiles');
}

export function ensureDir(dirPath: string): boolean {
  try {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

export function isPathWritable(dirPath: string): boolean {
  try {
    accessSync(dirPath, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function isPathReadable(filePath: string): boolean {
  try {
    accessSync(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function validatePath(filePath: string): {
  exists: boolean;
  readable: boolean;
  writable: boolean;
} {
  const exists = existsSync(filePath);
  let readable = false;
  let writable = false;

  if (exists) {
    try {
      accessSync(filePath, constants.R_OK);
      readable = true;
    } catch {
      readable = false;
    }

    try {
      accessSync(filePath, constants.W_OK);
      writable = true;
    } catch {
      writable = false;
    }
  }

  return { exists, readable, writable };
}

export function resolveConfigPath(...segments: string[]): string {
  return join(homedir(), '.config', 'opencode', ...segments);
}
