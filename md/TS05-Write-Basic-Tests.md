# TS05: Write Basic Tests (Auth, UI, Payments)

## Overview
Create comprehensive test coverage for core application flows including authentication, user interface components, and payment processing to ensure system reliability and prevent regressions during development and deployment.

## Requirements

### User Stories
- As a developer, I want automated tests to verify authentication flows work correctly so that users can reliably sign up, log in, and access protected routes
- As a developer, I want UI component tests to catch visual regressions so that the user experience remains consistent across updates
- As a developer, I want payment flow tests to ensure checkout processes work so that revenue operations are not disrupted
- As a QA engineer, I want end-to-end tests to verify complete user journeys so that critical workflows are validated before release

### Functional Requirements

#### Authentication Flow Tests
- **Unit Tests**: Test Better Auth client methods, session validation, and route protection logic
- **Integration Tests**: Verify signup/login forms submit correctly and handle validation errors
- **E2E Tests**: Complete user registration → email verification → login → access protected routes → logout workflow
- **Session Tests**: Verify session persistence across browser tabs and page reloads

#### UI Component Tests
- **Component Tests**: Render all major components (navigation, forms, cards) without errors
- **Responsive Tests**: Verify mobile, tablet, and desktop layouts render correctly
- **Accessibility Tests**: Validate WCAG 2.1 AA compliance with proper ARIA labels and keyboard navigation
- **Internationalization Tests**: Confirm content displays correctly in English, Spanish, and French locales

#### Payment Flow Tests
- **Stripe Tests**: Mock checkout session creation, webhook processing, and subscription status updates
- **LemonSqueezy Tests**: Mock checkout flows, payment confirmations, and billing management
- **Subscription Tests**: Verify tier changes, cancellations, and reactivations update database correctly
- **Error Handling**: Test payment failures, network issues, and invalid payment methods

### Data Requirements
- **Test Database**: Isolated MySQL database for testing with clean state between test runs
- **Mock Data**: User fixtures, product/pricing fixtures, and payment method test data
- **Test API Keys**: Separate Stripe/LemonSqueezy test credentials isolated from development
- **Mock Services**: Stubbed external API responses for Strapi, Mautic, and OpenAI integrations

### Security Considerations
- **Test Isolation**: No test data contamination between test runs or environments
- **Credential Security**: Test API keys separate from production with limited permissions
- **Input Validation**: Test form inputs handle malicious data and prevent injection attacks
- **Session Security**: Verify authentication bypasses are impossible and sessions expire correctly

### Performance Requirements
- **Unit Test Speed**: Individual test files complete within 5 seconds
- **E2E Test Speed**: Complete user workflows finish within 2 minutes per test
- **Test Suite Speed**: Full test suite (unit + E2E) completes within 10 minutes
- **Parallel Execution**: Support running up to 4 concurrent browser instances for E2E tests

## Prerequisites
- **TS02-Data-TestID-Setup.md** (Test IDs added to components - REQUIRED)
- **TS03-Vitest-Setup.md** (Vitest configured)
- **TS04-Playwright-Setup.md** (Playwright configured)

## Technical Specifications

### Dependencies
- **Testing Frameworks**: Vitest (unit), Playwright (E2E) from TS03-Vitest-Setup.md and TS04-Playwright-Setup.md
- **Testing Libraries**: @testing-library/svelte, @testing-library/jest-dom, @playwright/test
- **Mock Libraries**: MSW (Mock Service Worker) for API mocking, vi.mock for module mocking
- **Database**: Dedicated test MySQL database separate from development and production

### Test Structure
```
src/
  lib/
    components/
      __tests__/
        Navigation.test.ts
        LoginForm.test.ts
        PricingCard.test.ts
        AccountDashboard.test.ts
    auth/
      __tests__/
        auth-client.test.ts
        route-guards.test.ts
    utils/
      __tests__/
        validation.test.ts
        api-helpers.test.ts
tests/
  e2e/
    auth-flow.spec.ts
    payment-flow.spec.ts
    content-management.spec.ts
    multilingual.spec.ts
  fixtures/
    users.json
    products.json
    payment-methods.json
```

### Environment Variables
- `TEST_DATABASE_URL`: Isolated test database connection string
- `TEST_STRIPE_PUBLISHABLE_KEY`: Stripe test environment publishable key
- `TEST_STRIPE_SECRET_KEY`: Stripe test environment secret key
- `TEST_LEMONSQUEEZY_API_KEY`: LemonSqueezy test environment API key
- `TEST_BETTER_AUTH_SECRET`: Dedicated JWT secret for test environment
- `PLAYWRIGHT_HEADLESS`: Boolean to control browser visibility during E2E tests

