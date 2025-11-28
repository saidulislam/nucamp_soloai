# ST04-Stripe-Webhooks.md

## Overview
Handle Stripe webhook events from Checkout sessions and subscription lifecycle to maintain user billing status synchronization. Process events from Stripe-hosted checkout completions and ongoing subscription management.

**Feature Type**: Technical Integration

## Requirements

### Technical Integration Details
- **Service**: Stripe Webhooks API (latest stable version)
- **Endpoints**: `/api/stripe/webhook` for receiving webhook events
- **Authentication**: Webhook signature verification using STRIPE_WEBHOOK_SECRET
- **Key Events**: checkout.session.completed from Stripe-hosted checkout
- **Integration Points**: Better Auth user system, Checkout session metadata

### Functional Requirements
- **Checkout Session Events**: Process checkout.session.completed when users complete Stripe-hosted checkout
- **Subscription Events**: Handle customer.subscription.created/updated/deleted for ongoing management
- **Payment Events**: Process invoice.payment_succeeded/failed for recurring billing
- **Signature Verification**: Validate all webhooks using STRIPE_WEBHOOK_SECRET
- **Idempotency**: Prevent duplicate processing using Stripe event IDs
- **User Status Updates**: Update subscription status immediately after checkout completion
- **Customer Linking**: Associate Stripe customers with application users via metadata
- **Error Recovery**: Implement retry logic for transient failures
- **Audit Logging**: Track all webhook events and processing results
- **Portal Events**: Handle customer.portal events for self-service changes

### Data Requirements
- Extend existing user database schema to include subscription status, Stripe customer ID, and billing information
- Store webhook event IDs to implement idempotency and prevent duplicate processing
- Track subscription tier changes with timestamps for billing history and analytics
- Maintain audit logs of all webhook events and processing results for compliance

### Security Considerations
- Implement webhook signature verification using Stripe's signature headers and webhook secret
- Validate webhook event source and authenticity before processing any data changes
- Sanitize webhook payload data to prevent injection attacks and malformed data processing
- Rate limit webhook endpoint to prevent abuse and DoS attacks
- Log security events including invalid signatures and suspicious webhook activity

### Performance Requirements
- Process webhook events within 10 seconds under normal conditions
- Handle up to 100 webhook events per minute without performance degradation
- Implement webhook response within 2 seconds to prevent Stripe retry attempts
- Support concurrent webhook processing for multiple users simultaneously
- Database updates must complete within 5 seconds of webhook receipt

## Technical Specifications

### Dependencies
- Stripe Node.js SDK v14.0+ from ST02-Install-Stripe-SDK.md
- Better Auth user system from AU02-BetterAuth-Init.md
- MySQL database from DB01-DB-Container-Setup.md
- Environment variables from ST01-Stripe-Account-Setup.md (STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY)
- Pricing tiers configuration from P02-Pricing-Tiers.md

### Database Changes
- Add subscription fields to users table: stripe_customer_id, subscription_status, subscription_tier, subscription_end_date
- Create webhook_events table with columns: id, stripe_event_id, event_type, processed_at, user_id, processing_status
- Add database indexes on stripe_customer_id and stripe_event_id for efficient webhook processing
- Create subscription_history table for tracking tier changes and billing events

### API Changes
- New POST endpoint: `/api/stripe/webhook` accepting Stripe webhook payloads
- Webhook endpoint must return 200 status for successful processing, 400 for invalid data, 500 for processing errors
- Implement proper HTTP status codes and error responses for webhook processing failures
- Support raw body parsing for webhook signature verification requirements

### Environment Variables
- STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe dashboard
- STRIPE_SECRET_KEY: Server-side API key for Stripe operations (from ST01-Stripe-Account-Setup.md)
- DATABASE_URL: MySQL connection string for subscription data updates

## Additional Context for AI Assistant

### SaaS Architecture Integration
This webhook handler integrates with the existing SvelteKit/Better Auth architecture by:
- Using SvelteKit API routes for webhook endpoint implementation
- Leveraging Better Auth user session management for subscription updates
- Connecting to MySQL database through existing Prisma ORM setup
- Maintaining consistency with established error handling patterns

### Webhook Event Types to Handle

#### Primary Events (Checkout Flow)
- `checkout.session.completed`: Stripe-hosted checkout successful
- `checkout.session.expired`: Checkout session expired without payment

#### Subscription Events
- `customer.subscription.created`: New subscription from checkout
- `customer.subscription.updated`: Plan changes via Customer Portal
- `customer.subscription.deleted`: Subscription cancelled
- `customer.subscription.trial_will_end`: Trial ending notification

#### Payment Events
- `invoice.payment_succeeded`: Successful recurring payment
- `invoice.payment_failed`: Failed payment attempt
- `payment_intent.succeeded`: One-time payment completed

