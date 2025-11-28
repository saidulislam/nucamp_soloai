# Review and Edit AI-Generated Translations in Strapi

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
- Guide content creators through reviewing, editing, and approving AI-generated translations for Strapi CMS content
- Establish quality control process for automated translations from AI02-Content-Localization-Workflow.md
- Enable content managers to refine AI translations before publishing to maintain brand voice and accuracy
- Feature type: Content Management Workflow

## Requirements

### Functional Requirements
- **Translation Review Interface**: Content creators must access and review AI-generated Spanish (es) and French (fr) translations through Strapi admin UI at localhost:1337/admin
- **Content Comparison**: Side-by-side viewing of original English content and AI translations for Landing Pages, Features, and FAQ content types
- **Inline Editing**: Direct editing capability for translated content fields including titles, descriptions, rich text content, and meta descriptions
- **Quality Assessment**: Ability to identify translation errors, awkward phrasing, cultural inappropriateness, or brand voice inconsistencies
- **Publication Control**: Approval workflow to publish, reject, or request re-translation of AI-generated content
- **Version History**: Track translation edits and maintain audit trail of changes made to AI-generated content
- **Field-Level Review**: Review process for each translatable field (hero headlines, feature descriptions, FAQ answers, SEO metadata)
- **Batch Operations**: Ability to review and approve multiple content items or languages simultaneously

### Content Quality Standards
- **Brand Voice Consistency**: Translations must maintain the same tone, style, and messaging as original English content
- **Cultural Appropriateness**: Content must be culturally relevant and appropriate for target Spanish and French markets
- **Technical Accuracy**: Product features, benefits, and technical terms must be accurately translated
- **SEO Optimization**: Meta titles, descriptions, and URLs must be optimized for target language search engines
- **Call-to-Action Effectiveness**: CTAs must be compelling and action-oriented in target languages
- **Rich Text Preservation**: HTML formatting, links, and media references must remain intact after translation edits

### User Stories
- As a content manager, I want to review AI-generated translations so that I can ensure quality before publishing
- As a marketing manager, I want to edit translated content so that it maintains our brand voice in all languages
- As a content creator, I want to compare original and translated content side-by-side so that I can identify translation issues
- As an admin, I want to approve or reject translations so that only quality content is published
- As a content reviewer, I want to see translation history so that I can track changes and improvements

## Data Requirements

### Translation Review Workflow
- **Review Status**: Track translation status (pending_review, approved, rejected, needs_revision)
- **Reviewer Information**: Record who reviewed and approved each translation
- **Review Comments**: Internal notes and feedback on translation quality
- **Edit History**: Log of changes made to AI-generated translations
- **Quality Scores**: Optional rating system for translation quality assessment

### Content Validation
- **Character Limits**: Ensure translated content respects field length limits (hero headlines 50-60 chars, meta descriptions 150-160 chars)
- **Required Fields**: Validate that all required fields have approved translations
- **Link Integrity**: Verify internal and external links work correctly in translated content
- **Media References**: Ensure image alt text and media descriptions are appropriately translated

## Technical Specifications

### Prerequisites (Must be completed first)
- SP02-Strapi-Content-Type.md - Content types for Landing Pages, Features, FAQs
- SP03-Strapi-Seed-Content.md - Sample content entries for testing
- SP06-Create-Homepage-Content.md - Production-ready homepage content
- AI01-OpenAI-API-Setup.md - OpenAI API integration setup
- AI02-Content-Localization-Workflow.md - Automated translation workflow
- PG01-Paraglide-Install.md - i18n framework setup
- PG02-Paraglide-Configure-Langs.md - Language configuration

### Strapi Configuration
- **i18n Plugin**: Utilize Strapi's built-in internationalization plugin for locale management
- **Content Types**: Access Landing Pages, Features, and FAQ content types with i18n enabled
- **Locale Switching**: Use Strapi admin UI locale switcher to navigate between English, Spanish, and French versions
- **Permissions**: Ensure content reviewers have appropriate permissions to edit translated content
- **Workflow States**: Configure content workflow states for translation review process

### Review Process Integration
- **Webhook Integration**: Connect to existing webhook system from AI02-Content-Localization-Workflow.md
- **Translation Cache**: Work with existing translation cache to avoid redundant API calls
- **OpenAI Integration**: Interface with AI01-OpenAI-API-Setup.md for re-translation requests
- **Paraglide Sync**: Ensure approved translations sync with Paraglide i18n system

### Environment Variables
- Use existing OPENAI_API_KEY for re-translation requests
- Leverage STRAPI_API_URL and PUBLIC_STRAPI_URL for API connections
- Utilize PUBLIC_DEFAULT_LOCALE and PUBLIC_SUPPORTED_LOCALES for language configuration

### Quality Control Tools
- **Translation Memory**: Build database of approved translations for consistency
- **Style Guide Integration**: Reference brand voice guidelines during review process
- **Automated Checks**: Implement basic quality checks (character limits, required fields, link validation)
- **Collaboration Features**: Enable multiple reviewers to collaborate on translation improvements

## Security Considerations
- **Access Control**: Restrict translation review permissions to authorized content managers and reviewers
- **Audit Trail**: Maintain complete log of translation edits and approvals for compliance
- **Content Backup**: Preserve original AI translations before manual edits are applied
- **Version Control**: Track all changes to translated content with timestamps and user attribution

## Performance Requirements
- **Review Interface**: Translation comparison and editing interface must load within 3 seconds
- **Bulk Operations**: Support reviewing up to 50 content items simultaneously without performance degradation
- **Search and Filter**: Enable quick location of content needing review through search and filter capabilities
- **Auto-Save**: Implement auto-save functionality to prevent loss of translation edits

## Additional Context for AI Assistant

### Review Workflow Process
1. **Access Review Queue**: Navigate to content items with pending AI translations
2. **Side-by-Side Comparison**: Review original vs. translated content for accuracy and brand voice
3. **Edit and Refine**: Make necessary improvements to AI-generated translations
4. **Quality Assessment**: Evaluate cultural appropriateness and marketing effectiveness
5. **Approval/Rejection**: Approve quality translations or reject for re-translation
6. **Publication**: Publish approved translations to frontend via existing SP05-Strapi-Frontend-Connect.md integration

### Common Translation Issues to Address
- Literal translations that miss cultural context
- Brand terminology that should remain in English
- Call-to-action phrases that don't motivate in target language
- Technical terms that need localized explanations
- SEO metadata that needs target-language optimization

### Integration Points
- Work seamlessly with existing Strapi admin UI workflow
- Maintain compatibility with PG03-Paraglide-Translate-Content.md for frontend delivery
- Support future MA07-Review-Email-Translations.md workflow for email content
- Prepare for AI03-Email-Translation-Manager.md integration requirements

This review process ensures that automated AI translations maintain the quality and effectiveness of the original content while adapting appropriately for Spanish and French-speaking audiences.