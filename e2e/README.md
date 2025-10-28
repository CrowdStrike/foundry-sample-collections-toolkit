# E2E Tests

End-to-end tests for the Collections Toolkit Foundry app using Playwright.

## Tests Included

- **2 UI Extensions** (hosts.host.panel socket): User Preferences, Collections CRUD
- **4 Workflows**: log_event_handler, process_events_handler, user_preferences collection, security_events pagination

## Setup

```bash
npm ci
npx playwright install chromium
cp .env.sample .env
# Edit .env with your credentials
```

## Run Tests

```bash
npm test              # All tests
npm run test:debug    # Debug mode
npm run test:ui       # Interactive UI
```

## Environment Variables

```env
APP_NAME=foundry-sample-collections-toolkit
FALCON_BASE_URL=https://falcon.us-2.crowdstrike.com
FALCON_USERNAME=your-username
FALCON_PASSWORD=your-password
FALCON_AUTH_SECRET=your-mfa-secret
```

**Important:** The `APP_NAME` must exactly match the app name as deployed in Falcon.

## CI/CD

Tests run automatically in GitHub Actions on push/PR to main. The workflow deploys the app, runs tests, and cleans up.