#### Customer Portal Events
- `billing_portal.session.created`: User accessed Customer Portal
- `customer.updated`: Customer info changed in Portal

### Integration with Completed Features
- Build upon Stripe checkout sessions from ST03-Stripe-Checkout-Sessions.md
- Use API key configuration from ST01-Stripe-Account-Setup.md
- Connect to user authentication system from Better Auth setup
- Integrate with pricing tier structure from P02-Pricing-Tiers.md

### Future Integration Points
- Webhook events will trigger Mautic email campaigns for billing notifications
- Subscription status updates will affect user access to protected features
- Payment events will integrate with upcoming account billing dashboard
- Webhook processing will support LemonSqueezy integration patterns

## Implementation Details

### Database Schema Updates

**CRITICAL:** Add subscription fields to User model and create WebhookEvent model for idempotency:

```prisma
// prisma/schema.prisma
model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  emailVerified        Boolean   @default(false)
  name                 String?
  image                String?

  // Stripe subscription fields (ST04)
  stripeCustomerId     String?   @unique // From ST03
  subscriptionStatus   String?   @default("free")
  subscriptionTier     String?
  subscriptionId       String?   @unique
  subscriptionEndDate  DateTime?

  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  // ... other fields and relations
}

// Idempotency tracking for webhooks
model WebhookEvent {
  id               String   @id @default(cuid())
  stripeEventId    String   @unique // Stripe event ID
  eventType        String
  processed        Boolean  @default(false)
  processingStatus String?
  errorMessage     String?  @db.Text
  userId           String?
  payload          String?  @db.Text
  createdAt        DateTime @default(now())
  processedAt      DateTime?

  @@index([stripeEventId])
  @@index([eventType])
  @@index([userId])
  @@index([processed])
}
```

After updating schema, run:
```bash
npx prisma db push
```

### Better Auth Custom Session Plugin

**CRITICAL FIX:** By default, Better Auth only returns core user fields in the session. Custom Stripe fields must be explicitly fetched using the `customSession` plugin.

#### Server-Side Configuration

```typescript
// src/lib/auth/server.ts
import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins"; // Import plugin
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { sveltekitCookies } from "better-auth/plugins/svelte-kit";
import { getRequestEvent } from "better-auth/svelte-kit";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mysql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5173",
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    sveltekitCookies(getRequestEvent),
    // ✅ CRITICAL: Add customSession plugin to fetch Stripe fields
    customSession(async ({ user, session }) => {
      // Fetch full user object including custom fields
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          mauticId: true,
          // Stripe fields - MUST be explicitly selected
          stripeCustomerId: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          subscriptionId: true,
          subscriptionEndDate: true
        }
      });

      if (!fullUser) return { user, session };

      return {
        user: fullUser,
        session
      };
    })
  ]
});

export type Auth = typeof auth;
```

#### Client-Side Configuration

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/svelte';
import { customSessionClient } from 'better-auth/client/plugins';
import type { auth } from '$lib/auth/server';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:5173',
  plugins: [
    // ✅ CRITICAL: Add client-side plugin
    customSessionClient<typeof auth>()
  ]
});

export const { signIn, signOut, signUp, useSession } = authClient;
```

#### TypeScript Type Definitions

```typescript
// src/app.d.ts
import type { Locale } from '$lib/paraglide/runtime.js';
import type { Session, User } from 'better-auth/types';

// ✅ CORRECT: Use intersection type (not module augmentation)
export type ExtendedUser = User & {
  mauticId?: number | null;
  stripeCustomerId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionTier?: string | null;
  subscriptionId?: string | null;
  subscriptionEndDate?: Date | null;
};

declare global {
  namespace App {
    interface Locals {
      locale: Locale;
      session?: Session;
      user?: ExtendedUser; // Use ExtendedUser type
    }
  }
}

export {};
```

#### Hooks Configuration

```typescript
// src/hooks.server.ts
import { auth } from '$lib/auth/server';
// ... other imports

export const handle: Handle = sequence(
  async ({ event, resolve }) => {
    // Get session with custom fields
    const session = await auth.api.getSession({
      headers: event.request.headers
    });

    if (session) {
      event.locals.session = session.session;
      // ✅ Cast to bypass Better Auth type limitations
      event.locals.user = session.user as any;
    }

    return resolve(event);
  },
  // ... other handlers
);
```

**Why This Fix is Necessary:**
- Better Auth doesn't automatically include custom Prisma fields in session
- Without `customSession` plugin, Stripe fields will be `undefined` in the UI
- Must explicitly fetch all custom fields in the select statement
- Type casting with `as any` needed due to Better Auth TypeScript limitations

### Stripe SDK Type Intersection Fixes

**CRITICAL FIX:** The Stripe Node.js SDK has incomplete TypeScript definitions. Some properties that exist in the API are missing from type definitions.

#### Missing Properties

1. **Subscription.current_period_end** - Not in TypeScript definitions but exists in API
2. **Invoice.subscription** - Not properly typed in SDK

#### Solution: Use Type Intersections

```typescript
// src/routes/api/stripe/webhook/+server.ts

