import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promisify } from 'util';
import { IpcChannels, type IpcResult } from '../../shared/ipc';

// eslint-disable-next-line @typescript-eslint/ban-types -- test mock pattern
const mockIpcHandlers = new Map<string, Function>();
const execCalls: Array<{ command: string; options: unknown }> = [];
const execQueue: Array<(command: string, options: unknown) => Promise<{ stdout: string; stderr: string }>> = [];

const execMock = vi.fn();
const execAsyncMock = vi.fn(async (command: string, options?: unknown) => {
  execCalls.push({ command, options });

  const next = execQueue.shift();
  if (!next) {
    throw new Error(`No exec response queued for ${command}`);
  }

  return next(command, options);
});

(execMock as typeof execMock & { [promisify.custom]: typeof execAsyncMock })[promisify.custom] = execAsyncMock;

vi.mock('child_process', () => ({
  exec: execMock,
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => { // eslint-disable-line @typescript-eslint/ban-types -- test mock pattern
      mockIpcHandlers.set(channel, handler);
    }),
  },
}));

type ModelsHandlerModule = typeof import('../ipc/handlers/models');
type ModelsHandlerResult = IpcResult<{
  models: string[];
  modelInfos: unknown[];
  rawStdout?: string;
  rawStderr?: string;
}>;
type DeferredExec = {
  resolve: (stdout: string, stderr?: string) => void;
  reject: (message: string, stdout?: string, stderr?: string) => void;
};

let registerModelsHandlers: ModelsHandlerModule['registerModelsHandlers'];
let resetCacheState: ModelsHandlerModule['resetCacheState'];
let listModelsHandler: () => Promise<ModelsHandlerResult>;

function queueExecSuccess(stdout: string, stderr = ''): void {
  execQueue.push(async () => ({ stdout, stderr }));
}

function queueExecDeferred(): DeferredExec {
  let resolvePromise: ((value: { stdout: string; stderr: string }) => void) | null = null;
  let rejectPromise: ((reason: Error & { stdout?: string; stderr?: string }) => void) | null = null;

  const promise = new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  execQueue.push(async () => promise);

  return {
    resolve: (stdout: string, stderr = '') => {
      resolvePromise?.({ stdout, stderr });
    },
    reject: (message: string, stdout = '', stderr = '') => {
      const error = new Error(message) as Error & { stdout?: string; stderr?: string };
      error.stdout = stdout;
      error.stderr = stderr;
      rejectPromise?.(error);
    },
  };
}

function queueInitialFetch(stdout: string): void {
  queueExecSuccess('found\n');
  queueExecSuccess('PATH=/mock/bin\0HOME=/tmp/test\0');
  queueExecSuccess(stdout);
}

function countExecCalls(pattern: RegExp): number {
  return execCalls.filter(call => pattern.test(call.command)).length;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function expectSuccessfulModels(result: ModelsHandlerResult, models: string[]): void {
  expect(result.success).toBe(true);
  if (!result.success) {
    return;
  }

  expect(result.data.models).toEqual(models);
}

function expectFailureCode(
  result: ModelsHandlerResult,
  code: string
): asserts result is Extract<ModelsHandlerResult, { success: false }> {
  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error('Expected failure result');
  }

  expect(result.error.code).toBe(code);
}

