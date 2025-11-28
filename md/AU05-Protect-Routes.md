# Route Protection and Authentication Guards

## Overview
Implement comprehensive route protection system in SvelteKit server hooks for authenticated areas of the SaaS application using Better Auth session management. Create middleware in `hooks.server.ts` to guard protected routes while providing seamless user experience with proper redirects and role-based authorization.

**IMPORTANT**: In SvelteKit, route protection **must be implemented in `hooks.server.ts`**, not in layout files. The handle hook is the recommended approach for authentication guards as it runs on every request and can prevent unauthorized access before pages load.

**Feature Type**: Technical Integration

## Requirements

### User Stories
- As a guest user, I want to be automatically redirected to `/login` when I try to access protected routes so that I understand authentication is required
- As an authenticated user, I want seamless access to protected routes without unnecessary redirects so that I can use the application efficiently
- As a user with an expired session, I want to be redirected to login with my intended destination preserved so that I can continue where I left off after re-authenticating

### Functional Requirements
1. **Hooks-Based Protection**: Implement route guards in `hooks.server.ts` using the handle hook
2. **Path Pattern Matching**: Define protected routes using regex patterns (e.g., `/app/*`, `/account/*`, `/admin/*`)
3. **Role-Based Authorization**: Check user roles against route requirements (e.g., "authenticated", "admin")
4. **Session Validation**: Verify Better Auth session exists in `event.locals.session` and `event.locals.user`
5. **Redirect Handling**: Preserve intended destination URL using `?redirectTo` parameter for post-login navigation
6. **Path Exemptions**: Skip protection for auth endpoints (`/api/auth`, `/auth/signin`, `/.well-known/`)
7. **Role Validation**: Clear session and redirect if user has no roles assigned
8. **Middleware Composition**: Use SvelteKit's `sequence()` to compose multiple middleware handlers

### Security Considerations
- **Server-Side Only Protection**: Route protection MUST happen in server hooks, not client-side code
- **Session Validation**: Always validate session data from `event.locals`, never trust client state
- **Cookie Cleanup**: Clear Better Auth session cookies when users lack proper roles
- **Redirect Safety**: Validate redirect URLs to prevent open redirect vulnerabilities
- **Path Traversal**: Use regex patterns to prevent path traversal attacks
- **Authorization Logic**: Separate authorization checks into dedicated functions for maintainability

### Performance Requirements
- Authentication checks must complete within 100ms
- Protected route loading must not introduce noticeable delay
- Session validation should use cached results when appropriate
- Failed authentication checks should fail fast without blocking UI

## Technical Specifications

### Dependencies
- Better Auth client from `AU04-Global-Client-Setup.md`
- Better Auth server handler from `AU03-Mount-BetterAuth-Handler.md`
- SvelteKit routing system and load functions
- Existing route structure from `A01-Setup-Base-Routes.md`

### Implementation Components

**⚠️ IMPORTANT**: Do NOT implement route protection in `+layout.server.ts` or `+layout.ts` files. Authorization logic in layout files is not guaranteed to run for all routes (especially `+server.ts` endpoints) and can lead to security vulnerabilities.

#### 1. Route Configuration File

**File**: `src/routes.ts`

Define protected routes with regex patterns and required roles:

```typescript
type Route = {
  path: RegExp;
  allowedRoles: string[];
};

const protectedRoutes: Route[] = [
  { path: /.*\/app\/.*$/, allowedRoles: ['authenticated'] },
  { path: /.*\/account\/.*$/, allowedRoles: ['authenticated'] },
  { path: /.*\/admin\/.*$/, allowedRoles: ['admin'] }
];

export function isRouteAuthorized(currentRoute: string, userRoles: string[]): boolean {
  for (const route of protectedRoutes) {
    if (route.path.test(currentRoute)) {
      return userRoles.some(role => route.allowedRoles.includes(role));
    }
  }
  return true; // Allow access to unprotected routes
}
```

#### 2. Route Protection Middleware

**File**: `src/hooks.server.ts`

Implement the `protectRoutes` handle function:

