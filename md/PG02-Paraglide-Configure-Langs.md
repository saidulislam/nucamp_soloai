# PG02-Paraglide-Configure-Langs.md

## Overview
Configure multiple languages and implement a language switcher for the SvelteKit application using Paraglide i18n. This builds upon the basic Paraglide installation to enable users to switch between supported locales and establishes the foundation for AI-powered content localization from Strapi CMS.

**Business Value**: Enables multilingual user experience with seamless language switching, preparing the application for global markets and automated content translation workflows.

**Feature Type**: Technical Integration

## Requirements

### Functional Requirements

#### Language Configuration
- **Language Support**: Configure English (en) as default locale with fr, hi, es, pt, de, it, ur, fi, nb, ar, ru as additional supported languages
- **Locale Detection**: Implement automatic locale detection from browser preferences with fallback to default locale
- **URL Structure**: Support locale-aware routing with optional locale prefix (/, /es/, /fr/ etc/...) without breaking existing routes
- **Persistence**: Store user's selected language preference in browser localStorage with session persistence

#### Language Switcher Component
- **Visual Design**: Create accessible dropdown or button group language switcher with country flags or language codes
- **Placement**: Position language switcher in main navigation header for consistent access across all pages
- **State Management**: Display current active locale and provide visual feedback during language changes
- **Functionality**: Enable instant language switching without page reload where possible

#### Content Translation Infrastructure
- **Message Structure**: Organize translation keys by feature/page with nested namespacing (nav.home, auth.login, etc.)
- **Content Types**: Support UI text translations, form labels, error messages, and dynamic content placeholders
- **Fallback Strategy**: Implement fallback to default locale for missing translations with development warnings
- **Integration Points**: Prepare translation key structure for future Strapi CMS content integration

### Technical Specifications

#### Dependencies
- Paraglide i18n library (already installed from PG01-Paraglide-Install.md)
- SvelteKit routing system compatibility
- TypeScript support for translation function types

#### Configuration Files
- **project.inlang.json**: Update with supported language codes, source language, and locale paths
- **messages/ directory**: Create separate .json files for each locale (en.json, es.json, fr.json)
- **Environment variables**: Configure PUBLIC_SUPPORTED_LOCALES and PUBLIC_DEFAULT_LOCALE

#### Integration Requirements
- **Route Structure**: Maintain compatibility with existing routes from A01-Setup-Base-Routes.md
- **Layout System**: Integrate with main layout component structure for consistent switcher placement
- **Future Compatibility**: Prepare for AI translation workflow integration (AI01-OpenAI-API-Setup.md)

### Data Requirements

#### Locale Metadata
- Language codes following ISO 639-1 standard
- Display names in native language (English, Español, Français etc...)  
- Optional country codes for regional variants
- RTL/LTR text direction indicators

### Security Considerations
- **Input Validation**: Validate locale parameters to prevent path traversal or injection attacks
- **XSS Prevention**: Sanitize dynamic content and translation interpolations
- **CSRF Protection**: Ensure language switching doesn't bypass existing security measures

### Performance Requirements
- **Bundle Size**: Implement lazy loading of translation files to minimize initial bundle size
- **Switching Speed**: Language changes should complete within 200ms for optimal UX
- **Caching**: Cache translation files with appropriate browser cache headers
- **Tree Shaking**: Only include translations for used keys in production builds

## Additional Context for AI Assistant

### Prerequisites
This feature requires completion of:
- **PG01-Paraglide-Install.md**: Basic Paraglide installation and configuration
- **A01-Setup-Base-Routes.md**: Core application routes that need translation support

### Integration with Existing System
- **Route Compatibility**: Must work with existing SvelteKit file-based routing without breaking current navigation
- **Layout Integration**: Language switcher will be integrated into the main layout component structure
- **Content Preparation**: Translation key structure should anticipate content from Strapi CMS (SP02-Strapi-Content-Type.md, SP03-Strapi-Seed-Content.md)

### Future Integration Points
- **AI Translation**: Translation files will be automatically populated by AI workflow (AI01-OpenAI-API-Setup.md, AI02-Content-Localization-Workflow.md)
- **Dynamic Content**: Prepare for translating dynamic Strapi content (PG03-Paraglide-Translate-Content.md)
- **User Preferences**: Language selection will integrate with user account preferences in future auth implementation

### Implementation Notes
- Use Paraglide's compile-time approach for type-safe translations
- Implement proper TypeScript types for translation function parameters
- Consider accessibility requirements for language switcher (ARIA labels, keyboard navigation)
- Ensure SEO compatibility with locale-aware meta tags and hreflang attributes
- Test language switching across all existing routes to ensure no functionality breaks

The language switcher should be prominently placed but not intrusive, and the translation key organization should be scalable for the full application scope including future features like authentication, billing, and content management.