### API Changes
- **Test Endpoints**: Create `/api/test/reset-db` endpoint for cleaning test database
- **Mock Handlers**: MSW handlers for external API responses (Strapi, Mautic, OpenAI)
- **Test Middleware**: Database transaction rollback for isolated test runs

## Additional Context for AI Assistant

### Authentication Test Priority
Focus on testing the complete Better Auth integration including:
- User registration with email/password and social OAuth providers
- Session persistence and cross-tab synchronization from AU06-Session-Persistence.md
- Route protection middleware from AU05-Protect-Routes.md
- Password reset workflow from FP01-ForgotPass-Route.md through FP03-ForgotPass-Success.md

### Payment Integration Testing
Mock both Stripe and LemonSqueezy payment processors:
- Use test payment methods and webhook signatures
- Verify subscription status updates from ST04-Stripe-Webhooks.md and LS04-LemonSqueezy-Webhooks.md
- Test subscription management from D04-Account-Billing.md
- Validate pricing tier display from ST05-Stripe-Portal-Integration.md

### Content Management Testing
Test dynamic content delivery:
- Strapi CMS integration from SP05-Strapi-Frontend-Connect.md
- Multilingual content from PG03-Paraglide-Translate-Content.md
- AI translation workflow from AI01-OpenAI-API-Setup.md and AI02-Content-Localization-Workflow.md

### Component Test Coverage
Prioritize testing these completed components:
- Main layout from A02-Create-Layout-Component.md
- Navigation menu from A06-Nav-Menu.md
- Homepage sections from H01-Home-Route.md through H05-Homepage-Footer.md
- Account dashboard from D01-Account-Route.md through D05-Account-Logout.md
- All form components from login, signup, contact, and profile update flows

### Test Data Management
Create comprehensive test fixtures covering:
- User accounts with different subscription tiers
- Strapi content entries in multiple languages
- Payment methods and subscription states
- Mautic contact and campaign data

### Performance and Reliability
Ensure tests are:
- **Deterministic**: Same inputs always produce same outputs
- **Independent**: Tests don't depend on execution order
- **Fast**: Quick feedback for development workflow
- **Comprehensive**: Cover happy paths, edge cases, and error conditions

## Browser Component Testing Best Practices

### Vitest Browser Mode API Usage
When writing component tests with `@vitest/browser`, the `page` object has a different API than Playwright:

**❌ Don't use Playwright APIs:**
```typescript
// This will fail - page.locator() is not available in Vitest browser mode
await page.locator('.dropdown').count()
await page.waitForTimeout(100)
```

**✅ Use standard DOM APIs via container:**
```typescript
import { render } from 'vitest-browser-svelte';

const { container } = render(MyComponent);
const dropdown = container.querySelector('.dropdown');
expect(dropdown).toBeTruthy();
```

**✅ Use Vitest browser context for interactions:**
```typescript
import { page } from '@vitest/browser/context';

// Use page.getByRole for accessibility queries
const heading = page.getByRole('heading', { level: 1 });
await expect.element(heading).toBeInTheDocument();
```

### Component Test Data Requirements
Components often require props/data from SvelteKit loaders. Always provide mock data:

**❌ Don't render without required props:**
```typescript
// This will fail if component expects data from +page.server.ts
render(Page);
```

**✅ Provide mock data matching expected shape:**
```typescript
const mockData = {
	landingPage: {
		metaTitle: 'Test Page',
		hero_title: 'Welcome',
		content: '## Test Content'
	},
	features: [],
	faqs: []
};

render(Page, { props: { data: mockData } });
```

### Common Patterns

#### Testing Component Rendering
```typescript
it('should render dropdown', () => {
	const { container } = render(LanguageSwitcher);
	const dropdown = container.querySelector('.dropdown');
	expect(dropdown).toBeTruthy();
});
```

#### Testing with Props
```typescript
it('should accept custom props', () => {
	const { container } = render(Component, {
		props: {
			size: '6',
			variant: 'primary'
		}
	});
	expect(container).toBeTruthy();
});
```

#### Testing Accessibility
```typescript
it('should have accessible heading', async () => {
	render(Page, { props: { data: mockData } });
	const heading = page.getByRole('heading', { level: 1 });
	await expect.element(heading).toBeInTheDocument();
});
```

## Playwright E2E Testing Best Practices

### localStorage SecurityError in beforeEach Hooks
When clearing authentication state in `beforeEach` hooks, you may encounter a SecurityError:

