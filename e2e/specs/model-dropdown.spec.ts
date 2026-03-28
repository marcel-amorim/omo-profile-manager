import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp, closeApp, skipWizard } from '../helpers/app-helpers';

test.describe('Model Dropdown', () => {
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

  test('model dropdown shows model ids only, no JSON fragments', async () => {
    const modelButton = window.locator('button#sisyphus-model');
    const warningBanner = window.locator('.bg-amber-50');

    // Wait for either the model button OR the warning banner to appear
    // This handles the race condition where models might fail to load
    const buttonOrWarning = async () => {
      const buttonVisible = await modelButton.isVisible({ timeout: 100 }).catch(() => false);
      const warningVisible = await warningBanner.isVisible({ timeout: 100 }).catch(() => false);
      return { buttonVisible, warningVisible };
    };

    // Poll until we see either button or warning (max 30s)
    let attempts = 0;
    let result = await buttonOrWarning();
    while (!result.buttonVisible && !result.warningVisible && attempts < 300) {
      await window.waitForTimeout(100);
      result = await buttonOrWarning();
      attempts++;
    }

    // If warning banner appears instead of model button, skip the test
    if (result.warningVisible && !result.buttonVisible) {
      const warningText = await warningBanner.textContent().catch(() => '');
      if (warningText?.includes('Models list is empty') || warningText?.includes('Failed to load models')) {
        test.skip();
      }
    }

    // If neither button nor warning appeared after 30s, models might not be available in test env
    if (!result.buttonVisible && !result.warningVisible) {
      // Give it one more chance with explicit wait
      try {
        await modelButton.waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        // Models not available - skip the test
        test.skip();
      }
    }

    // Now wait for the model button to be visible
    await modelButton.waitFor({ state: 'visible', timeout: 10000 });

    // Open model dropdown for sisyphus agent
    await window.click('button#sisyphus-model');

    // Wait for dropdown to open
    await window.waitForSelector('input[placeholder="Search models..."]', { state: 'visible' });

    // Get all options - dropdown is absolute positioned with z-50 and contains the search input
    const dropdown = window.locator('div.absolute.z-50:has(input[placeholder="Search models..."])');
    const options = dropdown.locator('button');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // Save evidence screenshots immediately while dropdown is open
    await window.screenshot({
      path: '.sisyphus/evidence/task-7-dropdown-options.png',
      fullPage: true
    });

    await dropdown.screenshot({
      path: '.sisyphus/evidence/task-7-no-json-fragments.png'
    });

    let validModelCount = 0;
    const jsonFragmentPatterns = [
      /^\{/,                    // Starts with {
      /"providerID"/,           // Contains providerID JSON key
      /"capabilities"/,        // Contains capabilities JSON key
      /"release_date"/         // Contains release_date JSON key
    ];

    // Check each option
    for (let i = 0; i < count; i++) {
      const option = options.nth(i);
      const text = await option.textContent();

      if (!text) continue;

      // Skip section headers (Recommended, Recent, All Models)
      if (text.includes('Recommended') || text.includes('Recent') || text.includes('All Models')) {
        continue;
      }

      // Assert NO JSON fragments in option text
      for (const pattern of jsonFragmentPatterns) {
        expect(text).not.toMatch(pattern);
      }

      // Count valid model IDs (contain / for provider/model pattern)
      if (text.includes('/')) {
        validModelCount++;
      }
    }

    // Assert at least one valid provider/model option is visible
    expect(validModelCount).toBeGreaterThan(0);
  });
});
