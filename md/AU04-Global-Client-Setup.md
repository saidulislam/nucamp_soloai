# Better Auth Global Client Setup

## Overview
Set up Better Auth client-side configuration with createAuthClient and integrate with global SvelteKit context for authentication state management across the application. This establishes the foundation for client-side authentication flows including login, signup, session persistence, and route protection.

**Feature Type**: Technical Integration

## Requirements

### Technical Integration Requirements
- **Service Details**: Better Auth v1.0+ client package with SvelteKit adapter integration
- **Authentication**: Client connects to mounted Better Auth server handler at `/api/auth/[...all]`
- **Integration Points**: Global context provider, session management, authentication state reactivity

### Functional Requirements
- Create Better Auth client instance using `createAuthClient` with proper configuration
- Integrate client with SvelteKit's global context system for app-wide authentication state
- Provide reactive authentication state accessible from any component or page
- Handle automatic session initialization and persistence across page reloads
- Support authentication actions (login, signup, logout) through client methods
- Maintain consistent authentication state between server and client
- Enable real-time authentication state updates without page refresh

**Acceptance Criteria**:
- Authentication client accessible globally through SvelteKit context
- Session state automatically loads on application initialization
- Authentication state reactive updates trigger component re-renders
- Client methods available for all authentication operations
- Session persistence works across browser tabs and page reloads

### Data Requirements
- Authentication state includes user data, session status, loading states
- Client maintains session tokens, user profile data, and authentication status
- Support for user metadata including email, name, OAuth provider information
- Session expiry handling with automatic token refresh when possible

### Security Considerations
- Secure token storage using httpOnly cookies for session management
- CSRF protection through Better Auth's built-in security measures
- Automatic token refresh handling for session continuity
- Client-side session validation with server-side verification

### Performance Requirements
- Authentication client initialization within 100ms of app startup
- Session state changes propagate to components within 50ms
- Client methods respond within 200ms for local operations
- Memory usage under 5MB for authentication state management

## Technical Specifications

### Dependencies
- `better-auth/svelte` - SvelteKit-specific authentication client with reactive state management
- Includes `createAuthClient` function for client initialization
- Built-in nano-store integration for reactive authentication state
- Existing Better Auth server configuration from AU02-BetterAuth-Init.md
- Mounted Better Auth handler from AU03-Mount-BetterAuth-Handler.md

### Integration Architecture
- Create auth client in `src/lib/auth/client.ts` using `createAuthClient` from `better-auth/svelte`
- Client automatically connects to Better Auth server endpoints at `/api/auth/*` routes
- **Nano-store Integration**: Client uses nano-store for reactive state management
- State automatically reflects changes when users sign in, sign out, or session updates occur
- No manual context setup required - client provides reactive stores out of the box
- **Plugin Support**: Use `inferAdditionalFields` plugin for type-safe access to custom user fields

### Client Configuration
- Configure base URL pointing to mounted Better Auth handler (typically handled automatically)
- Client provides reactive state through nano-store
- Automatic session refresh and token management handled by Better Auth
- OAuth provider support automatically matches server configuration

### Reactive State Management
- Authentication client exposes reactive stores for session data
- Changes automatically propagate to all components using the stores
- Supports social authentication providers (e.g., GitHub, Google, Discord)
- Sign-in/sign-out actions automatically update reactive state
- No manual state management or context setup required

### Environment Variables
- **Required**: `PUBLIC_BASE_URL` - Base URL for authentication API endpoints
- The client uses this to construct full URLs for auth requests (e.g., `${PUBLIC_BASE_URL}/api/auth/sign-in`)
- Must be a public environment variable (prefix with `PUBLIC_`) to be accessible in client code
- Example: `PUBLIC_BASE_URL=http://localhost:5173` (development) or `PUBLIC_BASE_URL=https://yourdomain.com` (production)

## Additional Context for AI Assistant

This feature builds directly on the Better Auth server setup from AU02-BetterAuth-Init.md and mounted handler from AU03-Mount-BetterAuth-Handler.md. The client must connect to the existing `/api/auth/[...all]` endpoint structure.

### Better Auth Svelte Client
The `better-auth/svelte` package provides a specialized SvelteKit client using `createAuthClient`:
- **Automatic Reactivity**: Built-in nano-store integration provides reactive authentication state
- **State Updates**: Session changes automatically trigger component re-renders
- **Social Auth**: Supports social authentication providers configured on the server
- **Sign-out**: Provides methods for signing out users with automatic state cleanup
- **Type Safety**: Full TypeScript support for authentication operations

### Implementation Pattern from Solo AI Reference Project

**File**: `src/lib/auth/client.ts`

```typescript
import { PUBLIC_BASE_URL } from "$env/static/public";
import { createAuthClient } from "better-auth/svelte";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "../../auth";

export const authClient = createAuthClient({
  baseURL: PUBLIC_BASE_URL,
  plugins: [
    inferAdditionalFields<typeof auth>()
  ]
});
```

**Key Implementation Points**:
- **Base URL**: Configure `baseURL` with `PUBLIC_BASE_URL` environment variable
- **Type Safety**: Use `inferAdditionalFields` plugin with `typeof auth` to infer custom user fields
- **Additional Fields**: This plugin ensures TypeScript knows about custom fields like `locale` and `timezone`
- **Reactive Stores**: Client automatically provides reactive stores via nano-store integration
- **No Manual Setup**: Components can directly import and use `authClient` without context setup

**Usage in Components**:
```typescript
import { authClient } from "$lib/auth/client";

// Access reactive session store
$: session = authClient.session;

// Sign in
await authClient.signIn.email({ email, password });

// Sign out
await authClient.signOut();
```

The implementation will be consumed by:
- Login forms (L02-Login-Form.md)
- Signup forms (S02-Signup-Form.md)
- Route guards (AU05-Protect-Routes.md)
- Session persistence (AU06-Session-Persistence.md)
- Account management pages (D01-Account-Route.md)

The reactive stores provided by the client eliminate the need for manual context setup or state management. Components can directly subscribe to authentication state and automatically receive updates.