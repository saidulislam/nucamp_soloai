# MA02-Mautic-API-Auth.md

## IMPORTANT IMPLEMENTATION NOTE
All configuration and setup for Mautic must be performed exclusively through the official Mautic interfaces:
- Mautic Web UI (Admin Dashboard)
- Mautic REST API
- Mautic CLI Tools

Directly injecting code, editing core source files, or programmatically modifying the Mautic application files, configuration files, or database to create or modify entities is STRICTLY PROHIBITED.

This restriction ensures:
- System consistency and database integrity
- Compatibility with future Mautic updates and plugins
- Maintainability and ease of troubleshooting
- Full support for automation, validation, and permissions features

Do NOT create or modify Mautic entities, configurations, or features by editing PHP files, configuration files, or the database directly.
Always use only the Web UI, official REST API, or CLI commands as documented by Mautic.
If actions are required using the UI, ask the user to perform them through the Mautic Admin interface or provide instructions for using the Mautic CLI.

## Overview
Integrate Mautic tracking script and API authentication to enable comprehensive visitor tracking, automated contact creation, and marketing automation. This implementation includes:

1. **Mautic Tracking Script**: Embed mtc.js to track anonymous visitors and generate tracking cookies
2. **Mautic Service Helper**: Create a reusable service library for contact management and API interactions
3. **Anonymous to Authenticated Transition**: Link Mautic tracking cookies to Better Auth user profiles
4. **Automated Contact Provisioning**: Create Mautic contacts when users register via Better Auth
5. **Webhook Endpoint**: Single API route to receive Mautic webhooks for contact updates

**Business Value**: Enables complete marketing automation workflow from anonymous visitor tracking through authenticated user engagement, supporting targeted campaigns and user lifecycle management.

**Feature Type**: Technical Integration

## Requirements

### Integration Points
- **Mautic Container**: Connect to existing Mautic instance from MA01-Mautic-Container-Setup.md running at http://localhost:8080
- **Better Auth**: Integrate with user registration/login flows from AU02-BetterAuth-Init.md for automatic contact creation
- **Environment Management**: Extend existing environment variable system from EV01-Env-File-Setup.md

### Service Details
- **Mautic Version**: 5.0+ with REST API v2 support
- **API Endpoints**: Access to `/api/contacts`, `/api/campaigns`, `/api/emails`, `/api/segments`
- **Authentication Method**: OAuth 2.0 with client credentials or API token authentication
- **Rate Limits**: Respect Mautic's default 100 requests per hour limit with exponential backoff

### Authentication Requirements
- **API Credentials**: Generate OAuth 2.0 client ID and secret or API token through Mautic admin interface
- **Credential Storage**: Store credentials securely as environment variables following existing patterns
- **Scope Configuration**: Request appropriate permissions for contact management and campaign access
- **Token Management**: Handle token refresh and expiration gracefully

### Functional Requirements
- **Credential Generation**: Create API credentials through Mautic admin panel accessible at http://localhost:8080/admin
- **Permission Configuration**: Set up API user with contact read/write, campaign access, and email management permissions
- **Connection Testing**: Verify API connectivity and authentication with test API call
- **Error Handling**: Implement proper error responses for authentication failures and rate limiting

### Security Considerations
- **Credential Protection**: Never expose API credentials in client-side code or version control
- **Access Control**: Limit API permissions to only required scopes for user provisioning and campaign management
- **Network Security**: Ensure API calls use HTTPS in production environments
- **Token Security**: Store tokens with proper encryption and implement secure rotation procedures

### Performance Requirements
- **Authentication Speed**: Complete authentication handshake within 2 seconds
- **Rate Limit Compliance**: Implement request throttling to stay within Mautic's API limits
- **Connection Pooling**: Reuse HTTP connections for multiple API requests
- **Timeout Handling**: Set appropriate timeouts for API requests (10 seconds default)

## Technical Specifications

### Dependencies
- Existing Mautic container from MA01-Mautic-Container-Setup.md
- HTTP client library (fetch API or axios) for API requests
- Environment variable validation from EV02-Env-Validation.md

