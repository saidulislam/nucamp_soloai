# LS03-LemonSqueezy-Checkout-URLs.md

## Overview
Create server-side API endpoint to generate LemonSqueezy checkout URLs that redirect users to LemonSqueezy-hosted payment pages. LemonSqueezy acts as merchant of record, handling all payment processing, tax calculation, and compliance requirements through their optimized checkout experience.

**Feature Type**: Technical Integration

**Integration Context**: This feature implements checkout URL generation for non-US users only. The Stripe checkout system (ST03-Stripe-Checkout-Sessions.md) is already implemented and serves US users (locale: `en`). The pricing page automatically routes users to the appropriate payment provider based on their active Paraglide locale.

## Requirements

### User Stories
- As a potential customer, I want to purchase subscriptions through LemonSqueezy's secure checkout
- As an international user, I want automatic tax calculation in my local currency
- As a user, I want a seamless redirect to LemonSqueezy's optimized checkout page

### Integration Points
- Connect with pricing tier cards from P02-Pricing-Tiers.md
- Integrate with Better Auth user system for customer identification
- Build upon SDK installation from LS02-Install-LemonSqueezy-SDK.md
- Utilize existing pricing page structure from P03-Pricing-Checkout-Link.md

### Functional Requirements
- **Checkout URL Generation**: Server-side endpoint creates checkout URLs with user and product data
- **Authentication**: Verify Better Auth session before creating checkout URLs
- **Product Validation**: Validate selected variant ID against configured products
- **Customer Data**: Pass user email and ID for customer record creation
- **Success/Cancel URLs**: Configure return URLs for post-payment redirects
- **Metadata**: Include user ID and tier information for webhook processing

### Security Considerations
- API keys stored securely in environment variables
- Authentication required for checkout URL creation
- Rate limiting: 10 checkout URLs per user per hour
- URL validation to prevent open redirects
- HTTPS-only for production checkouts

### Performance Requirements
- Checkout URL generation within 2 seconds
- Support 100+ concurrent checkout creations
- Immediate redirect to LemonSqueezy checkout
- Graceful error handling with user feedback

## Technical Specifications

### Dependencies
- LemonSqueezy Node.js SDK from LS02-Install-LemonSqueezy-SDK.md
- Better Auth session validation
- Environment variables: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID
- Product variant IDs from LS05-Configure-LemonSqueezy-Products.md

### API Endpoint
```typescript
// POST /api/lemonsqueezy/checkout
interface CheckoutRequest {
  variantId: string;        // LemonSqueezy product variant ID
  tier: 'pro' | 'enterprise'; // Subscription tier
}

interface CheckoutResponse {
  url: string;      // LemonSqueezy checkout URL
  checkoutId: string; // Checkout ID for tracking
}
```

### Implementation Example
```typescript
// src/routes/api/lemonsqueezy/checkout/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCheckoutUrl } from '$lib/lemonsqueezy';

export const POST: RequestHandler = async ({ request, locals, url }) => {
  // Verify authentication using Better Auth
  const session = locals.session;
  const user = locals.user;

  if (!session || !user) {
    console.error('[LemonSqueezy] Unauthorized checkout attempt');
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse request body
    const { variantId, tier } = await request.json();

    if (!variantId) {
      return json({ error: 'Missing variantId' }, { status: 400 });
    }

    console.log(`[LemonSqueezy] Creating checkout for user ${user.email}, tier: ${tier}`);

    // Create checkout URL using SDK utilities
    const checkout = await createCheckoutUrl({
      variantId,
      userEmail: user.email,
      userName: user.name || undefined,
      userId: user.id,
      successUrl: `${url.origin}/account?success=true`,
      cancelUrl: `${url.origin}/pricing?canceled=true`,
      metadata: {
        tier: tier || 'unknown'
      }
    });

    console.log(`[LemonSqueezy] Checkout created successfully: ${checkout.checkoutId}`);

    // Return URL for client-side redirect (not server-side redirect)
    return json({
      url: checkout.url,
      checkoutId: checkout.checkoutId
    });
  } catch (error) {
    console.error('[LemonSqueezy] Checkout creation failed:', error);
    return json(
      {
        error: error instanceof Error ? error.message : 'Failed to create checkout'
      },
      { status: 500 }
    );
  }
};
```

