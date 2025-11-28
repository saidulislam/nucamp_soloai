# ST05-Stripe-Portal-Integration.md

## Overview
Connect the existing pricing page and account dashboard UI components to Stripe subscription data, leveraging Stripe-hosted checkout and Customer Portal for payment and subscription management. Display subscription status while delegating sensitive operations to Stripe's secure interfaces.

**Feature Type**: Technical Integration

**Business Value**: Provides users with clear subscription visibility while utilizing Stripe's optimized, secure interfaces for payment collection and subscription management, reducing PCI compliance scope and support burden.

## Requirements

### Functional Requirements

**FR-1: Pricing Page Integration**
- Display current subscription status on pricing tier cards for authenticated users
- Show "Current Plan" badge for active subscription tier
- Display "Upgrade" or "Downgrade" buttons that redirect to Stripe Checkout
- Disable selection of current plan with clear visual indication

**FR-2: Account Dashboard Subscription Display**
- Show subscription overview with tier name and status
- Display next billing date and amount from webhook data
- Show subscription period (monthly/annual) and renewal information
- Include "Manage Subscription" button linking to Stripe Customer Portal

**FR-3: Checkout Redirect Flow**
- Create checkout sessions via API when user selects new plan
- Redirect users to Stripe-hosted checkout page
- Handle success/cancel URL parameters on return
- Display appropriate confirmation messages after checkout

**FR-4: Customer Portal Integration**
- Generate Customer Portal sessions for authenticated users
- Redirect to Stripe Portal for subscription management
- Handle portal return URL with status updates
- Let Stripe handle cancellations, payment method updates, and plan changes

### Data Requirements

**DR-1: User Subscription Model Extension**
- Utilize existing subscription fields from ST04-Stripe-Webhooks.md:
  - `stripe_customer_id`: Links user to Stripe customer
  - `subscription_status`: Current subscription state
  - `subscription_tier`: Active pricing tier
  - `subscription_end_date`: Next billing or cancellation date

**DR-2: Stripe API Data Fetching**
- Retrieve subscription details using Stripe Node.js SDK
- Fetch customer payment methods and billing history
- Cache subscription data for 5 minutes to reduce API calls
- Handle API rate limits with exponential backoff

**DR-3: Real-time Data Synchronization**
- Subscribe to subscription updates from webhook processing
- Update cached subscription data when webhooks modify database
- Invalidate cache when users perform subscription actions
- Maintain data consistency between Stripe and application state

### Security Considerations

**SC-1: Authentication & Authorization**
- Verify Better Auth session before displaying subscription data
- Ensure users can only view their own subscription information
- Validate subscription ownership before allowing management actions
- Protect Stripe API calls with server-side authentication

**SC-2: Data Protection**
- Never expose Stripe secret keys to client-side code
- Sanitize subscription data before sending to frontend
- Log subscription access and modification attempts
- Implement CSRF protection for subscription management forms

**SC-3: Payment Security**
- Use Stripe Customer Portal for sensitive billing operations
- Validate subscription tier changes against available products
- Implement rate limiting for subscription modification attempts
- Audit all subscription management actions with timestamps

### Performance Requirements

**PR-1: Load Times**
- Subscription data must load within 2 seconds on account dashboard
- Pricing page subscription status updates within 1 second
- Cache subscription data for 5 minutes to reduce API latency
- Support 50+ concurrent subscription data requests

**PR-2: API Efficiency**
- Batch Stripe API calls when fetching multiple data points
- Implement client-side caching for subscription status
- Use Stripe webhooks to minimize real-time API calls
- Optimize database queries for subscription data retrieval

**PR-3: User Experience**
- Show loading states during subscription data fetching
- Provide skeleton components while data loads
- Handle network failures gracefully with retry options
- Update UI within 100ms of user subscription actions

## Technical Specifications

### Dependencies
- **Required NPM Packages**:
  - `stripe` (Node.js SDK) - already installed from ST02-Install-Stripe-SDK.md
- **External Services**:
  - Stripe API (latest stable version) with existing API keys from ST01-Stripe-Account-Setup.md
  - Stripe Checkout (hosted pages)
  - Stripe Customer Portal
- **Existing Code Dependencies**:
  - Better Auth session management from AU04-Global-Client-Setup.md
  - User database schema from ST04-Stripe-Webhooks.md
  - Pricing tier components from P02-Pricing-Tiers.md
  - Account dashboard from D02-Account-Overview.md

### Database Changes
- **No new tables required** - utilizes existing subscription fields added in ST04-Stripe-Webhooks.md:
  - `users.stripe_customer_id`
  - `users.subscription_status`
  - `users.subscription_tier`
  - `users.subscription_end_date`

