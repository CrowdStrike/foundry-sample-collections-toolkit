import { Page, expect, FrameLocator } from '@playwright/test';
import { HostPanelExtensionPage } from './HostPanelExtensionPage';
import { config } from '../config/TestConfig';

/**
 * Page object for testing the "User Preferences" UI extension
 */
export class UserPreferencesExtensionPage extends HostPanelExtensionPage {
  constructor(page: Page) {
    super(page, 'User Preferences');
  }

  protected async verifyExtensionContent(iframe: FrameLocator): Promise<void> {
    await expect(iframe.locator('text=/User preferences for:/i')).toBeVisible({ timeout: 10000 });
    await expect(iframe.locator(`text=${config.falconUsername}`)).toBeVisible({ timeout: 10000 });
    await expect(iframe.getByRole('button', { name: /Save Preferences/i })).toBeVisible({ timeout: 10000 });
  }

  /**
   * Interact with the extension to save a preference, exercising the collection write path.
   * Assumes the extension is already expanded and iframe is visible (call verifyExtensionRenders first).
   */
  async savePreference(): Promise<void> {
    return this.withTiming(
      async () => {
        const iframe = this.page.frameLocator('iframe');

        // Wait for Save button to confirm form is loaded
        await expect(iframe.getByRole('button', { name: /Save Preferences/i })).toBeVisible({ timeout: 10000 });
        this.logger.info('Extension form loaded');

        // Click Save Preferences to write to the collection
        await iframe.getByRole('button', { name: /Save Preferences/i }).click();
        this.logger.info('Clicked Save Preferences');

        // Verify success alert appears
        await expect(iframe.locator('text=/Preferences saved successfully/i')).toBeVisible({ timeout: 10000 });
        this.logger.success('Preferences saved successfully - collection write verified');
      },
      'Save preference via extension'
    );
  }
}
