# Mount Better Auth Handler

## Overview
- Mount Better Auth server handler in SvelteKit using `svelteKitHandler` to handle all authentication API endpoints and requests
- Integrate with SvelteKit server hooks to populate session data in `event.locals`
- Configure `sveltekitCookies` plugin for proper cookie handling in server actions
- Establish secure server-side authentication processing with proper route handling and middleware integration
- Create foundation for client-side authentication flows including login, signup, password reset, and session management
- Feature type: Technical Integration

## Requirements

### Technical Integration Requirements
- **Service Details**: Better Auth v1.0+ server handler with SvelteKit adapter integration
- **Authentication**: Server-side JWT processing, session validation, and CSRF protection
- **Integration Points**: Connect to Better Auth initialization from AU02-BetterAuth-Init.md and prepare for client setup in AU04-Global-Client-Setup.md

### Functional Requirements
- Mount Better Auth handler at `/api/auth/[...all]` route to handle all authentication requests
- Process authentication endpoints including login, signup, logout, password reset, and session validation
- Handle OAuth callback processing for Google, GitHub, and Discord providers configured in AU02-BetterAuth-Init.md
- Support email verification workflows and password reset token validation
- Implement proper HTTP status codes and error responses for authentication failures
- Enable CORS handling for authentication requests from frontend client
- **Acceptance Criteria**: 
  - Authentication endpoints accessible at `/api/auth/*` routes
  - POST requests to `/api/auth/sign-in` successfully authenticate users
  - GET requests to `/api/auth/session` return current user session data
  - OAuth providers redirect correctly through `/api/auth/callback/*` routes
  - Authentication failures return appropriate error messages and status codes

### Data Requirements
- Process authentication request payloads including email/password credentials and OAuth tokens
- Validate user input data including email format, password strength, and required fields
- Handle session data persistence using MySQL database connection from DB01-DB-Container-Setup.md
- Store and retrieve user accounts, sessions, and verification tokens from database tables
- **Validation**: Email format validation, password complexity requirements, CSRF token verification
- **Storage**: Utilize existing MySQL container and Better Auth database schema

### Security Considerations
- Implement CSRF protection for all authentication state-changing operations
- Secure cookie handling with httpOnly, secure, and sameSite attributes
- Rate limiting for authentication attempts to prevent brute force attacks
- Input sanitization and validation to prevent injection attacks
- Proper error handling without exposing sensitive information in responses
- **Authentication**: JWT secret validation using BETTER_AUTH_SECRET environment variable
- **Authorization**: Session-based access control for protected endpoints
- **Data Protection**: Encrypted password storage using Argon2 hashing algorithm

### Performance Requirements
- Authentication requests must complete within 500ms under normal load
- Support concurrent authentication requests from multiple users
- Efficient database connection pooling for session and user data operations
- **Load Times**: Initial handler mounting within 100ms of server startup
- **Rate Limits**: Maximum 10 authentication attempts per IP per minute

## Technical Specifications

### Dependencies
- **External Services**: Better Auth server package, SvelteKit framework, MySQL database container
- **npm Packages**: `better-auth`, `better-auth/svelte` (includes SvelteKit utilities)
- **Existing Code**: Better Auth initialization from `src/lib/auth.ts` (AU02-BetterAuth-Init.md)
- **SvelteKit Version**: Requires SvelteKit 2.20.0+ for `getRequestEvent` function used by cookies plugin

### Database Changes
- **Existing Tables**: Utilize Better Auth auto-generated tables (users, sessions, accounts, verification_tokens)
- **No New Tables**: Handler uses existing database schema from AU02-BetterAuth-Init.md
- **Connection**: MySQL database connection via existing container configuration

### API Changes
- **New Endpoints**: Mount all Better Auth endpoints under `/api/auth/` prefix
  - `POST /api/auth/sign-in` - User login with email/password
  - `POST /api/auth/sign-up` - User registration
  - `POST /api/auth/sign-out` - User logout
  - `GET /api/auth/session` - Current session data
  - `POST /api/auth/forgot-password` - Password reset request
  - `POST /api/auth/reset-password` - Password reset confirmation
  - `GET /api/auth/callback/[provider]` - OAuth callback handling
- **Breaking Changes**: None - new API endpoints only

### Environment Variables
- **Required Variables**: 
  - `BETTER_AUTH_SECRET` - JWT signing secret (32+ characters)
  - `BETTER_AUTH_URL` - Base URL for authentication callbacks
  - `DATABASE_URL` - MySQL connection string from existing container
- **OAuth Variables**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- **Email Variables**: Email server configuration for verification workflows

## Additional Context for AI Assistant

This implementation creates the critical server-side authentication infrastructure using Better Auth's SvelteKit integration:

### Server Hook Integration

The authentication handler should be integrated into SvelteKit's server hook (`src/hooks.server.ts`) as part of the middleware sequence:

**Solo AI Reference Implementation Pattern**:
```typescript
// In hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from './auth';

// Create a betterAuthHandle middleware function
const betterAuthHandle = async ({ event, resolve }) => {
  // For auth routes, the API handler manages everything
  // For other routes, fetch and populate session data
  const session = await auth.api.getSession({ headers: event.request.headers });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return resolve(event);
};

// Compose with other middleware
export const handle = sequence(
  // Other middleware...
  betterAuthHandle,
  // More middleware...
);
```

**Key Points**:
- The handler does NOT automatically populate session data in `event.locals`
- You must manually fetch session using `auth.api.getSession()` with request headers
- Populate `event.locals.session` and `event.locals.user` for use throughout the app
- Session data becomes available in layouts, actions, and endpoints via `event.locals`
- Use SvelteKit's `sequence()` to compose with other middleware handlers

### Cookie Plugin for Server Actions
For server actions that set authentication cookies (e.g., `signInEmail`, `signUpEmail`), configure the `sveltekitCookies` plugin in your Better Auth initialization:
- This plugin uses the `getRequestEvent` function available in SvelteKit 2.20.0+
- Ensures cookies are properly set during server-side authentication operations
- Required for email/password authentication flows to work correctly

### API Route Handler Implementation

**File**: `src/routes/api/auth/[...all]/+server.ts`

```typescript
import { auth } from "../../../../auth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  return auth.handler(event.request);
};

export const POST: RequestHandler = async (event) => {
  return auth.handler(event.request);
};
```

**Implementation Notes**:
- The handler must be mounted at `src/routes/api/auth/[...all]/+server.ts` using the `[...all]` catch-all pattern
- Both GET and POST request handlers delegate to `auth.handler(event.request)`
- The auth instance is imported from your `src/auth.ts` configuration file
- Better Auth automatically handles all authentication endpoints through this single handler
- Supports endpoints like `/api/auth/sign-in`, `/api/auth/sign-up`, `/api/auth/session`, `/api/auth/callback/*`, etc.

This implementation will be consumed by:
1. **Client Setup** (AU04-Global-Client-Setup.md): Frontend client will connect to these mounted endpoints
2. **Login Forms** (L02-Login-Form.md): Forms will POST to `/api/auth/sign-in` endpoint
3. **Signup Forms** (S02-Signup-Form.md): Registration will POST to `/api/auth/sign-up` endpoint
4. **Route Guards** (AU05-Protect-Routes.md): Session validation will use session data from `event.locals`

Ensure the implementation supports the existing MySQL database setup and Better Auth configuration while preparing for seamless integration with upcoming client-side authentication components.