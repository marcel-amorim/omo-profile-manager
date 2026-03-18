import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, closeApp } from '../helpers/app-helpers';

test.describe('Setup Wizard', () => {
  let app: ElectronApplication;
  let window: Page;
  let tempDir: string;

  test.beforeEach(async () => {
    const launched = await launchApp();
    app = launched.app;
    window = launched.window;
    tempDir = launched.tempDir;
  });

  test.afterEach(async () => {
    await closeApp(app, tempDir);
  });

  test('should show wizard on first launch and allow skipping', async () => {
    const wizard = window.locator('[data-testid="setup-wizard"]');
    await expect(wizard).toBeVisible();
    
    await window.locator('[data-testid="skip-wizard-btn"]').click();
    await window.locator('[data-testid="wizard-finish-btn"]').click();
    
    await expect(wizard).not.toBeVisible();
    await expect(window.locator('[data-testid="create-profile-btn"]')).toBeVisible();
  });

  test('should complete wizard flow', async () => {
    const wizard = window.locator('[data-testid="setup-wizard"]');
    await expect(wizard).toBeVisible();
    
    await window.locator('button:has-text("Next")').click();
    
    await window.locator('text="Recommended Defaults"').click();
    
    await window.locator('button:has-text("Next")').click();
    
    await window.locator('[data-testid="wizard-finish-btn"]').click();
    
    await expect(wizard).not.toBeVisible();
    
    const applyModal = window.locator('text="Apply Profile"').first();
    if (await applyModal.isVisible({ timeout: 5000 })) {
      await window.locator('button:has-text("Cancel")').click({ force: true });
    }
    
    await expect(window.locator('[data-testid="create-profile-btn"]')).toBeVisible();
  });
});
