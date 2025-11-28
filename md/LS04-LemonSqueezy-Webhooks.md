# LS04-LemonSqueezy-Webhooks.md

## Overview
Handle LemonSqueezy webhook events from hosted checkout completions and subscription lifecycle to maintain user billing status synchronization. Process events from LemonSqueezy's merchant of record service to update subscription status in real-time.

**Business Value**: Ensures subscription data remains synchronized between LemonSqueezy's hosted checkout system and the application, automating billing operations and access control.

**Feature Type**: Technical Integration

**Integration Context**: This webhook handler processes subscription events for non-US users who use LemonSqueezy for payments. The Stripe webhook handler (ST04-Stripe-Webhooks.md) is already implemented and processes events for US users. Both webhook systems operate independently in parallel, updating the same user subscription fields based on the payment provider used.

## Requirements

### Functional Requirements
- **Checkout Events**: Process order_created when users complete hosted checkout
- **Subscription Events**: Handle subscription_created, subscription_updated, subscription_cancelled
- **Payment Events**: Process subscription_payment_success for renewals
- **Customer Portal Events**: Handle changes made through LemonSqueezy's customer portal
- **Signature Verification**: Validate all webhooks using LEMONSQUEEZY_WEBHOOK_SECRET
- **Idempotency**: Prevent duplicate processing using event IDs
- **Real-time Updates**: Update subscription status immediately after checkout completion
- **Audit Logging**: Track all webhook events and processing results

### Data Requirements
- **Database Schema Extensions**: Add subscription-related fields to user table: lemon_squeezy_customer_id, subscription_status, subscription_tier, subscription_end_date, lemon_squeezy_subscription_id
- **Webhook Events Table**: Create table to track processed events with fields: id, event_id, event_type, processed_at, status, user_id, error_message
- **Subscription History**: Create table for audit trail with fields: id, user_id, previous_status, new_status, previous_tier, new_tier, changed_at, event_type
- **Data Validation**: Ensure subscription status values match expected enum: active, past_due, cancelled, trialing, expired, on_hold

### Security Considerations
- **Signature Verification**: Validate all webhook requests using HMAC-SHA256 signature verification with webhook secret
- **Rate Limiting**: Implement webhook endpoint rate limiting to prevent abuse (500 requests per minute)
- **Input Sanitization**: Sanitize all webhook payload data before database operations
- **Error Logging**: Log security events including invalid signatures and suspicious webhook activity
- **IP Validation**: Optional whitelist LemonSqueezy webhook IP addresses for additional security

### Performance Requirements
- **Processing Speed**: Process webhook events within 10 seconds under normal conditions
- **Concurrent Handling**: Support up to 100 simultaneous webhook events without performance degradation
- **Database Updates**: Complete subscription status updates within 5 seconds
- **Error Recovery**: Implement exponential backoff retry mechanism for failed database operations
- **Memory Usage**: Webhook processing should not exceed 100MB memory per request

## Technical Specifications

### Dependencies
- **Existing Services**: LemonSqueezy SDK from LS02-Install-LemonSqueezy-SDK.md, Better Auth user system from AU02-BetterAuth-Init.md
- **Database**: MySQL with Prisma ORM for subscription data storage and event tracking
- **Environment Variables**: LEMON_SQUEEZY_WEBHOOK_SECRET, LEMON_SQUEEZY_API_KEY from LS01-LemonSqueezy-Account.md
- **Validation**: Environment validation system from EV02-Env-Validation.md for webhook configuration

### Database Changes
- **User Table Extensions**: Add lemon_squeezy_customer_id (string), lemon_squeezy_subscription_id (string) fields to the existing user table
  - Note: subscription_status, subscription_tier, and subscription_end_date are already added by ST04-Stripe-Webhooks.md
  - Both Stripe and LemonSqueezy webhooks update the same subscription status fields
  - Provider-specific IDs (stripeCustomerId vs lemon_squeezy_customer_id) allow tracking which provider the user is using
- **Webhook Events Table**: Extend the existing webhook_events table from ST04 to support both Stripe and LemonSqueezy events
  - Add provider field to distinguish between 'stripe' and 'lemonsqueezy' events
- **Indexes**: Add indexes on user.lemon_squeezy_customer_id for query performance
- **Migrations**: Create Prisma migration files to add LemonSqueezy-specific fields to existing schema

### API Changes
- **New Endpoint**: POST /api/lemonsqueezy/webhook for receiving and processing webhook events
- **Webhook Payload**: Accept LemonSqueezy webhook format with meta, data, and relationships structure
- **Response Format**: Return 200 OK for successful processing, 400 for invalid payloads, 401 for invalid signatures
- **Error Handling**: Return appropriate HTTP status codes and error messages for different failure scenarios

