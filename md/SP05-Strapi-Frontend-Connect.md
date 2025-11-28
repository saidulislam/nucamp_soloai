# Strapi Frontend Connection

## IMPORTANT IMPLEMENTATION NOTE
All content type setup and modification must be performed exclusively through the official Strapi interfaces:
- Strapi Admin UI (Content-Type Builder)
- Strapi REST API
- Strapi CLI
- Strapi Client

Directly injecting code, editing source files, or programmatically manipulating the Strapi application files or codebase to create or modify content types is STRICTLY PROHIBITED.

This restriction ensures:
- Database consistency and schema integrity
- Future compatibility with Strapi updates and plugins
- Maintainability and ease of troubleshooting
- Full support for localization, validation, and permissions features

Do NOT create or modify content types by editing model files, configuration files, or the database directly. Use only the UI/UX, official REST API, or CLI commands documented by Strapi.
If actions are required using the UI, ask the user to perform them through the Strapi Admin interface or provide instructions for using the Strapi CLI.

## Overview
- Connect SvelteKit frontend to Strapi CMS to fetch and display real content from the Landing Pages, Features, and FAQ content types
- Replace placeholder content with dynamic data from Strapi API endpoints
- Establish foundation for multilingual content delivery using i18n-enabled API responses
- Feature type: Technical Integration

## Requirements

### Technical Integration Requirements
- **Service Details**: Strapi CMS v4.15+ REST API accessible at http://localhost:1337/api
- **API Endpoints**: `/api/landing-pages`, `/api/features`, `/api/faqs` with public read permissions
- **Authentication**: No authentication required for public content endpoints
- **Integration Points**: SvelteKit load functions, page components, and content rendering

### Functional Requirements
- **Content Fetching**: Retrieve landing page, features, and FAQ data from Strapi API during page load
- **Error Handling**: Graceful handling of API failures with fallback content or error states
- **Performance**: Client-side caching of content with appropriate cache headers
- **SEO Support**: Server-side rendering of content for search engine optimization
- **Content Structure**: Handle rich text fields, media references, and relational content
- **Internationalization Ready**: Support for future i18n content delivery from Strapi

### Data Requirements
- **API Response Handling**: Parse Strapi's nested JSON response structure with data/attributes format
- **Content Validation**: Validate required fields exist before rendering
- **Media Processing**: Handle image URLs, alt text, and responsive image delivery
- **Rich Text Rendering**: Convert Strapi rich text content to HTML safely
- **Relationship Handling**: Process linked content and media references

### Security Considerations
- **API Security**: Only fetch from configured Strapi endpoints with CORS validation
- **Content Sanitization**: Sanitize HTML content from rich text fields to prevent XSS
- **Error Information**: Don't expose internal API errors to end users
- **Rate Limiting Awareness**: Implement request patterns that respect potential rate limits

### Performance Requirements
- **Load Times**: Initial content load within 2 seconds on 3G connection
- **Caching Strategy**: Cache API responses appropriately to reduce server requests
- **Progressive Loading**: Show loading states during content fetch operations
- **Bundle Size**: Minimize impact on JavaScript bundle size

## Technical Specifications

### Dependencies
- **Existing**: SvelteKit application from A01-Setup-Base-Routes.md setup
- **HTTP Client**: Use SvelteKit's built-in fetch or consider adding a lightweight HTTP client
- **HTML Sanitization**: Consider DOMPurify or similar for rich text content safety
- **Image Optimization**: Leverage SvelteKit's image optimization features

### API Integration Points
- **Load Functions**: Implement in `+page.server.ts` files for server-side data fetching
- **Client Components**: Update existing page components to consume and render Strapi content
- **Error Boundaries**: Add error handling components for API failure scenarios
- **Type Definitions**: Create TypeScript interfaces for Strapi content structure

### Content Type Integration
- **Landing Pages**: Fetch homepage content for hero sections, value propositions, and CTAs
- **Features**: Retrieve feature list with descriptions, benefits, categories, and media
- **FAQs**: Load question/answer pairs with categories and ordering

### Environment Configuration
- **STRAPI_API_URL**: Base URL for Strapi API (default: http://localhost:1337)
- **PUBLIC_STRAPI_URL**: Public-facing Strapi URL for media assets
- **STRAPI_API_TOKEN**: Optional API token for enhanced security (if configured)

### Error Handling Strategy
- **Network Failures**: Show graceful error messages with retry options
- **Content Missing**: Provide meaningful fallbacks when content is not available
- **Partial Failures**: Handle scenarios where some content loads but others fail
- **Loading States**: Implement skeleton loading UI during content fetch

## Prerequisites
- DB01-DB-Container-Setup.md: Database container must be running
- SP01-Strapi-Container-Setup.md: Strapi container and admin setup completed
- SP02-Strapi-Content-Type.md: Content types (Landing, Feature, FAQ) defined
- SP03-Strapi-Seed-Content.md: Sample content exists in database
- SP04-Strapi-API-Permissions.md: Public API permissions configured
- A01-Setup-Base-Routes.md: Base SvelteKit routes established

## Implementation Guidelines

### Content Fetching Pattern
- Use SvelteKit's `load` functions for server-side content fetching
- Implement proper error handling and loading states
- Structure API calls to minimize requests and optimize performance
- Handle Strapi's nested response format (data.attributes structure)

### Component Integration
- Update existing route components to consume Strapi content
- Maintain existing routing structure while replacing static content
- Ensure components gracefully handle missing or incomplete content
- Preserve accessibility and SEO optimizations

### Media Asset Handling
- Process Strapi media URLs for images and documents
- Implement responsive image loading with proper alt text
- Handle different media formats and sizes appropriately
- Ensure media assets load efficiently across devices

### Future-Proofing
- Structure content fetching to support future i18n integration with Paraglide
- Design API layer to accommodate authentication-gated content later
- Create reusable content fetching utilities for other components
- Maintain compatibility with upcoming AI translation workflow

### Testing Considerations
- Verify content displays correctly across all established routes
- Test error handling with network disconnection scenarios
- Validate that rich text content renders safely without XSS vulnerabilities
- Ensure server-side rendering works properly for SEO