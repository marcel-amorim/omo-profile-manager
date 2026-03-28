import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IpcChannels, IpcResult } from '../../../shared/ipc';
import { parseModelOutput } from './model-output-parser';

const execAsync = promisify(exec);

export interface ModelVariantInfo {
  [variantName: string]: Record<string, unknown>;
}

export interface ModelInfo {
  id: string;
  providerID: string;
  name: string;
  variants: ModelVariantInfo;
}

interface ModelsResult {
  models: string[];
  modelInfos: ModelInfo[];
  rawStdout: string;
  rawStderr: string;
  parsedModels?: string[];
}

type ModelsFailureDetails = {
  rawStdout: string;
  rawStderr: string;
  binaryPath: string;
  parsedModels?: string[];
};

class ModelsFetchError extends Error {
  readonly details: ModelsFailureDetails;

  constructor(message: string, details: ModelsFailureDetails) {
    super(message);
    this.name = 'ModelsFetchError';
    this.details = details;
  }
}

const CACHE_FRESHNESS_TTL = 5 * 60 * 1000;

let cachedResult: ModelsResult | null = null;
let cacheTimestamp: number = 0;
let isFetching = false;
let fetchPromise: Promise<ModelsResult> | null = null;
let resolvedBinaryPath: string | null = null;
let resolvedEnv: NodeJS.ProcessEnv | null = null;

const USABLE_MODEL_ID_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._/-]*[A-Za-z0-9])?$/;

export function isCacheFresh(): boolean {
  return cachedResult !== null && (Date.now() - cacheTimestamp) < CACHE_FRESHNESS_TTL;
}

export function isCacheStale(): boolean {
  return cachedResult !== null && (Date.now() - cacheTimestamp) >= CACHE_FRESHNESS_TTL;
}

export function getCachedResult(): ModelsResult | null {
  return cachedResult;
}

export function setCachedResult(result: ModelsResult): void {
  cachedResult = result;
  cacheTimestamp = Date.now();
}

export function resetCacheState(): void {
  cachedResult = null;
  cacheTimestamp = 0;
  isFetching = false;
  fetchPromise = null;
}

function isUsableModelId(modelId: string): boolean {
  return USABLE_MODEL_ID_PATTERN.test(modelId);
}

function normalizeParsedModels(
  parsedModels: string[],
  modelInfos: ModelInfo[]
): Pick<ModelsResult, 'models' | 'modelInfos' | 'parsedModels'> {
  const usableModels = parsedModels.filter(isUsableModelId);
  const usableModelIds = new Set(usableModels);

  return {
    parsedModels,
    models: usableModels,
    modelInfos: modelInfos.filter(info => usableModelIds.has(info.id)),
  };
}

function getModelsFailureDetails(
  rawStdout: string,
  rawStderr: string,
  parsedModels?: string[]
): ModelsFailureDetails {
  return {
    rawStdout,
    rawStderr,
    binaryPath: resolvedBinaryPath ?? 'unknown',
    ...(parsedModels ? { parsedModels } : {}),
  };
}

function createFailureResult(
  code: string,
  message: string,
  details: ModelsFailureDetails
): IpcResult<import('../../../shared/ipc').ModelsResult> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

function getTestModeModelsOutput(): { stdout: string; stderr: string } | null {
  if (process.env.OMO_TEST_MODE !== 'true') {
    return null;
  }

  if (process.env.OMO_TEST_MODELS_STDOUT === undefined && process.env.OMO_TEST_MODELS_STDERR === undefined) {
    return null;
  }

  return {
    stdout: process.env.OMO_TEST_MODELS_STDOUT ?? '',
    stderr: process.env.OMO_TEST_MODELS_STDERR ?? '',
  };
}

const COMMON_BINARY_PATHS = [
  '/usr/local/bin/opencode',
  '/opt/homebrew/bin/opencode',
  '/usr/bin/opencode',
  '/bin/opencode',
  `${process.env.HOME}/.local/bin/opencode`,
  `${process.env.HOME}/.bun/bin/opencode`,
  `${process.env.HOME}/.cargo/bin/opencode`,
];

