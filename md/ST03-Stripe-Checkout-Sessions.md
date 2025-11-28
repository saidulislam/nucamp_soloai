# ST03-Stripe-Checkout-Sessions.md

## Overview
Create server-side API endpoint to generate Stripe Checkout sessions that redirect users to Stripe-hosted payment pages for subscription purchases. This approach provides a secure, PCI-compliant payment flow without handling sensitive card data directly.

**Feature Type**: Technical Integration

## Requirements

### Technical Integration Details
- **Service**: Stripe Checkout Sessions API (latest stable version)
- **Checkout Mode**: Stripe-hosted pages (not embedded)
- **Authentication**: Requires STRIPE_SECRET_KEY from ST01-Stripe-Account-Setup.md
- **Integration Points**:
  - Better Auth user system for customer identification
  - Pricing tier data from P02-Pricing-Tiers.md
  - Existing SvelteKit API route structure

### Functional Requirements
- **Checkout Session Creation**: Generate secure Stripe Checkout sessions that redirect to Stripe-hosted payment pages
- **User Authentication**: Verify Better Auth session before creating checkout sessions
- **Customer Management**: Create or retrieve Stripe customers linked to authenticated users
- **Subscription Mode**: Configure sessions for subscription billing with recurring payments
- **Success/Cancel URLs**: Configure return URLs for post-payment redirects
- **Metadata Tracking**: Attach user and tier information to sessions for webhook processing

### Data Requirements
- **Session Configuration**: 
  - Payment mode: subscription
  - Line items: pricing tier products from Stripe Dashboard
  - Customer email: from authenticated user
  - Success URL: application account page
  - Cancel URL: application pricing page
- **Customer Mapping**: Link Better Auth users to Stripe customers
- **Session Metadata**: Store user_id, tier_name, and session_type

### Security Considerations
- **Authentication Required**: All checkout requests must include valid Better Auth session
- **Server-Side Only**: Checkout sessions created exclusively on server to protect API keys
- **URL Validation**: Validate success and cancel URLs to prevent open redirects
- **Rate Limiting**: Maximum 10 checkout sessions per user per hour
- **HTTPS Only**: Enforce HTTPS for all production checkout flows

### Performance Requirements
- **Session Creation**: Complete within 2 seconds
- **Redirect Time**: Navigate to Stripe page within 1 second
- **Concurrent Sessions**: Support 100+ simultaneous checkouts
- **Error Recovery**: Retry failed session creation with exponential backoff

## Technical Specifications

### Dependencies
- Stripe Node.js SDK v14.0+ from ST02-Install-Stripe-SDK.md
- Better Auth server methods for session validation
- Environment variables: STRIPE_SECRET_KEY, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL
- Pricing configuration from ST06-Configure-Stripe-Products.md

### API Endpoint
```typescript
// POST /api/stripe/checkout
// Accepts JSON (not form data for SPA pattern)
interface CheckoutRequest {
  priceId: string;           // Stripe price ID from configured products
  tier: 'pro' | 'enterprise'; // Subscription tier
}

interface CheckoutResponse {
  url: string;  // Stripe Checkout URL for client-side redirect
}

// IMPORTANT: Server responds with JSON containing URL
// Client-side code performs redirect using window.location.href
// This pattern is required for SPAs using fetch() - server-side redirect doesn't work
```

### Quick Start Implementation
**CRITICAL:** For SPAs using fetch(), you MUST return JSON and perform client-side redirect.
Server-side `redirect()` does NOT work with fetch() - the browser won't follow external redirects.