### Environment Variables

Add to existing `.env` configuration:

**Server-Side (Private)**:
- `MAUTIC_BASEURL` - Base URL for Mautic API (e.g., `http://localhost:8080/api` for development)
- `MAUTIC_USERNAME` - Admin username for Basic Auth API access
- `MAUTIC_PASSWORD` - Admin password for Basic Auth API access
- `MYSQL_MAUTIC_DB` - MySQL database name for Mautic (optional, for advanced operations)

**Client-Side (Public)**:
- `PUBLIC_MAUTIC_URL` - Base URL for Mautic tracking script (e.g., `http://localhost:8080` for development)

**Note**: The reference project uses Basic Authentication for simplicity. For production, consider OAuth 2.0.

### API Configuration
- **Base URL**: `http://localhost:8080/api` for development, configurable for production
- **Authentication Headers**: Include proper authorization headers for all requests
- **Content Type**: Use `application/json` for request/response payload format
- **User Agent**: Include application identifier in API requests for tracking

### Database Changes

**Required**: Add `mauticId` field to the User model in your Prisma schema.

**File**: `prisma/schema.prisma`

Add the `mauticId` field to your User model:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified DateTime?
  image         String?
  locale        String?   @default("en")
  timezone      String?   @default("UTC")
  mauticId      Int?      // Mautic contact ID
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Other fields...
  sessions      Session[]
  accounts      Account[]
}
```

**Migration Steps**:

1. Add the `mauticId` field to your Prisma schema
2. Generate Prisma client: `npx prisma generate`
3. Create and apply migration: `npx prisma migrate dev --name add-mautic-id`
4. Better Auth will automatically recognize this field as a custom user field

**Note**: This field stores the Mautic contact ID, linking your application users to Mautic contacts. It's nullable (`Int?`) because users may not have a Mautic contact initially (provisioned on first login/registration).

### Integration Architecture
- **Service Layer**: Create Mautic API service class for credential management and request handling
- **Authentication Middleware**: Implement token refresh and error handling logic
- **Connection Testing**: Add health check endpoint to verify Mautic API connectivity
- **Logging**: Implement API request/response logging for debugging and monitoring

## Prerequisites
- MA01-Mautic-Container-Setup.md - Mautic container running and accessible
- DB02-Prisma-Setup.md - Prisma ORM configured with soloai_db database
- AU02-BetterAuth-Init.md - Better Auth configured with Prisma adapter and custom user fields
- PG01-Paraglide-Install.md - Paraglide i18n configured for language detection
- EV01-Env-File-Setup.md - Environment variable management system
- EV02-Env-Validation.md - Environment variable validation framework

## Success Criteria
- ✅ `mauticId` field added to User model in Prisma schema and database migrated
- ✅ Mautic tracking script integrated and setting `mtc_id` cookie for anonymous visitors
- ✅ Mautic service helper library created with contact management functions
- ✅ API credentials configured and authenticated via Basic Auth
- ✅ Users automatically provisioned in Mautic when registering via Better Auth
- ✅ `mauticId` persisted in user database after Mautic contact creation
- ✅ **User locale from Paraglide synced to Mautic contact on provisioning**
- ✅ Anonymous visitor tracking linked to authenticated user profiles
- ✅ Webhook endpoint receives and processes Mautic contact updates
- ✅ No duplicate contacts created during anonymous-to-authenticated transition

## Implementation Guide

### 1. Add mauticId Field to Database Schema

Before implementing Mautic integration, you must add the `mauticId` field to your User model to store the Mautic contact ID.

**File**: `prisma/schema.prisma`

Update your User model:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified DateTime?
  image         String?
  locale        String?   @default("en")
  timezone      String?   @default("UTC")
  mauticId      Int?      // Mautic contact ID - links to Mautic contacts
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  accounts      Account[]
}
```

**Run migrations**:

```bash
# Generate Prisma client with new field
npx prisma generate

# Create and apply database migration
npx prisma migrate dev --name add-mautic-id-to-user
```

