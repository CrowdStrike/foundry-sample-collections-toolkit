import { test as baseTest } from '@playwright/test';
import { WorkflowsPage } from '@crowdstrike/foundry-playwright';
import { UserPreferencesExtensionPage } from './pages/UserPreferencesExtensionPage';
import { CollectionsCRUDExtensionPage } from './pages/CollectionsCRUDExtensionPage';

type FoundryFixtures = {
  userPreferencesExtensionPage: UserPreferencesExtensionPage;
  collectionsCRUDExtensionPage: CollectionsCRUDExtensionPage;
  workflowsPage: WorkflowsPage;
};

export const test = baseTest.extend<FoundryFixtures>({
  userPreferencesExtensionPage: async ({ page }, use) => {
    await use(new UserPreferencesExtensionPage(page));
  },

  collectionsCRUDExtensionPage: async ({ page }, use) => {
    await use(new CollectionsCRUDExtensionPage(page));
  },

  workflowsPage: async ({ page }, use) => {
    await use(new WorkflowsPage(page));
  },
});

export { expect } from '@playwright/test';
