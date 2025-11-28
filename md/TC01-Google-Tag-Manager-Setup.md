# TC01-Google-Tag-Manager-Setup.md

## Overview
Integrate Google Tag Manager (GTM) into the SvelteKit application to provide a centralized container for managing all tracking scripts, analytics, and marketing pixels without requiring code deployments for tag updates.

**Feature Type**: Technical Integration

**Business Value**: Enables marketing and analytics teams to manage tracking scripts independently through GTM's web interface, reducing developer dependencies and allowing rapid experimentation with conversion tracking and user behavior analysis.

**Integration Context**: GTM serves as the foundation for all tracking code. It loads first and manages all subsequent tracking scripts (Google Analytics, Hotjar, etc.) through its container system. For non-US users (all locales except `en`), GTM initialization is controlled by GDPR consent preferences (TC03-GDPR-Consent-Manager.md).

## Requirements

### Service Details
- **Service**: Google Tag Manager (GTM) container
- **Container Type**: Web container (gtm.js)
- **Loading Strategy**: Head + body noscript for maximum compatibility
- **Environment Support**: Separate containers for development, staging, and production
- **Integration Point**: Main application layout component

### Functional Requirements

**FR-1: GTM Container Integration**
- Install GTM script in application `<head>` section
- Add GTM noscript fallback in `<body>` for non-JavaScript users
- Support multiple container IDs for different environments
- Initialize GTM before other tracking scripts

**FR-2: Environment-Specific Containers**
- Development: Separate GTM container for testing tags
- Staging: Pre-production container with all production tags
- Production: Live container with verified tags only
- Use environment variables to switch between containers

**FR-3: Component-Based Loading**
- Create reusable Svelte component for GTM integration
- Mount component in main layout to ensure global availability
- Support conditional loading based on consent (for non-US users)
- Prevent duplicate GTM containers

**FR-4: Data Layer Preparation**
- Initialize dataLayer array before GTM loads
- Prepare for custom event tracking from application
- Support dynamic variable pushing to dataLayer
- Enable GTM Preview mode for development testing

### Technical Specifications

#### Dependencies
- SvelteKit application with layout system (A02-Create-Layout-Component.md)
- Environment variable management (EV01-Env-File-Setup.md)
- Paraglide locale system (PG02-Paraglide-Configure-Langs.md) for GDPR integration

#### Environment Variables
```bash
# Public variables (exposed to client)
PUBLIC_GTM_ID=GTM-XXXXXXX
PUBLIC_GTM_ENABLED=true

# Environment-specific GTM containers
PUBLIC_GTM_ID_DEV=GTM-DEVXXXX
PUBLIC_GTM_ID_STAGING=GTM-STAGEXXX
PUBLIC_GTM_ID_PROD=GTM-PRODXXX
```

#### File Structure
```
src/
├── lib/
│   ├── components/
│   │   └── tracking/
│   │       ├── GoogleTagManager.svelte
│   │       └── types.ts
│   └── utils/
│       └── tracking.ts
└── routes/
    └── +layout.svelte  # GTM component mounted here
```

### Security Considerations

**SC-1: Content Security Policy**
- Add GTM domains to CSP directives
- Allow scripts from `*.googletagmanager.com`
- Allow images from `*.google-analytics.com`
- Allow connections to `*.google-analytics.com` and `*.analytics.google.com`

**SC-2: Environment Isolation**
- Never expose production GTM container ID in development
- Validate GTM container ID format before loading
- Prevent XSS through dataLayer variables
- Sanitize user input before pushing to dataLayer

**SC-3: Data Privacy**
- Do not push PII (email, name, IP) to dataLayer
- Hash or anonymize user identifiers
- Respect Do Not Track browser settings
- Integrate with GDPR consent for non-US users (TC03)

### Performance Requirements

**PR-1: Load Time Impact**
- GTM script should load asynchronously
- Initial GTM container < 50KB compressed
- Script load time < 500ms on 3G connection
- No render-blocking from GTM initialization

**PR-2: Runtime Performance**
- dataLayer operations complete within 10ms
- Support 100+ dataLayer pushes without performance degradation
- No memory leaks from repeated tag fires
- Lazy load GTM in development to speed up local development

## Implementation

### GTM Account Setup

1. **Create GTM Account**
   - Navigate to tagmanager.google.com
   - Create new account with company name
   - Set up web container for your domain
   - Note container ID (GTM-XXXXXXX)

2. **Container Configuration**
   - Set container name (e.g., "Production - My App")
   - Configure container settings for SPA support
   - Enable container versioning
   - Set up workspace for development

