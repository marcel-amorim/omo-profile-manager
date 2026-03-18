import { promises as fs } from 'fs';
import { OMO_CONFIG_PATH } from './paths.js';
import type { OMOConfig } from '../../shared/types.js';
import { validateOMOConfig } from '../../shared/schemas.js';
import { ZodError } from 'zod';
import stripJsonComments from 'strip-json-comments';

export type ConfigReadError =
  | { type: 'NOT_FOUND'; message: string }
  | { type: 'PERMISSION_DENIED'; message: string }
  | { type: 'PARSE_ERROR'; message: string; cause?: Error }
  | { type: 'VALIDATION_ERROR'; message: string; zodError: ZodError }
  | { type: 'UNKNOWN_ERROR'; message: string; cause?: Error };

export class ConfigReadException extends Error {
  constructor(
    public readonly errorType: ConfigReadError['type'],
    message: string,
    public readonly cause?: Error,
    public readonly zodError?: ZodError
  ) {
    super(message);
    this.name = 'ConfigReadException';
  }
}

function isNodeErrorWithCode(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export async function readOMOConfig(): Promise<OMOConfig | null> {
  try {
    const content = await fs.readFile(OMO_CONFIG_PATH, 'utf-8');
    const jsonContent = stripJsonComments(content);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      const message =
        parseError instanceof Error
          ? `Invalid JSON: ${parseError.message}`
          : 'Invalid JSON in config file';

      throw new ConfigReadException('PARSE_ERROR', message, parseError as Error);
    }

    try {
      const validated = validateOMOConfig(parsed);
      return validated as OMOConfig;
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        const issues = validationError.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new ConfigReadException(
          'VALIDATION_ERROR',
          `Config validation failed: ${issues}`,
          undefined,
          validationError
        );
      }
      throw validationError;
    }
  } catch (error) {
    if (error instanceof ConfigReadException) {
      throw error;
    }

    if (isNodeErrorWithCode(error)) {
      if (error.code === 'ENOENT') {
        return null;
      }

      if (error.code === 'EACCES') {
        throw new ConfigReadException(
          'PERMISSION_DENIED',
          `Permission denied reading config file: ${OMO_CONFIG_PATH}`
        );
      }
    }

    throw new ConfigReadException(
      'UNKNOWN_ERROR',
      error instanceof Error ? error.message : 'Unknown error reading config file',
      error instanceof Error ? error : undefined
    );
  }
}

export async function readCurrentConfig(): Promise<OMOConfig> {
  if (typeof window === 'undefined') {
    throw new ConfigReadException(
      'UNKNOWN_ERROR',
      'readCurrentConfig() must be called from the renderer process'
    );
  }

  const electronApi = (window as unknown as {
    electron?: {
      config?: {
        readConfig: () => Promise<OMOConfig>;
      };
    };
  }).electron;

  if (!electronApi?.config?.readConfig) {
    throw new ConfigReadException(
      'UNKNOWN_ERROR',
      'Electron config bridge not available. Ensure preload script is loaded.'
    );
  }

  try {
    const config = await electronApi.config.readConfig();
    return config;
  } catch (error) {
    throw new ConfigReadException(
      'UNKNOWN_ERROR',
      error instanceof Error
        ? `Failed to read current config: ${error.message}`
        : 'Failed to read current config',
      error instanceof Error ? error : undefined
    );
  }
}

export async function configExists(): Promise<boolean> {
  try {
    await fs.access(OMO_CONFIG_PATH);
    return true;
  } catch {
    return false;
  }
}

export async function getConfigFileInfo(): Promise<{
  exists: boolean;
  readable: boolean;
  writable: boolean;
}> {
  try {
    await fs.access(OMO_CONFIG_PATH);
  } catch {
    return { exists: false, readable: false, writable: false };
  }

  let readable = false;
  let writable = false;

  try {
    await fs.access(OMO_CONFIG_PATH, fs.constants.R_OK);
    readable = true;
  } catch {
    readable = false;
  }

  try {
    await fs.access(OMO_CONFIG_PATH, fs.constants.W_OK);
    writable = true;
  } catch {
    writable = false;
  }

  return { exists: true, readable, writable };
}
