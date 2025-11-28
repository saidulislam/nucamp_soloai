# LS01-LemonSqueezy-Account.md

## Overview
Set up LemonSqueezy test environment and obtain API credentials for payment processing using LemonSqueezy's hosted checkout pages. LemonSqueezy provides a merchant of record service with automatic tax handling, making it ideal for SaaS businesses selling globally without managing tax compliance.

**Feature Type**: Technical Integration

**Business Value**: Enables global SaaS sales with LemonSqueezy acting as merchant of record, handling all tax compliance, VAT, and payment processing through their optimized hosted checkout experience.

**Integration Context**: This feature implements LemonSqueezy as the payment provider for non-US users, complementing the existing Stripe integration (ST01-ST06) which serves US users. The payment provider is automatically selected based on the user's active Paraglide locale - users with locale `en` use Stripe, while all other locales use LemonSqueezy.

## Requirements

### Service Details
- **LemonSqueezy API Version**: v1 (latest stable)
- **Checkout Type**: LemonSqueezy-hosted checkout pages (not embedded)
- **Environment**: Test mode for development and staging
- **API Endpoints**: Checkouts API, Webhooks API, Subscriptions API
- **Merchant of Record**: LemonSqueezy handles all tax compliance

### Authentication
- **API Key Management**: Test API key for development, production key for live environment
- **Store ID**: Required for all API operations and product configuration
- **Webhook Secret**: For webhook signature verification and security
- **Credential Storage**: Environment variables following existing patterns from EV01-Env-File-Setup.md

### Integration Points
- Connect to existing pricing tiers from P02-Pricing-Tiers.md for subscription products
- Integrate with Better Auth user system from AU02-BetterAuth-Init.md for customer identification
- Link to pricing page checkout buttons from P03-Pricing-Checkout-Link.md
- Prepare for webhook integration similar to ST04-Stripe-Webhooks.md patterns

## Functional Requirements

### Account Setup Requirements
**Acceptance Criteria:**
- LemonSqueezy account created with business information
- Test mode activated for development
- API credentials generated through dashboard
- Store configured with checkout customization
- Customer portal enabled for subscription management

### API Key Generation
**Acceptance Criteria:**
- Test API key generated with appropriate permissions for subscriptions and webhooks
- Store ID obtained for product and subscription management
- Webhook signing secret configured for secure event processing
- API access validated through test endpoint calls

### Environment Configuration
**Acceptance Criteria:**
- Environment variables added following EV01-Env-File-Setup.md patterns
- API keys stored securely and never exposed in client-side code
- Configuration supports both test and production environments
- Validation rules added for LemonSqueezy credentials in EV02-Env-Validation.md patterns

### Payment Method Support
**Acceptance Criteria:**
- Credit/debit cards enabled (Visa, Mastercard, American Express)
- Digital wallets configured (Apple Pay, Google Pay, PayPal)
- International payment methods available (SEPA, iDEAL, Bancontact)
- Cryptocurrency payments optionally enabled for modern markets

## Technical Specifications

### Dependencies
- LemonSqueezy merchant account (external service)
- Existing environment variable system from EV01-Env-File-Setup.md
- Better Auth user system from AU02-BetterAuth-Init.md
- Pricing tier configuration from P02-Pricing-Tiers.md

### Environment Variables
```
LEMON_SQUEEZY_API_KEY=test_api_key_here
LEMON_SQUEEZY_STORE_ID=store_id_here
LEMON_SQUEEZY_WEBHOOK_SECRET=webhook_secret_here
LEMON_SQUEEZY_ENVIRONMENT=sandbox
```

### API Configuration
- **Base URL**: https://api.lemonsqueezy.com/v1/
- **Authentication**: Bearer token using API key
- **Rate Limits**: 100 requests per minute (test), 1000 requests per minute (production)
- **Timeout**: 30 seconds for API requests with retry logic

### Database Changes
No new database tables required for initial setup. Future webhook integration will extend user subscription tables from ST04-Stripe-Webhooks.md patterns.

### Security Considerations
- API keys must never be exposed in client-side JavaScript code
- Webhook signatures must be verified using signing secret
- All API communications over HTTPS/TLS 1.3
- Rate limiting implemented to prevent API abuse
- Environment-specific credentials with no cross-environment access

### Performance Requirements
- Account verification must complete within 2 minutes
- API key generation accessible immediately after account approval  
- Test API calls must respond within 3 seconds
- Support for 50+ concurrent API operations without performance degradation

## Additional Context for AI Assistant

### LemonSqueezy vs Stripe Differences
- **Merchant of Record**: LemonSqueezy acts as seller, handling all tax compliance
- **Tax Handling**: Automatic VAT/sales tax calculation and remittance
- **Hosted Checkout**: Optimized checkout pages with built-in tax display
- **Customer Portal**: Built-in portal for subscription management
- **Global Selling**: Simplified international sales without tax registration

### Integration Strategy
This implementation establishes LemonSqueezy as the payment provider for non-US users alongside Stripe from ST01-Stripe-Account-Setup.md which serves US users. The application automatically selects the appropriate payment processor based on the user's active Paraglide locale:
- **US Users (locale: `en`)**: Stripe checkout and subscription management
- **Non-US Users (all other locales)**: LemonSqueezy checkout and subscription management

This locale-based provider selection ensures optimal payment experience and tax handling for users globally while maintaining consistent subscription management across both providers.

### Account Types
- **Test Account**: For development and staging environments
- **Live Account**: For production deployment (requires business verification)
- **Store Configuration**: Product catalog and subscription tiers
- **Tax Settings**: Automatic VAT handling and international compliance

### Prerequisites
- **Required**: Completed ST01-ST06 Stripe integration series (serves as primary provider for US users)
- **Required**: Completed PG02-Paraglide-Configure-Langs.md (for locale-based provider detection)
- Completed P02-Pricing-Tiers.md (for subscription tier mapping)
- Completed EV01-Env-File-Setup.md (for credential management patterns)
- Completed AU02-BetterAuth-Init.md (for user system integration)

### Next Steps
After completing this setup, the next features will be:
- LS02-Install-LemonSqueezy-SDK.md for SDK installation
- LS03-LemonSqueezy-Checkout-URLs.md for checkout flow implementation
- LS04-LemonSqueezy-Webhooks.md for webhook event handling