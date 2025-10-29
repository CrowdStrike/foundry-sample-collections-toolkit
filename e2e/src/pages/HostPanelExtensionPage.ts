import { Page, expect, FrameLocator } from '@playwright/test';
import { SocketNavigationPage } from './SocketNavigationPage';

/**
 * Base page object for testing UI extensions in hosts.host.panel socket
 */
export abstract class HostPanelExtensionPage extends SocketNavigationPage {
  constructor(page: Page, protected extensionName: string) {
    super(page);
  }

  async navigateToExtension(): Promise<void> {
    return this.withTiming(
      async () => {
        await this.navigateToPath('/host-management/hosts', 'Host Management page');
        await this.page.waitForLoadState('networkidle');

        // Click second column to avoid checkbox in first column
        const firstRowCell = this.page.locator('table tbody tr:first-child td:nth-child(2)');
        await firstRowCell.waitFor({ state: 'visible', timeout: 10000 });
        await firstRowCell.click();

        this.logger.info('Clicked on first row to open Host Information panel');
        await this.page.waitForLoadState('networkidle');

        const sidePanelHeader = this.page.locator('h2:has-text("Host information")').first();
        await sidePanelHeader.waitFor({ state: 'visible', timeout: 10000 });

        this.logger.success(`Navigated to host with ${this.extensionName} extension`);
      },
      `Navigate to ${this.extensionName} Extension`
    );
  }

  async verifyExtensionRenders(): Promise<void> {
    return this.withTiming(
      async () => {
        this.logger.info(`Verifying ${this.extensionName} extension renders`);
        await this.page.waitForLoadState('networkidle');

        const hostInfoPanel = this.page.locator('h2:has-text("Host information")').first();
        await hostInfoPanel.waitFor({ state: 'visible', timeout: 10000 });
        this.logger.info('Host Information panel is visible');

        // Scroll to bottom to reveal extensions
        await this.page.keyboard.press('End');
        await this.page.keyboard.press('End');
        this.logger.info('Scrolled to bottom of page');

        await this.page.waitForTimeout(1000);

        const extensionHeading = this.page.locator(`h1:has-text("${this.extensionName}")`).first();
        await extensionHeading.waitFor({ state: 'visible', timeout: 15000 });
        this.logger.info(`Found ${this.extensionName} heading`);

        await extensionHeading.click();
        this.logger.info(`Clicked to expand ${this.extensionName} extension`);

        await expect(this.page.locator('iframe')).toBeVisible({ timeout: 15000 });
        this.logger.info('Extension iframe loaded');

        const iframe: FrameLocator = this.page.frameLocator('iframe');
        await this.verifyExtensionContent(iframe);

        this.logger.success(`${this.extensionName} extension renders correctly`);
      },
      `Verify ${this.extensionName} extension renders`
    );
  }

  /**
   * Override this method to verify extension-specific content
   */
  protected abstract verifyExtensionContent(iframe: FrameLocator): Promise<void>;
}
