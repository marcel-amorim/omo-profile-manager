import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, closeApp, skipWizard } from '../helpers/app-helpers';

test.describe('Keyboard Shortcuts', () => {
  let app: ElectronApplication;
  let window: Page;
  let tempDir: string;

  test.beforeEach(async () => {
    const launched = await launchApp();
    app = launched.app;
    window = launched.window;
    tempDir = launched.tempDir;
    await skipWizard(window);
  });

  test.afterEach(async () => {
    await closeApp(app, tempDir);
  });

  test('should trigger create profile with Cmd/Ctrl+N', async () => {
    await app.evaluate(({ webContents }) => {
      webContents.getAllWebContents()[0].send('shortcut:triggered', { action: 'create-profile' });
    });
    
    await expect(window.locator('[data-testid="profile-name-input"]')).toBeVisible();
  });

  test('should trigger save profile with Cmd/Ctrl+S', async () => {
    await window.locator('[data-testid="create-profile-btn"]').click();
    await window.locator('[data-testid="profile-name-input"]').fill('Shortcut Save Test');
    
    await window.locator('body').click();
    
    await app.evaluate(({ webContents }) => {
      webContents.getAllWebContents()[0].send('shortcut:triggered', { action: 'save-profile' });
    });
    
    await expect(window.locator('[data-testid="profile-item-Shortcut Save Test"]')).toBeVisible();
  });
});