// ✅ CORRECT: Extend Subscription type with missing properties
async function handleSubscriptionCreated(event: Stripe.Event): Promise<string | null> {
  const subscription = event.data.object as Stripe.Subscription & {
    current_period_end: number; // Add missing property
  };

  const userId = subscription.metadata?.userId;
  if (!userId) return null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: subscription.status,
      subscriptionTier: subscription.metadata?.tier || 'unknown',
      subscriptionId: subscription.id,
      // Now TypeScript recognizes current_period_end
      subscriptionEndDate: new Date(subscription.current_period_end * 1000)
    }
  });

  return userId;
}

async function handleSubscriptionUpdated(event: Stripe.Event): Promise<string | null> {
  // Same type intersection pattern
  const subscription = event.data.object as Stripe.Subscription & {
    current_period_end: number;
  };

  // ... rest of handler
}

// ✅ CORRECT: Extend Invoice type with subscription property
async function handlePaymentSucceeded(event: Stripe.Event): Promise<string | null> {
  const invoice = event.data.object as Stripe.Invoice & {
    subscription: string | Stripe.Subscription | null;
  };

  if (!invoice.subscription) return null;

  // Handle both string ID and expanded object
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription.id;

  // ... rest of handler
}

async function handlePaymentFailed(event: Stripe.Event): Promise<string | null> {
  // Same type intersection pattern
  const invoice = event.data.object as Stripe.Invoice & {
    subscription: string | Stripe.Subscription | null;
  };

  // ... rest of handler
}
```

**Key Points:**
- Use intersection types: `Stripe.Type & { property: type }`
- Don't try to use camelCase - Stripe API uses snake_case
- Apply to all handlers that access these properties
- Check Stripe API docs for actual property names if types are incomplete

### Complete Webhook Handler Example

```typescript
// src/routes/api/stripe/webhook/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import stripe from '$lib/stripe/server';
import { PrismaClient } from '@prisma/client';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import type Stripe from 'stripe';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return json({ error: 'No signature' }, { status: 400 });
  }

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Check idempotency
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id }
  });

  if (existingEvent?.processed) {
    console.log(`Event ${event.id} already processed, skipping`);
    return json({ received: true, message: 'Already processed' });
  }

  // Create webhook event record
  await prisma.webhookEvent.create({
    data: {
      stripeEventId: event.id,
      eventType: event.type,
      processed: false,
      payload: JSON.stringify(event)
    }
  });

  // Handle event
  let userId: string | null = null;

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        userId = await handleCheckoutSessionCompleted(event);
        break;
      case 'customer.subscription.created':
        userId = await handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.updated':
        userId = await handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        userId = await handleSubscriptionDeleted(event);
        break;
      case 'invoice.payment_succeeded':
        userId = await handlePaymentSucceeded(event);
        break;
      case 'invoice.payment_failed':
        userId = await handlePaymentFailed(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processed: true,
        processingStatus: 'success',
        userId: userId || undefined,
        processedAt: new Date()
      }
    });

    return json({ received: true, eventType: event.type });

  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);

    // Mark as failed
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processed: false,
        processingStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date()
      }
    });

    return json({ error: 'Processing failed' }, { status: 500 });
  }
};

// Handler implementations with type intersections...
async function handleSubscriptionCreated(event: Stripe.Event): Promise<string | null> {
  const subscription = event.data.object as Stripe.Subscription & {
    current_period_end: number;
  };
  // ... implementation
}

// ... other handlers
```

### Testing Webhooks Locally

Use Stripe CLI to forward webhooks to your local dev server:

```bash
# Install Stripe CLI (if not installed)
brew install stripe/stripe-cli/stripe  # macOS
scoop install stripe                    # Windows

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:5173/api/stripe/webhook
```

The CLI will output a webhook signing secret - add it to `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_local_testing_secret
```

### Common Issues and Solutions

1. **Subscription fields not appearing in session**
   - Solution: Add `customSession` plugin to Better Auth server config
   - Must explicitly select fields in Prisma query

2. **TypeScript errors on Stripe properties**
   - Solution: Use intersection types to extend incomplete SDK types
   - Check Stripe API docs for actual property names

3. **Webhook processed multiple times**
   - Solution: Implement idempotency using WebhookEvent model
   - Check for existing event before processing

4. **User not updated after checkout**
   - Solution: Ensure metadata includes userId in checkout session
   - Verify webhook handler is extracting metadata correctly