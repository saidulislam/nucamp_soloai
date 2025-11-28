# SP04-Strapi-API-Permissions.md

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
Configure Strapi API permissions to enable public access to content types (Landing Pages, Features, FAQs) while maintaining security controls. This establishes the foundation for frontend content fetching and ensures proper access control for CMS-managed content that will be consumed by the SvelteKit application.

**Feature Type**: Technical Integration

## Requirements

### Functional Requirements
- **Public Content Access**: Configure public read permissions for Landing Pages, Features, and FAQ content types to enable frontend consumption
- **Authentication Bypass**: Allow unauthenticated API access for public marketing content while protecting admin functionality
- **Selective Field Exposure**: Control which fields are publicly accessible through API responses to prevent sensitive data exposure
- **API Endpoint Availability**: Ensure REST and GraphQL endpoints are accessible at `/api/landing-pages`, `/api/features`, and `/api/faqs`
- **Localization Support**: Enable access to i18n plugin fields for multilingual content delivery
- **Media File Access**: Configure public access to uploaded media files (images, documents) referenced in content entries

### Security Considerations
- **Admin Panel Protection**: Maintain authentication requirements for Strapi admin panel access at `/admin`
- **Write Operation Restriction**: Prevent public API access for create, update, delete operations on all content types
- **Sensitive Field Filtering**: Exclude internal fields (createdAt, updatedAt, publishedAt) from public API responses where appropriate
- **Rate Limiting Readiness**: Structure permissions to support future API rate limiting implementation
- **CORS Configuration**: Ensure API endpoints accept requests from frontend application domain

### Data Requirements
- **Content Type Coverage**: Apply permissions to all content types created in SP02-Strapi-Content-Type.md
- **Field-Level Control**: Configure granular permissions for each field within content types
- **Publication Status**: Respect published/draft status in public API responses
- **Relationship Access**: Enable access to related content and media through API relationships

## Technical Specifications

### Dependencies
- Completed Strapi container setup from SP01-Strapi-Container-Setup.md
- Existing content types from SP02-Strapi-Content-Type.md
- Seeded content from SP03-Strapi-Seed-Content.md
- Homepage content from SP06-Create-Homepage-Content.md

### Strapi Configuration Changes
- **Role Permissions**: Modify "Public" role permissions through Strapi admin panel Settings → Users & Permissions Plugin → Roles
- **API Access Configuration**: Enable "find" and "findOne" permissions for public role on all content types
- **Field Visibility**: Configure which fields are accessible through API responses using Strapi's permission matrix
- **Media Library Access**: Enable public access to uploaded files through `/uploads` endpoint
- **i18n Plugin Integration**: Ensure localization fields are accessible for multilingual content delivery

### API Endpoint Configuration
- **REST API Endpoints**: Verify public access to standard CRUD endpoints for all content types
- **GraphQL Schema**: Confirm GraphQL introspection and query capabilities for public content
- **Custom Endpoints**: Prepare structure for future custom API routes if needed
- **Response Format**: Maintain consistent JSON API response structure across all endpoints

### Environment Variables
- No new environment variables required
- Utilize existing Strapi configuration from SP01-Strapi-Container-Setup.md

## Implementation Requirements

### Permission Configuration Steps
1. **Access Strapi Admin Panel**: Navigate to http://localhost:1337/admin using admin credentials
2. **Navigate to Permissions**: Go to Settings → Users & Permissions Plugin → Roles → Public
3. **Configure Content Type Permissions**: Enable "find" and "findOne" for Landing-page, Feature, and Faq content types
4. **Set Field-Level Access**: Review and configure individual field permissions for each content type
5. **Media Library Configuration**: Enable public access to media files and uploads
6. **Save and Validate**: Apply changes and test API endpoints for proper access

### Testing Requirements
- **Public API Access**: Verify unauthenticated GET requests succeed for all content endpoints
- **Protected Operations**: Confirm POST, PUT, DELETE operations remain restricted without authentication
- **Admin Panel Security**: Ensure admin panel still requires authentication after permission changes
- **Media File Access**: Test direct access to uploaded images and files through public URLs
- **CORS Functionality**: Validate cross-origin requests work from frontend application domain

### Acceptance Criteria
- [ ] Public role has "find" and "findOne" permissions enabled for all content types
- [ ] API endpoints `/api/landing-pages`, `/api/features`, `/api/faqs` return data without authentication
- [ ] GraphQL endpoint returns schema and allows queries for public content types
- [ ] Uploaded media files are accessible through public URLs
- [ ] Admin panel remains protected and requires authentication
- [ ] Write operations (create, update, delete) remain restricted for public users
- [ ] i18n plugin fields are accessible for multilingual content support
- [ ] API responses include all configured public fields with proper JSON structure

## Integration Notes
- **Frontend Integration**: These permissions enable SP05-Strapi-Frontend-Connect.md to fetch content data
- **Localization Workflow**: Supports AI01-OpenAI-API-Setup.md and AI02-Content-Localization-Workflow.md for content translation
- **Security Foundation**: Establishes secure API access patterns for future features requiring content consumption

## Performance Considerations
- **Caching Strategy**: Configure response caching for frequently accessed content endpoints
- **Query Optimization**: Ensure database queries for public content are optimized for performance
- **Rate Limiting Preparation**: Structure permissions to accommodate future API rate limiting requirements