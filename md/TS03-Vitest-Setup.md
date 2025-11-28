# TS03: Vitest Unit Testing Setup

## Overview
- Set up Vitest as the unit testing framework for the SvelteKit SaaS application
- Establish testing foundation for components, utilities, API endpoints, and business logic
- Business value: Ensures code quality, prevents regressions, and enables confident refactoring
- Feature type: Infrastructure Setup

## Requirements

### Functional Requirements
- **Testing Framework**: Install and configure Vitest v1.0+ with SvelteKit integration
- **Test Environment**: Set up JSDOM environment for component testing and Node.js for server-side testing
- **TypeScript Support**: Full TypeScript support with type checking during test execution
- **Coverage Reporting**: Generate code coverage reports with minimum 80% coverage threshold
- **Test Discovery**: Automatically discover and run tests matching `*.test.ts`, `*.test.js`, `*.spec.ts`, `*.spec.js` patterns
- **Mock Support**: Enable mocking capabilities for external dependencies, APIs, and database connections
- **Snapshot Testing**: Support for component snapshot testing to catch UI regressions
- **Watch Mode**: Fast file watching and re-running tests during development

### Testing Categories
- **Component Tests**: Svelte component rendering, props, events, and user interactions
- **Utility Tests**: Pure functions, helpers, validation logic, and business rules
- **API Tests**: Server-side endpoints, authentication, and data processing
- **Integration Tests**: Database operations, external service interactions, and workflow testing

### Performance Requirements
- Test suite execution must complete within 30 seconds for full run
- Individual test files must complete within 5 seconds
- Watch mode must detect changes and re-run affected tests within 2 seconds
- Coverage report generation must complete within 10 seconds

### Security Considerations
- Isolate test environment from production data and services
- Use dedicated test database and mock external APIs during testing
- Prevent test files from exposing sensitive configuration or credentials
- Ensure test data doesn't persist beyond test execution

## Technical Specifications

### Dependencies
- **Core**: `vitest`, `@vitest/ui` for test runner and browser UI
- **SvelteKit Integration**: `@testing-library/svelte`, `@testing-library/jest-dom`
- **Environment**: `jsdom` for DOM simulation in component tests
- **Mocking**: Built-in Vitest mocking capabilities
- **Coverage**: `@vitest/coverage-v8` for Istanbul-based coverage reports

### Configuration Files
- **vite.config.js**: Extend existing Vite configuration with Vitest test configuration
- **vitest.config.ts**: Dedicated Vitest configuration file with environment setup
- **.gitignore**: Add coverage reports and test output directories

### Environment Variables
- `VITEST_ENVIRONMENT`: Set to 'node' for server tests, 'jsdom' for component tests
- `TEST_DATABASE_URL`: Isolated test database connection (if different from main)
- Mock environment variables for external services (OpenAI, Stripe, Mautic)

### File Structure
```
src/
├── lib/
│   ├── components/
│   │   └── __tests__/
│   ├── utils/
│   │   └── __tests__/
│   └── server/
│       └── __tests__/
├── routes/
│   └── __tests__/
└── tests/
    ├── setup.ts
    ├── mocks/
    └── fixtures/
```

## Integration Points

### Existing System Integration
- **Database**: Connect to existing MySQL test database from DB01-DB-Container-Setup.md
- **Authentication**: Mock Better Auth client and server methods from AU02-BetterAuth-Init.md
- **CMS**: Mock Strapi API calls from SP05-Strapi-Frontend-Connect.md
- **Payments**: Mock Stripe and LemonSqueezy SDKs from payment integration guides
- **Translation**: Mock OpenAI API calls from AI01-OpenAI-API-Setup.md
- **Marketing**: Mock Mautic API interactions from MA02-Mautic-API-Auth.md

### Component Testing
- Test Svelte components from layout system (A02-Create-Layout-Component.md)
- Validate authentication forms (L02-Login-Form.md, S02-Signup-Form.md)
- Test account dashboard components (D02-Account-Overview.md)
- Verify pricing tier cards (P02-Pricing-Tiers.md)