### API Changes
**New Server Endpoints**:
- `GET /api/stripe/subscription` - Fetch current user subscription data
- `POST /api/stripe/customer-portal` - Generate Customer Portal session URL

**Enhanced Existing Endpoints**:
- `/api/stripe/checkout` from ST03-Stripe-Checkout-Sessions.md handles all subscription operations
- Webhook processing in ST04-Stripe-Webhooks.md updates subscription data

**Removed Endpoints** (handled by Stripe Portal):
- No direct cancellation endpoint - use Customer Portal
- No reactivation endpoint - use Customer Portal
- No payment method update endpoint - use Customer Portal

### Environment Variables
- **Existing Variables** (already configured):
  - `STRIPE_SECRET_KEY` - Server-side Stripe operations
  - `STRIPE_PUBLISHABLE_KEY` - Client-side Stripe integration
  - `STRIPE_WEBHOOK_SECRET` - Webhook signature verification

## Integration Points

### Component Updates Required

**Pricing Page Components** (from P02-Pricing-Tiers.md):
- Modify `PricingTierCard.svelte` to accept subscription status prop
- Update button logic in `PricingButton.svelte` to show current plan status
- Add subscription status indicators and tier comparison features

**Account Dashboard Components** (from D02-Account-Overview.md):
- Extend `AccountOverview.svelte` with subscription information section
- Add new `SubscriptionCard.svelte` component for detailed billing display
- Create `SubscriptionActions.svelte` for management operations

**Authentication Integration**:
- Build upon Better Auth session from AU04-Global-Client-Setup.md
- Ensure subscription data fetching respects authentication state
- Handle unauthenticated users gracefully in pricing displays

### Data Flow Architecture

**Client-Side Flow**:
1. Better Auth session provides authenticated user context
2. SvelteKit load functions fetch subscription data from API endpoints
3. Components reactively update based on subscription state changes
4. User actions trigger API calls and optimistic UI updates

**Server-Side Flow**:
1. API endpoints validate Better Auth session tokens
2. Stripe API calls retrieve real-time subscription information
3. Database queries supplement Stripe data with application state
4. Webhook events update database and invalidate client caches

### Internationalization Support
- Integrate with Paraglide i18n system from PG02-Paraglide-Configure-Langs.md
- Support subscription status display in English, Spanish, and French
- Translate subscription tier names and billing terminology
- Localize date formatting for billing dates and trial periods

### Error Handling Strategy
- Graceful degradation when Stripe API is unavailable
- Fallback to cached subscription data during network issues
- Clear error messages for subscription management failures
- Retry mechanisms for temporary API failures with exponential backoff

## Additional Context for AI Assistant

**Integration Complexity**: This feature requires careful coordination between multiple existing systems:
- Stripe API integration (ST01-ST04)
- Better Auth user sessions (AU02-AU06)
- Existing UI components (P02, D02)
- Database schema modifications (ST04)

**User Experience Priority**: Focus on creating seamless transitions between subscription states without requiring page refreshes. Users should see immediate feedback for their actions while background processes handle Stripe synchronization.

**Performance Considerations**: Implement intelligent caching strategies to balance real-time accuracy with API efficiency. Subscription data changes infrequently but must be current for billing operations.

**Future Integration Points**: This implementation prepares for:
- LemonSqueezy integration (LS01-LS05) requiring similar UI patterns
- Advanced billing features and subscription analytics
- Multi-currency and tax calculation displays

## Implementation Details

### API Endpoint: Customer Portal Session

**CRITICAL:** Like checkout sessions, Customer Portal must return JSON and perform client-side redirect.

```typescript
// src/routes/api/stripe/customer-portal/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import stripe from '$lib/stripe/server';

export const POST: RequestHandler = async ({ locals, url }) => {
  // Verify authentication
  const session = locals.session;
  const user = locals.user;

  if (!session || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user has a Stripe customer ID
    const stripeCustomerId = (user as any).stripeCustomerId;

    if (!stripeCustomerId) {
      return json(
        { error: 'No Stripe customer ID found. Please subscribe to a plan first.' },
        { status: 400 }
      );
    }

    // Create Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${url.origin}/account`
    });

    console.log(`Created portal session for customer ${stripeCustomerId}`);

    // ✅ CORRECT: Return URL for client-side redirect
    return json({ url: portalSession.url });

    // ❌ WRONG: Server-side redirect doesn't work with fetch()
    // return redirect(303, portalSession.url);

  } catch (error) {
    console.error('Customer portal session creation failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Portal session creation failed';
    return json({ error: errorMessage }, { status: 500 });
  }
};
```

### API Endpoint: Subscription Data Fetch (Optional)

This endpoint is optional - you can also use Better Auth session data directly if `customSession` plugin is configured.

```typescript
// src/routes/api/stripe/subscription/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import stripe from '$lib/stripe/server';

