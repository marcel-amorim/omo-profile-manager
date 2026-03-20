import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IpcChannels, IpcResult } from '../../../shared/ipc';

const execAsync = promisify(exec);

interface ModelsResult {
  models: string[];
  rawStdout: string;
  rawStderr: string;
}

let cachedResult: ModelsResult | null = null;
let isFetching = false;
let fetchPromise: Promise<ModelsResult> | null = null;
let resolvedBinaryPath: string | null = null;
let resolvedEnv: NodeJS.ProcessEnv | null = null;

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
  try {
    const { stdout } = await execAsync(
      `${shell} -ilc 'echo "___ENV_START___${JSON.stringify(process.env).replace(/'/g, "'\"'\"'")}___ENV_END___"'`,
      { timeout: 10000 }
    );
    const match = stdout.match(/___ENV_START___(.+?)___ENV_END___/);
    if (match) {
      try {
        resolvedEnv = JSON.parse(match[1]);
      } catch {
        resolvedEnv = process.env as NodeJS.ProcessEnv;
      }
      return resolvedEnv!;
    }
  } catch (error) {
    console.warn('[models] getShellEnv failed:', error);
  }

  resolvedEnv = process.env!;
  return resolvedEnv!;
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
    } catch {}
  }

  const shell = process.env.SHELL || '/bin/zsh';
  try {
    const { stdout } = await execAsync(
      `${shell} -lc 'command -v opencode || which opencode || echo ""'`,
      { timeout: 8000, env: { ...process.env } }
    );
    const path = stdout.trim();
    if (path && path.length > 0 && !path.includes('not found') && !path.includes('no opencode')) {
      resolvedBinaryPath = path;
      return resolvedBinaryPath;
    }
  } catch (error) {
    console.warn('Failed to find opencode via shell:', error);
  }

  resolvedBinaryPath = 'opencode';
  return resolvedBinaryPath;
}

async function fetchModels(): Promise<ModelsResult> {
  if (cachedResult) return cachedResult;

  if (isFetching && fetchPromise) return fetchPromise;

  isFetching = true;
  fetchPromise = (async () => {
    const binaryPath = await findOpencodeBinaryPath();
    const env = await getShellEnv();
    console.log('[models] binary:', binaryPath);

    let rawStdout = '';
    let rawStderr = '';

    try {
      const result = await execAsync(`"${binaryPath}" models`, {
        timeout: 15000,
        env: { ...env },
      });
      rawStdout = result.stdout;
      rawStderr = result.stderr;
    } catch (error) {
      const execError = error as { stdout?: string; stderr?: string; message?: string };
      rawStdout = execError.stdout ?? '';
      rawStderr = execError.stderr ?? '';
      console.error('[models] exec error:', execError.message, 'stdout:', rawStdout, 'stderr:', rawStderr);
    }

    const models = rawStdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith(' ') && !line.includes('[Agent Usage Reminder]'));

    console.log('[models] stdout:', JSON.stringify(rawStdout));
    console.log('[models] stderr:', JSON.stringify(rawStderr));
    console.log('[models] Found models:', models.length);

    cachedResult = { models, rawStdout, rawStderr };
    return cachedResult;
  })();

  try {
    return await fetchPromise;
  } finally {
    isFetching = false;
    fetchPromise = null;
  }
}

export function registerModelsHandlers(): void {
  ipcMain.handle(
    IpcChannels.LIST_MODELS,
    async (): Promise<IpcResult<ModelsResult>> => {
      try {
        const result = await fetchModels();
        if (result.models.length === 0) {
          return {
            success: false,
            error: {
              code: 'MODELS_EMPTY',
              message: `opencode models returned no models.\n\nRaw stdout:\n${result.rawStdout}\n\nRaw stderr:\n${result.rawStderr}\n\nBinary used: ${resolvedBinaryPath ?? 'unknown'}`,
            },
          };
        }
        return { success: true, data: result };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: { code: 'FETCH_FAILED', message } };
      }
    }
  );
}