**Update Better Auth Configuration** (if needed):

If using Better Auth's `additionalFields` feature (from AU02-BetterAuth-Init.md), the `mauticId` will be automatically recognized as a custom field. No additional configuration needed.

**Verification**:

```typescript
// The field will be available on the user object
const user = await prisma.user.findUnique({ where: { id: userId }});
console.log(user.mauticId); // null initially, populated after provisioning
```

### 2. Mautic Tracking Script Integration

The Mautic tracking script (mtc.js) tracks anonymous visitors and sets the `mtc_id` cookie that identifies the contact in Mautic.

**File**: `src/app.html`

Add the tracking script in the `<head>` section:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <!-- Other head content... -->

    <!-- Mautic Tracking Script -->
    <script>
      (function(w,d,t,u,n,a,m){w['MauticTrackingObject']=n;
      w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)},
      a=d.createElement(t), m=d.getElementsByTagName(t)[0];
      a.async=1;a.src=u;m.parentNode.insertBefore(a,m)
      })(window,document,'script','%sveltekit.env.PUBLIC_MAUTIC_URL%/mtc.js','mt');
      mt('send', 'pageview');
    </script>

    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

**Key Points**:
- Use `%sveltekit.env.PUBLIC_MAUTIC_URL%` to inject the environment variable
- The script loads asynchronously to avoid blocking page rendering
- `mt('send', 'pageview')` tracks the initial page view
- Mautic automatically sets the `mtc_id` cookie after the first request

**Cookie Behavior**:
- First visit: Mautic creates a new anonymous contact and sets `mtc_id` cookie
- Subsequent visits: Mautic uses the `mtc_id` from the cookie to identify the returning visitor
- The cookie contains the Mautic contact ID (integer value)

### 3. Mautic Service Helper Library

Create a reusable service class for all Mautic API interactions based on the Solo AI Reference implementation.

**File**: `src/lib/services/mautic.ts`

