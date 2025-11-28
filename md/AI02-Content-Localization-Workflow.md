# AI02-Content-Localization-Workflow.md

## Overview
Establish automated webhook-driven content translation workflow that automatically translates all new and updated Strapi CMS content using OpenAI API. When content creators publish or update Landing Pages, Features, or FAQ entries in Strapi, the system automatically generates all configured translations and updates the Strapi i18n entries, eliminating manual translation work.

**Business Value**: Enables instant multilingual content delivery, reduces translation costs by 90%, and ensures all marketing content is immediately available in supported languages for global user acquisition.

**Feature Type**: Technical Integration

## Requirements

### Functional Requirements

**FR-01: Strapi Webhook Configuration**
- Configure Strapi webhooks to trigger on content creation and updates for Landing Pages, Features, and FAQ content types
- Webhook endpoints must fire on `entry.create`, `entry.update`, and `entry.publish` lifecycle events
- Include content ID, content type, locale, and full entry data in webhook payload
- Support webhook retry mechanism with exponential backoff for failed deliveries
- **Acceptance Criteria**: Webhook fires within 5 seconds of content publish/update, includes complete entry data

**FR-02: Translation API Integration**
- Process webhook payloads to extract translatable text fields from Strapi content
- Send structured translation requests to OpenAI API using existing setup from AI01-OpenAI-API-Setup.md
- Preserve HTML markup, rich text formatting, and content structure during translation
- Handle batch translation of multiple fields in single API request for efficiency
- **Acceptance Criteria**: Successfully translates all text fields while maintaining formatting and structure

**FR-03: Strapi i18n Integration**
- Automatically create all configured locale versions of translated content
- Update existing locale entries if translations already exist using Strapi REST API
- Maintain relationships between original and translated content entries
- Set appropriate publication status for translated entries based on source content
- **Acceptance Criteria**: Translated content appears in Strapi admin UI under appropriate locale tabs

**FR-04: Content Field Processing**
- Identify and translate text fields: titles, descriptions, rich text content, meta descriptions
- Skip non-translatable fields: slugs, IDs, dates, media references, publication status
- Handle rich text fields with HTML tags, preserving markup structure
- Process nested content structures and repeatable field groups
- **Acceptance Criteria**: Only appropriate fields are translated, technical fields remain unchanged

**FR-05: Error Handling and Logging**
- Implement comprehensive error handling for webhook processing, API failures, and Strapi updates
- Log translation activities with content ID, source/target locales, and processing time
- Handle OpenAI API rate limits with queue-based retry system
- Graceful degradation when translation services are unavailable
- **Acceptance Criteria**: System continues operating during API outages, all errors logged for debugging

### Data Requirements

**DR-01: Webhook Processing Queue**
- Implement job queue system to handle multiple simultaneous webhook requests
- Store pending translation jobs with content metadata and retry counts
- Support job prioritization based on content type and publication status
- Persist queue state across application restarts

**DR-02: Translation Cache**
- Cache translated content to avoid redundant API calls for unchanged text
- Implement cache invalidation when source content is modified
- Store translation metadata including version, timestamp, and source content hash

**DR-03: Audit Trail**
- Log all translation activities with timestamps, content IDs, and processing results
- Track translation costs and API usage for billing and monitoring
- Store error logs with detailed debugging information

### Security Considerations

**SC-01: Webhook Authentication**
- Implement webhook signature verification to ensure requests originate from Strapi
- Use shared secret for HMAC signature validation
- Reject unsigned or improperly signed webhook requests

**SC-02: API Security**
- Protect OpenAI API key using environment variables from AI01-OpenAI-API-Setup.md
- Implement rate limiting on webhook endpoints to prevent abuse
- Validate and sanitize all content before translation processing

**SC-03: Content Access Control**
- Verify webhook content matches published/public content only
- Respect Strapi permissions when creating translated entries
- Ensure translated content inherits appropriate access controls from source

### Performance Requirements

**PR-01: Processing Speed**
- Process webhook requests within 30 seconds for typical content entries
- Handle concurrent translation requests without blocking other operations
- Implement timeout protection for long-running translation jobs

