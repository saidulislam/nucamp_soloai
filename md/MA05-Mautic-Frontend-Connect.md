# Mautic Frontend Integration for User Provisioning

## IMPORTANT IMPLEMENTATION NOTE
All configuration and setup for Mautic must be performed exclusively through the official Mautic interfaces:
- Mautic Web UI (Admin Dashboard)
- Mautic REST API
- Mautic CLI Tools

Directly injecting code, editing core source files, or programmatically modifying the Mautic application files, configuration files, or database to create or modify entities is STRICTLY PROHIBITED.

This restriction ensures:
- System consistency and database integrity
- Compatibility with future Mautic updates and plugins
- Maintainability and ease of troubleshooting
- Full support for automation, validation, and permissions features

Do NOT create or modify Mautic entities, configurations, or features by editing PHP files, configuration files, or the database directly.
Always use only the Web UI, official REST API, or CLI commands as documented by Mautic.
If actions are required using the UI, ask the user to perform them through the Mautic Admin interface or provide instructions for using the Mautic CLI.

## Overview
- **Description**: Integrate Mautic API with Better Auth signup/login flows to automatically create and update contacts in Mautic for marketing automation and user engagement
- **Business Value**: Enables automated marketing campaigns, user segmentation, and lead nurturing workflows by synchronizing user data between authentication system and marketing platform
- **Problem Solved**: Eliminates manual contact management and ensures all users are automatically added to marketing automation workflows for onboarding, engagement, and retention campaigns
- **Feature Type**: Technical Integration

## Requirements

### Service Details
- **Mautic Version**: 5.0+ REST API v2
- **API Endpoints**: 
  - `/api/contacts` for contact creation and updates
  - `/api/contacts/{id}` for individual contact management
  - `/api/segments` for contact categorization
- **SDK Requirements**: Direct HTTP client integration using fetch API or axios
- **Base URL**: http://localhost:8080/api (development), configurable via environment variables

### Authentication
- **API Credentials**: OAuth 2.0 client credentials or API token from MA02-Mautic-API-Auth.md
- **Credential Storage**: Environment variables `MAUTIC_API_URL`, `MAUTIC_CLIENT_ID`, `MAUTIC_CLIENT_SECRET`, `MAUTIC_API_TOKEN`
- **Rate Limiting**: Respect 100 requests per hour default limit with exponential backoff retry mechanism

### Integration Points
- **Better Auth Hooks**: Integrate with signup completion and profile update flows from AU02-BetterAuth-Init.md
- **User Data Sync**: Map Better Auth user fields (email, name, registration date) to Mautic contact fields
- **Contact Form Integration**: Connect frontend contact forms to Mautic lead capture system
- **Newsletter Signup**: Enable email subscription opt-ins during registration and on contact pages

### Functional Requirements

#### User Provisioning Automation
- **Acceptance Criteria**: When user completes registration via Better Auth, contact is automatically created in Mautic within 30 seconds
- **Data Mapping**: Email (required), first name, last name, registration date, user source, locale preference
- **Contact Segmentation**: Automatically assign new users to "New Signups" segment for onboarding campaigns
- **Duplicate Handling**: Check for existing contacts by email address and update rather than create duplicates

#### Profile Synchronization
- **Acceptance Criteria**: When authenticated user updates profile information, corresponding Mautic contact is updated within 60 seconds
- **Sync Fields**: Name changes, email updates, locale preferences, subscription status
- **Conflict Resolution**: Handle cases where email address changes and may conflict with existing contacts

#### Marketing Opt-in Management
- **Acceptance Criteria**: Users can opt-in/opt-out of marketing communications with preference stored in both systems
- **Newsletter Signup**: Dedicated signup forms on homepage and contact page with Mautic integration
- **Preference Center**: Allow users to manage communication preferences through account dashboard
- **GDPR Compliance**: Include proper consent tracking and opt-out mechanisms

#### Contact Form Integration
- **Acceptance Criteria**: Contact form submissions create leads in Mautic with proper categorization and follow-up triggers
- **Lead Scoring**: Assign appropriate lead scores based on form type and user engagement level
- **Campaign Triggers**: Automatically trigger relevant email campaigns based on form submission type

### Data Requirements

#### Contact Model Mapping
- **Required Fields**: Email (unique identifier), first name, last name, created date
- **Optional Fields**: Phone, company, locale, user source, subscription preferences
- **Custom Fields**: Registration method (email/oauth), authentication provider, account tier
- **Validation**: Email format validation, required field checks, character length limits

