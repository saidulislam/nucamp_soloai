# LS02-Install-LemonSqueezy-SDK.md

## Overview
Install and configure LemonSqueezy Node.js SDK for server-side operations to create checkout URLs and handle webhooks. Since LemonSqueezy uses hosted checkout pages, no client-side SDK is needed, simplifying the integration and reducing bundle size.

**Feature Type**: Technical Integration

**Integration Context**: This SDK installation supports the LemonSqueezy payment provider for non-US users (all locales except `en`). The Stripe SDK (ST02-Install-Stripe-SDK.md) is already installed and serves US users. Both SDKs operate in parallel, with locale-based routing determining which provider handles each checkout request.

## Requirements

### Functional Requirements
- Install LemonSqueezy Node.js SDK for server-side API operations
- Configure SDK with API credentials from LS01-LemonSqueezy-Account.md
- Set up TypeScript support with proper type definitions
- Create checkout URL generation utilities
- Prepare webhook signature verification
- Support test and production environments

### Integration Requirements
- Connect to existing pricing tiers from P02-Pricing-Tiers.md
- Integrate with Better Auth user system for customer identification
- Use environment variables following EV01-Env-File-Setup.md patterns
- Prepare for checkout URL creation in LS03-LemonSqueezy-Checkout-URLs.md
- Enable webhook processing for LS04-LemonSqueezy-Webhooks.md

### Security Requirements
- Store API keys securely in environment variables
- Never expose LemonSqueezy API keys to client-side code
- Validate API credentials during application startup
- Implement secure webhook signature verification
- Log errors without exposing sensitive information

## Technical Specifications

### Dependencies
- `@lemonsqueezy/lemonsqueezy.js` - Official Node.js SDK
- TypeScript type definitions included with SDK
- Existing environment validation system from EV02-Env-Validation.md
- SvelteKit for server-side API routes

### Environment Variables
```bash
LEMONSQUEEZY_API_KEY=test_xxx
LEMONSQUEEZY_STORE_ID=123456  # Optional: Fallback if API call fails
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_xxx
LEMONSQUEEZY_TEST_MODE=true
```

**Note**: The system automatically fetches the first store ID from your LemonSqueezy account. The `LEMONSQUEEZY_STORE_ID` is only used as a fallback if the API call fails.

### API Configuration
- Base URL: https://api.lemonsqueezy.com/v1/
- Authentication: Bearer token using API key
- Content-Type: application/vnd.api+json (JSON:API format)
- Rate limits: Handled automatically by SDK

### Performance Requirements
- SDK initialization under 100ms during startup
- Checkout URL creation within 2 seconds
- No client-side libraries to impact bundle size
- Support 100+ concurrent checkout creations

## Implementation

### SDK Installation
```bash
npm install @lemonsqueezy/lemonsqueezy.js
```

### Server Configuration
```typescript
// src/lib/lemonsqueezy/client.ts
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import { env } from '$env/dynamic/private';

// Initialize LemonSqueezy SDK
export function initLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: env.LEMONSQUEEZY_API_KEY,
    onError: (error) => {
      console.error('LemonSqueezy Error:', error);
    }
  });
}

// Initialize on server startup
initLemonSqueezy();
```

### Checkout URL Creator
```typescript
// src/lib/lemonsqueezy/checkout.ts
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { getStoreId, isTestMode } from './client';
import type { User } from '$lib/types';

export async function createCheckoutUrl(
  variantId: string,
  user: User,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const storeId = await getStoreId(); // Fetches first store from API
    const testMode = isTestMode(); // Use environment variable

    const checkout = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: user.email,
        name: user.name,
        custom: {
          user_id: user.id,
          success_url: successUrl, // Include in custom data
          cancel_url: cancelUrl     // Include in custom data
        }
      },
      checkoutOptions: {
        embed: false,
        media: true,
        logo: true,
        desc: true,
        discount: true,
        dark: false,
        subscriptionPreview: true,
        buttonColor: '#3B82F6'
      },
      expiresAt: undefined,
      preview: false,
      testMode // Use environment variable LEMONSQUEEZY_TEST_MODE
    });

    if (checkout.error) {
      throw new Error(checkout.error.message);
    }

    // Access URL from nested structure: checkout.data.data.attributes.url
    const checkoutUrl = checkout.data?.data?.attributes?.url ||
                        checkout.data?.attributes?.url ||
                        checkout.data?.url;

    if (!checkoutUrl) {
      throw new Error('No checkout URL found in response');
    }

    // Return URL as-is (don't modify signed URL)
    return checkoutUrl;
  } catch (error) {
    console.error('Failed to create checkout:', error);
    throw error;
  }
}
```

