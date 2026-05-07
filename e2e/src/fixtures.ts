import { test as baseTest } from '@playwright/test';
import {
  FoundryHomePage, AppManagerPage, AppCatalogPage, WorkflowsPage, config,
} from '@crowdstrike/foundry-playwright';
import { UserPreferencesExtensionPage } from './pages/UserPreferencesExtensionPage';
import { CollectionsCRUDExtensionPage } from './pages/CollectionsCRUDExtensionPage';

type FoundryFixtures = {
  foundryHomePage: FoundryHomePage;
  appManagerPage: AppManagerPage;
  appCatalogPage: AppCatalogPage;
  userPreferencesExtensionPage: UserPreferencesExtensionPage;
  collectionsCRUDExtensionPage: CollectionsCRUDExtensionPage;
  workflowsPage: WorkflowsPage;
  appName: string;
};

export const test = baseTest.extend<FoundryFixtures>({
  foundryHomePage: async ({ page }, use) => { await use(new FoundryHomePage(page)); },
  appManagerPage: async ({ page }, use) => { await use(new AppManagerPage(page)); },
  appCatalogPage: async ({ page }, use) => { await use(new AppCatalogPage(page)); },
  userPreferencesExtensionPage: async ({ page }, use) => { await use(new UserPreferencesExtensionPage(page)); },
  collectionsCRUDExtensionPage: async ({ page }, use) => { await use(new CollectionsCRUDExtensionPage(page)); },
  workflowsPage: async ({ page }, use) => { await use(new WorkflowsPage(page)); },
  appName: async ({}, use) => { await use(config.appName); },
});

export { expect } from '@playwright/test';
