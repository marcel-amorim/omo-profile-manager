import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, closeApp, skipWizard, waitForSuccessToastCycle } from '../helpers/app-helpers';
import { testProfile } from '../fixtures/test-data';
import path from 'path';
import fs from 'fs';

test.describe('Import and Export', () => {
  let app: ElectronApplication;
  let page: Page;
  let tempDir: string;

  test.beforeEach(async () => {
    const launched = await launchApp();
    app = launched.app;
    page = launched.window;
    tempDir = launched.tempDir;
    await skipWizard(page);
  });

  test.afterEach(async () => {
    await closeApp(app, tempDir);
  });

  test('should export a profile', async () => {
    await page.locator('[data-testid="create-profile-btn"]').click();
    await page.locator('[data-testid="profile-name-input"]').fill('Export Test');
    await page.locator('[data-testid="save-profile-btn"]').click();
    await waitForSuccessToastCycle(page, 'Profile updated successfully');

    await page.evaluate(() => {
      const pageWindow = window as unknown as Window & {
        __downloadedUrl: string | null;
        __downloadedName: string | null;
      };

      pageWindow.__downloadedUrl = null;
      pageWindow.__downloadedName = null;

      const originalClick = HTMLElement.prototype.click;

      HTMLElement.prototype.click = function (this: HTMLElement) {
        if (this instanceof HTMLAnchorElement && this.download) {
          pageWindow.__downloadedUrl = this.href;
          pageWindow.__downloadedName = this.download;
        } else {
          originalClick.call(this);
        }
      };
    });

    const profileCard = page.locator('[data-testid="profile-item-Export Test"]').locator('..');
    await profileCard.getByTitle('Export Profile').click();

    await expect(async () => {
      const downloadedName = await page.evaluate(() => {
        const pageWindow = window as unknown as Window & { __downloadedName: string | null };
        return pageWindow.__downloadedName;
      });

      expect(downloadedName).toBe('export-test-omo-profile.json');
    }).toPass();
  });

  test('should import a profile', async () => {
    const importPath = path.join(tempDir, 'import-test.json');
    console.log('testProfile:', JSON.stringify(testProfile, null, 2));
    fs.writeFileSync(importPath, JSON.stringify(testProfile));
    
    await page.locator('input[type="file"]').setInputFiles(importPath);

    const errorToast = page.locator('.bg-red-600');
    if (await errorToast.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await errorToast.textContent();
      console.error('Import failed with toast:', text);
    }
    
    await expect(page.locator(`[data-testid="profile-item-${testProfile.name}"]`)).toBeVisible();
  });
});
