# TC02-Google-Analytics-Hotjar-Setup.md

## Overview
Configure Google Analytics 4 (GA4) and Hotjar (now part of Contentsquare) tracking through Google Tag Manager to analyze user behavior, measure conversion funnels, and optimize user experience through session recordings and heatmaps.

**Feature Type**: Technical Integration

**Business Value**: Provides comprehensive user behavior insights through GA4's quantitative analytics and Hotjar's qualitative user session data, enabling data-driven product and marketing decisions without requiring code deployments for tracking changes.

**Integration Context**: This feature configures tracking scripts through the GTM container from TC01-Google-Tag-Manager-Setup.md. For non-US users (all locales except `en`), these tags are controlled by GDPR consent preferences (TC03-GDPR-Consent-Manager.md) and only fire when appropriate consent is granted.

**Note on Hotjar/Contentsquare**: Hotjar was acquired by Contentsquare and has fully merged. When you create a Hotjar account, you'll be redirected to Contentsquare's platform. The tracking implementation remains the same (using Hotjar script and cookies), but account management and dashboards are now on Contentsquare's platform.

## Requirements

### Service Details

**Google Analytics 4 (GA4)**
- **Property Type**: GA4 property (not Universal Analytics)
- **Data Stream**: Web data stream for SPA tracking
- **Measurement ID**: Format GA4-XXXXXXXXXX
- **Data Retention**: 14 months (configurable)
- **Enhanced Measurement**: Auto-enabled for scroll, outbound clicks, site search

**Hotjar (now Contentsquare)**
- **Site Type**: Web application
- **Site ID**: Numeric identifier from Contentsquare/Hotjar dashboard
- **Tracking Code**: Loaded via GTM custom HTML tag (still uses Hotjar script)
- **Features**: Session recordings, heatmaps, surveys, feedback widgets
- **Data Retention**: Based on plan (typically 365 days)
- **Platform**: Managed through Contentsquare dashboard (contentsquare.com/hotjar)

### Functional Requirements

**FR-1: GA4 Property Setup**
- Create GA4 property with appropriate settings
- Configure web data stream for application domain
- Enable enhanced measurement features
- Set up user properties for subscription tier tracking
- Configure conversion events (signup, subscription purchase)

**FR-2: GA4 Tag Configuration in GTM**
- Add GA4 Configuration tag with measurement ID
- Configure page view tracking for SPA navigation
- Set up custom dimensions for user attributes
- Enable ecommerce tracking for subscription events
- Configure consent mode for GDPR compliance (non-US users)

**FR-3: Hotjar Site Setup**
- Create Hotjar site for application domain
- Configure recording settings and triggers
- Set up feedback widgets and surveys
- Define heatmap pages and funnels
- Configure user attributes for segmentation

**FR-4: Hotjar Tag Configuration in GTM**
- Add Hotjar tracking code as custom HTML tag
- Configure tag firing rules based on consent (for non-US users)
- Set up Hotjar user identification with hashed IDs
- Enable recording for specific user segments
- Configure sampling rates for recordings

**FR-5: Event Tracking**
- Track key user actions (signup, login, subscription)
- Monitor subscription funnel steps
- Track feature usage events
- Monitor payment provider selection (Stripe vs LemonSqueezy)
- Track language/locale changes

### Data Requirements

**DR-1: GA4 Custom Dimensions**
- User properties: subscriptionTier, locale, paymentProvider
- Event parameters: tier, priceId, provider
- Custom dimensions for user segmentation
- User ID for cross-device tracking (hashed)

**DR-2: Hotjar User Attributes**
- User ID (hashed for privacy)
- Subscription tier
- User locale
- Account age
- Payment provider used

**DR-3: Ecommerce Data Structure**
```javascript
{
  transaction_id: 'T123',
  value: 29.99,
  currency: 'USD',
  items: [{
    item_id: 'pro_monthly',
    item_name: 'Professional Plan',
    item_category: 'subscription',
    price: 29.99,
    quantity: 1
  }]
}
```

### Security Considerations

