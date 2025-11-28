# Environment Variable File Setup

## Overview
- Establish secure environment variable management system for development, testing, and production environments
- Create structured `.env` configuration files with validation and documentation for all service integrations
- Feature type: Infrastructure Setup

## Requirements

### For Infrastructure Setup, include:
- **Configuration Management**: Centralized environment variable storage with clear naming conventions
- **Security Standards**: Separation of sensitive credentials from code repository with proper .gitignore configuration
- **Development Workflow**: Easy onboarding for new developers with comprehensive .env.example template
- **Service Integration**: Environment variables for all integrated services (MySQL, Strapi, Mautic, OpenAI, Better Auth)

### Functional Requirements
- Create `.env` file containing all required environment variables for local development
- Generate `.env.example` template file with placeholder values and comprehensive documentation
- Implement proper .gitignore configuration to prevent sensitive data from entering version control
- Establish naming conventions following SCREAMING_SNAKE_CASE with service prefixes
- Support multiple environment contexts (development, test, production) with environment-specific overrides
- Include validation-ready variable structure for integration with upcoming environment validation system
- Document variable purposes, expected formats, and security requirements inline

### Data Requirements
- **Database Configuration**: Connection strings, credentials, and connection pool settings for MySQL container
- **Service API Keys**: Secure storage for OpenAI API keys, Strapi tokens, and Mautic credentials
- **Authentication Secrets**: JWT secrets, session keys, and OAuth provider credentials for Better Auth
- **Application Settings**: Base URLs, port configurations, and feature flags
- **Localization Settings**: Default locale, supported languages, and translation service configuration

### Security Considerations
- Never commit actual API keys, passwords, or sensitive tokens to version control
- Use strong, randomly generated secrets for JWT signing and session management
- Implement proper file permissions (600) for .env files in production environments
- Separate development/test keys from production credentials
- Include security warnings and best practices in .env.example comments
- Validate environment variable formats to prevent injection attacks

### Performance Requirements
- Environment variable loading must complete within 100ms during application startup
- Support for at least 50 concurrent environment variable reads without performance degradation
- Minimal memory footprint for environment variable storage and access

## Technical Specifications

### Dependencies
- Built-in Node.js `process.env` for environment variable access
- No additional npm packages required for basic .env file functionality
- Integration points prepared for `dotenv` package if needed for advanced features
- Compatible with SvelteKit's built-in environment variable handling

### Environment Variables Structure
**Database & Infrastructure:**
```
# Database Configuration (from DB01-DB-Container-Setup.md)
DATABASE_URL=mysql://app_user:secure_password@localhost:3306/saas_app
DB_HOST=localhost
DB_PORT=3306
DB_NAME=saas_app
DB_USER=app_user
DB_PASSWORD=secure_password
TEST_DATABASE_URL=mysql://app_user:secure_password@localhost:3306/saas_test
```

**Content Management System:**
```
# Strapi Configuration (from SP01-Strapi-Container-Setup.md)
STRAPI_API_URL=http://localhost:1337/api
PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=optional_admin_token_for_server_operations
STRAPI_ADMIN_JWT_SECRET=generated_jwt_secret_for_admin
STRAPI_APP_KEYS=comma_separated_app_keys
```

**Marketing Automation:**
```
# Mautic Configuration (from MA01-Mautic-Container-Setup.md)
MAUTIC_URL=http://localhost:8080
MAUTIC_API_USERNAME=admin_username
MAUTIC_API_PASSWORD=secure_admin_password
MAUTIC_CLIENT_ID=oauth_client_id
MAUTIC_CLIENT_SECRET=oauth_client_secret
```

**AI Translation Services:**
```
# OpenAI Configuration (from AI01-OpenAI-API-Setup.md)
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.3
```

**Internationalization:**
```
# Paraglide i18n Configuration (from PG01-Paraglide-Install.md)
PUBLIC_DEFAULT_LOCALE=en
PUBLIC_SUPPORTED_LOCALES=en,es,fr
```

**Authentication (Prepared for Better Auth):**
```
# Better Auth Configuration (upcoming AU01-Install-BetterAuth.md)
BETTER_AUTH_SECRET=generated_secret_for_jwt_signing
BETTER_AUTH_URL=http://localhost:3000
SESSION_SECRET=session_encryption_key
AUTH_TRUST_HOST=true
```

**Application Configuration:**
```
# Application Settings
NODE_ENV=development
PORT=3000
PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=info
```

### File Structure Requirements
- `.env` - Actual environment variables for local development (git-ignored)
- `.env.example` - Template file with placeholder values (version controlled)
- `.env.local` - Optional local overrides (git-ignored)
- `.env.production` - Production-ready template (version controlled, no secrets)

### Additional Context for AI Assistant

**Integration Points:**
- Must support all services established in previous container setup guides (DB01, SP01, MA01)
- Variables must be compatible with AI translation workflow (AI01, AI02)
- Prepared for Better Auth integration variables (upcoming AU01, AU02)
- Support for Paraglide i18n configuration (PG01, PG02)
- Ready for Stripe/LemonSqueezy payment integration variables (upcoming ST01, LS01)

**Security Best Practices:**
- Generate secure random values for all secrets using cryptographically secure methods
- Include inline documentation explaining variable purposes and security requirements
- Implement file permission recommendations for production environments
- Provide guidelines for secret rotation and management

**Development Experience:**
- Clear commenting and organization for easy maintenance
- Logical grouping of related variables by service/feature
- Consistent naming conventions across all environment variables
- Comprehensive .env.example with realistic placeholder values and setup instructions

## Remember
This environment setup is foundational infrastructure that all other features depend on. The .env.example file serves as onboarding documentation for new developers and must be comprehensive and well-documented. All sensitive values must be excluded from version control while maintaining clear setup instructions.