### API Testing
- Test authentication endpoints from AU03-Mount-BetterAuth-Handler.md
- Validate Stripe checkout API from ST03-Stripe-Checkout-Sessions.md
- Test webhook handlers (ST04-Stripe-Webhooks.md, LS04-LemonSqueezy-Webhooks.md)
- Verify content fetching from Strapi integration

## Prerequisites
- **TS02-Data-TestID-Setup.md** (Test IDs added to components - REQUIRED)
- DB01-DB-Container-Setup.md (MySQL test database)
- AU02-BetterAuth-Init.md (Authentication system)
- SP05-Strapi-Frontend-Connect.md (CMS integration)
- EV01-Env-File-Setup.md (Environment configuration)
- A03-Configure-Tailwind-DaisyUI.md (Styling system)

## Test Categories to Implement

### Unit Tests
- Pure utility functions and helpers
- Form validation logic
- Data transformation functions
- Business rule implementations

### Component Tests
- Svelte component rendering with various props
- User interaction handling (clicks, form submissions)
- Conditional rendering based on authentication state
- Internationalization display with Paraglide

### Integration Tests
- API endpoint responses and error handling
- Database operations with test fixtures
- Authentication flow end-to-end
- Content management workflows

### Mock Requirements
- External API services (OpenAI, Stripe, LemonSqueezy, Mautic)
- Database operations for isolated testing
- File system operations and uploads
- Network requests and HTTP clients
- Authentication session management

## Known Issues & Solutions

### Version Compatibility
**Issue**: `@vitest/coverage-v8` version mismatch
- Installing latest `@vitest/coverage-v8@4.x` causes peer dependency conflicts with `vitest@3.2.4`
- Error: `peer vitest@"4.0.6" from @vitest/coverage-v8@4.0.6`

**Solution**: Install version-specific packages matching your Vitest version:
```bash
npm install --save-dev @vitest/coverage-v8@3.2.4 @vitest/ui@3.2.4
```

### Null/Undefined Handling in Utility Functions
**Issue**: Test failures when passing `null` or `undefined` to utility functions
- Functions like `extractStripeSubscriptionId()` fail with "Cannot read properties of null"

**Solution**: Add null checks at the beginning of utility functions:
```typescript
export function extractStripeSubscriptionId(event: any): string | null {
	if (!event) return null;  // Add this guard
	// ... rest of function
}
```

### Browser Test SSR Cleanup Errors
**Issue**: Browser component tests cause SSR module errors during cleanup
- Error: `transport was disconnected, cannot call "fetchModule"`
- Process hangs for 10 seconds before force-closing

**Solution**: Update `vite.config.ts` browser test configuration:
```typescript
{
	test: {
		name: 'client',
		environment: 'browser',
		browser: {
			enabled: true,
			provider: 'playwright',
			instances: [{ browser: 'chromium' }],
			headless: true  // Add this
		},
		exclude: ['src/lib/server/**', 'src/routes/api/**'],  // Exclude server-only code
		poolOptions: {  // Add this
			threads: {
				singleThread: true
			}
		},
		testTimeout: 10000  // Add this
	}
}
```

### Playwright E2E Test Issues
**Note**: For Playwright E2E test-specific issues (localStorage SecurityError, selector best practices, etc.), see **TS05-Write-Basic-Tests.md** under "Playwright E2E Testing Best Practices".

Common E2E issues documented in TS03:
- localStorage SecurityError in `beforeEach` hooks
- Selector best practices for dynamic content
- Navigation in page objects
- Error message testing with ARIA attributes
- CMS/External data dependencies

## Success Criteria
- All existing functionality covered by appropriate test types
- Test suite runs successfully in CI/CD pipeline
- Coverage reports show minimum 80% code coverage
- Tests provide meaningful error messages and debugging information
- Test execution time remains under performance thresholds
- Mock implementations accurately simulate real service behavior