# SP02-Strapi-Content-Type.md

## IMPORTANT IMPLEMENTATION NOTE

### Recommended Methods for Content Type Creation

Content types can be created through several official Strapi methods:

#### 1. **Strapi Admin UI (Content-Type Builder)** - Recommended for manual setup
- Access at `http://localhost:1337/admin`
- Navigate to Content-Type Builder
- Use visual interface to create content types and fields
- Best for: Initial setup, prototyping, visual configuration

#### 2. **Filesystem Method (Development Mode)** - Recommended for automated setup
When Strapi is running in development mode, content types can be safely created by adding properly structured files to the Strapi filesystem. This method is safe and officially supported:

**Prerequisites:**
- Strapi must be running in development mode (NODE_ENV=development)
- Container must be restarted after adding files for changes to take effect

**File Structure Required:**
```
src/
├── api/
│   ├── [content-type-name]/
│   │   ├── content-types/
│   │   │   └── [content-type-name]/
│   │   │       └── schema.json
│   │   ├── controllers/
│   │   │   └── [content-type-name].js
│   │   ├── routes/
│   │   │   └── [content-type-name].js
│   │   └── services/
│   │       └── [content-type-name].js
└── components/
    └── [category]/
        └── [component-name].json
```

**Implementation Steps:**
1. Create content type files locally in a staging directory
2. Copy files to Strapi container: `docker cp [local-path] [container-name]:/srv/app/src/`
3. Restart Strapi container: `docker restart [container-name]`
4. Verify in Strapi admin panel or via API endpoints

This method ensures:
- Reproducible deployments
- Version control compatibility
- Automated provisioning capabilities
- Database schema generation handled by Strapi

#### 3. **Strapi REST API** - For programmatic creation
- Use authenticated API calls to Content-Type Builder endpoints
- Requires admin JWT token
- Best for: CI/CD pipelines, automated provisioning

#### 4. **Strapi CLI** - For command-line operations
- Use `strapi generate` commands
- Available inside container via `docker exec`
- Best for: Scripted deployments

### What NOT to Do
- Never directly modify database schemas
- Avoid editing files while Strapi is running (except in development mode)
- Don't bypass Strapi's content type generation system


## Overview
- Define comprehensive content types in Strapi CMS to support multilingual SaaS marketing website
- Create structured content models for Landing pages, Feature descriptions, and FAQ entries
- Enable content creators to manage homepage, features, and support content through Strapi admin UI
- Establish foundation for AI-powered content localization workflow
- Feature type: Technical Integration

## Requirements

### Content Type Structure
Create three core content types in Strapi that support the marketing website structure:

1. **Landing Page Content Type** - For homepage and marketing pages
2. **Feature Content Type** - For product feature descriptions  
3. **FAQ Content Type** - For frequently asked questions and support content

### Functional Requirements

#### Landing Page Content Type (`landing-page`)
- **Page Identifier**: Unique slug field (e.g., "homepage", "about", "product-overview")
- **Hero Section**: Title, subtitle, description, and call-to-action text
- **Media Support**: Hero image/video upload capability
- **SEO Fields**: Meta title, meta description, Open Graph title/description
- **Content Sections**: Rich text editor for flexible content blocks
- **Publication Status**: Draft/Published workflow
- **Localization Ready**: Enable i18n plugin for multi-language support

#### Feature Content Type (`feature`)
- **Feature Identity**: Name, slug, and short description fields
- **Feature Details**: Long description with rich text formatting
- **Visual Assets**: Icon upload field and optional feature image
- **Categorization**: Category field for grouping related features
- **Priority Ordering**: Order/priority number for display sequence  
- **Benefits**: Repeatable component for feature benefits list
- **CTA Configuration**: Optional call-to-action text and link
- **Publication Status**: Draft/Published workflow
- **Localization Ready**: Enable i18n plugin for translations

#### FAQ Content Type (`faq`)
- **Question/Answer Pair**: Question text field and rich text answer field
- **Categorization**: Category field (e.g., "Billing", "Account", "Technical")
- **Priority Ordering**: Order number for display sequence within category
- **Helpfulness**: Optional helpfulness rating or vote count fields
- **Related Links**: Optional related documentation or page links
- **Publication Status**: Draft/Published workflow  
- **Localization Ready**: Enable i18n plugin for translations

### Data Requirements

#### Field Specifications
- **Text Fields**: Use "Text" type for short content, "Long text" for descriptions
- **Rich Text**: Use "Rich text" type with CKEditor for formatted content
- **Media Fields**: Use "Media" type with proper file validation (images: JPG/PNG/WebP, max 5MB)
- **Slug Fields**: Auto-generate from title with URL-safe formatting
- **Number Fields**: Use "Number" type for ordering/priority fields
- **Select Fields**: Use "Enumeration" type for category dropdowns
- **Boolean Fields**: Use "Boolean" type for publication status toggles

