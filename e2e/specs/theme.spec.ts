import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, closeApp, skipWizard } from '../helpers/app-helpers';

test.describe('Theme Switching', () => {
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

  test('should toggle theme between light and dark', async () => {
    const html = window.locator('html');
    
    const isDarkInitially = await html.evaluate((node) => node.classList.contains('dark'));
    
    await window.locator('[data-testid="theme-toggle-btn"]').click();
    
    if (isDarkInitially) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }
    
    await window.locator('[data-testid="theme-toggle-btn"]').click();
    
    if (isDarkInitially) {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }
  });
});