async function getShellEnv(): Promise<NodeJS.ProcessEnv> {
  if (resolvedEnv) return resolvedEnv;

  if (process.platform === 'win32') {
    resolvedEnv = process.env;
    return resolvedEnv;
  }

  const shell = process.env.SHELL || '/bin/zsh';

  for (const flags of ['-lc', '-ilc']) {
    try {
      const { stdout } = await execAsync(
        `${shell} ${flags} 'env -0'`,
        { timeout: 10000 }
      );
      const env: Record<string, string> = {};
      for (const entry of stdout.split('\0')) {
        const idx = entry.indexOf('=');
        if (idx > 0) {
          env[entry.substring(0, idx)] = entry.substring(idx + 1);
        }
      }
      if (env.PATH) {
        resolvedEnv = { ...process.env, ...env } as NodeJS.ProcessEnv;
        console.log(`[models] shell PATH resolved (${flags}):`, env.PATH);
        return resolvedEnv;
      }
    } catch (error) {
      console.warn(`[models] getShellEnv (${flags}) failed:`, error);
    }
  }

  const extraPaths = [
    `${process.env.HOME}/.asdf/shims`,
    `${process.env.HOME}/.asdf/bin`,
    `${process.env.HOME}/.nvm/current/bin`,
    `${process.env.HOME}/.volta/bin`,
    `${process.env.HOME}/.bun/bin`,
    `${process.env.HOME}/.local/bin`,
    '/opt/homebrew/bin',
    '/usr/local/bin',
  ];
  const currentPath = process.env.PATH || '';
  const augmentedPath = [...extraPaths, ...currentPath.split(':')].join(':');
  console.log('[models] falling back to augmented PATH:', augmentedPath);

  resolvedEnv = { ...process.env, PATH: augmentedPath } as NodeJS.ProcessEnv;
  return resolvedEnv;
}

async function findOpencodeBinaryPath(): Promise<string> {
  if (resolvedBinaryPath) return resolvedBinaryPath;

  if (process.platform === 'win32') {
    resolvedBinaryPath = 'opencode';
    return resolvedBinaryPath;
  }

  for (const binPath of COMMON_BINARY_PATHS) {
    try {
      await execAsync(`test -x "${binPath}" && echo "found"`, { timeout: 2000 });
      resolvedBinaryPath = binPath;
      return resolvedBinaryPath;
    } catch {
      // Intentionally empty - path doesn't exist, try next
    }
  }

  const env = await getShellEnv();
  const shell = process.env.SHELL || '/bin/zsh';
  try {
    const { stdout } = await execAsync(
      `${shell} -lc 'command -v opencode || which opencode || echo ""'`,
      { timeout: 8000, env: { ...env } }
    );
    const resolved = stdout.trim();
    if (resolved && resolved.length > 0 && !resolved.includes('not found') && !resolved.includes('no opencode')) {
      resolvedBinaryPath = resolved;
      return resolvedBinaryPath;
    }
  } catch (error) {
    console.warn('Failed to find opencode via shell:', error);
  }

  resolvedBinaryPath = 'opencode';
  return resolvedBinaryPath;
}

async function fetchModels(): Promise<ModelsResult> {
  if (isCacheFresh()) return cachedResult!;

  if (isCacheStale()) {
    if (!isFetching) {
      triggerBackgroundRefresh();
    }
    return cachedResult!;
  }

  if (isFetching && fetchPromise) return fetchPromise;

  return await performFetch();
}

