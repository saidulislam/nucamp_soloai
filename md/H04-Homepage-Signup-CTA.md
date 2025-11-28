# H04-Homepage-Signup-CTA.md

## Overview
Create a prominent call-to-action section on the homepage that directs users to register for the SaaS application. This section serves as the primary conversion element to drive user acquisition and will display different content based on authentication status.

**Feature Type**: User-Facing Feature

## Requirements

### User Stories
- **As a guest user**, I want to see a compelling signup CTA so that I'm encouraged to create an account and try the product
- **As an authenticated user**, I want to see a dashboard CTA so that I can quickly access my account area
- **As a user in different languages**, I want to see the CTA in my selected language so that I understand the next steps clearly

### UI/UX Requirements
- **Section Layout**: Full-width section positioned after the features preview section with centered content container (max-width 1200px)
- **Visual Hierarchy**: Large headline, supporting text, primary CTA button, and optional secondary action
- **Button Design**: Primary button using DaisyUI `btn-primary` class with sufficient contrast and minimum 44px touch target
- **Responsive Behavior**: 
  - Desktop: Horizontal layout with text left, button right
  - Tablet: Centered single column layout
  - Mobile: Stacked layout with full-width button
- **Authentication States**:
  - **Guest Users**: "Get Started Free" or "Sign Up Now" button linking to `/signup`
  - **Authenticated Users**: "Go to Dashboard" button linking to `/account`

### User Flow
1. User scrolls to CTA section after viewing features
2. System checks authentication status using Better Auth client
3. Display appropriate CTA based on authentication state
4. User clicks CTA button
5. Redirect to signup page (guests) or account dashboard (authenticated users)
6. Preserve current locale during navigation

## Technical Specifications

### Dependencies
- Better Auth client from AU04-Global-Client-Setup.md for authentication state
- Paraglide i18n from PG02-Paraglide-Configure-Langs.md for multilingual content
- Tailwind CSS and DaisyUI from A03-Configure-Tailwind-DaisyUI.md for styling
- Strapi CMS integration from SP05-Strapi-Frontend-Connect.md for dynamic content

### Database Changes
None required - uses existing Strapi content structure

### API Changes
None required - leverages existing Strapi `/api/landing-pages` endpoint

### Environment Variables
None additional required

## Functional Requirements

### Content Management
- **Dynamic Content**: Fetch CTA headline, description, and button text from Strapi landing page content
- **Multilingual Support**: Display content in English, Spanish, or French based on Paraglide locale
- **Content Fallback**: Show default English content if translation unavailable
- **Required Strapi Fields**:
  - `ctaHeadline` (30-50 characters)
  - `ctaDescription` (80-120 characters) 
  - `ctaButtonText` (10-20 characters)
  - `ctaSecondaryText` (optional, 15-30 characters)

### Authentication Integration
- **Session Detection**: Use Better Auth client to determine user authentication status
- **Dynamic Button Text**: Show "Get Started" for guests, "Dashboard" for authenticated users
- **Dynamic Navigation**: Link to `/signup` for guests, `/account` for authenticated users
- **Loading State**: Show skeleton/loading state while checking authentication status

### Performance Requirements
- **Render Time**: Section must render within 1 second of page load
- **Authentication Check**: Complete within 100ms
- **Content Loading**: Strapi content should load within 2 seconds
- **Image Optimization**: Any background images must be optimized for web delivery

### Security Considerations
- **Content Sanitization**: Sanitize any rich text content from Strapi to prevent XSS
- **URL Validation**: Validate redirect destinations for authenticated users
- **CSRF Protection**: Apply CSRF tokens to any form submissions

## Data Requirements

### Strapi Content Structure
Extend existing Landing Page content type with CTA fields:
- `ctaHeadline`: Text field, required, max 50 characters
- `ctaDescription`: Textarea field, required, max 120 characters  
- `ctaButtonText`: Text field, required, max 20 characters
- `ctaSecondaryText`: Text field, optional, max 30 characters
- `ctaBackgroundImage`: Media field, optional, for background imagery

### Paraglide Translation Keys
Required translation keys in message catalogs:
- `homepage.cta.defaultHeadline`: "Ready to get started?"
- `homepage.cta.defaultDescription`: "Join thousands of users already using our platform"
- `homepage.cta.guestButton`: "Get Started Free"
- `homepage.cta.userButton`: "Go to Dashboard"
- `homepage.cta.loading`: "Loading..."

## Prerequisites
- H03-Homepage-Features-Preview.md (component positioning)
- AU04-Global-Client-Setup.md (authentication state)
- PG02-Paraglide-Configure-Langs.md (i18n system)
- SP05-Strapi-Frontend-Connect.md (CMS integration)
- A03-Configure-Tailwind-DaisyUI.md (styling system)

## Integration Points
- **Next Feature**: Will be integrated with H05-Homepage-Footer.md for section ordering
- **Future Enhancement**: Will connect with Stripe/LemonSqueezy checkout flows in Week 3
- **Analytics Preparation**: Component structure should support future conversion tracking

## Accessibility Requirements
- **WCAG 2.1 AA Compliance**: All interactive elements must be keyboard accessible
- **Screen Reader Support**: Proper ARIA labels for authentication-dependent content
- **Color Contrast**: Minimum 4.5:1 contrast ratio for all text elements
- **Focus Management**: Visible focus indicators on all interactive elements

## Additional Context
This CTA section serves as the primary conversion point on the homepage and should be positioned prominently after users have learned about the product features. The authentication-aware behavior ensures a seamless experience for both new visitors and returning users while maintaining consistent branding and messaging across all supported languages.