describe('Models Handler Integration', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    vi.resetModules();
    mockIpcHandlers.clear();
    execCalls.length = 0;
    execQueue.length = 0;
    execMock.mockClear();
    execAsyncMock.mockClear();

    const modelsModule = await import('../ipc/handlers/models');
    registerModelsHandlers = modelsModule.registerModelsHandlers;
    resetCacheState = modelsModule.resetCacheState;

    resetCacheState();
    registerModelsHandlers();

    listModelsHandler = mockIpcHandlers.get(IpcChannels.LIST_MODELS) as typeof listModelsHandler;
  });

  afterEach(() => {
    resetCacheState();
    vi.useRealTimers();
  });

  it('reuses cached models for repeated calls within the fresh ttl', async () => {
    queueInitialFetch('model-a\nmodel-b');

    const firstResult = await listModelsHandler();
    const callCountAfterFirstFetch = execCalls.length;
    const secondResult = await listModelsHandler();

    expectSuccessfulModels(firstResult, ['model-a', 'model-b']);
    expectSuccessfulModels(secondResult, ['model-a', 'model-b']);
    expect(execCalls).toHaveLength(callCountAfterFirstFetch);
    expect(countExecCalls(/models --verbose/)).toBe(1);
  });

  it('shares one in-flight fetch across concurrent calls', async () => {
    queueExecSuccess('found\n');
    queueExecSuccess('PATH=/mock/bin\0HOME=/tmp/test\0');
    const inflightFetch = queueExecDeferred();

    const firstCall = listModelsHandler();
    const secondCall = listModelsHandler();

    await flushPromises();

    inflightFetch.resolve('model-a\nmodel-b');

    const [firstResult, secondResult] = await Promise.all([firstCall, secondCall]);

    expectSuccessfulModels(firstResult, ['model-a', 'model-b']);
    expectSuccessfulModels(secondResult, ['model-a', 'model-b']);
    expect(execCalls).toHaveLength(3);
    expect(countExecCalls(/models --verbose/)).toBe(1);
  });

  it('returns stale cache immediately while triggering a background refresh', async () => {
    queueInitialFetch('model-a\nmodel-b');

    const freshResult = await listModelsHandler();
    expectSuccessfulModels(freshResult, ['model-a', 'model-b']);

    vi.advanceTimersByTime(5 * 60 * 1000);

    const backgroundRefresh = queueExecDeferred();
    const staleResultPromise = listModelsHandler();

    await flushPromises();

    const staleResult = await staleResultPromise;

    expectSuccessfulModels(staleResult, ['model-a', 'model-b']);
    expect(countExecCalls(/models --verbose/)).toBe(2);

    backgroundRefresh.resolve('model-c\nmodel-d');
    await flushPromises();
  });

  it('returns refreshed data on the next call after a stale-cache refresh completes', async () => {
    queueInitialFetch('model-a\nmodel-b');

    const initialResult = await listModelsHandler();
    expectSuccessfulModels(initialResult, ['model-a', 'model-b']);

    vi.advanceTimersByTime(5 * 60 * 1000);

    queueExecSuccess('model-c\nmodel-d');
    const staleResult = await listModelsHandler();

    expectSuccessfulModels(staleResult, ['model-a', 'model-b']);

    await flushPromises();
    expect(countExecCalls(/models --verbose/)).toBe(2);
    await flushPromises();

    const callCountAfterRefresh = execCalls.length;
    const refreshedResult = await listModelsHandler();

    expectSuccessfulModels(refreshedResult, ['model-c', 'model-d']);
    expect(execCalls).toHaveLength(callCountAfterRefresh);
    expect(countExecCalls(/models --verbose/)).toBe(2);
  });

  it('returns structured failure when no models are parsed', async () => {
    queueInitialFetch('\n\n');

    const result = await listModelsHandler();

    expectFailureCode(result, 'MODELS_EMPTY');
    expect(result.error.message).toBe('Models list is empty');
    expect(result.error.details).toMatchObject({
      rawStdout: '\n\n',
      rawStderr: '',
      binaryPath: '/usr/local/bin/opencode',
    });
  });

  it('returns structured failure when verbose output has no usable model ids', async () => {
    queueInitialFetch('warn-output-123 unexpected\n{\n  "providerID": "oops"\n}');

    const result = await listModelsHandler();

    expectFailureCode(result, 'MODELS_UNUSABLE');
    expect(result.error.message).toBe('No usable model ids were found');
    expect(result.error.details).toMatchObject({
      rawStdout: 'warn-output-123 unexpected\n{\n  "providerID": "oops"\n}',
      rawStderr: '',
      binaryPath: '/usr/local/bin/opencode',
      parsedModels: ['warn-output-123 unexpected'],
    });
  });

  it('returns fetch failure when the cli execution fails entirely', async () => {
    queueExecSuccess('found\n');
    queueExecSuccess('PATH=/mock/bin\0HOME=/tmp/test\0');
    execQueue.push(async () => {
      const error = new Error('spawn failed') as Error & { stdout?: string; stderr?: string };
      error.stdout = '{"providerID":"oops"}';
      error.stderr = 'fatal: missing binary';
      throw error;
    });

    const result = await listModelsHandler();

    expectFailureCode(result, 'FETCH_FAILED');
    expect(result.error.message).toBe('Failed to execute opencode models: spawn failed');
    expect(result.error.details).toMatchObject({
      rawStdout: '{"providerID":"oops"}',
      rawStderr: 'fatal: missing binary',
      binaryPath: '/usr/local/bin/opencode',
    });
  });
});
