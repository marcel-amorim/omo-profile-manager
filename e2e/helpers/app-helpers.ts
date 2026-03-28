import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function launchApp(): Promise<{ app: ElectronApplication; window: Page; tempDir: string }> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omo-profile-manager-test-'));
  fs.mkdirSync(path.join(tempDir, '.config', 'opencode'), { recursive: true });
  
  const app = await electron.launch({
    args: [
      path.join(__dirname, '../../dist-electron/index.js'),
      `--user-data-dir=${tempDir}`
    ],
    env: {
      ...process.env,
      HOME: tempDir,
      NODE_ENV: 'test',
      OMO_TEST_MODE: 'true',
      USERPROFILE: tempDir,
      XDG_CONFIG_HOME: path.join(tempDir, '.config')
    }
  });

  const window = await app.firstWindow();
  
  window.on('console', msg => console.log(`[Electron] ${msg.type()}: ${msg.text()}`));
  window.on('pageerror', error => console.error(`[Electron Error] ${error.message}\n${error.stack}`));
  
  await window.waitForLoadState('domcontentloaded');
  
  return { app, window, tempDir };
}

export async function closeApp(app: ElectronApplication, tempDir: string) {
  await app.close();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {
    console.error(`Failed to clean up temp dir ${tempDir}:`, e);
  }
}

export async function skipWizard(window: Page) {
  try {
    const wizard = window.locator('[data-testid="setup-wizard"]');
    await wizard.waitFor({ state: 'visible', timeout: 2000 });
    await window.locator('[data-testid="skip-wizard-btn"]').click({ force: true });
    await window.waitForTimeout(500);
    await window.locator('[data-testid="wizard-finish-btn"]').click({ force: true });
    await wizard.waitFor({ state: 'hidden', timeout: 2000 });
    
    const applyModal = window.locator('text="Apply Profile"').first();
    if (await applyModal.isVisible({ timeout: 5000 })) {
      await window.locator('button:has-text("Cancel")').click({ force: true });
    }
  } catch (e) {
    // Modal may not be visible - that's fine
  }
}

export async function waitForSuccessToastCycle(window: Page, message: string) {
  const toast = window.getByRole('alert').filter({ hasText: message });
  await toast.waitFor({ state: 'visible', timeout: 6000 });
  await toast.waitFor({ state: 'hidden', timeout: 6000 });
}
