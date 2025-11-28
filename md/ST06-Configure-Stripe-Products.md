# ST06-Configure-Stripe-Products.md

## Overview
Configure Stripe products and pricing tiers in the Stripe Dashboard for use with Stripe-hosted checkout pages. Set up subscription products that will be displayed and managed through Stripe's optimized checkout flow and Customer Portal.

**Feature Type**: Technical Integration

## Requirements

### For This Technical Integration:
- **Service Details**: Stripe Dashboard, Products API, Prices API, Checkout Settings
- **Authentication**: Stripe test account credentials from ST01-Stripe-Account-Setup.md
- **Checkout Type**: Stripe-hosted pages configuration
- **Integration Points**: Price IDs for checkout sessions (ST03-Stripe-Checkout-Sessions.md)

### Functional Requirements
- Create subscription products: Pro and Enterprise in Stripe Dashboard
- Configure monthly and annual pricing for each tier
- Set up product metadata for checkout session creation
- Configure Checkout settings for optimal conversion
- Enable Customer Portal for subscription management
- Set up tax collection and invoice settings
- Configure supported payment methods

**Acceptance Criteria:**
- Products configured with correct pricing in Dashboard
- Price IDs ready for checkout session creation
- Checkout page customized with branding
- Customer Portal enabled for self-service
- Test mode fully configured for development

### Data Requirements
- **Product Structure**: Name, description, metadata fields, statement descriptor
- **Pricing Structure**: Amount, currency (USD), billing interval, trial period
- **Metadata Fields**: tier_id, tier_name, features_included, max_users
- **Validation**: Pricing amounts match P02-Pricing-Tiers.md display

### Security Considerations
- Use test mode for development and staging environments
- Validate pricing IDs in application before checkout creation
- Implement proper error handling for invalid price references
- Secure webhook endpoints for subscription status updates

### Performance Requirements
- Product/pricing data accessible within 2 seconds
- Webhook delivery configured for 30-second maximum delay
- Customer portal loads within 3 seconds
- Support concurrent checkout sessions without rate limiting

## Technical Specifications

### Dependencies
- Stripe test account from ST01-Stripe-Account-Setup.md
- Existing pricing tier display from P02-Pricing-Tiers.md
- Stripe SDK installation from ST02-Install-Stripe-SDK.md
- Checkout API implementation from ST03-Stripe-Checkout-Sessions.md

### Database Changes
- No database schema changes required
- Utilizes existing user subscription fields from ST04-Stripe-Webhooks.md
- Webhook events table from ST04-Stripe-Webhooks.md stores subscription updates

### API Changes
- No new API endpoints required
- Existing `/api/stripe/checkout` endpoint references configured price IDs
- Webhook endpoint `/api/stripe/webhook` processes subscription events

### Environment Variables
- Uses existing STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET configured for webhook verification
- No additional environment variables needed

## Product Configuration Details

### Free Tier Configuration
- **Product Name**: "Free Plan"
- **Price**: $0.00 (no Stripe price object needed)
- **Billing**: N/A
- **Metadata**: `{ tier_id: "free", tier_name: "Free", max_users: "1", features: "basic" }`
- **Description**: "Get started with essential features"

### Pro Tier Configuration
- **Product Name**: "Pro Plan"
- **Monthly Price**: $29.00 USD
- **Annual Price**: $290.00 USD (2 months free)
- **Trial Period**: 14 days
- **Metadata**: `{ tier_id: "pro", tier_name: "Pro", max_users: "10", features: "advanced" }`
- **Description**: "Perfect for growing teams"

### Enterprise Tier Configuration
- **Product Name**: "Enterprise Plan"
- **Monthly Price**: $99.00 USD
- **Annual Price**: $990.00 USD (2 months free)
- **Trial Period**: 14 days
- **Metadata**: `{ tier_id: "enterprise", tier_name: "Enterprise", max_users: "unlimited", features: "premium" }`
- **Description**: "Full-featured solution for large organizations"

## Dashboard Configuration Steps

### Checkout Configuration
1. Navigate to Settings → Checkout and Payment Links
2. Configure checkout page appearance:
   - Upload logo and brand colors
   - Set accent color to match application theme
   - Enable address collection if needed
   - Configure phone number collection
3. Set up payment methods:
   - Enable card payments
   - Configure digital wallets (Apple Pay, Google Pay)
   - Set up regional payment methods if needed

### Product Creation Process
1. Navigate to Products section in Dashboard
2. Create "Pro Plan" product:
   - Add monthly price: $29.00
   - Add annual price: $290.00
   - Set 14-day trial period
3. Create "Enterprise Plan" product:
   - Add monthly price: $99.00
   - Add annual price: $990.00
   - Set 14-day trial period
4. Add metadata to each product for identification

### Customer Portal Configuration
1. Navigate to Settings → Customer Portal
2. Enable portal features:
   - Allow customers to update payment methods
   - Enable subscription cancellation
   - Allow plan switching between products
   - Configure invoice history access
3. Customize portal branding to match application
4. Set business information and support contact

### Webhook Setup
1. Navigate to Developers → Webhooks
2. Add endpoint URL: `https://yourdomain.com/api/stripe/webhook`
3. Select events to listen for:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
4. Copy webhook signing secret for application configuration

### Testing Checklist
- Create test checkout session with price IDs
- Complete test payment on hosted checkout page
- Verify webhook events are received
- Test Customer Portal access and functionality
- Validate subscription management flows

## Additional Context for AI Assistant

### Stripe-Hosted Checkout Benefits
- **Conversion Optimized**: Stripe continuously improves checkout conversion rates
- **PCI Compliant**: No card data touches your servers (SAQ-A compliance)
- **Localized**: Automatic language and currency detection
- **Mobile Ready**: Responsive design works on all devices
- **Payment Methods**: Access to 40+ payment methods globally

### Integration Flow
1. User clicks pricing button in application
2. Application creates checkout session via API
3. User redirected to Stripe-hosted checkout page
4. Payment processed entirely on Stripe's infrastructure
5. User redirected back to application success URL
6. Webhook confirms payment and updates subscription

### Customer Portal Features
The Stripe Customer Portal handles:
- Payment method updates
- Subscription cancellations
- Plan upgrades/downgrades
- Invoice history and downloads
- Billing address updates

This eliminates the need to build these features in your application while providing a professional, tested interface for customers.