# Account Billing Dashboard

## Overview
Create comprehensive billing and subscription management interface within the `/account` dashboard to display current subscription status, billing history, and payment management for both Stripe and LemonSqueezy integrations.

Enables users to view subscription details, manage payment methods, update billing information, and handle subscription changes through a unified interface supporting both payment processors.

**Feature type**: User-Facing Feature

## Requirements

### User Stories
- As an authenticated user, I want to view my current subscription tier and billing status so I can understand my account standing
- As a subscriber, I want to see my next billing date and amount so I can plan my expenses
- As a user, I want to access billing history to track my payments and download invoices
- As a subscriber, I want to update my payment method when my card expires or I get a new one
- As a user, I want to cancel my subscription if I no longer need the service
- As a subscriber, I want to upgrade or downgrade my plan based on my changing needs

### UI/UX Requirements
- Clean, card-based layout using DaisyUI components matching existing account dashboard design
- Responsive design: single column on mobile, two-column layout on desktop with sidebar navigation
- Subscription status displayed with color-coded badges (Active: green, Trial: blue, Cancelled: red, Past Due: orange)
- Billing information section showing current plan, next billing date, and payment method summary
- Action buttons for subscription management: Cancel, Change Plan, Update Payment Method, View Portal
- Loading states with skeleton components during data fetching
- Error states with retry options for failed requests
- Success confirmations for completed actions with auto-dismiss

### User Flow
1. Navigate to `/account` → access billing tab/section
2. View current subscription overview with status and next billing date
3. Review billing history with downloadable invoices
4. Access payment method management or subscription changes
5. Complete actions through integrated flows or external portals
6. Return to dashboard with updated information displayed

## Technical Specifications

### Dependencies
- Better Auth client for session management and user authentication
- Stripe SDK for Stripe subscription and billing management
- LemonSqueezy SDK for LemonSqueezy subscription management
- Existing account dashboard layout and routing structure
- DaisyUI components for consistent styling and responsive design

### Database Changes
- Utilizes existing user subscription fields from webhook implementations:
  - `stripe_customer_id`, `lemon_squeezy_customer_id`
  - `subscription_status`, `subscription_tier`, `subscription_end_date`
  - `stripe_subscription_id`, `lemon_squeezy_subscription_id`
- No new tables required - uses existing subscription and user data

### API Changes
- New API endpoints for subscription management:
  - `GET /api/billing/subscription` - fetch current subscription details
  - `POST /api/billing/cancel` - initiate subscription cancellation
  - `POST /api/billing/portal` - generate customer portal access
- Integration with existing Stripe and LemonSqueezy webhook handlers
- Customer portal URL generation for advanced billing management

### Environment Variables
- Uses existing payment processor credentials:
  - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
  - `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`

## Functional Requirements

### Subscription Overview Display
**Requirement**: Display comprehensive subscription information for authenticated users
**Acceptance Criteria**:
- Show current subscription tier (Free, Pro, Enterprise) with visual badge
- Display subscription status with color-coded indicators
- Show next billing date and amount for paid subscriptions
- Display trial period information when applicable
- Handle both Stripe and LemonSqueezy subscriptions uniformly

### Billing History
**Requirement**: Provide access to payment history and invoice downloads
**Acceptance Criteria**:
- Display chronological list of payments with dates, amounts, and status
- Enable invoice download for completed payments
- Show payment method used for each transaction
- Support pagination for users with extensive billing history
- Handle both Stripe and LemonSqueezy payment records

### Payment Method Management
**Requirement**: Allow users to update payment methods
**Acceptance Criteria**:
- Display current payment method summary (last 4 digits, expiry, type)
- Provide secure update flow through payment processor portals
- Show loading states during payment method updates
- Confirm successful payment method changes
- Handle expired or failed payment methods with clear messaging

### Subscription Management Actions
**Requirement**: Enable subscription tier changes and cancellation
**Acceptance Criteria**:
- Cancel subscription with confirmation dialog and effective date display
- Upgrade/downgrade through existing checkout flows
- Access advanced billing management through customer portals
- Handle subscription reactivation for cancelled subscriptions
- Display subscription change confirmations with effective dates

## Data Requirements

### Subscription Data Structure
- Current subscription tier and status from webhook-populated database fields
- Next billing date and amount from payment processor APIs
- Payment method information from customer portal integration
- Billing history from payment processor transaction APIs

### Data Validation
- Validate subscription status against payment processor data
- Ensure billing dates are properly formatted and localized
- Verify payment amounts match subscription tier pricing
- Validate customer portal URLs before redirect

## Security Considerations

### Authentication and Authorization
- Require valid Better Auth session for all billing data access
- Verify user ownership of subscription data before display
- Protect billing API endpoints with authentication middleware
- Validate user permissions for subscription modification actions

### Data Protection
- Never expose full payment method details in UI
- Use secure customer portal redirects for sensitive operations
- Implement CSRF protection for subscription management actions
- Rate limit billing API endpoints to prevent abuse

### Payment Security
- Redirect sensitive operations to official payment processor portals
- Validate webhook signatures for subscription status updates
- Log all billing management actions for audit trail
- Handle payment processor errors gracefully without exposing sensitive data

## Performance Requirements

### Loading Performance
- Dashboard billing section loads within 2 seconds on 3G connection
- Subscription data fetch completes within 1 second
- Billing history pagination responds within 500ms
- Payment method updates reflect within 5 seconds

### Concurrent Usage
- Support 100+ simultaneous billing dashboard access
- Handle 50+ concurrent subscription modifications
- Customer portal URL generation within 3 seconds
- Maintain responsive UI during peak billing cycle periods

## Additional Context for AI Assistant

This feature builds upon several completed implementations:

**Prerequisites**:
- `AU02-BetterAuth-Init.md` - User authentication system
- `D01-Account-Route.md` - Account dashboard structure
- `D02-Account-Overview.md` - Account dashboard layout
- `ST04-Stripe-Webhooks.md` - Stripe subscription data
- `ST05-Stripe-Portal-Integration.md` - Stripe UI integration patterns
- `LS04-LemonSqueezy-Webhooks.md` - LemonSqueezy subscription data

**Integration Points**:
- Extends existing account dashboard with billing-specific components
- Uses subscription data populated by webhook handlers
- Integrates with payment processor customer portals for secure operations
- Maintains consistency with existing account management UI patterns

**Component Architecture**:
- `BillingOverview.svelte` - Main subscription status display
- `BillingHistory.svelte` - Payment history and invoice access
- `PaymentMethod.svelte` - Current payment method display
- `SubscriptionActions.svelte` - Cancel, upgrade, portal access buttons
- `BillingSection.svelte` - Container component for account dashboard

**Future Considerations**:
- Prepare for usage-based billing implementation
- Support for multiple subscription management
- Integration with upcoming invoice generation features
- Extensible design for additional payment processors