```typescript
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { isRouteAuthorized } from './routes';

const protectRoutes: Handle = async ({ event, resolve }) => {
  // Skip protection for certain paths
  if (
    event.url.pathname.startsWith('/.well-known/') ||
    event.url.pathname.startsWith('/api/auth') ||
    event.url.pathname.startsWith('/auth/')
  ) {
    return resolve(event);
  }

  // Use Better Auth session from event.locals (populated by betterAuthHandle)
  const session = event.locals.session;
  const user = event.locals.user;
  const roles = user?.roles || [];

  // If user has session but no roles, clear session and redirect
  if (session && user && !roles.length) {
    console.log('User has no roles, clearing session');
    event.cookies.delete('better-auth.session_token', { path: '/' });
    event.cookies.delete('__Secure-better-auth.session_token', { path: '/' });
    throw redirect(303, `/auth/signin?redirectTo=${event.url.pathname}`);
  }

  // Check route authorization
  const rolesArray = typeof roles === 'string' ? [roles] : roles;
  const isAuthorized = isRouteAuthorized(event.url.pathname, rolesArray);

  if (!isAuthorized) {
    throw redirect(303, `/auth/signin?redirectTo=${event.url.pathname}`);
  }

  return resolve(event);
};

// Compose with other middleware using sequence
export const handle = sequence(
  // betterAuthHandle should run first to populate session
  betterAuthHandle,
  // Then run route protection
  protectRoutes,
  // Other middleware...
);
```

#### 3. Integration with Better Auth

The `protectRoutes` middleware relies on session data populated by `betterAuthHandle`:

```typescript
const betterAuthHandle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({
    headers: event.request.headers
  });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return resolve(event);
};
```

**Key Implementation Notes**:
- Route protection runs in `hooks.server.ts` as middleware
- Session data must be populated before route protection runs
- Use `sequence()` to ensure proper middleware execution order
- Regex patterns provide flexible route matching
- Role arrays support multiple authorization levels
- Redirect preserves destination for post-login navigation

### Database Changes
None required - utilizes existing Better Auth session tables

### API Changes
None required - utilizes existing Better Auth authentication endpoints

### Environment Variables
None additional required - uses existing Better Auth configuration

### Role Configuration
Define roles in your Better Auth user schema:
- `authenticated` - Basic authenticated user role
- `admin` - Administrator with elevated privileges
- Custom roles as needed for your application

The Solo AI Reference project expects users to have at least one role. Users without roles are logged out and redirected to signin.

## Why Hooks-Based Protection?

### Advantages of Server Hooks
1. **Runs on Every Request**: The handle hook executes for ALL requests including `+server.ts` endpoints
2. **Prevents Data Exposure**: Blocks unauthorized access before any page/endpoint code runs
3. **Single Source of Truth**: Centralized authorization logic in one place
4. **No Propagation Issues**: Unlike layout files, hooks are guaranteed to run
5. **API Endpoint Protection**: Protects both page routes and API routes uniformly

### Why NOT Layout Files?
According to SvelteKit documentation and community best practices:
- ❌ Layout logic is NOT guaranteed to run for all leafs in the route tree
- ❌ Layout functions do NOT run for `+server.ts` endpoints (API routes)
- ❌ Can lead to security vulnerabilities where API endpoints are unprotected
- ❌ Difficult to maintain when protection logic is scattered across multiple files

### Optional Page-Level Protection
For specific pages that need additional authorization beyond the hooks:

```typescript
// In +page.server.ts (optional, for page-specific checks)
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Additional page-specific authorization
  if (!locals.user?.isAdmin) {
    throw error(403, 'Admin access required');
  }

  // Load page data...
};
```

**Use page-level checks only for:**
- Fine-grained authorization (e.g., checking if user owns a specific resource)
- Additional role checks beyond the base hook protection
- Page-specific business logic validation

**The hooks remain the primary security layer** - page-level checks are supplementary only.

## Prerequisites
- `AU02-BetterAuth-Init.md` - Better Auth server configuration with user roles
- `AU03-Mount-BetterAuth-Handler.md` - Authentication API endpoints and session population
- `A01-Setup-Base-Routes.md` - Basic route structure

## Integration Points
- Works with account pages (`D01-Account-Route.md`, `D02-Account-Overview.md`)
- Supports dashboard routes and admin areas through role configuration
- Integrates with Paraglide i18n for localized signin redirects
- Compatible with existing navigation from `A02-Create-Layout-Component.md`

## Success Criteria
1. ✅ All protected routes checked in hooks.server.ts before page load
2. ✅ Unauthenticated users automatically redirected to signin
3. ✅ Role-based access control working for different user types
4. ✅ Auth endpoints and public paths properly exempted
5. ✅ Redirect destination preserved via `?redirectTo` parameter
6. ✅ Session cookies cleared when user has invalid role state
7. ✅ API endpoints protected alongside page routes
8. ✅ No security vulnerabilities from layout file protection attempts