3. **Environment Setup**
   - Create separate containers for dev/staging/prod
   - Configure environment-specific variables
   - Set up container publishing workflow
   - Document container IDs for environment variables

### GTM Component Implementation

**⚠️ Important Note**: This is the basic GTM implementation. In **TC03-GDPR-Consent-Manager.md**, this component will be enhanced to support Klaro consent management for non-US users. The component below works for initial testing, but you'll modify it in TC03 to add locale-based consent control.

```svelte
<!-- src/lib/components/tracking/GoogleTagManager.svelte -->
<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  interface Props {
    containerId: string;
    enabled?: boolean;
  }

  let { containerId, enabled = true }: Props = $props();

  // Validate container ID format
  const isValidContainerId = $derived(
    /^GTM-[A-Z0-9]+$/.test(containerId)
  );

  onMount(() => {
    if (!browser || !enabled || !isValidContainerId) {
      console.warn('GTM not loaded:', { browser, enabled, isValidContainerId });
      return;
    }

    // Check if GTM is already loaded
    if (window.dataLayer) {
      console.warn('GTM already initialized');
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // Load GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;

    script.onerror = () => {
      console.error('Failed to load Google Tag Manager');
    };

    document.head.appendChild(script);

    console.log('GTM initialized:', containerId);
  });
</script>

<!-- GTM Head Script - Loaded via script tag above -->

<!-- GTM Body Noscript Fallback -->
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

<!-- TypeScript declarations for window.dataLayer -->
<svelte:head>
  <script>
    window.dataLayer = window.dataLayer || [];
  </script>
</svelte:head>
```

**What Changes in TC03**:
- For **US users** (locale: `en`): GTM loads immediately as shown above
- For **non-US users**: GTM script gets Klaro data attributes (`type="text/plain"`, `data-name="google-tag-manager"`) to block loading until consent is given
- The component will check `languageTag()` from Paraglide to determine which behavior to use

### TypeScript Types

```typescript
// src/lib/components/tracking/types.ts

export interface GTMDataLayerEvent {
  event: string;
  [key: string]: unknown;
}

export interface GTMConfig {
  containerId: string;
  enabled: boolean;
  dataLayer?: GTMDataLayerEvent[];
}

// Global window interface extension
declare global {
  interface Window {
    dataLayer: GTMDataLayerEvent[];
  }
}
```

### Utility Functions

```typescript
// src/lib/utils/tracking.ts

import { browser } from '$app/environment';
import type { GTMDataLayerEvent } from '$lib/components/tracking/types';

/**
 * Push event to GTM dataLayer
 */
export function pushToDataLayer(event: GTMDataLayerEvent): void {
  if (!browser) return;

  if (!window.dataLayer) {
    console.warn('GTM not initialized, queueing event:', event);
    window.dataLayer = [event];
    return;
  }

  window.dataLayer.push(event);
}

/**
 * Track page view (for SPA navigation)
 */
export function trackPageView(path: string, title?: string): void {
  pushToDataLayer({
    event: 'pageview',
    page: {
      path,
      title: title || document.title,
      url: window.location.href
    }
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
): void {
  pushToDataLayer({
    event: eventName,
    ...eventParams
  });
}

/**
 * Track user action
 */
export function trackAction(
  category: string,
  action: string,
  label?: string,
  value?: number
): void {
  pushToDataLayer({
    event: 'user_action',
    eventCategory: category,
    eventAction: action,
    eventLabel: label,
    eventValue: value
  });
}
```

### Layout Integration

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import GoogleTagManager from '$lib/components/tracking/GoogleTagManager.svelte';
  import { trackPageView } from '$lib/utils/tracking';
  import { env } from '$env/dynamic/public';

  // Determine GTM container ID based on environment
  const gtmId = $derived(
    env.PUBLIC_GTM_ID ||
    (browser && window.location.hostname === 'localhost'
      ? env.PUBLIC_GTM_ID_DEV
      : env.PUBLIC_GTM_ID_PROD)
  );

  const gtmEnabled = $derived(env.PUBLIC_GTM_ENABLED === 'true');

  // Track page views on route changes (SPA navigation)
  $effect(() => {
    if (browser && gtmEnabled && $page.url.pathname) {
      // Small delay to ensure GTM is loaded
      setTimeout(() => {
        trackPageView($page.url.pathname);
      }, 100);
    }
  });

  // Your existing layout code...
</script>

<!-- GTM Component - Loads first -->
<GoogleTagManager containerId={gtmId} enabled={gtmEnabled} />