**PR-02: Resource Management**
- Limit concurrent OpenAI API requests to respect rate limits (3 requests/minute for new accounts)
- Implement memory-efficient processing for large content entries
- Support graceful scaling for high-volume content publishing

## Technical Specifications

### Dependencies
- **Existing Services**: Strapi CMS container from SP01-Strapi-Container-Setup.md, OpenAI API integration from AI01-OpenAI-API-Setup.md
- **Node.js Packages**: `@strapi/strapi` SDK for API interactions, `node-cron` for scheduled jobs, `bull` or `agenda` for job queue management

### Integration Points
- **Strapi Webhooks**: Configure in Strapi admin at Settings > Webhooks to target `/api/webhooks/translate-content` endpoint
- **OpenAI Translation**: Extend existing translation functions from AI01-OpenAI-API-Setup.md with content-specific prompts
- **Paraglide i18n**: Prepare for integration with message catalog updates from future PG03-Paraglide-Translate-Content.md

### Environment Variables
- `STRAPI_WEBHOOK_SECRET`: Shared secret for webhook signature verification
- `TRANSLATION_QUEUE_CONCURRENCY`: Maximum concurrent translation jobs (default: 2)
- `ENABLE_TRANSLATION_CACHE`: Boolean flag to enable/disable translation caching

### API Endpoints
- **POST `/api/webhooks/translate-content`**: Webhook endpoint for Strapi content events
- **GET `/api/translation/status/:jobId`**: Check translation job status and progress
- **POST `/api/translation/retry/:contentId`**: Manually retry failed translation jobs

### Database Changes
- **Translation Jobs Table**: Store webhook processing queue with job status, retry counts, and error logs
- **Translation Cache Table**: Cache translated content with hash keys and expiration timestamps
- **Content Audit Log**: Track all translation activities for monitoring and debugging

## Implementation Notes

### Workflow Sequence
1. Content creator publishes/updates content in Strapi admin UI
2. Strapi triggers webhook to `/api/webhooks/translate-content` endpoint
3. System validates webhook signature and extracts content data
4. Translation job added to processing queue with content metadata
5. Queue processor extracts translatable fields and calls OpenAI API
6. Translated content posted back to Strapi as new locale entries
7. Success/failure logged with detailed processing information

### Content Type Mapping
- **Landing Pages**: Translate hero_headline, hero_subheadline, content_sections, meta_title, meta_description
- **Features**: Translate name, description, benefits array, category labels
- **FAQs**: Translate question, answer, category labels

### Integration with Future Features
- Prepare webhook payload structure for Mautic email campaign translation (AI03-Email-Translation-Manager.md)
- Design translation cache to support Paraglide message catalog updates
- Structure audit logs for future analytics and reporting dashboards

## Prerequisites
- DB01-DB-Container-Setup.md: MySQL database container running
- SP01-Strapi-Container-Setup.md: Strapi CMS container with admin access
- SP02-Strapi-Content-Type.md: Landing Pages, Features, and FAQ content types configured
- SP04-Strapi-API-Permissions.md: API permissions configured for content access
- AI01-OpenAI-API-Setup.md: OpenAI API integration with translation capabilities
- PG01-Paraglide-Install.md: Paraglide i18n framework installed
- PG02-Paraglide-Configure-Langs.md: All configured locales (Spanish, French, etc.) configured

## Acceptance Criteria
- [ ] Strapi webhooks configured and firing on content publish/update events
- [ ] Webhook endpoint processes requests and validates signatures correctly
- [ ] OpenAI API successfully translates content while preserving formatting
- [ ] Translated content automatically appears in Strapi admin under all locale tabs
- [ ] Translation jobs queued and processed without blocking other operations
- [ ] Comprehensive error handling with retry logic for failed translations
- [ ] All translation activities logged with detailed audit information
- [ ] System handles OpenAI rate limits gracefully with queue management
- [ ] Cache system prevents redundant translation of unchanged content
- [ ] End-to-end workflow completes within 2 minutes for typical content entries