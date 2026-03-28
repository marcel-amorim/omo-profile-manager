import { expect, test } from '@playwright/test';
import { closeApp, launchApp, skipWizard } from '../helpers/app-helpers';

test('model warning banner shown when models fail to load without leaking raw output', async () => {
  const previousStdout = process.env.OMO_TEST_MODELS_STDOUT;
  const previousStderr = process.env.OMO_TEST_MODELS_STDERR;

  process.env.OMO_TEST_MODELS_STDOUT = 'warn-output-123 unexpected\n{\n  "providerID": "oops"\n  "name": "Broken"\n}';
  process.env.OMO_TEST_MODELS_STDERR = 'simulated stderr';

  try {
    const { app, window, tempDir } = await launchApp();

    await skipWizard(window);

    const warning = window.locator('.bg-amber-50');
    await expect(warning).toBeVisible({ timeout: 10000 });
    await expect(warning).toContainText(/Models list is empty|Failed to load models:/);
    await expect(warning).not.toContainText('warn-output-123 unexpected');
    await expect(warning).not.toContainText('providerID');
    await expect(window.locator('body')).not.toContainText('warn-output-123 unexpected');
    await expect(window.locator('body')).not.toContainText('providerID');

    await closeApp(app, tempDir);
  } finally {
    if (previousStdout === undefined) {
      delete process.env.OMO_TEST_MODELS_STDOUT;
    } else {
      process.env.OMO_TEST_MODELS_STDOUT = previousStdout;
    }

    if (previousStderr === undefined) {
      delete process.env.OMO_TEST_MODELS_STDERR;
    } else {
      process.env.OMO_TEST_MODELS_STDERR = previousStderr;
    }
  }
});