export const GET: RequestHandler = async ({ locals }) => {
  // Verify authentication
  const session = locals.session;
  const user = locals.user;

  if (!session || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get subscription data from user object (populated by Better Auth customSession)
    const subscriptionData = {
      stripeCustomerId: (user as any).stripeCustomerId || null,
      subscriptionStatus: (user as any).subscriptionStatus || 'free',
      subscriptionTier: (user as any).subscriptionTier || 'free',
      subscriptionId: (user as any).subscriptionId || null,
      subscriptionEndDate: (user as any).subscriptionEndDate || null
    };

    // If user has an active subscription, fetch additional details from Stripe
    if (subscriptionData.subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionData.subscriptionId);

        // Add additional Stripe data
        return json({
          ...subscriptionData,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodStart: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : null,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null
        });
      } catch (stripeError) {
        console.error('Error fetching subscription details:', stripeError);
        // Fall through to return database data only
      }
    }

    // Return subscription data from database
    return json(subscriptionData);
  } catch (error) {
    console.error('Subscription data fetch failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Subscription fetch failed';
    return json({ error: errorMessage }, { status: 500 });
  }
};
```

### Account Page Integration

Update account page to display subscription info and manage subscription button:

```svelte
<!-- src/routes/account/+page.svelte -->
<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { page } from '$app/stores';

  let sessionData = authClient.useSession();

  // Derive user data from session (includes custom Stripe fields via customSession plugin)
  const currentUser = $derived($sessionData?.data?.user);

  // Check for success parameter from Stripe redirect
  const showSuccessMessage = $derived($page.url.searchParams.get('success') === 'true');
  const sessionId = $derived($page.url.searchParams.get('session_id'));

  // Handle manage subscription
  let isLoadingPortal = false;
  async function handleManageSubscription() {
    if (isLoadingPortal) return; // Prevent double-clicks

    isLoadingPortal = true;
    try {
      // Call API to create customer portal session
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      // ✅ CRITICAL: Client-side redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert(error instanceof Error ? error.message : 'Failed to open subscription portal. Please try again.');
      isLoadingPortal = false; // Only reset on error
    }
    // Don't reset isLoadingPortal on success - page will navigate away
  }

  // Format date helper
  function formatDate(date: Date | string | undefined) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Account - My Dashboard</title>
</svelte:head>

