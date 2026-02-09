# Vault E2E Tests

End-to-end tests for the Nimble Vault documentation site using Playwright.

## Test Coverage

### Search Tests (`search.spec.ts`)

Comprehensive test suite for the enhanced Fuse.js search functionality:

#### Basic Functionality
- Search input visibility and text entry
- Results dropdown display on typing
- Search result highlighting with `<mark>` tags
- Clear button (X) functionality
- Empty search state handling

#### Fuzzy Search
- Typo tolerance testing
- Pattern matching across multiple fields
- Weighted result ranking validation

#### User Interactions
- Click outside to close dropdown
- Escape key to dismiss results
- Result navigation on click
- Input focus management

#### Performance & UX
- Debounce behavior (200ms delay)
- Result limit enforcement (12 max)
- Category badge display
- Content snippet extraction
- Mobile viewport compatibility

## Running Tests

### Local Development
```bash
# Run all tests (headless)
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Debug mode (step through)
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

### From Root
```bash
# Run vault E2E tests from monorepo root
npm run test:e2e --workspace=@nimble/vault
```

## Test Configuration

- **Port**: 4321 (vault dev server)
- **Base URL**: `http://localhost:4321`
- **Timeout**: 60 seconds per test
- **Retry**: 2 retries on CI, 1 retry locally
- **Workers**: 1 on CI, 5 locally

## Browser Support

Tests run on:
- Chromium (Desktop Chrome)
- Firefox (Desktop)
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Test Organization

```
e2e/
├── search.spec.ts    # Search functionality tests (15 test cases)
└── README.md         # This file
```

## Writing New Tests

Follow the web app pattern:

```typescript
import { expect, test } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("test description", async ({ page }) => {
    await test.step("Step 1", async () => {
      // Test logic
    });
  });
});
```

## CI Integration

Tests automatically run:
- On pull requests
- Before deployments
- Via git pre-push hook (if configured)

## Debugging Tips

1. **Use UI mode**: `npm run test:e2e:ui` for interactive debugging
2. **Use debug mode**: `npm run test:e2e:debug` to step through tests
3. **Check screenshots**: Failed tests capture screenshots in `test-results/`
4. **View trace**: Use Playwright trace viewer for detailed debugging

## Common Issues

### Port Already in Use
If port 4321 is occupied:
```bash
# Kill process on port 4321
lsof -ti:4321 | xargs kill -9
```

### Dev Server Not Starting
Check Velite content build:
```bash
npm run content:build
```

### Test Timeouts
Increase timeout in playwright.config.ts if needed:
```typescript
timeout: 120000, // 2 minutes
```
