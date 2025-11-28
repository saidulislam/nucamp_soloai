# TS04: Playwright E2E Testing Setup

## Overview
Set up Playwright v1.40+ as the end-to-end testing framework for the SvelteKit SaaS application to test complete user workflows including authentication, content management, payment processing, and multilingual functionality. This establishes comprehensive browser automation testing to ensure all integrated systems work together correctly.

**Feature type**: Technical Integration

**Business value**: Ensures production-ready application quality through automated testing of critical user journeys and prevents regressions in complex workflows involving multiple services (Strapi, Mautic, Stripe, LemonSqueezy, Better Auth).

## Requirements

### Functional Requirements
- **Test Environment Setup**: Configure isolated test environment with separate database, API keys, and service instances
- **Browser Coverage**: Support Chromium, Firefox, and WebKit browsers with headless and headed modes
- **Authentication Testing**: Test complete Better Auth flows including signup, login, logout, and session persistence
- **Content Management Testing**: Verify Strapi CMS content rendering, multilingual display, and dynamic updates
- **Payment Flow Testing**: Test Stripe and LemonSqueezy checkout processes with mock payment methods
- **Cross-Browser Compatibility**: Ensure consistent behavior across different browsers and viewport sizes
- **Test Isolation**: Each test runs independently with clean state and no cross-test contamination
- **Visual Testing**: Support screenshot comparison and visual regression detection
- **API Mocking**: Mock external services for reliable test execution without external dependencies

### Performance Requirements
- Test suite execution must complete within 10 minutes for full browser matrix
- Individual test files must complete within 2 minutes
- Browser launch time under 5 seconds per instance
- Page navigation and interaction response within 3 seconds
- Screenshot capture and comparison within 1 second
- Parallel test execution support for up to 4 concurrent browser instances

### Security Considerations
- Use test-specific API keys and credentials separate from development/production
- Mock sensitive operations like actual payment processing
- Sanitize test data to prevent exposure of sensitive information
- Implement secure test user account management with automated cleanup
- Validate that test environment cannot access production services or data
- Protect test credentials using environment variables and secure storage

## Technical Specifications

### Dependencies
- **Core Playwright**: `@playwright/test` v1.40+, `playwright` browser binaries
- **SvelteKit Integration**: `@playwright/experimental-ct-svelte` for component testing
- **Test Utilities**: `@testing-library/playwright`, custom test helpers
- **Environment Management**: `dotenv` for test environment variables
- **Visual Testing**: Playwright's built-in screenshot comparison
- **Existing Integration**: Build upon TS03-Vitest-Setup.md patterns and test database setup

### Environment Variables
- `TEST_BASE_URL`: Base URL for test application instance (default: http://localhost:4173)
- `TEST_DATABASE_URL`: Separate MySQL database for E2E tests
- `TEST_STRAPI_URL`: Test Strapi instance URL
- `TEST_MAUTIC_URL`: Test Mautic instance URL
- `PLAYWRIGHT_HEADLESS`: Boolean for headless browser execution
- `PLAYWRIGHT_BROWSER`: Specific browser for single-browser testing
- `TEST_USER_EMAIL`: Pre-configured test user account
- `TEST_USER_PASSWORD`: Test user account password

### Configuration Structure
- **Playwright Config**: `playwright.config.ts` with project-specific browser configurations
- **Test Setup**: Global setup and teardown scripts for database seeding and cleanup
- **Page Object Models**: Reusable page objects for authentication, account management, pricing
- **Test Data Management**: Factories for test users, content, and subscription data
- **Custom Fixtures**: Extended Playwright fixtures for Better Auth integration

### Database Changes
- **Test Database**: Separate MySQL database instance for E2E testing
- **Data Seeding**: Automated test data creation for Strapi content, user accounts, subscriptions
- **Cleanup Procedures**: Automated database reset between test runs
- **Migration Support**: Test database migrations matching development schema

### API Integration Points
- **Better Auth**: Test authentication endpoints and session management
- **Strapi CMS**: Mock or test instance for content management testing
- **Stripe/LemonSqueezy**: Payment testing with mock checkout sessions and webhooks
- **Mautic**: Marketing automation testing with test campaigns and contact management
- **OpenAI**: Mock AI translation services for predictable test results

## Test Categories and Scope

### Authentication Flows
- User registration with email verification
- Login with email/password and social providers
- Password reset and account recovery
- Session persistence across browser tabs
- Route protection and authentication guards
- Logout and session termination

### Content Management
- Dynamic content rendering from Strapi CMS
- Multilingual content display and language switching
- FAQ search and filtering functionality
- Contact form submission and validation
- Error handling for failed API requests

### Payment Processing
- Stripe and LemonSqueezy checkout flows
- Subscription tier selection and validation
- Payment success and failure scenarios
- Webhook processing simulation
- Billing dashboard functionality

### User Interface Testing
- Responsive design across viewport sizes
- Navigation menu functionality
- Form validation and error states
- Loading states and skeleton components
- Accessibility compliance verification

### Integration Testing
- Strapi to frontend content flow
- Better Auth to Mautic user provisioning
- Payment processor to subscription status updates
- AI translation workflow end-to-end
- Cross-service error handling

## Development and Maintenance

### Test Organization
- **Structure**: Tests organized by feature area matching application routing
- **Naming**: Descriptive test names following `feature.action.expected-result` pattern
- **Documentation**: Each test file includes purpose, prerequisites, and maintenance notes
- **Tagging**: Test categorization for selective execution (smoke, regression, integration)

### Continuous Integration
- **Integration**: Works with existing GitHub Actions workflow from CI01-GitHub-Actions-Init.md
- **Parallel Execution**: Supports parallel test execution for faster CI/CD pipelines
- **Artifact Collection**: Screenshots and videos on test failures for debugging
- **Result Reporting**: JUnit XML and HTML reports for CI/CD integration

### Prerequisites
- **TS02-Data-TestID-Setup.md** (Test IDs added to components - REQUIRED)
- Completed TS03-Vitest-Setup.md for unit testing foundation
- Existing Better Auth setup from AU01-Install-BetterAuth.md through AU06-Session-Persistence.md
- Strapi CMS configuration from SP01-Strapi-Container-Setup.md through SP05-Strapi-Frontend-Connect.md
- Payment integration from ST01-Stripe-Account-Setup.md through ST06-Configure-Stripe-Products.md
- Working application with all core routes and functionality implemented

### Future Integration Points
- **CI01-GitHub-Actions-Init.md**: Integration with automated CI/CD pipeline
- **TS05-Write-Basic-Tests.md**: Specific test implementations for authentication and payment flows
- **LA01-Launch-Checklist.md**: Production readiness validation through comprehensive E2E testing

## Success Criteria
- All critical user journeys covered by automated tests
- Test suite runs reliably in CI/CD environment
- Visual regression detection prevents UI breaking changes
- Payment flows tested without actual financial transactions
- Cross-browser compatibility verified
- Test execution time meets performance requirements
- Test maintenance burden remains manageable with clear documentation