**❌ Common Issue:**
```typescript
// e2e/helpers/auth.ts
export async function clearAuthState(page: Page): Promise<void> {
	await page.context().clearCookies();
	await page.evaluate(() => {
		localStorage.clear();      // ❌ Fails on about:blank
		sessionStorage.clear();
	});
}

// e2e/auth.spec.ts
test.beforeEach(async ({ page }) => {
	await clearAuthState(page);  // ❌ Called before page.goto()
});
```

**Error Message:**
```
SecurityError: Failed to read the 'localStorage' property from 'Window':
Access is denied for this document.
```

**Root Cause:**
- `beforeEach` runs before any navigation
- Page starts on `about:blank`
- `about:blank` doesn't allow localStorage access for security reasons
- `page.evaluate()` throws SecurityError when trying to access localStorage

**✅ Solution - Wrap in try-catch:**
```typescript
export async function clearAuthState(page: Page): Promise<void> {
	await page.context().clearCookies();

	// Try to clear storage, but ignore errors if page doesn't support it
	try {
		await page.evaluate(() => {
			localStorage.clear();
			sessionStorage.clear();
		});
	} catch (error) {
		// Ignore SecurityError on about:blank or other restricted pages
		// Storage will be cleared once we navigate to the actual site
	}
}
```

**Why this works:**
- If page is `about:blank`, error is caught and ignored
- Cookies are still cleared successfully
- Once test navigates to actual site, storage will be accessible
- Fresh state is guaranteed for each test

### Selector Best Practices for Dynamic Content

**Issue:** Tests fail when content is dynamic (CMS-driven text, i18n messages, etc.)

**❌ Don't rely on dynamic text:**
```typescript
// Bad - button text comes from CMS or i18n
await page.click('button:has-text("Sign Up")');
await page.click('button:has-text("Get Started")');
```

**✅ Use data-testid attributes (from TS02-Data-TestID-Setup.md):**
```typescript
// Best practice - stable test identifiers
await page.click('[data-testid="hero-signup-button"]');
await page.click('[data-testid="nav-signup-button"]');

// Fallback - href is stable (if data-testid not available)
await page.click('a[href*="signup"]');
```

**Why data-testid is better:**
- Survives refactoring and CSS changes
- Works across all languages (i18n)
- Works regardless of CMS content
- Explicit test intent
- See **TS02-Data-TestID-Setup.md** for complete implementation guide

### Navigation in Page Objects

**Issue:** Tests try to click links that don't exist in the navigation.

**❌ Don't assume navigation structure:**
```typescript
// Bad - assumes login link exists in nav
async goToLogin() {
	await this.click('a[href*="login"]');  // May not exist!
}
```

**✅ Use direct navigation when link doesn't exist:**
```typescript
// Good - navigate directly
async goToLogin() {
	await this.goto('/login');
	await this.waitForLoad();
}
```

### Error Message Testing

**Issue:** Tests can't find error messages due to missing accessibility attributes.

**❌ Application without proper ARIA:**
```html
<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
	<p class="text-sm text-red-800">{error}</p>
</div>
```

**✅ Add role="alert" for accessibility and testability:**
```html
<div role="alert" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
	<p class="text-sm text-red-800">{error}</p>
</div>
```

**Test selector:**
```typescript
// Can now find errors reliably
const errorMessage = page.locator('[role="alert"]');
await expect(errorMessage).toBeVisible();
```

### CMS/External Data Dependencies

**Issue:** Tests fail when external services (Strapi, Mautic, etc.) are unavailable or have no data.

**Solutions:**

1. **Ensure services are running with seed data:**
```bash
# Before running E2E tests
docker-compose up -d strapi mysql
npm run seed:strapi
```

2. **Add fallback checks in tests:**
```typescript
test('homepage displays hero', async ({ page }) => {
	await page.goto('/');

	// Check for either CMS content or fallback
	const hero = page.locator('h1');
	await expect(hero).toBeVisible();

	const heroText = await hero.textContent();
	expect(heroText?.length).toBeGreaterThan(0);
});
```

3. **Mock API responses (advanced):**
```typescript
test.beforeEach(async ({ page }) => {
	// Mock Strapi API
	await page.route('**/api/landing-pages**', async route => {
		await route.fulfill({
			status: 200,
			body: JSON.stringify({
				data: [{
					attributes: {
						heroTitle: 'Test Hero',
						heroSubtitle: 'Test Subtitle'
					}
				}]
			})
		});
	});
});
```