# H02-Homepage-Hero.md

## Overview
Create a compelling hero section for the homepage that dynamically renders content from Strapi CMS with multilingual support. The hero section serves as the primary conversion element, featuring headline, subtext, and call-to-action button to drive user engagement and signups.

**Feature Type**: User-Facing Feature

**Business Value**: First impression for visitors, primary conversion driver for user acquisition, establishes brand positioning and value proposition.

## Requirements

### User Stories
- As a visitor, I want to immediately understand the product value proposition so that I can decide if it meets my needs
- As a visitor, I want to see a clear call-to-action so that I can easily start using the product
- As a visitor, I want to view the hero content in my preferred language so that I can better understand the offering
- As a marketing manager, I want to update hero content through Strapi CMS so that I can optimize messaging without code changes

### UI/UX Requirements
- **Hero Layout**: Full-width section with centered content, maximum 1200px container width
- **Visual Hierarchy**: Large headline (48-64px desktop, 32-40px mobile), supporting subtext (18-24px), prominent CTA button
- **Background**: Subtle gradient or solid color background that doesn't compete with text readability
- **Responsive Behavior**: 
  - Desktop: Two-column layout with text left, optional hero image/illustration right
  - Tablet: Single column with reduced spacing
  - Mobile: Stacked layout with optimized typography sizes
- **Call-to-Action**: Primary button styled with DaisyUI, minimum 44px height for touch targets
- **Authentication Awareness**: Show "Get Started" for guests, "Go to Dashboard" for authenticated users

### User Flow
1. User lands on homepage (/) 
2. Hero section loads with Strapi content in user's selected language
3. User reads headline and value proposition
4. User clicks CTA button → redirected to /signup (guest) or /account (authenticated)
5. Loading states shown during content fetch, graceful fallback if Strapi unavailable

### Functional Requirements
- **Dynamic Content Rendering**: Fetch hero content from Strapi `/api/landing-pages` endpoint
- **Multilingual Support**: Display content in user's selected language (English/Spanish/French) using Paraglide
- **Authentication Integration**: Detect user login status via Better Auth client and customize CTA accordingly
- **Content Fallback**: Display default content if Strapi CMS is unavailable or returns errors
- **Rich Text Support**: Process and sanitize rich text content from Strapi to prevent XSS attacks
- **Media Handling**: Support optional hero images with responsive loading and proper alt text

**Acceptance Criteria**:
- Hero section renders within 2 seconds on 3G connection
- Content updates immediately when user changes language via language switcher
- CTA button reflects authentication status without page reload
- Hero content is editable through Strapi admin panel
- All text content supports HTML formatting from Strapi rich text fields
- Hero section maintains visual hierarchy and readability across all screen sizes

### Data Requirements
- **Strapi Content Structure**: Use existing Landing Page content type from SP02-Strapi-Content-Type.md
- **Required Fields**: 
  - `heroHeadline` (Text, 50-60 characters)
  - `heroSubheadline` (Text, 100-120 characters) 
  - `heroCta` (Text, call-to-action button text)
  - `heroImage` (Media, optional background/illustration)
- **Localization**: Content must exist in English (default), Spanish (es), and French (fr) locales
- **Content Validation**: Headline and CTA text are required fields, subheadline optional
- **Media Assets**: Hero images optimized for web delivery, maximum 2MB file size

### Security Considerations
- **Content Sanitization**: All rich text content from Strapi must be sanitized to prevent XSS injection
- **Media Security**: Validate uploaded hero images for proper file types and size limits
- **API Security**: Use public Strapi API permissions configured in SP04-Strapi-API-Permissions.md
- **Input Validation**: Validate locale parameters to prevent locale injection attacks

### Performance Requirements
- **Load Time**: Hero section visible within 1.5 seconds of page load
- **Content Fetch**: Strapi API response within 800ms under normal conditions
- **Image Loading**: Hero images lazy-loaded with progressive enhancement, WebP format preferred
- **Language Switching**: Content updates within 300ms when user changes language
- **Caching**: Implement appropriate cache headers for Strapi content (5-minute cache recommended)

## Technical Specifications

### Dependencies
- **Existing Components**: Main layout component from A02-Create-Layout-Component.md
- **Strapi Integration**: Builds on SP05-Strapi-Frontend-Connect.md for API connectivity
- **i18n System**: Paraglide configuration from PG02-Paraglide-Configure-Langs.md and PG03-Paraglide-Translate-Content.md
- **Authentication**: Better Auth client from AU04-Global-Client-Setup.md for user status detection
- **Styling**: Tailwind CSS and DaisyUI from A03-Configure-Tailwind-DaisyUI.md

### Database Changes
No database schema changes required - uses existing Strapi Landing Page content type and i18n structure.

### API Changes
No new API endpoints required - uses existing Strapi REST API at `/api/landing-pages` with i18n support.

### Environment Variables
No new environment variables required - uses existing `STRAPI_API_URL` and `PUBLIC_STRAPI_URL` from SP05-Strapi-Frontend-Connect.md.

## Integration Points

### Prerequisites
- **H01-Home-Route.md**: Homepage route structure and Strapi data fetching
- **SP02-Strapi-Content-Type.md**: Landing Page content type with hero fields
- **SP06-Create-Homepage-Content.md**: Actual hero content authored in Strapi
- **PG03-Paraglide-Translate-Content.md**: Multilingual content delivery system
- **AU04-Global-Client-Setup.md**: Better Auth client for authentication status

### Extension Points for Future Features
- **Hero A/B Testing**: Component structure supports multiple hero variants
- **Analytics Integration**: Event tracking points prepared for conversion analytics  
- **Advanced CTAs**: Support for multiple CTA buttons or conditional messaging
- **Video Backgrounds**: Architecture supports video hero backgrounds
- **Personalization**: User-specific hero content based on profile or behavior

### Implementation Notes
- Hero component should be reusable across different landing pages
- Implement loading skeleton that matches final hero layout
- Support both text-only and text-with-image hero variations
- Ensure hero section works without JavaScript for SEO crawlers
- Consider viewport height calculations for above-the-fold optimization
- Plan for future integration with analytics tracking for conversion measurement

## Component Architecture
- **HeroSection.svelte**: Main hero component with responsive layout
- **HeroCTA.svelte**: Authentication-aware call-to-action button component  
- **HeroContent.svelte**: Text content rendering with i18n support
- **HeroImage.svelte**: Optional hero image with responsive loading
- Integration within existing `src/routes/+page.svelte` homepage structure