**SC-1: Privacy Protection**
- Never send PII (email, name, address) to analytics
- Hash or anonymize user identifiers
- Respect user consent preferences (GDPR for non-US)
- Enable IP anonymization in GA4
- Configure data retention limits

**SC-2: Hotjar Privacy**
- Exclude sensitive form fields from recordings
- Enable user session anonymization
- Configure suppression lists for PII
- Respect Do Not Track headers
- Disable recording on checkout/payment pages

**SC-3: Content Security Policy**
- Add GA4 and Hotjar domains to CSP
- Allow connections to analytics.google.com
- Allow scripts from static.hotjar.com
- Allow connections to *.hotjar.com and *.hotjar.io

### Performance Requirements

**PR-1: Load Time Impact**
- GA4 tag loads asynchronously via GTM
- Hotjar script loads after page interactive
- Total analytics scripts < 100KB combined
- No render-blocking from tracking scripts

**PR-2: Data Collection Efficiency**
- Batch GA4 events to reduce requests
- Sample Hotjar recordings (e.g., 10% of sessions)
- Limit Hotjar recording length to reduce data
- Use GA4 session-scoped events for efficiency

## Implementation

### Part 1: Google Analytics 4 Setup

#### GA4 Property Creation

1. **Create GA4 Property**
   - Go to analytics.google.com
   - Click "Admin" → "Create Property"
   - Enter property name (e.g., "My SaaS App")
   - Set timezone and currency
   - Click "Create"

