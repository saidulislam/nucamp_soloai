# ST02-Install-Stripe-SDK.md

## Overview
- Install and configure Stripe SDK for server-side operations to create Checkout sessions and handle webhooks for Stripe-hosted payment pages
- Minimal client-side setup required since payments are handled on Stripe's hosted pages
- Feature type: Technical Integration

## Requirements

### Service Details
- Stripe Node.js SDK v14.0+ for server-side API operations (stripe)
- API Version: Uses latest stable version (automatically set by SDK)
- Support for Checkout Sessions API and webhook processing
- No client-side Stripe.js or Elements required for hosted checkout

### Authentication
- Uses API keys from ST01-Stripe-Account-Setup.md environment variables
- Server-side only: STRIPE_SECRET_KEY for creating Checkout sessions and API operations
- Webhook secret: STRIPE_WEBHOOK_SECRET for event verification
- No client-side keys needed for Stripe-hosted checkout

### Integration Points
- Connects to existing Better Auth user system for customer identification
- Integrates with pricing tiers from P02-Pricing-Tiers.md structure
- Prepares for checkout implementation in ST03-Stripe-Checkout-Sessions.md
- Enables webhook handling for ST04-Stripe-Webhooks.md
- Supports billing UI integration in ST05-Stripe-Portal-Integration.md

### Functional Requirements
- **Server-side API Client**: Initialize Stripe API client with secret key for creating Checkout sessions
- **Checkout Session Creation**: Support for creating Stripe-hosted checkout sessions with proper configuration
- **TypeScript Support**: Full type definitions for Checkout sessions and webhook events
- **Environment Validation**: Validate Stripe API keys during application startup using existing EV02-Env-Validation.md patterns
- **Error Handling**: Comprehensive error handling for session creation failures and webhook processing

### Data Requirements
- No new database tables required - uses existing Better Auth user schema
- Stripe customer IDs will be stored in user records for future billing integration
- Webhook events processed in-memory with optional logging for debugging
- Payment and subscription data managed entirely through Stripe's systems

### Security Considerations
- Never expose Stripe secret keys to client-side code or browser
- Implement proper CORS configuration for Stripe API requests
- Use HTTPS-only for all Stripe API communications in production
- Validate webhook signatures using STRIPE_WEBHOOK_SECRET for event authenticity
- Apply rate limiting to prevent API abuse and stay within Stripe limits

### Performance Requirements
- Server-side Stripe client initialization under 100ms during startup
- Checkout session creation must complete within 3 seconds
- Redirect to Stripe-hosted page within 1 second of session creation
- Support up to 100 concurrent checkout sessions without degradation
- Webhook processing must complete within 10 seconds

## Technical Specifications

### Dependencies
- `stripe` v14.0+ Node.js SDK for server-side operations
- TypeScript definitions included with stripe package
- Existing environment validation system from EV02-Env-Validation.md
- SvelteKit for server-side API routes and redirects

### Database Changes
- No database schema changes required
- Future integration will extend existing user table with Stripe customer ID
- Webhook events processed without persistent storage initially

### API Changes
- No new API endpoints created in this phase
- Prepares foundation for `/api/stripe/checkout` endpoint in next feature
- Enables webhook endpoint `/api/stripe/webhooks` for future implementation
- Server-side Stripe client available for all future payment operations

### Environment Variables
- Validates existing STRIPE_SECRET_KEY for server operations
- Validates existing STRIPE_WEBHOOK_SECRET for webhook verification
- Adds STRIPE_SUCCESS_URL and STRIPE_CANCEL_URL for checkout redirects
- Extends EV02-Env-Validation.md with Stripe-specific validation

## Additional Context for AI Assistant

### SaaS Architecture Integration
- **Frontend**: Simple redirect to Stripe-hosted checkout pages
- **Backend**: Initialize Stripe client in server-side routes for session creation
- **TypeScript**: Ensure full type safety for Checkout sessions and webhooks
- **Error Handling**: Use existing error patterns from Better Auth integration
- **Performance**: No client-side libraries needed, reducing bundle size

### File Structure
- Server-side utilities: `src/lib/stripe/server.ts`
- Checkout session creator: `src/lib/stripe/checkout.ts`
- Type definitions: `src/lib/types/stripe.ts`
- Environment validation: Extend existing `src/lib/env.ts`

### Integration Patterns
- Follow existing service integration patterns from OpenAI and Mautic setups
- Use similar error handling and retry logic from MA02-Mautic-API-Auth.md
- Apply same environment variable validation approach from completed features
- Maintain consistency with existing TypeScript patterns throughout codebase

### Future Compatibility
- Design client utilities to support upcoming checkout flows in ST03-Stripe-Checkout-Sessions.md
- Structure server utilities for webhook processing in ST04-Stripe-Webhooks.md
- Prepare type definitions for subscription management in ST05-Stripe-Portal-Integration.md
- Create extension points for LemonSqueezy integration in Week 3 Lesson 2

### Security Best Practices
- Never log or expose Stripe secret keys in error messages or debugging output
- Implement proper key rotation support for production deployments
- Use secure headers and CORS policies for all Stripe API communications
- Apply input validation for all data sent to Stripe APIs

### Testing Preparation
- Structure code to support unit testing with Vitest in TS01-Vitest-Setup.md
- Create mockable interfaces for end-to-end testing with Playwright
- Enable test mode detection for development and staging environments
- Prepare test utilities for payment flow testing in TS03-Write-Basic-Tests.md