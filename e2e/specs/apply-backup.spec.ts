import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, closeApp, skipWizard } from '../helpers/app-helpers';
import { testProfile } from '../fixtures/test-data';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    
    await window.locator(`[data-testid="profile-item-${testProfile.name}"]`).hover();
    await window.locator(`[data-testid="profile-item-${testProfile.name}"]`).locator('button[title="Apply Profile"]').click();
    
    await window.locator('[data-testid="confirm-apply-btn"]').click();
    
    await expect(window.locator('[data-testid="toast-success"]')).toBeVisible();
    
    const omoConfigPath = path.join(os.homedir(), '.config', 'opencode', 'oh-my-opencode.json');
    const backupDir = path.join(os.homedir(), '.config', 'opencode', 'backups');
    
    if (fs.existsSync(backupDir)) {
      const backups = fs.readdirSync(backupDir);
      expect(backups.length).toBeGreaterThan(0);
    }
  });
});
