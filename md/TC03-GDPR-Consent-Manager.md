# TC03-GDPR-Consent-Manager.md

## Overview
Implement GDPR-compliant cookie consent management for non-US users using Klaro consent manager integrated with Google Tag Manager. The consent banner and controls only appear for users with locales other than `en`, as US users are not subject to GDPR requirements.

**Feature Type**: Technical Integration / Legal Compliance

**Business Value**: Ensures legal compliance with GDPR, ePrivacy Directive, and other international privacy regulations while maintaining optimal tracking for US users who don't require consent mechanisms, reducing friction in user onboarding.

**Integration Context**: This feature implements locale-based consent requirements using Klaro (https://klaro.org), an open-source consent management library. US users (locale: `en`) bypass consent requirements and have tracking enabled by default, while non-US users (all other locales) see Klaro's consent banner. Klaro controls GTM tag firing through Google Consent Mode V2 (TC01-TC02).

**Library**: Klaro v0.7+ - Open source, GDPR/ePrivacy compliant, integrates with Google Consent Mode V2

## Requirements

### Legal Context

**GDPR Requirements** (EU users)
- Explicit opt-in consent before non-essential cookies
- Clear information about data collection purposes
- Easy-to-access privacy policy
- Ability to withdraw consent at any time
- Granular consent for different purposes

**ePrivacy Directive** (EU)
- User consent before storing cookies
- Exceptions for strictly necessary cookies only
- Clear cookie information
- Consent valid for 12 months maximum

**Other Jurisdictions**
- CCPA (California): Right to opt-out of sale
- LGPD (Brazil): Similar to GDPR requirements
- UK GDPR: Post-Brexit equivalent to EU GDPR

### Functional Requirements

**FR-1: Locale-Based Consent Detection**
- Detect user locale using Paraglide `languageTag()` function
- US users (locale: `en`): Skip consent, enable all tracking by default
- Non-US users (all other locales): Show consent banner, require explicit consent
- Persist locale-based consent decision across sessions
- Handle locale changes during session

**FR-2: Consent Banner (Non-US Only)**
- Display on first visit or when consent not yet given
- Show clear information about cookie usage
- Provide granular consent options (Analytics, Marketing, Preferences)
- Include links to Privacy Policy and Cookie Policy
- Support keyboard navigation and screen readers
- Display in user's selected language (via Paraglide)

**FR-3: Consent Preferences Storage**
- Store consent preferences in localStorage
- Include timestamp of consent
- Track consent version for policy updates
- Expire consent after 12 months (GDPR requirement)
- Include locale in consent record
- Clear consent on locale change to US

**FR-4: GTM Consent Mode Integration**
- Implement Google Consent Mode v2
- Set default consent state based on locale
- Update consent state when user makes selection
- Control tag firing based on consent state
- Support consent categories: analytics_storage, functionality_storage, ad_storage

**FR-5: Consent Management UI**
- Provide "Cookie Settings" link in footer (non-US only)
- Allow users to review and change consent
- Show current consent status
- Provide "Accept All" and "Reject All" options
- Support granular category management

**FR-6: Tracking Script Control**
- Block GA4 tag firing without analytics consent
- Block Hotjar tag firing without analytics + functionality consent
- Load scripts only after consent granted
- Retroactively clear cookies if consent withdrawn
- Respect consent changes immediately

### Technical Specifications

#### Dependencies
- **Klaro**: `npm install klaro` (v0.7+)
- GTM container from TC01-Google-Tag-Manager-Setup.md
- GA4 and Hotjar tags from TC02-Google-Analytics-Hotjar-Setup.md
- Paraglide locale system from PG02-Paraglide-Configure-Langs.md
- SvelteKit layout system from A02-Create-Layout-Component.md

#### Consent Categories

```typescript
interface ConsentCategories {
  necessary: boolean;      // Always true (required for site function)
  analytics: boolean;      // GA4, Hotjar
  marketing: boolean;      // Future: Marketing pixels, ads
  preferences: boolean;    // User preferences, language settings
}

interface ConsentState {
  categories: ConsentCategories;
  timestamp: number;
  version: string;
  locale: string;
  expiresAt: number;
}
```

#### Data Storage

```typescript
// localStorage key
const CONSENT_KEY = 'user_consent_preferences';

// Consent object structure
{
  categories: {
    necessary: true,      // Always true
    analytics: false,     // Requires consent for non-US
    marketing: false,     // Requires consent for non-US
    preferences: true     // Generally allowed
  },
  timestamp: 1234567890000,
  version: '1.0',
  locale: 'fr',
  expiresAt: 1234567890000 + (365 * 24 * 60 * 60 * 1000) // 1 year
}
```

### Security Considerations

**SC-1: Data Privacy**
- Never store PII in consent record
- Don't use consent mechanism for user tracking
- Respect Do Not Track browser settings
- Clear tracking cookies when consent withdrawn

**SC-2: Cookie Security**
- Use secure cookies for consent storage
- Set appropriate SameSite attributes
- Implement CSRF protection
- Validate consent data before processing

**SC-3: Compliance**
- Log consent actions for audit trail
- Support data subject access requests
- Provide mechanism for consent withdrawal
- Document consent mechanism for regulators

### Performance Requirements

**PR-1: Banner Load Time**
- Consent banner loads within 200ms
- Does not block page rendering
- Minimal impact on First Contentful Paint
- Lazy load consent UI components

**PR-2: Consent Processing**
- Consent decision processed within 50ms
- GTM consent mode updated immediately
- localStorage operations complete within 10ms
- No page reload required for consent changes

## Implementation

### Part 1: Install Klaro

```bash
npm install klaro
```

### Part 2: Klaro Configuration with Locale Detection

Create Klaro configuration that integrates with Google Consent Mode V2 and respects user locale:

```typescript
// src/lib/config/klaro-config.ts

import type { KlaroConfig } from 'klaro';
import { languageTag } from '$lib/paraglide/runtime';

/**
 * Check if user is from US (doesn't need consent)
 */
export function isUSUser(): boolean {
  if (typeof window === 'undefined') return false;
  return languageTag() === 'en';
}

/**
 * Klaro configuration for GDPR consent management
 * Integrates with Google Consent Mode V2 and GTM
 */
export function getKlaroConfig(): KlaroConfig {
  return {
    // Consent expires after 365 days (GDPR requirement)
    cookieExpiresAfterDays: 365,

    // Version number - increment when making changes
    version: 1,

    // Element ID where Klaro will mount
    elementID: 'klaro',

    // Storage method
    storageMethod: 'localStorage',
    storageName: 'klaro-consent',

    // Don't show consent notice on first page load for US users
    mustConsent: !isUSUser(),

    // Allow users to accept all with one click
    acceptAll: true,

    // Hide decline button (optional - some prefer "Reject All")
    hideDeclineAll: false,

    // Hide learn more link
    hideLearnMore: false,

    // Notice will be shown as a modal
    noticeAsModal: false,

    // Translations
    translations: {
      en: {
        consentNotice: {
          title: '🍪 We value your privacy',
          description: 'We use cookies and similar technologies to improve your experience, analyze site traffic, and personalize content. You can choose which categories of cookies to accept.',
          learnMore: 'Learn more',
        },
        consentModal: {
          title: 'Cookie Preferences',
          description: 'Here you can see and customize the information we collect about you.',
        },
        purposes: {
          analytics: 'Analytics',
          marketing: 'Marketing',
          functional: 'Functional',
        },
        ok: 'Accept Selected',
        acceptAll: 'Accept All',
        acceptSelected: 'Accept Selected',
        decline: 'Reject All',
        close: 'Close',
        save: 'Save',
        poweredBy: 'Powered by Klaro',
      },
      // Add more languages as needed (fr, es, de, etc.)
      fr: {
        consentNotice: {
          title: '🍪 Nous respectons votre vie privée',
          description: 'Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.',
          learnMore: 'En savoir plus',
        },
        // ... more translations
      },
    },

    // Services configuration
    services: [
      {
        // Google Tag Manager - Required service that loads first
        name: 'google-tag-manager',
        title: 'Google Tag Manager',
        purposes: ['functional'],
        required: true, // Always enabled
        default: true,

        // Initialize Google Consent Mode V2
        onInit: function() {
          window.dataLayer = window.dataLayer || [];
          window.gtag = function() {
            window.dataLayer.push(arguments);
          };

          // Set default consent state (all denied for non-US users)
          if (!isUSUser()) {
            window.gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              functionality_storage: 'denied',
              personalization_storage: 'denied',
              security_storage: 'granted',
              wait_for_update: 2000,
            });
          } else {
            // US users: all granted by default
            window.gtag('consent', 'default', {
              ad_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted',
              analytics_storage: 'granted',
              functionality_storage: 'granted',
              personalization_storage: 'granted',
              security_storage: 'granted',
            });
          }
        },

        // No cookies set directly by GTM
        cookies: [],
      },
      {
        // Google Analytics 4
        name: 'google-analytics',
        title: 'Google Analytics',
        description: 'We use Google Analytics to understand how visitors interact with our website by collecting and reporting information anonymously.',
        purposes: ['analytics'],
        required: false,
        default: isUSUser(), // Default enabled for US users

        // Update consent when user accepts
        onAccept: function() {
          window.gtag('consent', 'update', {
            analytics_storage: 'granted',
          });
        },

        // Update consent when user declines
        onDecline: function() {
          window.gtag('consent', 'update', {
            analytics_storage: 'denied',
          });
        },

        // GA4 cookies
        cookies: [
          /^_ga(_.*)?$/,  // Matches _ga, _gid, _gat, etc.
        ],
      },
      {
        // Hotjar (now part of Contentsquare)
        name: 'hotjar',
        title: 'Hotjar (Contentsquare)',
        description: 'Hotjar (now part of Contentsquare) helps us understand user behavior through session recordings and heatmaps to improve your experience.',
        purposes: ['analytics', 'functional'],
        required: false,
        default: isUSUser(), // Default enabled for US users

        onAccept: function() {
          window.gtag('consent', 'update', {
            functionality_storage: 'granted',
          });
        },

        onDecline: function() {
          window.gtag('consent', 'update', {
            functionality_storage: 'denied',
          });
        },

        // Hotjar cookies (still uses Hotjar cookie names despite Contentsquare merger)
        cookies: [
          /^_hj/,  // Matches _hjid, _hjSessionUser_, _hjSession_, etc.
        ],
      },
      // Add more services as needed (Facebook Pixel, etc.)
    ],
  };
}
```

### Part 3: Update GTM Script to be Controlled by Klaro

Modify the GTM component from TC01 to be controlled by Klaro:

```svelte
<!-- src/lib/components/tracking/GoogleTagManager.svelte -->
<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { isUSUser } from '$lib/config/klaro-config';

  interface Props {
    containerId: string;
    enabled?: boolean;
  }

  let { containerId, enabled = true }: Props = $props();

  const isValidContainerId = $derived(
    /^GTM-[A-Z0-9]+$/.test(containerId)
  );

  onMount(() => {
    if (!browser || !enabled || !isValidContainerId) {
      console.warn('GTM not loaded:', { browser, enabled, isValidContainerId });
      return;
    }

    // For US users, load GTM directly without Klaro control
    if (isUSUser()) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
      document.head.appendChild(script);

      console.log('GTM initialized (US user):', containerId);
    } else {
      // For non-US users, GTM will be controlled by Klaro
      // Add GTM script with Klaro data attributes
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;

      // CRITICAL: These attributes let Klaro control the script
      script.setAttribute('type', 'text/plain');
      script.setAttribute('data-type', 'application/javascript');
      script.setAttribute('data-name', 'google-tag-manager');

      document.head.appendChild(script);

      console.log('GTM configured for Klaro control (non-US user):', containerId);
    }
  });
</script>

<!-- GTM Noscript Fallback -->
{#if browser && enabled && isValidContainerId}
  <noscript>
    <iframe
      src="https://www.googletagmanager.com/ns.html?id={containerId}"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
      title="Google Tag Manager"
    ></iframe>
  </noscript>
{/if}
```

### Part 4: Initialize Klaro in Layout

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import * as Klaro from 'klaro';
  import { getKlaroConfig, isUSUser } from '$lib/config/klaro-config';
  import { languageTag } from '$lib/paraglide/runtime';
  import GoogleTagManager from '$lib/components/tracking/GoogleTagManager.svelte';
  import { env } from '$env/dynamic/public';

  // Import Klaro CSS
  import 'klaro/dist/klaro.css';

  const gtmId = env.PUBLIC_GTM_ID || '';
  const gtmEnabled = env.PUBLIC_GTM_ENABLED === 'true';

  // Initialize Klaro
  onMount(() => {
    if (!browser || !gtmEnabled) return;

    // Get config with current locale
    const config = getKlaroConfig();

    // Set language based on Paraglide locale
    const locale = languageTag();
    config.lang = locale;

    // For non-US users, show Klaro
    if (!isUSUser()) {
      // Initialize Klaro
      Klaro.setup(config);

      console.log('Klaro initialized for non-US user');
    } else {
      console.log('Klaro skipped for US user - all tracking enabled');
    }
  });

  // Monitor locale changes
  $effect(() => {
    if (browser && gtmEnabled) {
      const locale = languageTag();

      // If locale changed, reinitialize Klaro with new settings
      const config = getKlaroConfig();
      config.lang = locale;

      // Reset consent if switching to/from US
      if (!isUSUser()) {
        // Render Klaro for non-US
        Klaro.setup(config);
      }
    }
  });

  // Your existing layout code...
</script>

<!-- GTM Component -->
<GoogleTagManager containerId={gtmId} enabled={gtmEnabled} />

<!-- Klaro will automatically render its UI for non-US users -->

<!-- Rest of your layout -->
<slot />

<!-- Footer with cookie settings button -->
<footer>
  <!-- Your existing footer content -->

  <!-- Cookie Settings Button (only for non-US users) -->
  {#if !isUSUser()}
    <button
      class="cookie-settings-link"
      onclick={() => Klaro.show()}
      type="button"
    >
      🍪 Cookie Settings
    </button>
  {/if}
</footer>

<style>
  .cookie-settings-link {
    background: none;
    border: none;
    color: var(--color-text-secondary, #666);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0;
  }

  .cookie-settings-link:hover {
    color: var(--color-primary, #3b82f6);
  }
</style>
```

### Part 5: Configure GTM Triggers for Klaro Events

In Google Tag Manager, create triggers that listen for Klaro consent events:

#### 1. Create Google Analytics Trigger

- Go to GTM → Triggers → New
- Trigger Configuration → Custom Event
- Event name: `klaro-google-analytics-accepted`
- Trigger name: "Klaro - Google Analytics Accepted"
- This trigger fires when user accepts Google Analytics

#### 2. Create Hotjar Trigger

- Go to GTM → Triggers → New
- Trigger Configuration → Custom Event
- Event name: `klaro-hotjar-accepted`
- Trigger name: "Klaro - Hotjar Accepted"
- This trigger fires when user accepts Hotjar

#### 3. Update GA4 Tag

- Go to your GA4 Configuration tag (from TC02)
- Change Triggering from "All Pages" to "Klaro - Google Analytics Accepted"
- Go to Advanced Settings → Consent Settings
- Built-in Consent Checks:
  - Require: `analytics_storage`
- Save tag

#### 4. Update Hotjar Tag

- Go to your Hotjar tag (from TC02)
- Change Triggering to "Klaro - Hotjar Accepted"
- Go to Advanced Settings → Consent Settings
- Built-in Consent Checks:
  - Require: `analytics_storage`, `functionality_storage`
- Save tag

**Important**: The GTM tags will now only fire when:
1. User accepts the service in Klaro (fires klaro-*-accepted event)
2. Google Consent Mode grants the required consent types
3. This dual-gate ensures proper consent compliance

## Testing

### Consent Flow Testing

#### 1. US User Testing (locale: `en`)

```bash
# Steps:
1. Set browser/app locale to 'en'
2. Reload application
3. Verify:
   - NO Klaro banner appears
   - GTM loads immediately
   - Check browser console: "GTM initialized (US user)"
   - Check browser console: "Klaro skipped for US user"
4. Open GTM Preview mode
5. Verify:
   - consent_default event with all consent granted
   - GA4 tags fire immediately
   - Hotjar tags fire immediately
6. Check cookies:
   - _ga* cookies present
   - _hj* cookies present
```

#### 2. Non-US User Testing (other locales)

```bash
# Steps:
1. Set browser/app locale to 'fr', 'es', or any non-en locale
2. Reload application
3. Verify:
   - Klaro banner appears at bottom of page
   - GTM script present but blocked (type="text/plain")
   - Check browser console: "GTM configured for Klaro control"
   - Check browser console: "Klaro initialized for non-US user"
4. Click "Reject All"
5. Verify:
   - Banner closes
   - NO _ga* cookies
   - NO _hj* cookies
   - consent_default event with all consent denied
6. Reload, click "Cookie Settings" in footer
7. Click "Accept All"
8. Verify:
   - GTM loads (script changes to type="application/javascript")
   - klaro-google-analytics-accepted event fires
   - klaro-hotjar-accepted event fires
   - consent_update events with consent granted
   - _ga* and _hj* cookies appear
```

#### 3. Consent Persistence Testing

```bash
# Steps:
1. As non-US user, accept consent
2. Reload page
3. Verify:
   - NO banner appears
   - Tracking loads immediately
   - localStorage has 'klaro' key with consents
4. Check localStorage:
   - localStorage.getItem('klaro')
   - Should show accepted services
5. Clear localStorage
6. Reload → verify banner reappears
```

#### 4. Locale Change Testing

```bash
# Test switching locales:
1. Start as 'fr' user, accept consent
2. Switch to 'en' locale
3. Verify:
   - Consent cleared (Klaro config has mustConsent: false)
   - All tracking enabled
4. Switch back to 'fr'
5. Verify:
   - Klaro reinitializes
   - Consent must be given again (due to locale change)
```

### GTM Preview Mode Testing

1. **Enable GTM Preview**
   - Go to GTM → Preview
   - Enter your app URL
   - GTM Tag Assistant opens

2. **Test as US User** (locale: `en`)
   - Tag Assistant shows:
     - GA4 Configuration tag fires on "Initialization"
     - Hotjar tag fires on "DOM Ready"
     - All consent granted immediately

3. **Test as Non-US User** (locale: `fr`)
   - Initially (no consent):
     - Tags BLOCKED (waiting for consent)
     - dataLayer shows consent_default with all denied
   - After accepting in Klaro:
     - klaro-google-analytics-accepted event fires
     - klaro-hotjar-accepted event fires
     - GA4 and Hotjar tags fire
     - consent_update with consent granted

### Browser DevTools Testing

1. **Network Tab**
   - Non-US user, no consent: NO requests to google-analytics.com or hotjar.com
   - Non-US user, consent given: Requests to analytics and hotjar
   - US user: Immediate requests

2. **Application Tab → Cookies**
   - Check _ga, _gid, _gat cookies (GA4)
   - Check _hjid, _hjSessionUser cookies (Hotjar)
   - Verify cookies only appear with consent (or for US users)

3. **Console Messages**
   - Look for Klaro initialization messages
   - Look for GTM loading messages
   - Check for any errors

## Additional Context

### Why Klaro?

**Klaro Benefits**:
- ✅ Open source (MIT license) - no vendor lock-in
- ✅ Lightweight (~20KB gzipped)
- ✅ Google Consent Mode V2 integration
- ✅ Multi-language support
- ✅ Accessible (WCAG compliant)
- ✅ Customizable UI/styling
- ✅ No external dependencies
- ✅ Active maintenance and community

**vs. Alternatives**:
- **Cookiebot**: More features, but expensive ($9-299/mo)
- **OneTrust**: Enterprise-grade, overkill for most apps
- **Custom Solution**: Full control, but requires legal review

### How Klaro Controls GTM

Klaro uses the HTML5 `type` attribute trick:

```html
<!-- Before consent (Klaro blocks) -->
<script type="text/plain" data-type="application/javascript" data-name="google-tag-manager">
  // GTM code doesn't execute
</script>

<!-- After consent (Klaro enables) -->
<script type="application/javascript">
  // GTM code executes
</script>
```

When user accepts, Klaro:
1. Changes `type="text/plain"` to `type="application/javascript"`
2. Re-executes the script
3. Fires custom event `klaro-[service-name]-accepted`
4. Updates Google Consent Mode

### Legal Disclaimer

This implementation provides technical controls for GDPR compliance but:
- **Consult legal counsel** for your specific jurisdiction
- Update **Privacy Policy** to reflect cookie usage and consent mechanism
- Update **Cookie Policy** with detailed cookie list
- Maintain **records of consent** for audit purposes (Klaro stores in localStorage)
- Implement **data subject request** procedures (GDPR Article 15-22)
- Add **Cookie Policy** route (referenced in Klaro banner)

### Consent Mode v2

This implementation uses **Google Consent Mode V2** which:
- Supports additional consent signals (`ad_user_data`, `ad_personalization`)
- **Required** for Google tags from March 2024 in EEA
- Provides better privacy and conversion modeling
- Uses cookieless pings for denied consent
- Supports consent for EEA users while maintaining tracking for granted users

### Locale-Based Approach Rationale

The locale-based approach (`en` = US, no consent needed):
- **Simplifies UX**: US users not burdened with consent banners (better conversion)
- **Legal Compliance**: GDPR/ePrivacy only apply to EU/EEA/international users
- **Business Impact**: Maintains full tracking for primary market (US)
- **Consistent Pattern**: Matches payment provider split (Stripe/LemonSqueezy)
- **Performance**: Skips Klaro initialization for US users (faster page load)

**Important Note**: This assumes `en` locale = US users. If you have:
- UK English users → May need consent (UK GDPR post-Brexit)
- Canadian English users → May need consent (PIPEDA)
- Australian English users → May need consent (Privacy Act)

**Solution**: Refine locale detection:
```typescript
export function requiresConsent(): boolean {
  const locale = languageTag();
  const country = getCountryFromLocale(); // Implement this

  // US users only
  if (locale === 'en' && country === 'US') return false;

  // All other users require consent
  return true;
}
```

### CCPA Compliance

For California users, consider adding:
- "Do Not Sell My Personal Information" link (CCPA requirement)
- Opt-out mechanism separate from GDPR consent
- Update privacy policy with CCPA rights (access, delete, opt-out)
- **Note**: Klaro can handle CCPA opt-out by adding a service for it

### Klaro Customization

Klaro is highly customizable:

**Custom Styling**:
```css
/* Override Klaro styles */
.klaro .cookie-modal {
  max-width: 600px;
  border-radius: 16px;
}

.klaro .cm-btn {
  border-radius: 8px;
  font-weight: 600;
}
```

**Custom Translations**:
Add more languages to the `translations` object in config

**Custom Position**:
```typescript
config.noticeAsModal = true; // Show as modal instead of banner
```

**Custom Services**:
Add Facebook Pixel, LinkedIn, etc. by adding to `services` array

## Integration Points

### Prerequisites
- **Required**: TC01-Google-Tag-Manager-Setup.md - GTM container
- **Required**: TC02-Google-Analytics-Hotjar-Setup.md - Tracking tags to control
- **Required**: PG02-Paraglide-Configure-Langs.md - Locale detection
- A02-Create-Layout-Component.md - Layout for banner integration

### Related Features
- LG01-Privacy-Route.md - Privacy policy (referenced in banner)
- Footer component - Cookie settings link placement
- Language switcher - Triggers consent re-validation on locale change

## Success Criteria

### Installation & Configuration
- [ ] Klaro installed via npm (`npm install klaro`)
- [ ] Klaro config created in `src/lib/config/klaro-config.ts`
- [ ] Klaro CSS imported in layout
- [ ] GTM script updated with Klaro data attributes for non-US users
- [ ] Klaro initialized in layout with locale detection

### US User Experience (locale: `en`)
- [ ] NO Klaro banner appears for US users
- [ ] GTM loads immediately without consent prompt
- [ ] GA4 and Hotjar load immediately
- [ ] All tracking cookies present
- [ ] Console shows "Klaro skipped for US user"
- [ ] Console shows "GTM initialized (US user)"

### Non-US User Experience (other locales)
- [ ] Klaro banner appears on first visit
- [ ] GTM script blocked until consent (type="text/plain")
- [ ] NO tracking cookies before consent
- [ ] "Accept All" button works
- [ ] "Reject All" button works
- [ ] "Manage Preferences" shows service details
- [ ] Individual service toggles work
- [ ] Banner shows in user's language (via Paraglide)

### Consent Persistence
- [ ] Consent preferences saved to localStorage
- [ ] Consent persists across page reloads
- [ ] Consent expires after 365 days
- [ ] localStorage key `klaro` exists with consents
- [ ] Consent cleared when locale changes
- [ ] Cookie Settings button in footer (non-US only)

### GTM Integration
- [ ] GTM tags fire only after Klaro acceptance
- [ ] `klaro-google-analytics-accepted` event fires
- [ ] `klaro-hotjar-accepted` event fires
- [ ] Google Consent Mode V2 updates correctly
- [ ] GTM Preview mode shows consent states
- [ ] Tags blocked when consent denied

### Technical Validation
- [ ] No console errors related to Klaro or GTM
- [ ] Tracking scripts load only with consent
- [ ] Cookies cleared when consent withdrawn
- [ ] Privacy policy link works
- [ ] Cookie policy link works (create this route)
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader accessible
- [ ] Mobile-responsive consent UI
- [ ] Performance impact < 50ms for Klaro init
