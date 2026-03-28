import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, closeApp, skipWizard } from '../helpers/app-helpers';

test.describe('Model Startup Behavior', () => {
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

  test('page renders and is interactive before models finish loading', async () => {
    await window.waitForLoadState('domcontentloaded');
    
    const wizard = window.locator('[data-testid="setup-wizard"]');
    const wizardVisible = await wizard.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (wizardVisible) {
      await skipWizard(window);
    }

    const createBtn = window.locator('[data-testid="create-profile-btn"]');
    
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await expect(createBtn).toBeEnabled({ timeout: 5000 });
    
    await createBtn.click();
    
    const nameInput = window.locator('[data-testid="profile-name-input"]');
    await expect(nameInput).toBeVisible({ timeout: 2000 });
    await nameInput.fill('Early Render Test');
    
    const saveBtn = window.locator('[data-testid="save-profile-btn"]');
    await expect(saveBtn).toBeEnabled({ timeout: 2000 });
  });

  test('no model error banner when models load successfully', async () => {
    await window.waitForLoadState('domcontentloaded');
    
    const wizard = window.locator('[data-testid="setup-wizard"]');
    const wizardVisible = await wizard.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (wizardVisible) {
      await skipWizard(window);
    }

    await window.waitForTimeout(2000);
    
    const modelsErrorBanner = window.locator('text=/Failed to load models/i');
    const emptyModelsBanner = window.locator('text=/Models list is empty/i');
    
    await expect(modelsErrorBanner).not.toBeVisible({ timeout: 5000 });
    await expect(emptyModelsBanner).not.toBeVisible({ timeout: 5000 });
  });
});