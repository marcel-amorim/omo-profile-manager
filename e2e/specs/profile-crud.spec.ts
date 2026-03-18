import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, closeApp, skipWizard } from '../helpers/app-helpers';
import { testProfile } from '../fixtures/test-data';

test.describe('Profile CRUD Operations', () => {
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

  test('should create a new profile', async () => {
    await window.locator('[data-testid="create-profile-btn"]').click();
    
    await window.locator('[data-testid="profile-name-input"]').fill(testProfile.name);
    await window.locator('[data-testid="profile-description-input"]').fill(testProfile.description);
    
    await window.locator('[data-testid="save-profile-btn"]').click();
    
    await expect(window.locator(`[data-testid="profile-item-${testProfile.name}"]`)).toBeVisible();
  });

  test('should edit an existing profile', async () => {
    await window.locator('[data-testid="create-profile-btn"]').click();
    await window.locator('[data-testid="profile-name-input"]').fill('To Edit');
    await window.locator('[data-testid="save-profile-btn"]').click();
    
    await window.locator('[data-testid="profile-item-To Edit"]').click();
    
    await window.locator('[data-testid="profile-name-input"]').fill('Edited Profile');
    await window.locator('[data-testid="save-profile-btn"]').click();
    
    await expect(window.locator('[data-testid="profile-item-Edited Profile"]')).toBeVisible();
    await expect(window.locator('[data-testid="profile-item-To Edit"]')).not.toBeVisible();
  });

  test('should duplicate a profile', async () => {
    await window.locator('[data-testid="create-profile-btn"]').click();
    await window.locator('[data-testid="profile-name-input"]').fill('To Duplicate');
    await window.locator('[data-testid="save-profile-btn"]').click();
    
    await window.locator('[data-testid="profile-item-To Duplicate"]').click();
    await window.locator('[data-testid="profile-item-To Duplicate"] [data-testid="duplicate-profile-btn"]').click();
    
    await expect(window.locator('[data-testid="profile-item-To Duplicate (Copy)"]')).toBeVisible();
  });

  test('should delete a profile', async () => {
    await window.locator('[data-testid="create-profile-btn"]').click();
    await window.locator('[data-testid="profile-name-input"]').fill('To Delete');
    await window.locator('[data-testid="save-profile-btn"]').click();
    
    await window.locator('[data-testid="profile-item-To Delete"]').click();
    await window.locator('[data-testid="profile-item-To Delete"] [data-testid="delete-profile-btn"]').click();
    
    await expect(window.locator('[data-testid="profile-item-To Delete"]')).not.toBeVisible();
  });
});