**Important Notes:**
- Success/cancel URLs must be in `custom` data, NOT in `checkoutOptions`
- The checkout URL is signed by LemonSqueezy - never modify it after receiving it
- Modifying the URL breaks the signature and causes "Invalid signature" errors
- Handle redirects in your webhook handler using the URLs from `meta.custom_data`

### Webhook Signature Verification
```typescript
// src/lib/lemonsqueezy/webhooks.ts
import crypto from 'crypto';
import { env } from '$env/dynamic/private';

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### Environment Validation
```typescript
// Extend src/lib/env.ts
const requiredEnvVars = [
  'LEMONSQUEEZY_API_KEY',
  'LEMONSQUEEZY_WEBHOOK_SECRET'
];

// Optional: LEMONSQUEEZY_STORE_ID (used as fallback if API call fails)

export function validateLemonSqueezyEnv() {
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate API key format
  if (!process.env.LEMONSQUEEZY_API_KEY?.startsWith('test_') &&
      process.env.LEMONSQUEEZY_TEST_MODE === 'true') {
    console.warn('Using production API key in test mode');
  }

  // Warn if STORE_ID is not set (will use API to fetch)
  if (!process.env.LEMONSQUEEZY_STORE_ID) {
    console.log('LEMONSQUEEZY_STORE_ID not set, will fetch from API');
  }
}
```

## File Structure
- `src/lib/lemonsqueezy/client.ts` - SDK initialization
- `src/lib/lemonsqueezy/checkout.ts` - Checkout URL creation
- `src/lib/lemonsqueezy/webhooks.ts` - Webhook utilities
- `src/lib/lemonsqueezy/types.ts` - TypeScript interfaces

## Error Handling
- SDK initialization failures logged but don't crash app
- Checkout creation errors return user-friendly messages
- Network timeouts handled with retry logic
- Invalid API credentials detected at startup

## Testing Considerations
- Use test mode API keys for development
- Mock SDK responses for unit tests
- Test checkout URL generation with various products
- Verify webhook signature validation

## Additional Context

### Advantages of Hosted Checkout
- **No PCI Compliance**: Payment data never touches your servers
- **Tax Handling**: Automatic tax calculation and display
- **Optimized Conversion**: LemonSqueezy continuously improves checkout
- **Multi-language**: Automatic localization for global customers
- **Payment Methods**: Access to various payment methods globally

### SDK Usage Pattern
Unlike Stripe which requires both client and server SDKs, LemonSqueezy only needs server-side SDK since all payment collection happens on their hosted pages. This simplifies the integration and reduces client-side bundle size.

### Dual Provider Architecture
The application runs both Stripe and LemonSqueezy SDKs simultaneously:
- **Stripe SDK** (from ST02-Install-Stripe-SDK.md): Handles US users (locale: `en`)
- **LemonSqueezy SDK**: Handles non-US users (all other locales)

The pricing page and checkout logic use Paraglide's active locale to determine which provider to use, ensuring seamless payment processing for all users regardless of location.

### Migration Path
For teams migrating from embedded checkout:
1. Remove any client-side LemonSqueezy code
2. Replace embedded forms with checkout URL generation
3. Update success/cancel handling for redirects
4. Simplify error handling since payment errors occur on LemonSqueezy's pages

## Prerequisites
- **Required**: ST02-Install-Stripe-SDK.md - Stripe SDK already installed for US users
- **Required**: PG02-Paraglide-Configure-Langs.md - Locale system for provider selection
- LS01-LemonSqueezy-Account.md - Account setup and API credentials
- EV01-Env-File-Setup.md - Environment variable management
- EV02-Env-Validation.md - Environment validation patterns

## Success Criteria
- SDK installed and initialized successfully
- Checkout URLs can be generated for products
- Webhook signatures can be verified
- Environment variables properly validated
- TypeScript types working correctly
- Error handling prevents application crashes