<section class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Account Overview</h1>

  <!-- Success message after Stripe checkout -->
  {#if showSuccessMessage}
    <div class="alert alert-success mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="font-bold">Payment Successful!</h3>
        <div class="text-sm">
          Thank you for subscribing. Your payment has been processed successfully.
          {#if sessionId}
            <br />
            <span class="opacity-70">Session ID: {sessionId}</span>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if currentUser}
    <div class="space-y-6">
      <!-- User Info -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Profile Information</h2>
          <p><strong>Name:</strong> {currentUser.name || 'Not set'}</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
          <p><strong>Member Since:</strong> {formatDate(currentUser.createdAt)}</p>
        </div>
      </div>

      <!-- Subscription Status -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Subscription Status</h2>

          {#if (currentUser as any).subscriptionStatus && (currentUser as any).subscriptionStatus !== 'free'}
            <div class="space-y-3">
              <div>
                <span
                  class="badge"
                  class:badge-success={(currentUser as any).subscriptionStatus === 'active'}
                  class:badge-warning={(currentUser as any).subscriptionStatus === 'past_due'}
                  class:badge-error={(currentUser as any).subscriptionStatus === 'cancelled'}
                >
                  {(currentUser as any).subscriptionStatus.toUpperCase()}
                </span>
                <span class="ml-2 font-medium">
                  {(currentUser as any).subscriptionTier?.charAt(0).toUpperCase()}
                  {(currentUser as any).subscriptionTier?.slice(1)} Plan
                </span>
              </div>

              {#if (currentUser as any).subscriptionEndDate}
                <p class="text-sm">
                  Renews: {formatDate((currentUser as any).subscriptionEndDate)}
                </p>
              {/if}

              <!-- Manage Subscription Button -->
              <button
                onclick={handleManageSubscription}
                class="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? 'Loading...' : 'Manage Subscription'}
              </button>
            </div>
          {:else}
            <div>
              <span class="badge badge-neutral">FREE</span>
              <span class="ml-2 text-sm">No active subscription</span>
            </div>
            <a href="/pricing" class="btn btn-primary btn-sm mt-2">
              Upgrade to Pro
            </a>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      <div class="skeleton h-32 w-full"></div>
      <div class="skeleton h-32 w-full"></div>
    </div>
  {/if}
</section>
```

### Pricing Page Integration

Update pricing page to show current plan and disable current tier button:

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
  // Get current tier from Better Auth session (via customSession plugin)
  const currentTier = $derived((currentUser as any)?.subscriptionTier || 'free');

  async function handleCheckout(priceId: string, tier: string) {
    if (isLoading) return;

    isLoading = true;
    try {
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
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
      isLoading = false;
    }
  }
</script>

<section class="container mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold mb-4">Pricing Plans</h1>

  <div class="grid gap-8 md:grid-cols-3">
    <!-- Starter Tier -->
    <div
      class="p-6 border rounded-lg"
      class:border-green-500={currentTier === 'starter'}
      class:border-2={currentTier === 'starter'}
    >
      {#if currentTier === 'starter'}
        <div class="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
          CURRENT PLAN
        </div>
      {/if}

      <h2 class="text-2xl font-semibold mb-3">Starter</h2>
      <p class="text-3xl font-bold mb-4">$9<span class="text-lg font-normal">/month</span></p>

      <ul class="space-y-2 mb-6">
        <li>Basic features</li>
        <li>Up to 10 users</li>
        <li>Email support</li>
      </ul>

      <button
        onclick={() => handleCheckout(PRICE_IDS.starter, 'starter')}
        disabled={isLoading || currentTier === 'starter'}
        class="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if currentTier === 'starter'}
          Current Plan
        {:else if isLoading}
          Loading...
        {:else}
          Choose Starter
        {/if}
      </button>
    </div>

    <!-- Pro Tier (Popular) -->
    <div
      class="p-6 border-2 rounded-lg"
      class:border-green-500={currentTier === 'pro'}
      class:border-blue-600={currentTier !== 'pro'}
    >
      {#if currentTier === 'pro'}
        <div class="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
          CURRENT PLAN
        </div>
      {:else}
        <div class="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
          POPULAR
        </div>
      {/if}

      <h2 class="text-2xl font-semibold mb-3">Professional</h2>
      <p class="text-3xl font-bold mb-4">$29<span class="text-lg font-normal">/month</span></p>

      <ul class="space-y-2 mb-6">
        <li>All Starter features</li>
        <li>Unlimited users</li>
        <li>Priority support</li>
      </ul>

      <button
        onclick={() => handleCheckout(PRICE_IDS.pro, 'pro')}
        disabled={isLoading || currentTier === 'pro'}
        class="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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

    <!-- Enterprise Tier -->
    <div
      class="p-6 border rounded-lg"
      class:border-green-500={currentTier === 'enterprise'}
      class:border-2={currentTier === 'enterprise'}
    >
      {#if currentTier === 'enterprise'}
        <div class="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
          CURRENT PLAN
        </div>
      {/if}

      <h2 class="text-2xl font-semibold mb-3">Enterprise</h2>
      <p class="text-3xl font-bold mb-4">Custom</p>

      <ul class="space-y-2 mb-6">
        <li>All Professional features</li>
        <li>Custom integrations</li>
        <li>Dedicated support</li>
      </ul>

      <button
        onclick={() => handleCheckout(PRICE_IDS.enterprise, 'enterprise')}
        disabled={isLoading || currentTier === 'enterprise'}
        class="w-full btn btn-gray disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if currentTier === 'enterprise'}
          Current Plan
        {:else if isLoading}
          Loading...
        {:else}
          Contact Sales
        {/if}
      </button>
    </div>
  </div>
</section>
```

### Key Implementation Points

1. **Client-Side Redirects**: Both checkout and portal use JSON + `window.location.href` pattern
2. **Loading States**: Prevent double-clicks, only reset on error
3. **Better Auth Integration**: Use `customSession` plugin to get Stripe fields in session
4. **Current Plan Display**: Show "CURRENT PLAN" badge and disable button for active tier
5. **Error Handling**: User-friendly error messages with alerts
6. **Success Feedback**: Show confirmation message after successful checkout

### Testing Checklist

- [ ] Customer Portal link works for users with subscriptions
- [ ] Portal returns to account page correctly
- [ ] Current plan badge shows correctly on pricing page
- [ ] Current plan button is disabled
- [ ] Subscription status shows correctly on account page
- [ ] "Manage Subscription" button redirects to Stripe Portal
- [ ] Success message appears after checkout completion
- [ ] Free users see "Upgrade to Pro" link
- [ ] Loading states prevent double-clicks
- [ ] Error messages display for failed operations