**Important Implementation Notes:**
- Success/cancel URLs MUST be in `custom` data (handled by `createCheckoutUrl`)
- Never modify the checkout URL after receiving it - it's signed by LemonSqueezy
- Modifying the URL causes "Invalid signature" errors
- Handle post-payment redirects in your webhook handler using `meta.custom_data`
- The checkout URL path is `checkout.data.data.attributes.url` (nested structure)

### Frontend Integration
```svelte
<!-- src/routes/pricing/+page.svelte -->
<script lang="ts">
  async function handleLemonSqueezyCheckout(variantId: string, tier: string) {
    try {
      const response = await fetch('/api/lemonsqueezy/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, tier })
      });

      if (!response.ok) {
        throw new Error('Checkout failed');
      }

      const { url } = await response.json();
      
      // Redirect to LemonSqueezy-hosted checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      // Show error message to user
    }
  }
</script>

<button on:click={() => handleLemonSqueezyCheckout('variant_xxx', 'pro')}>
  Subscribe with LemonSqueezy
</button>
```

### Checkout Configuration

#### Required Parameters
- `storeId`: Your LemonSqueezy store ID
- `variantId`: Product variant to purchase
- `email`: Customer email address

#### Optional Customization
- `name`: Customer full name
- `custom`: Metadata for webhook processing
- `success_url`: Return URL after successful payment
- `cancel_url`: Return URL if checkout canceled
- `receipt_thank_you_note`: Custom message on receipt

### Success/Cancel Handling
```typescript
// src/routes/account/+page.ts
export async function load({ url }) {
  const success = url.searchParams.get('success');
  const checkoutId = url.searchParams.get('checkout_id');
  
  if (success === 'true' && checkoutId) {
    // Payment successful, wait for webhook confirmation
    return {
      message: 'Payment successful! Your subscription will be activated shortly.',
      checkoutId
    };
  }
}
```

### Error Handling
- **Invalid Variant**: Return 400 with error message
- **Authentication Failed**: Return 401 unauthorized
- **API Error**: Log details and return 500
- **Rate Limit**: Return 429 with retry-after
- **Network Issues**: Implement retry logic

### Testing
- Use test mode for development
- Test with various product variants
- Verify success/cancel redirects
- Check webhook event delivery
- Validate customer portal access

## Customer Portal

LemonSqueezy provides a built-in customer portal where users can:
- Update payment methods
- Cancel subscriptions
- Download invoices
- Change plans
- Update billing information

Generate portal URL:
```typescript
// Generate customer portal URL
async function getCustomerPortalUrl(customerId: string) {
  const customer = await getCustomer(customerId);
  return customer.data?.attributes.urls.customer_portal;
}
```

## Webhook Integration

After successful payment, LemonSqueezy sends webhook events:
- `order_created`: Initial purchase completed
- `subscription_created`: Subscription activated
- `subscription_updated`: Plan changes
- `subscription_payment_success`: Renewal payment

These are handled in LS04-LemonSqueezy-Webhooks.md.

## Additional Context

### LemonSqueezy Checkout Features
- **Tax Compliance**: Automatic VAT/sales tax calculation
- **Multi-currency**: Local currency display and conversion
- **Payment Methods**: Cards, PayPal, and regional methods
- **Localization**: Automatic language detection
- **Mobile Optimized**: Responsive checkout design
- **Fraud Protection**: Built-in fraud detection

### Merchant of Record Benefits
- LemonSqueezy handles all tax compliance
- No need for tax registration in multiple countries
- Automatic invoice generation
- Simplified accounting (one invoice from LemonSqueezy)
- Reduced legal and compliance burden

### Migration from Embedded Checkout
If migrating from embedded forms:
1. Remove client-side checkout code
2. Replace with server-side URL generation
3. Update success/cancel handling
4. Simplify error handling
5. Remove PCI compliance requirements

### Locale-Based Payment Provider Selection

The application automatically selects the payment provider based on the user's active Paraglide locale:

```typescript
// Choose provider based on Paraglide locale
import { getLocale } from '$lib/paraglide/runtime';

const isUSUser = getLocale() === 'en';

if (isUSUser) {
  // Redirect to Stripe checkout (ST03-Stripe-Checkout-Sessions.md)
  await handleStripeCheckout(priceId, tier);
} else {
  // Redirect to LemonSqueezy checkout
  await handleLemonSqueezyCheckout(variantId, tier);
}
```

**Implementation on Pricing Page:**

```svelte
<!-- src/routes/pricing/+page.svelte -->
<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { getLocale } from '$lib/paraglide/runtime';

  // Stripe price IDs for US users
  const STRIPE_PRICE_IDS = {
    starter: 'price_STARTER_MONTHLY',
    pro: 'price_PRO_MONTHLY',
    enterprise: 'price_ENTERPRISE_MONTHLY'
  };

  // LemonSqueezy variant IDs for non-US users
  const LEMONSQUEEZY_VARIANT_IDS = {
    starter: 'variant_STARTER_MONTHLY',
    pro: 'variant_PRO_MONTHLY',
    enterprise: 'variant_ENTERPRISE_MONTHLY'
  };

  let isLoading = false;
  let sessionData = authClient.useSession();
  const currentUser = $derived($sessionData?.data?.user);
  const currentTier = $derived((currentUser as any)?.subscriptionTier || 'free');

  // Determine payment provider based on locale
  const isUSUser = $derived(getLocale() === 'en');
  const paymentProvider = $derived(isUSUser ? 'Stripe' : 'LemonSqueezy');

  async function handleCheckout(tier: string) {
    if (isLoading) return;

    isLoading = true;
    try {
      if (isUSUser) {
        // Use Stripe for US users (locale: en)
        const priceId = STRIPE_PRICE_IDS[tier];
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId, tier })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        // Use LemonSqueezy for non-US users
        const variantId = LEMONSQUEEZY_VARIANT_IDS[tier];
        const response = await fetch('/api/lemonsqueezy/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantId, tier })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
      isLoading = false;
    }
  }
</script>

<section class="container mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold mb-4">Pricing Plans</h1>

  <!-- Show which payment provider is being used -->
  <p class="text-sm text-gray-600 mb-4">
    Payment processed by {paymentProvider}
  </p>

  <div class="grid gap-8 md:grid-cols-3">
    <!-- Pricing tier cards -->
    <div class="p-6 border rounded-lg">
      <h2 class="text-2xl font-semibold mb-3">Professional</h2>
      <p class="text-3xl font-bold mb-4">$29<span class="text-lg font-normal">/month</span></p>

      <button
        onclick={() => handleCheckout('pro')}
        disabled={isLoading || currentTier === 'pro'}
        class="w-full btn btn-primary disabled:opacity-50"
      >
        {#if currentTier === 'pro'}
          Current Plan
        {:else if isLoading}
          Loading...
        {:else}
          Choose Professional
        {/if}
      </button>
    </div>
  </div>
</section>
```

**Key Implementation Points:**
1. **Locale Detection**: Uses `getLocale()` from Paraglide to determine user locale
2. **Provider Selection**: `en` locale → Stripe; all others → LemonSqueezy
3. **Unified UX**: Same button/flow for users, different backend based on locale
4. **Transparent Routing**: Users don't need to choose provider manually
5. **Consistent Pricing**: Same displayed prices across both providers

## Prerequisites
- **Required**: ST03-Stripe-Checkout-Sessions.md - Stripe checkout already implemented for US users
- **Required**: PG02-Paraglide-Configure-Langs.md - Locale system for provider selection
- LS01-LemonSqueezy-Account.md - Account and API setup
- LS02-Install-LemonSqueezy-SDK.md - SDK installation
- LS05-Configure-LemonSqueezy-Products.md - Product configuration

## Success Criteria
- Checkout URLs generated successfully
- Users redirected to LemonSqueezy checkout
- Success/cancel redirects working
- Metadata passed for webhook processing
- Authentication and rate limiting enforced
- Error handling provides good UX