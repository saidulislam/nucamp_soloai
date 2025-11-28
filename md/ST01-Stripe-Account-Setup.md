# ST01-Stripe-Account-Setup.md

## Overview
Set up Stripe test environment and obtain API credentials to enable payment processing using Stripe Checkout with Stripe-hosted pages for SaaS subscription tiers. This establishes the foundation for secure, PCI-compliant payment collection without handling sensitive card data directly.

**Feature Type**: Technical Integration

**Business Value**: Enables revenue generation through Stripe's secure, hosted payment pages with built-in conversion optimization and subscription management for Free, Pro, and Enterprise tiers.

## Requirements

### Service Details
- **Stripe API Version**: Uses latest stable API version (automatically set by SDK)
- **Checkout Type**: Stripe-hosted payment pages (not embedded)
- **Account Type**: Test mode for development and staging environments
- **Dashboard Access**: Full access to Stripe Dashboard for product and Checkout configuration
- **Webhook Endpoints**: Support for checkout.session and subscription lifecycle events

### Authentication Requirements
- **API Keys**: Publishable key (client-side) and secret key (server-side)
- **Test Mode**: All operations in test environment initially
- **Key Security**: Secret keys never exposed to client-side code
- **Environment Isolation**: Separate test/production key management

### Integration Points
- Connect to existing pricing tiers from `P02-Pricing-Tiers.md`
- Integrate with Better Auth user system from `AU02-BetterAuth-Init.md`
- Support existing environment variable patterns from `EV01-Env-File-Setup.md`

### Functional Requirements
1. **Account Creation**
   - Create Stripe test account with business information
   - Verify email address and complete account setup
   - Enable test mode for all payment operations
   - Access Stripe Dashboard for Checkout configuration

2. **API Key Generation**
   - Generate publishable key for creating Checkout sessions
   - Generate secret key for server-side API operations
   - Ensure keys are properly scoped for test environment
   - Document key rotation procedures for production

3. **Checkout Configuration**
   - Configure Stripe Checkout settings in Dashboard
   - Set up return URLs for successful and cancelled payments
   - Enable customer portal for subscription management
   - Configure tax collection and invoice settings

4. **Dashboard Navigation**
   - Access Products section for subscription tier configuration
   - Navigate to Checkout settings for hosted page customization
   - Configure Webhooks for checkout.session events
   - Review test payment methods and card numbers

### Data Requirements
- **Environment Variables**: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`
- **Test Data**: Sample products and pricing for development
- **Webhook Secrets**: Generated webhook signing secrets for security

### Security Considerations
- Store secret keys in environment variables only
- Never commit API keys to version control
- Use publishable keys only for client-side operations
- Implement proper key rotation procedures
- Monitor API key usage and access patterns

### Performance Requirements
- API key validation within 100ms
- Dashboard access within 2 seconds
- Test payment processing under 5 seconds
- Webhook delivery within 30 seconds

## Technical Specifications

### Dependencies
- Stripe account with verified business information
- Environment variable management from `EV01-Env-File-Setup.md`
- Existing pricing structure from `P02-Pricing-Tiers.md`

### Environment Variables
```
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:5173/account?success=true
STRIPE_CANCEL_URL=http://localhost:5173/pricing?canceled=true
```

### API Integration Requirements
- REST API v1 compatibility
- JSON request/response format
- HTTPS-only communication
- Idempotency key support for critical operations

### Supported Payment Methods
- Credit/debit cards (Visa, Mastercard, American Express)
- Digital wallets (Apple Pay, Google Pay) for future enhancement
- International payment methods for global expansion
- Test card numbers for development workflows

## Additional Context for AI Assistant

### Account Setup Process
1. Navigate to stripe.com and create business account
2. Complete business verification with test information
3. Access Dashboard and enable test mode toggle
4. Generate API keys from Developers > API keys section
5. Configure webhook endpoints for subscription events
6. Test API connectivity with simple balance retrieval

### Test Environment Configuration
- Use test API keys (pk_test_* and sk_test_*)
- Configure test webhook endpoints pointing to localhost
- Use Stripe test card numbers for payment simulation
- Enable all relevant payment methods in test mode

### Integration Preparation
- Review existing pricing tier structure from Strapi CMS
- Plan product/price mapping between Strapi and Stripe
- Prepare for subscription tier synchronization
- Document currency and billing period requirements

### Security Best Practices
- Implement API key validation on application startup
- Store webhook secrets securely for signature verification
- Use HTTPS-only endpoints for all Stripe communication
- Monitor failed payment attempts and suspicious activity

### Prerequisites
- `EV01-Env-File-Setup.md`: Environment variable management system
- `P02-Pricing-Tiers.md`: Existing pricing structure definition
- `AU02-BetterAuth-Init.md`: User authentication system

### Next Steps
This setup enables `ST02-Install-Stripe-SDK.md` for SDK integration and prepares for `ST03-Stripe-Checkout-Sessions.md` checkout implementation.