```typescript
import axios, { type AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import {
  MAUTIC_BASEURL,
  MAUTIC_PASSWORD,
  MAUTIC_USERNAME
} from '$env/static/private';
import type { MauticUserData, SimplifiedError } from './datamodel';

class Mautic {
  private client: AxiosInstance;

  constructor() {
    const baseURL = MAUTIC_BASEURL;
    const username = MAUTIC_USERNAME;
    const password = MAUTIC_PASSWORD;
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    // Configure axios-retry with exponential backoff
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return !error.response?.status ||
               error.response?.status === 429 ||
               error.response?.status >= 500;
      },
    });
  }

  public async getUser(id: number) {
    try {
      const response = await this.client.get(`/contacts/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async createUser(data: MauticUserData) {
    try {
      const response = await this.client.post('/contacts/new', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async editUser(
    id: number,
    data: MauticUserData,
    createIfNotFound: boolean = false
  ) {
    try {
      const method = createIfNotFound ? 'put' : 'patch';
      const response = await this.client.request({
        method,
        url: `/contacts/${id}/edit`,
        data,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async findUserByEmail(email: string) {
    try {
      const response = await this.client.get(`/contacts`, {
        params: { search: email },
      });
      if (response.data.total > 0) {
        const contactId = Object.keys(response.data.contacts)[0];
        return response.data.contacts[contactId];
      }
      return null;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get or create a Mautic contact, handling anonymous to authenticated transition
   *
   * This function implements the key logic for avoiding duplicate contacts:
   * 1. If user has an email, search for existing contact by email first
   * 2. If found, update that contact with new data
   * 3. If mauticId exists (from cookie), try to get that contact
   * 4. If email changed, create new contact (different person)
   * 5. Otherwise, update existing contact
   * 6. If no existing contact found, create new one
   */
  public async getOrCreateMauticUser(contactData: MauticUserData) {
    try {
      let mauticUser = await this.findUserByEmail(contactData.email);

      if (mauticUser) {
        // Found by email - update existing contact
        mauticUser = await this.editUser(mauticUser.id, contactData, true);
      } else if (contactData.mauticId) {
        // No email match, but have mauticId from cookie
        mauticUser = await this.getUser(contactData.mauticId);

        if (mauticUser?.contact?.fields?.all?.email &&
            mauticUser.contact.fields.all.email !== contactData.email) {
          // Email changed - create new contact (different user)
          mauticUser = await this.createUser(contactData);
        } else {
          // Same user, update existing anonymous contact
          mauticUser = await this.editUser(contactData.mauticId, contactData, true);
        }
      } else {
        // No existing contact found - create new
        mauticUser = await this.createUser(contactData);
      }

      return mauticUser;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any) {
    console.error('Mautic API error:', error);
    const simplifiedError: SimplifiedError = {
      code: error.code,
      status: error.response?.status || 500,
      message: error.message,
      errors: error.response?.data?.errors ?? []
    };

    if (simplifiedError?.errors[0]?.message) {
      simplifiedError.message = simplifiedError.errors[0].message;
    }

    throw simplifiedError;
  }
}

export default Mautic;
```

**Key Features**:
- **Basic Authentication**: Uses username/password encoded in Base64
- **Retry Logic**: Exponential backoff for rate limits (429) and server errors (5xx)
- **Contact Management**: CRUD operations for Mautic contacts
- **Duplicate Prevention**: `getOrCreateMauticUser` handles email matching and anonymous transitions
- **Error Handling**: Centralized error formatting for consistent error responses

**Type Definitions** (`src/lib/services/datamodel.ts`):

```typescript
export interface MauticUserData {
  email: string;
  firstname?: string;
  lastname?: string;
  ipAddress?: string;
  preferred_locale?: string; // Mautic's field for user's preferred language
  locale?: string;            // User's current locale from Paraglide/Better Auth
  timezone?: string;
  mauticId?: number;
  last_active?: string;
  createdAt?: string;
  [key: string]: any; // Allow custom fields
}

export interface SimplifiedError {
  code: string;
  status: number;
  message: string;
  errors: any[];
}
```

**Important**: Both `locale` and `preferred_locale` can be used in Mautic. The `locale` field typically represents the user's current language selection from your application (e.g., from Paraglide i18n), while `preferred_locale` can store the user's long-term language preference.

### 4. Locale Synchronization with Paraglide

A critical part of user provisioning is syncing the user's language preference from Paraglide (your i18n library) to Mautic. This ensures marketing emails and campaigns can be sent in the user's preferred language.

**Locale Flow Architecture**:

```
1. User visits site
   └─> Paraglide detects/sets locale (e.g., 'en', 'es', 'fr')
       └─> Stored in PARAGLIDE_LOCALE cookie
           └─> Available in event.locals.paraglide.locale

2. User registers via Better Auth
   └─> Better Auth databaseHooks captures locale from Paraglide
       └─> Stored in User.locale field (database)
           └─> Available in session.user.locale

3. hooks.server.ts provisions Mautic contact
   └─> Reads locale from session.user.locale
       └─> Sends to Mautic contact as 'locale' and/or 'preferred_locale'
           └─> Mautic stores user's language preference
```

**Better Auth Configuration for Locale Capture**:

In your `src/auth.ts` file, Better Auth should be configured to capture locale from Paraglide:

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getRequestEvent } from "$app/server";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mysql" }),

  user: {
    additionalFields: {
      locale: {
        type: "string",
        required: false,
        defaultValue: "en",
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "UTC",
      }
    }
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          // Get locale from Paraglide if not set
          const event = getRequestEvent();
          if (!user.locale && event) {
            const paraglideCookieLocale = event.cookies.get('PARAGLIDE_LOCALE');
            const paraglideEventLocale = event.locals?.paraglide?.locale;
            user.locale = paraglideEventLocale || paraglideCookieLocale || "en";
          }
          if (!user.timezone && event) {
            const preferredTimezone = event.cookies.get('preferredTimezone');
            user.timezone = preferredTimezone || "UTC";
          }
          return { data: user };
        }
      }
    }
  }
});
```

**Key Points**:
- ✅ Locale captured from Paraglide during user registration
- ✅ Falls back to cookie if `event.locals.paraglide` not available
- ✅ Defaults to "en" if no locale detected
- ✅ Stored in User database table via Better Auth
- ✅ Available in all future sessions as `session.user.locale`

**Mautic Field Mapping**:

When sending to Mautic, you can use either or both fields:
- `locale`: Current language preference (e.g., "en", "es", "fr")
- `preferred_locale`: Alternative field name some Mautic setups use

The Solo AI Reference project uses both fields for maximum compatibility.

### 5. Anonymous to Authenticated User Transition

The key to avoiding duplicate contacts is handling the transition when an anonymous visitor (tracked by `mtc_id` cookie) registers or logs in. This is handled in `hooks.server.ts`.

**File**: `src/hooks.server.ts` (add to existing betterAuthHandle middleware)

```typescript
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { auth } from './auth';
import Mautic from '$lib/services/mautic';

const betterAuthHandle: Handle = async ({ event, resolve }) => {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: event.request.headers
  });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;

    // Handle new user provisioning
    if (session.user && !session.user.mauticId) {
      // Read Mautic tracking cookie
      const mauticIdCookie = event.cookies.get('mtc_id');

      // Prepare contact data for Mautic
      const contactData = {
        email: session.user.email,
        firstname: session.user.name?.split(' ')[0] || '',
        lastname: session.user.name?.split(' ').slice(1).join(' ') || '',
        ipAddress: event.getClientAddress(),
        locale: session.user.locale || 'en',           // From Paraglide via Better Auth
        preferred_locale: session.user.locale || 'en', // Same value for compatibility
        timezone: session.user.timezone || 'UTC',
        mauticId: mauticIdCookie ? parseInt(mauticIdCookie) : undefined,
        last_active: new Date().toISOString(),
      };

      try {
        // Create or update Mautic contact
        const mauticClient = new Mautic();
        const mauticUser = await mauticClient.getOrCreateMauticUser(contactData);

        // Update user in your database with Mautic ID
        if (mauticUser?.contact?.id) {
          // TODO: Update your user database with mauticId
          const updatedMauticId = mauticUser.contact.id;

          // Sync cookie with database value
          if (updatedMauticId && updatedMauticId !== parseInt(mauticIdCookie || '0')) {
            event.cookies.set('mtc_id', updatedMauticId.toString(), { path: '/' });
          }
        }
      } catch (error) {
        console.error('Error provisioning Mautic contact:', error);
        // Don't block authentication on Mautic errors
      }
    }
  }

  return resolve(event);
};

export const handle = sequence(
  betterAuthHandle,
  // Other middleware...
);
```

**How the Transition Works**:

1. **Anonymous Visitor**:
   - User visits site for first time
   - Mautic tracking script loads and calls Mautic server
   - Mautic creates anonymous contact and sets `mtc_id` cookie
   - All subsequent page views tracked under this anonymous contact

2. **User Registers/Logs In**:
   - Better Auth creates authenticated user
   - `betterAuthHandle` detects new user without `mauticId`
   - Reads `mtc_id` cookie from browser
   - Calls `getOrCreateMauticUser()` with email and `mauticId`

3. **Contact Matching Logic**:
   - **Case 1**: Email found in Mautic → Update existing contact (returning user)
   - **Case 2**: `mauticId` from cookie exists, no email match → Check if same person
     - If anonymous contact has no email or same email → Update anonymous contact (anonymous → authenticated)
     - If anonymous contact has different email → Create new contact (different person using same browser)
   - **Case 3**: No existing contact → Create new contact (new user)

4. **Cookie Synchronization**:
   - After provisioning, sync `mtc_id` cookie with database value
   - Ensures browser tracking continues with correct Mautic contact ID
   - Prevents duplicate contacts on future sessions

**Key Benefits**:
- ✅ Anonymous visitor activity preserved when user registers
- ✅ No duplicate contacts created
- ✅ Handles shared device scenarios (different users, same browser)
- ✅ Maintains marketing attribution and campaign tracking

**Locale Syncing**:
- ✅ User's Paraglide locale automatically synced to Mautic
- ✅ Enables sending campaign emails in user's preferred language
- ✅ Supports multilingual marketing automation (see AI02-Content-Localization-Workflow.md)

### 6. Update User Database with Mautic ID

After creating or updating the Mautic contact, you need to persist the `mauticId` in your database.

**Update the hooks.server.ts provisioning code**:

```typescript
// In betterAuthHandle middleware
if (session.user && !session.user.mauticId) {
  const mauticIdCookie = event.cookies.get('mtc_id');

  // ... prepare contactData ...

  try {
    const mauticClient = new Mautic();
    const mauticUser = await mauticClient.getOrCreateMauticUser(contactData);

    if (mauticUser?.contact?.id) {
      const updatedMauticId = mauticUser.contact.id;

      // Update user in database with Mautic ID using Prisma
      const prisma = new PrismaClient();
      await prisma.user.update({
        where: { id: session.user.id },
        data: { mauticId: updatedMauticId }
      });

      // Update session user object
      event.locals.user.mauticId = updatedMauticId;

      // Sync cookie with database value
      if (updatedMauticId && updatedMauticId !== parseInt(mauticIdCookie || '0')) {
        event.cookies.set('mtc_id', updatedMauticId.toString(), { path: '/' });
      }
    }
  } catch (error) {
    console.error('Error provisioning Mautic contact:', error);
    // Don't block authentication on Mautic errors
  }
}
```

**Key Points**:
- Use Prisma Client to update the user record with `mauticId`
- Update `event.locals.user` so the current request has the updated value
- Sync the browser cookie with the database value
- On subsequent requests, `session.user.mauticId` will exist, preventing re-provisioning

### 7. Mautic Webhook Endpoint

Create a single webhook endpoint to receive all Mautic webhook events for contact updates, form submissions, and campaign interactions.

**File**: `src/routes/api/webhooks/mautic/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const payload = await request.json();

    // Mautic webhook structure
    const eventType = payload['mautic.webhook_event'];
    const contact = payload['mautic.lead'];

    console.log('Mautic webhook received:', {
      eventType,
      contactId: contact?.id,
      contactEmail: contact?.fields?.all?.email
    });

    // Handle different webhook events
    switch (eventType) {
      case 'contact.identified':
        // Contact was identified (anonymous → authenticated)
        await handleContactIdentified(contact);
        break;

      case 'contact.added':
        // New contact created
        await handleContactAdded(contact);
        break;

      case 'contact.updated':
        // Contact fields updated
        await handleContactUpdated(contact);
        break;

      case 'form.submitted':
        // Form submission received
        await handleFormSubmission(payload);
        break;

      case 'email.opened':
      case 'email.clicked':
        // Email engagement tracking
        await handleEmailEngagement(payload);
        break;

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Mautic webhook error:', error);
    return json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
};

// Handler functions
async function handleContactIdentified(contact: any) {
  // Update your database when anonymous contact becomes identified
  console.log('Contact identified:', contact?.id);
  // TODO: Sync contact data to your database
}

async function handleContactAdded(contact: any) {
  // Handle new contact creation
  console.log('Contact added:', contact?.id);
  // TODO: Perform any necessary actions for new contacts
}

async function handleContactUpdated(contact: any) {
  // Sync contact updates to your database
  console.log('Contact updated:', contact?.id);
  // TODO: Update your user database with latest Mautic data
}

async function handleFormSubmission(payload: any) {
  // Process form submission data
  console.log('Form submitted:', payload['mautic.form']?.id);
  // TODO: Handle form submission (e.g., trigger workflows, send notifications)
}

async function handleEmailEngagement(payload: any) {
  // Track email engagement
  console.log('Email engagement:', payload);
  // TODO: Update engagement metrics in your database
}
```

**Webhook Configuration in Mautic**:

1. Navigate to Mautic Admin → Webhooks
2. Click "New" to create webhook
3. Configure webhook:
   - **Name**: "SvelteKit App Webhook"
   - **Webhook POST URL**: `https://yourdomain.com/api/webhooks/mautic` (production) or `http://localhost:5173/api/webhooks/mautic` (development)
   - **Events to Send**:
     - ✅ Contact Identified
     - ✅ Contact Added
     - ✅ Contact Updated
     - ✅ Form Submitted
     - ✅ Email Opened
     - ✅ Email Clicked
   - **Order**: 1 (or as needed)

4. Save webhook configuration

**Testing Webhooks Locally**:

For local development, you'll need to expose your local server to the internet:

```bash
# Using ngrok
ngrok http 5173

# Update Mautic webhook URL with ngrok URL
https://your-ngrok-url.ngrok.io/api/webhooks/mautic
```

**Security Considerations**:
- Consider adding webhook signature verification for production
- Validate webhook payload structure before processing
- Rate limit webhook endpoint to prevent abuse
- Log all webhook events for debugging and monitoring

### 8. Dependencies Installation

Install required npm packages:

```bash
npm install axios axios-retry
```

**Package Purposes**:
- `axios`: HTTP client for Mautic API requests
- `axios-retry`: Automatic retry logic with exponential backoff

## Integration Workflow Summary

The complete Mautic integration workflow:

```
1. Anonymous Visitor
   └─> Mautic tracking script loads
       └─> mtc.js calls Mautic server
           └─> Mautic creates anonymous contact
               └─> Sets mtc_id cookie (e.g., mtc_id=123)

2. User Registers/Logs In
   └─> Better Auth creates user
       └─> hooks.server.ts detects new user
           └─> Reads mtc_id cookie
               └─> Calls mauticClient.getOrCreateMauticUser()
                   ├─> Searches by email first
                   ├─> Falls back to mauticId from cookie
                   ├─> Updates anonymous contact with email
                   └─> Returns Mautic contact ID

3. Store Mautic ID
   └─> Update user database with mauticId
       └─> Sync mtc_id cookie with database value
           └─> Future requests use consistent tracking

4. Webhook Updates (Optional)
   └─> Mautic sends webhook on contact events
       └─> Webhook endpoint processes event
           └─> Sync updates back to your database
```

## Best Practices

1. **Error Handling**: Never block authentication on Mautic errors - log and continue
2. **Cookie Sync**: Always sync `mtc_id` cookie after provisioning to maintain tracking
3. **Email Matching**: Search by email first to handle returning users correctly
4. **Duplicate Prevention**: The `getOrCreateMauticUser` logic prevents duplicates
5. **Locale Sync**: Always send user's locale from Paraglide to enable multilingual campaigns
6. **Async Processing**: Consider queueing Mautic operations for better performance
7. **Testing**: Test anonymous → authenticated flow thoroughly in development

## Troubleshooting

**Issue**: `mtc_id` cookie not set
- **Solution**: Verify Mautic tracking script is loaded and `PUBLIC_MAUTIC_URL` is correct
- **Check**: Browser console for mtc.js loading errors
- **Verify**: Mautic container is running and accessible

**Issue**: Duplicate contacts created
- **Solution**: Ensure email search happens before using `mauticId`
- **Check**: `getOrCreateMauticUser` logic follows correct order
- **Verify**: Cookie is being read correctly in hooks.server.ts

**Issue**: Webhooks not received
- **Solution**: Check webhook URL is publicly accessible
- **Verify**: Mautic webhook configuration is correct
- **Test**: Use ngrok for local development testing

**Issue**: User locale not syncing to Mautic
- **Solution**: Verify Better Auth `additionalFields` includes `locale` field
- **Check**: Paraglide is setting `PARAGLIDE_LOCALE` cookie correctly
- **Verify**: `databaseHooks.user.create.before` captures locale from Paraglide
- **Test**: Check `session.user.locale` has correct value in hooks.server.ts
- **Mautic**: Verify contact has `locale` or `preferred_locale` field populated