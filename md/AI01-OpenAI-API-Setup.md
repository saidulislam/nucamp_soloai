# OpenAI API Setup for Content Localization

## Overview
Set up OpenAI API integration to enable automated content translation workflow for the SaaS application. This establishes the foundation for AI-powered localization of Strapi CMS content, Paraglide messages and future Mautic email campaigns across multiple languages (English, Spanish, French).

**Business Value**: Enables automatic translation of all content, reducing manual translation costs and ensuring consistent multilingual user experience across marketing pages and email campaigns.

**Feature Type**: Technical Integration

## Requirements

### Service Details
- **OpenAI API Version**: latest stable
- **Primary Model**: Least expensive model
- **SDK**: Latest OpenAI SDK
- **API Endpoints**: Most current API endpoints
- **Rate Limits**: Respect OpenAI's rate limits (tier-dependent, typically 3 requests/minute for new accounts)

### Authentication & Security
- **API Key Storage**: Store OpenAI API key as environment variable `OPENAI_API_KEY`
- **Key Security**: Never expose API key in client-side code or version control
- **Access Control**: API calls only from server-side code or secure server routes
- **Error Handling**: Graceful degradation when API is unavailable or quota exceeded

### Integration Points
- **Strapi Integration**: Prepare for webhook-triggered translation of Landing Pages, Features, and FAQ content
- **Mautic Integration**: Foundation for future email campaign translation workflow
- **Paraglide Integration**: Generate translation files compatible with existing i18n setup from PG01-Paraglide-Install.md and PG02-Paraglide-Configure-Langs.md

### Functional Requirements
- **Translation Test**: Successfully translate sample text from English to Spanish and French
- **Content Structure Preservation**: Maintain HTML markup, rich text formatting, and content structure
- **Translation Quality**: Contextually appropriate translations for SaaS marketing content
- **Batch Processing**: Support translation of multiple content fields in single API request
- **Language Support**: Primary support for English (source) → 13 languages listed by Strapi

### Data Requirements
- **Input Format**: Accept structured content objects with field identification
- **Output Format**: Return translated content maintaining original structure and field mapping
- **Content Types**: Support plain text, rich text/HTML, and structured data translation
- **Field Mapping**: Preserve content type field relationships (title, description, etc.)

### Security Considerations
- **API Key Protection**: Secure storage and access to OpenAI API credentials
- **Input Validation**: Sanitize content before sending to OpenAI API
- **Rate Limiting**: Implement client-side rate limiting to prevent quota exhaustion
- **Error Logging**: Log translation failures without exposing sensitive data

### Performance Requirements
- **Response Time**: Translation requests complete within 10-30 seconds depending on content length
- **Concurrent Requests**: Support up to 3 concurrent translation requests (respecting rate limits)
- **Retry Logic**: Implement exponential backoff for rate limit and temporary API failures
- **Caching**: Prepare structure for caching translated content to avoid duplicate API calls

## Technical Specifications

### Dependencies
- **OpenAI Node.js SDK**: `npm install openai`
- **Environment Variables**: dotenv package already configured from EV01-Env-File-Setup.md

### Database Changes
- **No immediate database changes required**
- **Future consideration**: Translation cache table for storing API responses
- **Content versioning**: Prepare for tracking translation status on existing Strapi content

### API Changes
- **New Server Route**: `/api/translate` endpoint for testing translation functionality
- **Translation Service**: Utility service class for OpenAI API integration
- **Error Handling**: Standardized error responses for translation failures
- **Rate Limiting Middleware**: Implement request throttling for translation endpoints

### Environment Variables
- `OPENAI_API_KEY`: OpenAI API secret key (required)
- `OPENAI_MODEL`: Model to use for translations (default: gpt4mini)
- `TRANSLATION_ENABLED`: Feature flag to enable/disable AI translation (default: true)

## Prerequisites
- **SP02-Strapi-Content-Type.md**: Strapi content types for translation

## Success Criteria
1. OpenAI SDK successfully installed and configured with proper TypeScript support
2. API key securely stored and validated in environment configuration
3. Test translation endpoint successfully translates sample content from English to Spanish and French
4. Translation service maintains content structure and formatting
5. Error handling gracefully manages API failures and rate limiting
6. Foundation established for integration with upcoming AI02-Content-Localization-Workflow.md
7. Performance metrics show translation requests complete within acceptable timeframes
8. Security review confirms no API key exposure or injection vulnerabilities

## Future Integration Points
- **AI02-Content-Localization-Workflow.md**: Automated Strapi content translation
- **AI03-Email-Translation-Manager.md**: Mautic email campaign translation
- **PG03-Paraglide-Translate-Content.md**: Dynamic content translation in frontend