### Environment Variables
- **LEMON_SQUEEZY_WEBHOOK_SECRET**: Secret key for webhook signature verification (required)
- **LEMON_SQUEEZY_WEBHOOK_ENDPOINT**: Custom webhook endpoint path (optional, defaults to /api/lemonsqueezy/webhook)
- **WEBHOOK_RETRY_ATTEMPTS**: Number of retry attempts for failed processing (optional, defaults to 3)
- **WEBHOOK_RATE_LIMIT**: Maximum webhooks per minute (optional, defaults to 500)

## Integration Points

### Prerequisites
- **Required**: ST04-Stripe-Webhooks.md - Stripe webhook handler and database schema already implemented
- **Required**: PG02-Paraglide-Configure-Langs.md - Locale system that determines which provider users are assigned to
- **LS01-LemonSqueezy-Account.md**: LemonSqueezy account setup with webhook secret configuration
- **LS02-Install-LemonSqueezy-SDK.md**: LemonSqueezy SDK installation and initialization
- **LS03-LemonSqueezy-Checkout-URLs.md**: Checkout flow creating customer and subscription records
- **AU02-BetterAuth-Init.md**: Better Auth user system for linking subscriptions to user accounts
- **DB01-DB-Container-Setup.md**: MySQL database container for subscription data storage

### Future Integration
- **D04-Account-Billing.md**: Account dashboard will display subscription status from webhook-updated data
- **ST05-Stripe-Portal-Integration.md**: Similar UI patterns for subscription status display across payment providers
- **TS03-Write-Basic-Tests.md**: Webhook processing will require comprehensive testing coverage

### Data Flow
1. LemonSqueezy sends webhook event to /api/lemonsqueezy/webhook endpoint
2. Verify webhook signature using LEMON_SQUEEZY_WEBHOOK_SECRET
3. Parse event payload and extract subscription/order data
4. Check webhook_events table for duplicate processing prevention
5. Update user subscription fields in database based on event type
6. Record event processing in webhook_events table
7. Create subscription_history record for audit trail
8. Return success response to LemonSqueezy

### Error Handling Strategy
- **Invalid Signature**: Return 401 Unauthorized and log security event
- **Duplicate Event**: Return 200 OK but skip processing, log duplicate attempt
- **Database Error**: Return 500 Internal Server Error, implement retry logic
- **Unknown Event Type**: Return 200 OK but log unhandled event for future implementation
- **User Not Found**: Return 200 OK but log orphaned subscription event

### Webhook Event Types

#### Primary Events (Checkout Flow)
- `order_created`: Hosted checkout completed successfully
- `order_refunded`: Order refunded through LemonSqueezy

#### Subscription Events
- `subscription_created`: New subscription from checkout
- `subscription_updated`: Plan changes via Customer Portal
- `subscription_cancelled`: Subscription cancelled
- `subscription_resumed`: Cancelled subscription reactivated
- `subscription_expired`: Subscription ended
- `subscription_paused`: Subscription paused
- `subscription_unpaused`: Subscription resumed from pause

#### Payment Events
- `subscription_payment_success`: Recurring payment successful
- `subscription_payment_failed`: Payment failed
- `subscription_payment_recovered`: Failed payment recovered

### Event Processing Flow
1. LemonSqueezy sends webhook to `/api/lemonsqueezy/webhook`
2. Verify signature using LEMONSQUEEZY_WEBHOOK_SECRET
3. Extract user ID from custom data passed during checkout
4. Update subscription status based on event type
5. Record event in webhook_events table
6. Return 200 OK to acknowledge receipt

### Customer Portal Integration
Users can manage subscriptions through LemonSqueezy's hosted customer portal:
- Change payment methods
- Cancel or pause subscriptions
- Download invoices
- Update billing information

All changes made in the portal trigger webhook events to keep the application synchronized.

## Additional Context

### Advantages of LemonSqueezy Webhooks
- **Simplified Tax Data**: Tax already calculated and handled by LemonSqueezy
- **Clean Events**: Well-structured JSON:API format
- **Reliable Delivery**: Automatic retries with exponential backoff
- **Event Ordering**: Events delivered in correct sequence
- **Portal Integration**: Automatic events from customer portal actions

### Merchant of Record Benefits
Since LemonSqueezy acts as merchant of record:
- Invoice data comes from LemonSqueezy
- Tax compliance handled automatically
- Refunds processed by LemonSqueezy
- Dispute management handled by LemonSqueezy

This webhook handler ensures seamless integration between LemonSqueezy's hosted checkout/portal and the application's subscription management system.

### Unified Subscription Data Model

Both Stripe and LemonSqueezy webhooks update the same subscription fields on the user model:
- **subscription_status**: 'active', 'past_due', 'cancelled', etc.
- **subscription_tier**: 'pro', 'enterprise', etc.
- **subscription_end_date**: Next billing or cancellation date

Provider-specific fields track which service is being used:
- **stripeCustomerId** + **subscriptionId**: Set when using Stripe (US users)
- **lemon_squeezy_customer_id** + **lemon_squeezy_subscription_id**: Set when using LemonSqueezy (non-US users)

This unified model allows the application's UI and access control logic to work consistently regardless of which payment provider the user is assigned to based on their locale.