#### Segmentation Data
- **User Segments**: New signups, active users, trial users, premium subscribers, inactive users
- **Behavioral Data**: Login frequency, feature usage, support requests, billing events
- **Demographic Data**: Locale, timezone, registration source, device type

### Security Considerations
- **API Authentication**: Secure storage of Mautic API credentials using environment variables
- **Data Privacy**: Only sync necessary user data, respect privacy preferences and GDPR requirements  
- **Rate Limiting**: Implement proper rate limiting to avoid API abuse and account suspension
- **Error Logging**: Log integration errors without exposing sensitive user data or API credentials
- **Input Validation**: Sanitize all user data before sending to Mautic API to prevent injection attacks

### Performance Requirements
- **Response Times**: Contact creation/update operations complete within 30 seconds
- **Concurrent Users**: Support 100+ simultaneous user registrations without API failures
- **Rate Limits**: Stay within Mautic's 100 requests/hour limit using queuing and batching
- **Retry Logic**: Implement exponential backoff for failed API requests with maximum 3 retry attempts
- **Caching**: Cache Mautic segment IDs and contact data to reduce API calls

## Technical Specifications

### Dependencies
- **HTTP Client**: Native fetch API or axios for HTTP requests
- **Environment Management**: dotenv for configuration management
- **Validation Library**: zod or joi for API response validation
- **Queue System**: Simple in-memory queue or Redis for batching API requests
- **Logging**: Existing application logging system for error tracking

### Database Changes
- **User Model Extension**: Add `mautic_contact_id` field to existing user table for relationship tracking
- **Sync Status Tracking**: Optional table for tracking sync status and retry attempts
- **Migration Required**: Add new columns to existing user table via Prisma migration

### API Changes
- **No New Public Endpoints**: Integration occurs server-side during existing auth flows
- **Internal Hooks**: Add Mautic sync calls to existing Better Auth event handlers
- **Error Handling**: Extend existing error handling to include Mautic API failures

### Environment Variables
- **MAUTIC_API_URL**: Base URL for Mautic API (default: http://localhost:8080/api)
- **MAUTIC_CLIENT_ID**: OAuth client ID from Mautic configuration
- **MAUTIC_CLIENT_SECRET**: OAuth client secret from Mautic configuration  
- **MAUTIC_API_TOKEN**: Alternative to OAuth, direct API token
- **MAUTIC_DEFAULT_SEGMENT_ID**: Default segment ID for new user assignment
- **MAUTIC_RATE_LIMIT**: API rate limit configuration (default: 100/hour)

## Prerequisites
- **MA01-Mautic-Container-Setup.md**: Mautic instance running and accessible
- **MA02-Mautic-API-Auth.md**: API credentials configured and tested
- **AU02-BetterAuth-Init.md**: Better Auth initialized with user registration flows
- **AU04-Global-Client-Setup.md**: Better Auth client configured for session management
- **DB01-DB-Container-Setup.md**: Database container with user table structure

## Integration Workflow

### User Registration Flow
1. User completes registration via Better Auth (L02-Login-Form.md or S02-Signup-Form.md)
2. Better Auth creates user record in database
3. Post-registration hook triggers Mautic contact creation
4. Map user data to Mautic contact fields
5. Send API request to create contact in Mautic
6. Store Mautic contact ID in user record for future updates
7. Assign contact to appropriate segments based on registration method

### Profile Update Flow
1. User updates profile information in account dashboard (planned in D03-Account-Update-Form.md)
2. Better Auth updates user record in database
3. Profile update hook triggers Mautic contact sync
4. Retrieve existing Mautic contact using stored contact ID
5. Update Mautic contact with changed fields
6. Handle any API errors with retry logic

### Contact Form Submission Flow
1. User submits contact form on website (planned in CT02-Contact-Form.md)
2. Form validation and sanitization
3. Create or update Mautic contact with form data
4. Assign to appropriate lead segments
5. Trigger relevant email campaigns or follow-up sequences

## Error Handling Strategy
- **API Failures**: Queue failed requests for retry with exponential backoff
- **Rate Limiting**: Implement request queuing to stay within API limits
- **Duplicate Contacts**: Check for existing contacts by email before creation
- **Network Issues**: Graceful degradation that doesn't block user registration
- **Data Validation**: Validate API responses and handle malformed data
- **Logging**: Comprehensive error logging without exposing sensitive information

## Testing Requirements
- **Unit Tests**: Test API integration functions and data mapping logic
- **Integration Tests**: Test complete user registration to Mautic contact creation flow
- **Error Scenarios**: Test handling of API failures, rate limiting, and network issues
- **Data Validation**: Test proper handling of various user data formats and edge cases
- **Performance Tests**: Verify performance under high user registration loads