```typescript
// src/routes/api/stripe/checkout/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const POST: RequestHandler = async ({ request, locals, url }) => {
  // Verify authentication
  const session = locals.session;
  const user = locals.user;

  if (!session || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { priceId } = await request.json();

  try {
    // Create Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${url.origin}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/pricing?canceled=true`,
    });

    // ✅ CORRECT: Return JSON for client-side redirect
    return json({ url: checkoutSession.url });

    // ❌ WRONG: Server-side redirect doesn't work with fetch()
    // return redirect(303, checkoutSession.url);
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
    return json({ error: errorMessage }, { status: 500 });
  }
};
```

### Full Production Implementation
For production use with customer management and metadata:

```typescript
// src/routes/api/stripe/checkout/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import stripe from '$lib/stripe/server';
import { PrismaClient } from '@prisma/client';
import { STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL } from '$env/static/private';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request, locals, url }) => {
  // Verify authentication
  const session = locals.session;
  const user = locals.user;

  if (!session || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { priceId, tier } = await request.json();

    // Validate required fields
    if (!priceId) {
      return json({ error: 'Missing required field: priceId' }, { status: 400 });
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = (user as any).stripeCustomerId;

    if (stripeCustomerId) {
      // Verify customer still exists in Stripe
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (error) {
        console.log(`Customer ${stripeCustomerId} not found, creating new one`);
        stripeCustomerId = null;
      }
    }

    if (!stripeCustomerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id
        }
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      });

      console.log(`Created customer ${stripeCustomerId} for user ${user.email}`);
    }

    // Configure return URLs
    const successUrl = STRIPE_SUCCESS_URL || `${url.origin}/account?success=true`;
    const cancelUrl = STRIPE_CANCEL_URL || `${url.origin}/pricing?canceled=true`;

    // Create Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      // Add metadata for webhook processing
      metadata: {
        userId: user.id,
        tier: tier
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier: tier
        }
      },
      // Enable customer portal for subscription management
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address
      billing_address_collection: 'auto'
      // Note: automatic_tax is disabled by default - enable when configured
    });

    console.log(`Created checkout session ${checkoutSession.id} for user ${user.email}`);

    // ✅ CORRECT: Return checkout URL for client-side redirect
    return json({ url: checkoutSession.url });

  } catch (error) {
    console.error('Checkout session creation failed:', error);

    // Return error response
    const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
    return json({ error: errorMessage }, { status: 500 });
  }
};
```

**Important Notes:**
- Removed `payment_method_types` - Stripe automatically shows enabled payment methods from Dashboard
- Returns JSON with URL instead of server-side redirect (required for SPAs)
- Includes proper error handling with user-friendly messages
- Validates customer existence before using cached ID

### Frontend Integration

**Recommended Pattern: Fetch with Client-Side Redirect**

```svelte
<!-- src/routes/pricing/+page.svelte -->
<script lang="ts">
  import { authClient } from '$lib/auth-client';

  const PRICE_IDS = {
    starter: 'price_STARTER_MONTHLY',
    pro: 'price_PRO_MONTHLY',
    enterprise: 'price_ENTERPRISE_MONTHLY'
  };

  let isLoading = false;
  let sessionData = authClient.useSession();
  const currentUser = $derived($sessionData?.data?.user);
  const currentTier = $derived((currentUser as any)?.subscriptionTier || 'free');

  async function handleCheckout(priceId: string, tier: string) {
    if (isLoading) return; // Prevent double-clicks

    isLoading = true;
    try {
      // Call API to create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priceId, tier })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // ✅ CRITICAL: Client-side redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout. Please try again.');
      isLoading = false; // Only reset on error
    }
    // Don't reset isLoading on success - page will navigate away
  }
</script>

<button
  onclick={() => handleCheckout(PRICE_IDS.pro, 'pro')}
  disabled={isLoading || currentTier === 'pro'}
  class="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
>
  {#if currentTier === 'pro'}
    Current Plan
  {:else if isLoading}
    Loading...
  {:else}
    Choose Professional
  {/if}
</button>
```

**Key Implementation Points:**
1. **Loading State**: Prevents double-clicks and provides user feedback
2. **Error Handling**: Shows user-friendly error messages
3. **Client-Side Redirect**: Uses `window.location.href` for external URLs
4. **Don't Reset on Success**: Loading state remains true as page navigates away
5. **Current Tier Check**: Disables button if user already has the plan

### Checkout Session Configuration

#### Required Fields
- `customer`: Stripe customer ID or email
- `mode`: 'subscription' for recurring billing
- `line_items`: Array of price IDs and quantities
- `success_url`: Return URL after successful payment
- `cancel_url`: Return URL if user cancels

#### Recommended Fields
- `metadata`: Custom data for webhook processing
- `subscription_data`: Additional subscription configuration
- `automatic_tax`: Enable tax calculation
- `customer_update`: Allow address/name updates
- `billing_address_collection`: Collect billing address

### Error Handling
- **Invalid Price ID**: Return 400 with clear error message
- **Authentication Failed**: Return 401 unauthorized
- **Stripe API Error**: Log details and return 500
- **Rate Limit Exceeded**: Return 429 with retry-after header
- **Network Timeout**: Implement retry with exponential backoff

### Testing
Use Stripe test card numbers:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Authentication Required: 4000 0025 0000 3155

### Environment Variables
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_SUCCESS_URL=http://localhost:5173/account
STRIPE_CANCEL_URL=http://localhost:5173/pricing
```

## Webhook Integration

After successful payment, Stripe sends webhook events:
- `checkout.session.completed`: Payment successful
- `customer.subscription.created`: Subscription active
- `invoice.payment_succeeded`: Recurring payment processed

These events are handled in ST04-Stripe-Webhooks.md to update user subscription status.

## Customer Portal

Enable users to manage subscriptions through Stripe's Customer Portal:
```typescript
// Create portal session
const portalSession = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${url.origin}/account`
});

// Redirect to portal
return redirect(303, portalSession.url);
```

## Additional Context

### Migration from Embedded Checkout
If migrating from embedded checkout:
1. Remove client-side Stripe.js initialization
2. Replace embedded form with redirect flow
3. Update success/cancel URL handling
4. Simplify PCI compliance requirements

### Advantages of Stripe-Hosted Checkout
- **Security**: No sensitive card data touches your servers
- **Compliance**: Simplified PCI compliance (SAQ-A)
- **Conversion**: Optimized checkout flow by Stripe
- **Localization**: Automatic language detection
- **Payment Methods**: Access to 40+ payment methods
- **Mobile Optimized**: Responsive design for all devices

### Future Enhancements
- Support for one-time payments
- Coupon and discount code support
- Trial period configuration
- Multiple currency support
- Subscription quantity adjustments