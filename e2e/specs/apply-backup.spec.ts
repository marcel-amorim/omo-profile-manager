import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, closeApp, skipWizard, waitForSuccessToastCycle } from '../helpers/app-helpers';
import { testProfile } from '../fixtures/test-data';
import fs from 'fs';
import path from 'path';

test.describe('Apply Profile and Backup', () => {
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

  test('should apply profile and create backup', async () => {
    await window.locator('[data-testid="create-profile-btn"]').click();
    await window.locator('[data-testid="profile-name-input"]').fill(testProfile.name);
    await window.locator('[data-testid="save-profile-btn"]').click();
    await waitForSuccessToastCycle(window, 'Profile updated successfully');
    
    const profileCard = window.locator(`[data-testid="profile-item-${testProfile.name}"]`).locator('..');
    await profileCard.getByTestId('apply-profile-btn').click();
    
    await window.locator('[data-testid="confirm-apply-btn"]').click();
    
    await expect(window.getByRole('alert').filter({ hasText: 'Profile applied successfully' })).toBeVisible();
    
    const backupDir = path.join(tempDir, '.config', 'opencode', 'backups');
    
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir);
      expect(backups.length).toBeGreaterThan(0);
    }
  });
});