async function performFetch(): Promise<ModelsResult> {
  isFetching = true;
  fetchPromise = (async () => {
    const binaryPath = await findOpencodeBinaryPath();
    const env = await getShellEnv();
    console.log('[models] binary:', binaryPath);

    let rawStdout = '';
    let rawStderr = '';
    let executionErrorMessage: string | null = null;

    const execOpts = { timeout: 15000, env: { ...env } };
    const testModeOutput = getTestModeModelsOutput();

    if (testModeOutput) {
      rawStdout = testModeOutput.stdout;
      rawStderr = testModeOutput.stderr;
    } else {
      try {
        const result = await execAsync(`"${binaryPath}" models --verbose`, execOpts);
        rawStdout = result.stdout;
        rawStderr = result.stderr;
      } catch (error) {
        const execError = error as { stdout?: string; stderr?: string; message?: string };
        rawStdout = execError.stdout ?? '';
        rawStderr = execError.stderr ?? '';
        executionErrorMessage = execError.message ?? 'Failed to execute opencode models';
        console.error('[models] exec error:', execError.message, 'stdout:', rawStdout, 'stderr:', rawStderr);

        if (rawStderr.includes('No such file or directory')) {
          console.log('[models] retrying with fresh env resolution...');
          resolvedEnv = null;
          resolvedBinaryPath = null;
          const retryEnv = await getShellEnv();
          const retryBinary = await findOpencodeBinaryPath();
          console.log('[models] retry binary:', retryBinary);
          try {
            const retryResult = await execAsync(`"${retryBinary}" models --verbose`, {
              timeout: 15000,
              env: { ...retryEnv },
            });
            rawStdout = retryResult.stdout;
            rawStderr = retryResult.stderr;
            executionErrorMessage = null;
          } catch (retryError) {
            const retryExecError = retryError as { stdout?: string; stderr?: string; message?: string };
            rawStdout = retryExecError.stdout ?? '';
            rawStderr = retryExecError.stderr ?? '';
            executionErrorMessage = retryExecError.message ?? executionErrorMessage;
            console.error('[models] retry also failed:', retryExecError.message);
          }
        }
      }
    }

    if (executionErrorMessage) {
      throw new ModelsFetchError(
        `Failed to execute opencode models: ${executionErrorMessage}`,
        getModelsFailureDetails(rawStdout, rawStderr)
      );
    }

    const parsedResult = parseModelOutput(rawStdout);
    const { models, modelInfos, parsedModels } = normalizeParsedModels(
      parsedResult.models,
      parsedResult.modelInfos
    );

    console.log('[models] Found models:', models.length, '(with variant info:', modelInfos.length, ')');

    const result = { models, modelInfos, rawStdout, rawStderr, parsedModels };
    if (models.length > 0) {
      setCachedResult(result);
    }
    return result;
  })();

  try {
    return await fetchPromise;
  } finally {
    isFetching = false;
    fetchPromise = null;
  }
}

function triggerBackgroundRefresh(): void {
  performFetch().catch(err => {
    console.warn('[models] background refresh failed:', err);
  });
}

export function registerModelsHandlers(): void {
  ipcMain.handle(
    IpcChannels.LIST_MODELS,
    async (): Promise<IpcResult<import('../../../shared/ipc').ModelsResult>> => {
      try {
        const result = await fetchModels();
        const parsedModels = result.parsedModels ?? result.models;
        if (parsedModels.length === 0) {
          return createFailureResult(
            'MODELS_EMPTY',
            'Models list is empty',
            getModelsFailureDetails(result.rawStdout, result.rawStderr)
          );
        }
        if (result.models.length === 0) {
          return createFailureResult(
            'MODELS_UNUSABLE',
            'No usable model ids were found',
            getModelsFailureDetails(result.rawStdout, result.rawStderr, parsedModels)
          );
        }
        return { success: true, data: result };
      } catch (error) {
        if (error instanceof ModelsFetchError) {
          return createFailureResult('FETCH_FAILED', error.message, error.details);
        }
        const message = error instanceof Error ? error.message : String(error);
        return createFailureResult(
          'FETCH_FAILED',
          message,
          getModelsFailureDetails('', '')
        );
      }
    }
  );
}
