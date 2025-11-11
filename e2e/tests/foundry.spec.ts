import { test, expect } from '../src/fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Collections Toolkit - E2E Tests', () => {
  // Extension Tests - Both extensions are in hosts.host.panel socket
  test('should render User Preferences extension', async ({ userPreferencesExtensionPage }) => {
    await userPreferencesExtensionPage.navigateToExtension();
    await userPreferencesExtensionPage.verifyExtensionRenders();
  });

  test('should render Collections CRUD extension', async ({ collectionsCRUDExtensionPage }) => {
    await collectionsCRUDExtensionPage.navigateToExtension();
    await collectionsCRUDExtensionPage.verifyExtensionRenders();
  });

  // Workflow Tests - All workflows are self-contained (no external API credentials required)
  test('should execute Test log_event_handler function workflow', async ({ workflowsPage }) => {
    await workflowsPage.navigateToWorkflows();
    await workflowsPage.executeAndVerifyWorkflow('Test log_event_handler function');
  });

  test('should execute Test process_events_handler function workflow', async ({ workflowsPage }) => {
    await workflowsPage.navigateToWorkflows();
    await workflowsPage.executeAndVerifyWorkflow('Test process_events_handler function');
  });

  test('should execute Test user_preferences collection workflow', async ({ workflowsPage }) => {
    await workflowsPage.navigateToWorkflows();
    await workflowsPage.executeAndVerifyWorkflow('Test user_preferences collection');
  });

  test('should execute Paginate security_events collection workflow', async ({ workflowsPage }) => {
    await workflowsPage.navigateToWorkflows();
    await workflowsPage.executeAndVerifyWorkflow('Paginate security_events collection');
  });
});
