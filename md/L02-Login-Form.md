# Build Better Auth Sign-in Form with Email/Password and Social/OAuth Options

## Overview
- Build comprehensive login form component integrating Better Auth client with email/password authentication and social OAuth providers (Google, GitHub, Discord)
- Provide seamless user authentication experience with proper validation, error handling, and accessibility
- Feature type: User-Facing Feature with Technical Integration

## Requirements

### User Stories
- As a new user, I want to log in with email/password so that I can access my account securely
- As a user, I want to log in with Google/GitHub/Discord so that I can authenticate quickly without creating new credentials
- As a user, I want clear feedback when login fails so that I can understand and fix authentication issues
- As a user, I want the form to remember my intended destination so that I'm redirected appropriately after login

### UI/UX Requirements
- Login form with email and password input fields using DaisyUI form components
- Social authentication buttons for Google, GitHub, and Discord with recognizable provider branding
- Form validation with inline error messages and success states
- Loading states during authentication requests with disabled form submission
- Mobile-first responsive design with touch-friendly button sizes (minimum 44px tap targets)
- Clear visual hierarchy with primary email/password form and secondary social options
- Consistent styling with main layout and design system established in A02-Create-Layout-Component.md and A03-Configure-Tailwind-DaisyUI.md

### User Flow
1. User navigates to `/login` route (completed in L01-Login-Route.md)
2. User sees login form with email/password fields and social provider buttons
3. User enters credentials OR clicks social provider button
4. Form validates input and shows loading state during authentication
5. On success: redirect to intended destination or `/account` route
6. On failure: display specific error message with retry option

### Functional Requirements
- **Email/Password Authentication**: Submit credentials to Better Auth client signIn method with proper validation
- **Social OAuth Integration**: Trigger OAuth flows for Google, GitHub, Discord using Better Auth social provider methods
- **Form Validation**: Client-side validation for email format, password requirements, and required fields
- **Error Handling**: Display authentication errors (invalid credentials, account locked, network issues) with user-friendly messages
- **Redirect Handling**: Respect `?redirect` query parameter from L01-Login-Route.md for post-login navigation
- **Loading States**: Show loading indicators during authentication requests and disable form submission to prevent duplicate requests
- **Accessibility**: WCAG 2.1 AA compliance with proper labels, focus management, and keyboard navigation

**Acceptance Criteria**:
- Form successfully authenticates users using email/password through Better Auth client
- Social login buttons trigger OAuth flows and complete authentication
- Invalid credentials display appropriate error messages without exposing sensitive information
- Form prevents submission during loading states and provides visual feedback
- Successful authentication redirects to intended destination or default `/account` route
- All form elements are accessible via keyboard navigation and screen readers

### Data Requirements
- Email input validation (format, required field)
- Password input with secure entry (masked characters)
- Authentication state management using Better Auth client from AU04-Global-Client-Setup.md
- Form state management for loading, errors, and validation messages
- OAuth provider configuration matching AU02-BetterAuth-Init.md server setup

### Security Considerations
- Use Better Auth client methods exclusively - never handle credentials directly
- Implement CSRF protection through Better Auth's built-in mechanisms
- Prevent credential exposure in error messages or client-side logging
- Rate limiting handled by Better Auth server configuration
- Secure OAuth redirect handling with state validation
- No credential storage in localStorage or client-side persistence

### Performance Requirements
- Form rendering within 100ms of page load
- Authentication requests complete within 3 seconds under normal conditions
- Social OAuth flows initiate within 500ms of button click
- Client-side validation feedback appears within 100ms of input events

## Technical Specifications

### Dependencies
- Better Auth client from AU04-Global-Client-Setup.md for authentication methods
- Paraglide i18n from PG02-Paraglide-Configure-Langs.md for form labels and error messages
- Tailwind CSS and DaisyUI from A03-Configure-Tailwind-DaisyUI.md for styling
- Main layout integration from A02-Create-Layout-Component.md

### Integration Points
- Better Auth client signIn method for email/password authentication
- Better Auth social provider methods (signInWithGoogle, signInWithGitHub, signInWithDiscord)
- Better Auth session state for authentication status checking
- Paraglide translation functions for multilingual form content
- SvelteKit navigation for post-authentication redirects

### Environment Variables
- Uses existing Better Auth configuration from AU02-BetterAuth-Init.md
- OAuth provider credentials (GOOGLE_CLIENT_ID, GITHUB_CLIENT_ID, etc.) already configured
- No additional environment variables required

### Form Component Structure
- Create reusable LoginForm component in `src/lib/components/auth/`
- Separate components for EmailPasswordForm and SocialAuthButtons
- Form validation utilities for email format and password requirements
- Error message components with internationalization support
- Loading state management with visual indicators

### Translation Keys Required
```
auth.login.title
auth.login.email.label
auth.login.email.placeholder
auth.login.email.required
auth.login.email.invalid
auth.login.password.label
auth.login.password.placeholder
auth.login.password.required
auth.login.submit
auth.login.loading
auth.login.error.invalid_credentials
auth.login.error.account_locked
auth.login.error.network
auth.login.social.google
auth.login.social.github
auth.login.social.discord
auth.login.social.divider
```

### Prerequisites
- L01-Login-Route.md: Login route and page structure
- AU04-Global-Client-Setup.md: Better Auth client configuration
- AU03-Mount-BetterAuth-Handler.md: Better Auth server handler
- AU02-BetterAuth-Init.md: Better Auth initialization with OAuth providers
- PG02-Paraglide-Configure-Langs.md: Internationalization setup
- A03-Configure-Tailwind-DaisyUI.md: Styling framework configuration

### API Integration
- Better Auth client methods for authentication
- OAuth provider endpoints configured in Better Auth server
- Session state management through Better Auth reactive stores
- Error handling for network failures and authentication rejections

## Additional Context for AI Assistant

### Form Architecture
This login form is a critical user-facing component that must integrate seamlessly with:
1. **Better Auth Client**: Use established client from AU04-Global-Client-Setup.md for all authentication operations
2. **Existing Route Structure**: Build upon route foundation from L01-Login-Route.md
3. **Design System**: Follow patterns from A03-Configure-Tailwind-DaisyUI.md and layout from A02-Create-Layout-Component.md
4. **Internationalization**: Support English, Spanish, French using Paraglide system

### Social Provider Configuration
The OAuth providers (Google, GitHub, Discord) are already configured in the Better Auth server from AU02-BetterAuth-Init.md. The form should trigger these flows using Better Auth client methods without additional API configuration.

### Error Handling Strategy
- Use Better Auth's error response format
- Never expose sensitive authentication details
- Provide clear, actionable error messages
- Support retry mechanisms for transient failures

### Future Integration Points
- Form will connect to Mautic user provisioning (Week 2, Lesson 3)
- Authentication success will trigger welcome campaign workflows
- User profile data will populate from Better Auth session state

This form component should be production-ready with comprehensive error handling, accessibility compliance, and multilingual support while maintaining security best practices throughout the authentication flow.