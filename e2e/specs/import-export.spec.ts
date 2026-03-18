import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, closeApp, skipWizard } from '../helpers/app-helpers';
import { testProfile } from '../fixtures/test-data';
import path from 'path';
import fs from 'fs';
import os from 'os';

test.describe('Import and Export', () => {
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

  test('should export a profile', async () => {
    await window.locator('[data-testid="create-profile-btn"]').click();
    await window.locator('[data-testid="profile-name-input"]').fill('Export Test');
    await window.locator('[data-testid="save-profile-btn"]').click();
    
    await window.evaluate(() => {
      (window as any).__downloadedUrl = null;
      (window as any).__downloadedName = null;
      const originalClick = window.HTMLElement.prototype.click;
      window.HTMLElement.prototype.click = function() {
        if (this instanceof HTMLAnchorElement && this.download) {
          (window as any).__downloadedUrl = this.href;
          (window as any).__downloadedName = this.download;
        } else {
          originalClick.call(this);
        }
      };
    });
    
    await window.locator('[data-testid="profile-item-Export Test"]').hover();
    await window.locator('[data-testid="profile-item-Export Test"]').locator('button[title="Export Profile"]').click();
    
    await expect(async () => {
      const downloadedName = await window.evaluate(() => (window as any).__downloadedName);
      expect(downloadedName).toBe('export-test-omo-profile.json');
    }).toPass();
  });

  test('should import a profile', async () => {
    const importPath = path.join(tempDir, 'import-test.json');
    console.log('testProfile:', JSON.stringify(testProfile, null, 2));
    fs.writeFileSync(importPath, JSON.stringify(testProfile));
    
    await window.locator('input[type="file"]').setInputFiles(importPath);
    
    const errorToast = window.locator('.bg-red-600');
    if (await errorToast.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await errorToast.textContent();
      console.error('Import failed with toast:', text);
    }
    
    await expect(window.locator(`[data-testid="profile-item-${testProfile.name}"]`)).toBeVisible();
  });
});
