import { Page, expect, FrameLocator } from '@playwright/test';
import { HostPanelExtensionPage } from './HostPanelExtensionPage';

/**
 * Page object for testing the "Collections CRUD" UI extension
 */
export class CollectionsCRUDExtensionPage extends HostPanelExtensionPage {
  constructor(page: Page) {
    super(page, 'Collections CRUD');
  }

  protected async verifyExtensionContent(iframe: FrameLocator): Promise<void> {
    await expect(iframe.locator('text=/Please check your browser console/i')).toBeVisible({ timeout: 10000 });
    await expect(iframe.getByRole('button', { name: /Reload/i })).toBeVisible({ timeout: 10000 });
  }
}