2. **Configure Data Stream**
   - Click "Data Streams" → "Add stream" → "Web"
   - Enter website URL (e.g., https://myapp.com)
   - Enter stream name (e.g., "Web Stream")
   - Enable enhanced measurement
   - Click "Create stream"
   - Copy Measurement ID (G-XXXXXXXXXX)

3. **Enhanced Measurement Settings**
   - Enable: Page views, Scrolls, Outbound clicks, Site search
   - Configure: File downloads, Video engagement (if applicable)
   - Disable: Form interactions (for privacy)

4. **Custom Definitions**
   - Navigate to "Custom Definitions"
   - Create user property: "subscription_tier"
   - Create user property: "user_locale"
   - Create user property: "payment_provider"
   - Create event parameter: "tier"
   - Create event parameter: "provider"

#### GA4 Tag Configuration in GTM

1. **Add GA4 Configuration Tag**
   - Go to GTM → Tags → New
   - Tag Configuration → Google Analytics: GA4 Configuration
   - Measurement ID: Enter your G-XXXXXXXXXX
   - Tag name: "GA4 - Configuration"

2. **Configure Fields to Set**
   ```
   Field Name: user_id
   Value: {{var - User ID Hash}}

   Field Name: user_properties
   Value: {
     subscription_tier: {{var - Subscription Tier}},
     user_locale: {{var - User Locale}},
     payment_provider: {{var - Payment Provider}}
   }
   ```

3. **Configure Consent Settings** (for TC03 integration)
   - Go to Advanced Settings → Consent Settings
   - Built-in Consent Checks:
     - Require consent for tag: analytics_storage
     - Do not fire tag if consent missing
   - Note: This ensures GA4 respects GDPR consent for non-US users

4. **Trigger Configuration** (Initial Setup)
   - Trigger Type: Initialization - All Pages
   - This tag fires on every page load
   - Save tag
   - **⚠️ Note**: In **TC03**, you'll change this trigger to `klaro-google-analytics-accepted` (Custom Event) to integrate with Klaro consent management for non-US users

5. **Add Page View Tag**
   - Go to GTM → Tags → New
   - Tag Configuration → Google Analytics: GA4 Event
   - Configuration Tag: Select "GA4 - Configuration"
   - Event Name: page_view
   - Tag name: "GA4 - Page View"
   - Trigger: Page View - All Pages
   - Save tag

#### GA4 Variables in GTM

Create the following variables in GTM for GA4 tracking:

1. **User ID Hash Variable**
   - Variable Type: Custom JavaScript
   - Variable Name: "var - User ID Hash"
   ```javascript
   function() {
     // Get user ID from dataLayer or Better Auth
     var userId = {{var - User ID}};
     if (!userId) return undefined;

     // Simple hash function (use better hashing in production)
     return 'user_' + btoa(userId).substring(0, 16);
   }
   ```

2. **Subscription Tier Variable**
   - Variable Type: Data Layer Variable
   - Variable Name: "var - Subscription Tier"
   - Data Layer Variable Name: `user.subscriptionTier`
   - Default Value: `free`

3. **User Locale Variable**
   - Variable Type: JavaScript Variable
   - Variable Name: "var - User Locale"
   - Global Variable Name: `document.documentElement.lang`
   - Or read from dataLayer if you push locale info

4. **Payment Provider Variable**
   - Variable Type: Custom JavaScript
   - Variable Name: "var - Payment Provider"
   ```javascript
   function() {
     var locale = {{var - User Locale}};
     return locale === 'en' ? 'stripe' : 'lemonsqueezy';
   }
   ```

### Part 2: Hotjar Setup

#### Hotjar/Contentsquare Site Creation

1. **Create Account**
   - Go to hotjar.com
   - Sign up for account (free plan available)
   - **Note**: You'll be automatically redirected to Contentsquare's platform (contentsquare.com/hotjar)
   - Complete account setup through Contentsquare
   - Verify email address

2. **Add Site**
   - In Contentsquare dashboard, navigate to Hotjar section
   - Click "Add site" or "New site"
   - Enter site URL (e.g., https://myapp.com)
   - Select site type: "Web app"
   - Click "Add site"
   - Copy Site ID (numeric, e.g., 1234567)
   - **Note**: The tracking code still uses Hotjar script (static.hotjar.com), not Contentsquare

3. **Configure Recording Settings**
   - In Contentsquare dashboard, navigate to Hotjar → Recordings → Settings
   - Set sampling rate (e.g., 10%)
   - Enable recording for specific pages
   - Set maximum recording length (e.g., 10 minutes)
   - Configure data masking for sensitive fields

4. **Set Up Data Masking**
   - Go to Hotjar Settings → Privacy & Data
   - Add CSS selectors for sensitive fields:
     ```
     input[type="password"]
     input[type="email"]
     .sensitive-data
     [data-sensitive]
     ```
   - Enable automatic form field masking
   - Test masking with preview
   - **Note**: Privacy settings are critical for GDPR compliance

5. **Configure Feedback Widgets** (Optional)
   - Go to Hotjar → Feedback → Create widget
   - Choose widget type (e.g., feedback button)
   - Configure trigger conditions
   - Customize appearance
   - Save widget

#### Hotjar Tag Configuration in GTM

1. **Add Hotjar Custom HTML Tag**
   - Go to GTM → Tags → New
   - Tag Configuration → Custom HTML
   - Tag name: "Hotjar - Tracking Code"

2. **HTML Content**
   ```html
   <script>
     (function(h,o,t,j,a,r){
       h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
       h._hjSettings={hjid:{{Constant - Hotjar Site ID}},hjsv:6};
       a=o.getElementsByTagName('head')[0];
       r=o.createElement('script');r.async=1;
       r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
       a.appendChild(r);
     })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
   </script>
   ```

3. **Create Hotjar Site ID Constant**
   - Go to GTM → Variables → New
   - Variable Type: Constant
   - Variable Name: "Constant - Hotjar Site ID"
   - Value: Your Hotjar site ID (e.g., 1234567)
   - Save variable

4. **Configure Consent Settings** (for TC03 integration)
   - Go to Advanced Settings → Consent Settings
   - Require consent for tag: analytics_storage, functionality_storage
   - Do not fire tag if consent missing
   - Note: This ensures Hotjar respects GDPR consent for non-US users

5. **Trigger Configuration** (Initial Setup)
   - Trigger Type: Page View - DOM Ready
   - This ensures Hotjar loads after page is interactive
   - Save tag
   - **⚠️ Note**: In **TC03**, you'll change this trigger to `klaro-hotjar-accepted` (Custom Event) to integrate with Klaro consent management for non-US users

6. **Add Hotjar User Identification**
   - Go to GTM → Tags → New
   - Tag Configuration → Custom HTML
   - Tag name: "Hotjar - User Identification"
   - HTML Content:
   ```html
   <script>
     if (window.hj) {
       var userId = {{var - User ID Hash}};
       var attributes = {
         subscription_tier: {{var - Subscription Tier}},
         locale: {{var - User Locale}},
         payment_provider: {{var - Payment Provider}}
       };

       if (userId) {
         hj('identify', userId, attributes);
       }
     }
   </script>
   ```
   - Trigger: Custom Event → `user_authenticated`
   - Save tag

### Part 3: Event Tracking Implementation

#### Update Utility Functions

```typescript
// src/lib/utils/tracking.ts (extend from TC01)

/**
 * Track subscription purchase
 */
export function trackSubscriptionPurchase(
  tier: string,
  value: number,
  currency: string,
  provider: 'stripe' | 'lemonsqueezy'
): void {
  pushToDataLayer({
    event: 'purchase',
    tier,
    provider,
    ecommerce: {
      transaction_id: `sub_${Date.now()}`,
      value,
      currency,
      items: [{
        item_id: `${tier}_monthly`,
        item_name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
        item_category: 'subscription',
        price: value,
        quantity: 1
      }]
    }
  });
}

/**
 * Track user signup
 */
export function trackSignup(provider: 'email' | 'google' | 'github'): void {
  pushToDataLayer({
    event: 'sign_up',
    method: provider
  });
}

/**
 * Track user login
 */
export function trackLogin(provider: 'email' | 'google' | 'github'): void {
  pushToDataLayer({
    event: 'login',
    method: provider
  });
}

/**
 * Track subscription tier change
 */
export function trackTierChange(fromTier: string, toTier: string): void {
  pushToDataLayer({
    event: 'tier_change',
    from_tier: fromTier,
    to_tier: toTier
  });
}

/**
 * Identify user for tracking (pushes to dataLayer for Hotjar)
 */
export function identifyUser(
  userId: string,
  subscriptionTier: string,
  locale: string
): void {
  // Hash user ID for privacy
  const hashedUserId = `user_${btoa(userId).substring(0, 16)}`;

  pushToDataLayer({
    event: 'user_authenticated',
    user: {
      id: hashedUserId,
      subscriptionTier,
      locale,
      paymentProvider: locale === 'en' ? 'stripe' : 'lemonsqueezy'
    }
  });
}
```

#### Integration in Application

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { authClient } from '$lib/auth-client';
  import { languageTag } from '$lib/paraglide/runtime';
  import { identifyUser } from '$lib/utils/tracking';

  let sessionData = authClient.useSession();
  const currentUser = $derived($sessionData?.data?.user);

  // Identify user when logged in
  $effect(() => {
    if (currentUser) {
      const tier = (currentUser as any)?.subscriptionTier || 'free';
      const locale = languageTag();

      identifyUser(currentUser.id, tier, locale);
    }
  });

  // Your existing layout code...
</script>
```

```typescript
// Example: Track subscription purchase in checkout success
// src/routes/account/+page.svelte

import { trackSubscriptionPurchase } from '$lib/utils/tracking';
import { languageTag } from '$lib/paraglide/runtime';

// After successful checkout
const success = url.searchParams.get('success');
if (success === 'true') {
  const tier = 'pro'; // Get from checkout session
  const value = 29.99; // Get from checkout session
  const provider = languageTag() === 'en' ? 'stripe' : 'lemonsqueezy';

  trackSubscriptionPurchase(tier, value, 'USD', provider);
}
```

### Content Security Policy Updates

```typescript
// Update CSP from TC01 to include GA4 and Hotjar

const cspDirectives = {
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    'https://*.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://static.hotjar.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://*.google-analytics.com',
    'https://*.googletagmanager.com',
    'https://*.hotjar.com',
  ],
  'connect-src': [
    "'self'",
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
    'https://*.hotjar.com',
    'https://*.hotjar.io',
    'wss://*.hotjar.com', // For live session data
  ],
  'frame-src': [
    'https://*.googletagmanager.com',
    'https://*.hotjar.com',
  ],
  'font-src': [
    "'self'",
    'https://script.hotjar.com',
  ]
};
```

## Testing

### GA4 Verification

1. **Real-time Reports**
   - Go to GA4 → Reports → Realtime
   - Navigate your site
   - Verify events appearing in real-time

2. **Debug View**
   - Install GA4 DebugView Chrome extension
   - Enable debug mode
   - Verify events with correct parameters

3. **GTM Preview Mode**
   - Enable GTM Preview
   - Check GA4 tags firing correctly
   - Verify dataLayer variables populated

### Hotjar Verification

1. **Test Recording**
   - Navigate to Contentsquare dashboard → Hotjar → Recordings
   - Browse your site in another tab
   - Wait 2-3 minutes for processing
   - Verify recording appears in dashboard
   - **Tip**: Use incognito mode to ensure fresh session

2. **Check Data Masking**
   - Enter sensitive data in forms
   - Check recording shows masking (asterisks or blur)
   - Verify no PII visible
   - Test password fields are fully masked

3. **User Identification**
   - Log in to your app
   - In Contentsquare, go to Hotjar → Recordings → Filters
   - Verify user attributes populated (subscription tier, locale, etc.)
   - Check user ID is hashed (not plain text)

## Additional Context

### GA4 vs Universal Analytics

This guide uses GA4 (not deprecated Universal Analytics):
- Event-based model (not session-based)
- Machine learning insights
- Better privacy controls
- Cross-platform tracking
- No need for separate ecommerce plugin

### Hotjar Best Practices

1. **Recording Sampling**
   - Don't record 100% of sessions (expensive)
   - Use 5-20% sampling depending on traffic
   - Focus on specific user segments

2. **Privacy Compliance**
   - Always mask sensitive fields
   - Exclude payment pages from recording
   - Respect consent (especially for non-US users)
   - Configure data retention limits

3. **Performance Optimization**
   - Load Hotjar after page interactive
   - Limit recording length
   - Use conditional triggers
   - Monitor performance impact

### SPA Tracking Considerations

SvelteKit's SPA architecture requires:
- Manual page view tracking on route change
- History change trigger in GTM
- Virtual pageviews for navigation
- Custom event tracking for user actions

## Integration Points

### Prerequisites
- **Required**: TC01-Google-Tag-Manager-Setup.md - GTM container installed
- **Required**: A02-Create-Layout-Component.md - Layout for tracking integration
- Completed PG02-Paraglide-Configure-Langs.md for locale tracking

### Next Steps
- **TC03-GDPR-Consent-Manager.md**: **REQUIRED** - Install Klaro consent manager and update GTM triggers to use Klaro events (`klaro-google-analytics-accepted`, `klaro-hotjar-accepted`) for proper GDPR compliance

### Future Integration
- Track subscription funnel from ST03/LS03 checkout flows
- Monitor conversion rates by payment provider
- Analyze user behavior by locale/language
- Track feature adoption and usage patterns

## Success Criteria

### Initial Setup (TC02)
- [ ] GA4 property created and configured
- [ ] GA4 tag created in GTM with "Initialization - All Pages" trigger
- [ ] Custom dimensions configured for user properties
- [ ] Real-time reports showing data (will see data immediately in this phase)
- [ ] Hotjar site created and configured
- [ ] Hotjar tag created in GTM with "DOM Ready" trigger
- [ ] Hotjar recordings capturing sessions
- [ ] Data masking working for sensitive fields
- [ ] User identification working for both tools
- [ ] Event tracking working for key actions
- [ ] Consent settings configured (ready for TC03)
- [ ] No console errors from tracking scripts
- [ ] Performance impact < 200ms on page load

### After TC03 Integration
- [ ] GTM triggers updated to Klaro events (`klaro-*-accepted`)
- [ ] US users (locale: `en`): Tags fire immediately without consent
- [ ] Non-US users: Tags fire only after Klaro consent given
- [ ] Consent banner appears for non-US users only
