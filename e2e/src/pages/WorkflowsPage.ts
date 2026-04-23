import { Page } from '@playwright/test';
import { WorkflowsPage as BaseWorkflowsPage } from '@crowdstrike/foundry-playwright';

export class WorkflowsPage extends BaseWorkflowsPage {
  constructor(page: Page) {
    super(page);
  }

  async verifyWorkflowExecutionCompleted(timeoutMs = 120000): Promise<void> {
    this.logger.info('Checking workflow execution status in detail view');

    const viewLink = this.page.getByRole('link', { name: /^view$/i });
    await viewLink.waitFor({ state: 'visible', timeout: 10000 });

    const [executionPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      viewLink.click(),
    ]);

    await executionPage.waitForLoadState('domcontentloaded');
    this.logger.info('Execution page opened in new tab');

    const statusLabel = executionPage.getByText('Execution status');
    await statusLabel.waitFor({ state: 'visible', timeout: 60000 });
    this.logger.info('Execution details visible');

    this.logger.info(`Waiting up to ${timeoutMs / 1000}s for execution to complete...`);

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const currentStatusLabel = executionPage.getByText('Execution status');
      await currentStatusLabel.waitFor({ state: 'visible', timeout: 15000 });
      const statusContainer = currentStatusLabel.locator('..');
      const statusText = await statusContainer.textContent() || '';
      const currentStatus = statusText.replace('Execution status', '').trim();
      this.logger.info(`Current status: ${currentStatus}`);

      if (currentStatus.toLowerCase().includes('failed')) {
        const pageContent = await executionPage.textContent('body') || '';
        const messageMatch = pageContent.match(/"message":\s*"([^"]+)"/);
        const errorMessage = messageMatch ? messageMatch[1] : 'Workflow action failed';
        await executionPage.close();
        this.logger.error(`Workflow execution failed: ${errorMessage}`);
        throw new Error(`Workflow execution failed: ${errorMessage}`);
      }

      if (!currentStatus.toLowerCase().includes('in progress')) {
        await executionPage.close();
        this.logger.success(`Workflow execution completed with status: ${currentStatus}`);
        return;
      }

      await executionPage.waitForTimeout(5000);
      await executionPage.reload({ waitUntil: 'domcontentloaded' });
    }

    await executionPage.close();
    throw new Error('Workflow execution timed out - still in progress');
  }
}
