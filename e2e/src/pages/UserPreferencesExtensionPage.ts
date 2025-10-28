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
}