<!-- Rest of your layout -->
<slot />
```

### Environment Configuration

```bash
# .env.example

# Google Tag Manager Configuration
PUBLIC_GTM_ID=GTM-XXXXXXX
PUBLIC_GTM_ENABLED=true

# Environment-specific containers (optional)
PUBLIC_GTM_ID_DEV=GTM-DEVXXXX
PUBLIC_GTM_ID_STAGING=GTM-STAGEXXX
PUBLIC_GTM_ID_PROD=GTM-PRODXXX
```

### Content Security Policy Updates

```typescript
// src/hooks.server.ts or vite.config.ts

const cspDirectives = {
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for GTM
    'https://*.googletagmanager.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://*.google-analytics.com',
    'https://*.googletagmanager.com',
  ],
  'connect-src': [
    "'self'",
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
  ],
  'frame-src': [
    'https://*.googletagmanager.com',
  ]
};
```

## Testing

### Verification Steps

1. **GTM Container Loading**
   ```javascript
   // Browser console
   console.log(window.dataLayer);
   // Should show array with gtm.js event
   ```

2. **Preview Mode**
   - Open GTM interface
   - Click "Preview" button
   - Enter your application URL
   - Verify container loads and tags fire

3. **Network Tab Check**
   - Open browser DevTools → Network tab
   - Filter: "gtm.js"
   - Verify GTM script loads with 200 status
   - Check for gtm.js?id=GTM-XXXXXXX

4. **DataLayer Events**
   ```javascript
   // Push test event
   window.dataLayer.push({
     event: 'test_event',
     test_param: 'test_value'
   });
   ```

### Common Issues

**Issue: GTM not loading**
- Check container ID format (GTM-XXXXXXX)
- Verify PUBLIC_GTM_ENABLED=true
- Check Content Security Policy
- Look for ad blockers

**Issue: Duplicate containers**
- Ensure component only loads once in layout
- Check for multiple dataLayer initializations
- Verify conditional loading logic

**Issue: Events not firing**
- Verify dataLayer initialized before push
- Check GTM Preview mode for errors
- Ensure tag triggers are configured correctly
- Check browser console for errors

## Additional Context

### SPA Tracking Considerations

SvelteKit is a single-page application (SPA), which means:
- Page navigation doesn't reload the page
- GTM needs manual page view tracking
- Use `trackPageView()` on route changes
- Configure tags for history change trigger

### GTM Container Best Practices

1. **Version Control**
   - Create version for each major change
   - Document version changes
   - Test in Preview before publishing
   - Keep workspace organized

2. **Naming Conventions**
   - Tags: "[Type] Description" (e.g., "GA4 - Page View")
   - Triggers: "[Event] - [Condition]" (e.g., "Page View - All Pages")
   - Variables: "var - [Name]" (e.g., "var - User ID")

3. **Tag Organization**
   - Group related tags in folders
   - Use consistent naming
   - Document complex configurations
   - Regular container audits

### Data Layer Best Practices

```javascript
// Good: Structured data
dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: 'T123',
    value: 29.99,
    currency: 'USD'
  }
});

// Bad: Flat unstructured data
dataLayer.push({
  event: 'purchase',
  transactionId: 'T123',
  price: 29.99,
  curr: 'USD'
});
```

## Integration Points

### Prerequisites
- **Required**: A02-Create-Layout-Component.md - Layout system for component mounting
- **Required**: EV01-Env-File-Setup.md - Environment variable management
- Completed PG02-Paraglide-Configure-Langs.md for locale detection (needed for TC03)

### Next Steps
After completing this setup:
- **TC02-Google-Analytics-Hotjar-Setup.md**: Add GA4 and Hotjar through GTM
- **TC03-GDPR-Consent-Manager.md**: **IMPORTANT** - Add Klaro consent management and update this GTM component for non-US users

### Future Integration
- Better Auth user tracking with hashed user IDs
- E-commerce tracking for subscription events (Stripe/LemonSqueezy)
- Custom event tracking for feature usage
- Conversion tracking for marketing campaigns

## Success Criteria

- [ ] GTM container loads successfully on all pages
- [ ] DataLayer initialized before GTM script
- [ ] Noscript fallback present in body
- [ ] Environment-specific container IDs working
- [ ] GTM Preview mode connects successfully
- [ ] Page view tracking works on SPA navigation
- [ ] No console errors related to GTM
- [ ] Content Security Policy allows GTM resources
- [ ] TypeScript types defined for dataLayer
- [ ] Utility functions available for custom tracking
