# Environment Variable Validation

## Overview
- Implement runtime validation for all required environment variables to prevent application startup with missing or invalid configuration
- Ensure early failure detection during development and deployment with clear error messages
- Build upon existing environment variable structure from EV01-Env-File-Setup.md
- Feature type: Infrastructure Setup

## Requirements

### Functional Requirements
- **Validation Timing**: Environment variable validation must occur immediately during application startup, before any service initialization
- **Fail-Fast Behavior**: Application must refuse to start and exit with non-zero status code when required variables are missing or invalid
- **Clear Error Messages**: Display specific error messages indicating which variables are missing, invalid, or have incorrect format
- **Comprehensive Coverage**: Validate all environment variables defined in EV01-Env-File-Setup.md including database, API keys, authentication secrets, and application settings
- **Type Validation**: Ensure variables are not just present but contain valid values (URLs, numbers, booleans, enums)
- **Development vs Production**: Support different validation rules for development and production environments

### Data Requirements
- **Required Variables**: All variables marked as required in .env.example must be validated
- **Optional Variables**: Optional variables should have sensible defaults when not provided
- **Format Validation**: URLs must be valid HTTP/HTTPS, ports must be valid numbers, booleans must be true/false
- **Secret Strength**: JWT secrets and session keys must meet minimum length requirements (32+ characters)
- **Service URLs**: Database connection strings, API endpoints must be reachable and properly formatted

### Security Considerations
- **Secret Exposure**: Validation errors must not log or display actual secret values in error messages
- **Environment Isolation**: Validation logic must prevent cross-environment variable leakage
- **Input Sanitization**: Environment variable values must be sanitized to prevent injection attacks
- **Audit Trail**: Log validation results (success/failure) without exposing sensitive values

### Performance Requirements
- **Startup Time**: Environment variable validation must complete within 100ms
- **Memory Usage**: Validation process should not consume more than 10MB of memory
- **Error Reporting**: Validation failures must be reported immediately without additional network calls

## Technical Specifications

### Dependencies
- **Existing Dependencies**: Built upon .env file structure from EV01-Env-File-Setup.md
- **Validation Library**: Consider zod or joi for schema-based validation with TypeScript support
- **Node.js Built-ins**: Use process.env access and process.exit() for startup control

### Environment Variables to Validate
Based on EV01-Env-File-Setup.md structure:

**Database Configuration:**
- DATABASE_URL (required, MySQL connection string format)
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (if using separate variables)

**Service API Keys:**
- OPENAI_API_KEY (required, starts with sk-)
- STRAPI_API_URL (required, valid HTTP/HTTPS URL)
- STRAPI_API_TOKEN (optional for public content)
- MAUTIC_API_URL (required, valid HTTP/HTTPS URL)
- MAUTIC_CLIENT_ID and MAUTIC_CLIENT_SECRET (required)

**Authentication Secrets:**
- BETTER_AUTH_SECRET (required, minimum 32 characters)
- JWT_SECRET (required, minimum 32 characters)
- SESSION_SECRET (required, minimum 32 characters)

**Application Settings:**
- PUBLIC_APP_URL (required, valid HTTP/HTTPS URL)
- PORT (optional, defaults to 3000, must be valid port number)
- NODE_ENV (required, enum: development|test|production)

**Localization:**
- PUBLIC_DEFAULT_LOCALE (required, valid locale code)
- PUBLIC_SUPPORTED_LOCALES (required, comma-separated locale codes)

### Implementation Requirements
- **Schema Definition**: Create TypeScript interfaces or Zod schemas defining expected environment variables
- **Validation Function**: Single function that validates all variables and returns success/failure with detailed errors
- **Integration Point**: Hook into SvelteKit app initialization before any service connections
- **Error Formatting**: Provide structured error output with variable names, expected formats, and remediation steps
- **Development Helpers**: In development mode, provide suggestions for missing variables with example values

### Error Handling
- **Missing Variables**: List all missing required variables in a single error message
- **Invalid Formats**: Specify expected format for each invalid variable
- **Unreachable Services**: For URL validation, optionally check reachability (with timeout)
- **Exit Behavior**: Use process.exit(1) for validation failures with proper cleanup

## Additional Context for AI Assistant

This validation system should integrate with the existing environment variable setup from EV01-Env-File-Setup.md and prepare for future integrations including:

- Better Auth initialization (AU01-Install-BetterAuth.md, AU02-BetterAuth-Init.md)
- Stripe integration (ST01-Stripe-Account-Setup.md)
- LemonSqueezy integration (LS01-LemonSqueezy-Account.md)
- CI/CD pipeline validation (CI01-GitHub-Actions-Init.md)

The validation should be thorough enough to catch configuration issues before they cause runtime failures, but fast enough to not impact development workflow. Consider providing a `--validate-env` CLI flag for manual validation without starting the full application.