#### Content Validation
- Required fields: title, slug, content/description for all content types
- Unique constraints: slug fields must be unique within content type
- String length limits: titles (200 chars), meta descriptions (160 chars)
- Rich text sanitization: Allow safe HTML tags, strip dangerous content
- File upload restrictions: Image files only for media fields, reasonable size limits

### Technical Specifications

#### Prerequisites
- Complete DB01-DB-Container-Setup.md (MySQL database running)
- Complete SP01-Strapi-Container-Setup.md (Strapi admin accessible)

#### Strapi Configuration
- **Content Type Builder**: Use Strapi admin panel Content-Type Builder
- **Field Configuration**: Configure all field types with proper validation rules  
- **Relationships**: Avoid complex relationships initially for simplicity
- **Permissions**: Configure in SP04-Strapi-API-Permissions.md (upcoming)
- **API Endpoints**: Auto-generated REST endpoints at `/api/landing-pages`, `/api/features`, `/api/faqs`

#### Database Impact  
- New tables created automatically by Strapi: `landing_pages`, `features`, `faqs`
- Localization tables: `landing_pages_localizations`, etc. (when i18n enabled)
- Media relation tables: `files_related_morphs` for uploaded assets
- No manual database migrations required - Strapi handles schema generation

#### Integration Points
- **AI Localization**: Content types must support i18n plugin for AI02-Content-Localization-Workflow.md
- **Frontend Consumption**: API endpoints will be consumed in SP05-Strapi-Frontend-Connect.md
- **Content Creation**: Content will be authored in SP06-Create-Homepage-Content.md
- **Translation Workflow**: Prepared for AI01-OpenAI-API-Setup.md integration

#### Environment Variables
- No new environment variables required
- Uses existing Strapi database connection from SP01-Strapi-Container-Setup.md
- Content-Type Builder requires admin authentication established in SP01

## Security Considerations
- Admin-only access to Content-Type Builder through Strapi authentication
- Field validation prevents XSS attacks in rich text content
- File upload restrictions prevent malicious file execution
- API permissions will be configured separately in SP04-Strapi-API-Permissions.md
- Content sanitization for user-generated rich text fields

## Performance Requirements
- Content-Type Builder operations complete within 10 seconds
- API response times under 200ms for content retrieval
- Media file uploads process within 30 seconds for 5MB files
- Support for 100+ content entries per type without performance degradation
- Efficient database indexing on slug and category fields

## Implementation Example

### Creating Content Types via Filesystem Method

Here's a complete example of creating the Landing Page content type using the filesystem method:

#### Step 1: Create schema.json file
```json
// File: api/landing-page/content-types/landing-page/schema.json
{
  "kind": "collectionType",
  "collectionName": "landing_pages",
  "info": {
    "singularName": "landing-page",
    "pluralName": "landing-pages",
    "displayName": "Landing Page"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  },
  "attributes": {
    "pageIdentifier": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "heroTitle": {
      "type": "string",
      "required": true,
      "maxLength": 200,
      "pluginOptions": {
        "i18n": {
          "localized": true
        }
      }
    }
    // ... additional fields
  }
}
```

#### Step 2: Create controller file
```javascript
// File: api/landing-page/controllers/landing-page.js
'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::landing-page.landing-page');
```

#### Step 3: Create routes file
```javascript
// File: api/landing-page/routes/landing-page.js
'use strict';
const { createCoreRouter } = require('@strapi/strapi').factories;
module.exports = createCoreRouter('api::landing-page.landing-page');
```

#### Step 4: Create service file
```javascript
// File: api/landing-page/services/landing-page.js
'use strict';
const { createCoreService } = require('@strapi/strapi').factories;
module.exports = createCoreService('api::landing-page.landing-page');
```

#### Step 5: Deploy to container
```bash
# Copy files to Strapi container
docker cp ./api soloai-strapi-1:/srv/app/src/
docker cp ./components soloai-strapi-1:/srv/app/src/

# Restart container to load content types
docker restart soloai-strapi-1

# Verify API endpoints (403 is expected without permissions)
curl -I http://localhost:1337/api/landing-pages
```

## Additional Context for AI Assistant

This content type setup establishes the content architecture foundation that will support:

1. **Homepage content management** in SP06-Create-Homepage-Content.md
2. **API consumption** in SP05-Strapi-Frontend-Connect.md  
3. **AI translation workflows** in AI02-Content-Localization-Workflow.md
4. **Multi-language content** through Paraglide integration

The content types should be flexible enough to support various marketing page layouts while maintaining consistency with the SaaS application architecture using SvelteKit, Tailwind CSS, and the established Docker container setup.

Content creators will use these types to manage all marketing copy, feature descriptions, and support documentation that will be automatically translated and served to the SvelteKit frontend through the Strapi REST API.