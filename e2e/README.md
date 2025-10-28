# Collections Toolkit E2E Tests

End-to-end tests for the Collections Toolkit Foundry sample app using Playwright.

## Overview

This test suite verifies the core functionality of the Collections Toolkit app, including:

- **UI Extensions** (both in `hosts.host.panel` socket):
  - User Preferences extension rendering
  - Collections CRUD extension rendering
- **Workflows** (all self-contained, no external credentials required):
  - Test log_event_handler function
  - Test process_events_handler function
  - Test user_preferences collection
  - Paginate security_events collection

## Prerequisites

- Node.js 22+ installed
- Valid Falcon credentials with MFA configured
- App deployed to your Falcon environment

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

Copy `.env.sample` to `.env` and fill in your credentials:

```bash
cp .env.sample .env
```

Edit `.env` with your Falcon credentials:

```
FALCON_USERNAME=your.email@company.com
FALCON_PASSWORD=your-password
FALCON_AUTH_SECRET=your-totp-secret
FALCON_BASE_URL=https://falcon.us-2.crowdstrike.com
APP_NAME=foundry-sample-collections-toolkit
```

**Important:** The `APP_NAME` must exactly match the app name as deployed in Falcon.

3. **Install Playwright browsers:**

```bash
npx playwright install chromium
```

## Running Tests

### Run all tests:

```bash
npm test
```

### Run tests with UI (headed mode):

```bash
npx playwright test --headed
```

### Run specific test file:

```bash
npx playwright test tests/foundry.spec.ts
```

### Debug tests:

```bash
npx playwright test --debug
```

### View test report:

```bash
npx playwright show-report
```

## Test Structure

```
e2e/
├── src/
│   ├── config/
│   │   └── TestConfig.ts          # Environment configuration
│   ├── pages/                      # Page Object Model
│   │   ├── BasePage.ts             # Base page with common utilities
│   │   ├── FoundryHomePage.ts     # Foundry home navigation
│   │   ├── AppCatalogPage.ts      # App catalog operations
│   │   ├── AppManagerPage.ts      # App management
│   │   ├── SocketNavigationPage.ts # Socket navigation utilities
│   │   ├── HostManagementPage.ts  # Host management operations
│   │   ├── UserPreferencesExtensionPage.ts    # User Preferences extension
│   │   ├── CollectionsCRUDExtensionPage.ts    # Collections CRUD extension
│   │   └── WorkflowsPage.ts       # Workflow execution and verification
│   ├── utils/
│   │   ├── Logger.ts               # Structured logging
│   │   └── SmartWaiter.ts          # Smart waiting utilities
│   └── fixtures.ts                 # Playwright fixtures
├── tests/
│   ├── authenticate.setup.ts       # Login setup
│   ├── app-install.setup.ts       # App installation setup
│   ├── app-uninstall.teardown.ts  # App cleanup teardown
│   └── foundry.spec.ts            # Main test suite
├── playwright.config.ts            # Playwright configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

The CI workflow:
1. Deploys the app with a unique name
2. Installs dependencies and Playwright browsers
3. Runs E2E tests
4. Uploads test results and screenshots
5. Cleans up (deletes app)

## Test Patterns

### Extension Testing

Extensions are tested in the `hosts.host.panel` socket:

1. Navigate to Host Management
2. Open first available host
3. Verify extension button appears
4. Click to expand extension
5. Verify iframe loads with expected content

### Workflow Testing

Workflows are executed via Fusion SOAR:

1. Navigate to Fusion SOAR > Workflows
2. Find workflow by name
3. Execute workflow
4. Verify completion status (success/failure)
5. Check for errors in execution logs

## Troubleshooting

### App name mismatch

**Error:** "App not found in catalog"

**Solution:** Ensure `APP_NAME` in `.env` exactly matches the deployed app name. You can verify the app name in Falcon under Foundry > App Catalog.

### Extension not found

**Error:** "Extension button not visible"

**Solution:**
- Verify the app is properly installed in Falcon
- Check that you have hosts available in your CID
- Ensure extensions are properly configured in `manifest.yml`

### Authentication failures

**Error:** "Login failed" or "MFA timeout"

**Solution:**
- Verify `FALCON_AUTH_SECRET` is correct (use `foundry login` to get TOTP secret)
- Check `FALCON_BASE_URL` matches your Falcon region
- Ensure username/password are correct

### Workflow execution failures

**Error:** "Workflow execution failed"

**Solution:**
- Check workflow logs in Fusion SOAR for specific errors
- Verify collections are properly configured
- Ensure function endpoints are accessible

## Contributing

When adding new tests:

1. Create page objects in `src/pages/` if needed
2. Add fixtures in `src/fixtures.ts`
3. Write tests in `tests/` directory
4. Update this README with new test scenarios
5. Ensure tests pass locally before committing

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Foundry Documentation](https://falcon.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry)
- [Collections Toolkit App Documentation](../app_docs/README.md)
