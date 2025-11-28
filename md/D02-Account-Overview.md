# D02-Account-Overview.md

## Overview
Create comprehensive account overview dashboard displaying user profile information, account status, and subscription details for authenticated users. This dashboard serves as the main landing page after login, providing users with a clear view of their account status and quick access to account management features.

**Feature Type**: User-Facing Feature

## Requirements

### User Stories
- As an authenticated user, I want to see my profile information so that I can verify my account details
- As a user, I want to view my account status so that I understand my current subscription and verification state
- As a user, I want to see my subscription details so that I can understand my current plan and billing status
- As a user, I want quick access to account management actions so that I can easily update my profile or billing

### UI/UX Requirements
- Clean, card-based dashboard layout using DaisyUI components with consistent spacing and visual hierarchy
- Mobile-first responsive design supporting desktop, tablet, and mobile viewports (320px+)
- User profile card displaying avatar placeholder, display name, email address, and account creation date
- Account status indicators showing email verification status, subscription tier, and last login timestamp
- Quick action buttons for common tasks: Edit Profile, Manage Billing, Update Password, Logout
- Loading states with skeleton components during data fetching
- Error states with retry options for failed API requests
- Empty states for missing or incomplete profile information

### User Flow
1. User navigates to `/account` route (after authentication)
2. System validates session and loads user data from Better Auth
3. Dashboard displays profile information in organized card layout
4. User can view account details and access management actions
5. Real-time updates reflect any changes made to profile or subscription

## Functional Requirements

### Profile Information Display
- Display user's email address with verification status indicator (verified/unverified badge)
- Show display name or fallback to email username if name not provided
- Display account creation date in localized format based on user's language preference
- Show last login timestamp to help users track account access
- Avatar placeholder with user initials or generic user icon

### Account Status Information
- Email verification status with clear visual indicators (green checkmark for verified, yellow warning for unverified)
- Current subscription tier (Free, Pro, Enterprise) with visual tier badges
- Account type indicators (Trial, Active, Suspended, Cancelled)
- Next billing date for paid subscriptions
- Usage statistics or limits where applicable

### Navigation and Actions
- Primary action buttons: "Edit Profile", "Manage Billing", "Change Password"
- Secondary actions: "Download Data", "Delete Account", "Contact Support"
- Logout button with confirmation dialog
- Breadcrumb navigation showing current location
- Link to account settings and preferences

### Internationalization
- All text content translatable using Paraglide i18n system
- Support for English (default), Spanish (es), and French (fr) locales
- Date and time formatting respecting user's locale preferences
- Currency formatting for billing information based on user location

## Data Requirements

### User Profile Data
- Fetch user profile from Better Auth session including id, email, name, emailVerified, createdAt, lastLogin
- Handle missing or incomplete profile data gracefully with appropriate defaults
- Cache user data client-side to prevent unnecessary refetching

### Account Status Data
- Retrieve subscription information from Stripe/LemonSqueezy integration (when available)
- Load email verification status from Better Auth user record
- Calculate account age and format dates for display

### Data Validation
- Validate user session before displaying sensitive information
- Sanitize all user-provided data before rendering to prevent XSS attacks
- Handle edge cases like missing names, unverified emails, or expired sessions

## Security Considerations

### Authentication Requirements
- Require valid Better Auth session to access account overview
- Implement server-side session validation in addition to client-side checks
- Redirect unauthenticated users to `/login?redirect=/account`

### Data Protection
- Never expose sensitive information like password hashes or internal user IDs
- Mask or truncate sensitive data appropriately (e.g., partial credit card numbers)
- Implement proper error handling that doesn't leak system information

### Authorization
- Users can only view their own account information
- Implement proper session management with automatic logout on session expiration
- Validate user permissions for accessing account data

## Performance Requirements

### Loading Performance
- Initial page load must complete within 2 seconds on 3G connection
- Authentication check must complete within 100ms
- User data fetching should complete within 500ms
- Progressive loading with skeleton states for better perceived performance

### Caching Strategy
- Cache user profile data for 5 minutes to reduce API calls
- Implement proper cache invalidation when user data changes
- Use browser caching for static assets (avatars, icons)

### Error Handling
- Graceful degradation when user data is unavailable
- Retry mechanisms for failed API requests with exponential backoff
- Clear error messages without exposing system internals

## Technical Specifications

### Dependencies
- Better Auth client for session management and user data retrieval
- Paraglide i18n for internationalization
- DaisyUI for component styling
- Existing route protection from AU05-Protect-Routes.md

### Component Architecture
- Main AccountOverview component in `src/routes/account/+page.svelte`
- Reusable ProfileCard component in `src/lib/components/account/ProfileCard.svelte`
- AccountStatus component in `src/lib/components/account/AccountStatus.svelte`
- QuickActions component in `src/lib/components/account/QuickActions.svelte`

### File Structure
```
src/routes/account/
├── +page.svelte (main account overview)
├── +layout.server.ts (session validation)
└── +layout.ts (client-side auth check)

src/lib/components/account/
├── ProfileCard.svelte
├── AccountStatus.svelte
├── QuickActions.svelte
└── index.ts (component exports)
```

### Environment Variables
- No new environment variables required
- Uses existing Better Auth configuration from AU02-BetterAuth-Init.md

### Integration Points
- Better Auth session management from AU04-Global-Client-Setup.md
- Route protection middleware from AU05-Protect-Routes.md
- Main layout component from A02-Create-Layout-Component.md
- Paraglide i18n system from PG02-Paraglide-Configure-Langs.md

## Additional Context for AI Assistant

### Prerequisites
This feature builds upon:
- `D01-Account-Route.md` - Basic account route structure and authentication guards
- `AU04-Global-Client-Setup.md` - Better Auth client configuration
- `AU05-Protect-Routes.md` - Route protection middleware
- `A02-Create-Layout-Component.md` - Main layout component
- `PG02-Paraglide-Configure-Langs.md` - Internationalization setup

### Implementation Notes
- This is a read-only view of user account information
- Profile editing functionality will be implemented in `D03-Account-Update-Form.md`
- Billing management will be added in `D04-Account-Billing.md`
- Logout functionality will be implemented in `D05-Account-Logout.md`

### Design Considerations
- Use card-based layout to organize different types of account information
- Maintain visual consistency with login/signup pages using DaisyUI components
- Ensure proper loading states since this page requires authenticated user data
- Consider future integration with Stripe/LemonSqueezy subscription data

### Accessibility Requirements
- WCAG 2.1 AA compliance with proper heading hierarchy
- Keyboard navigation support for all interactive elements
- Screen reader compatibility with appropriate ARIA labels
- High contrast ratios for text and background colors
- Focus indicators for all interactive elements