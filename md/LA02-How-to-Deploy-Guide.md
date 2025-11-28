# LA02-How-to-Deploy-Guide.md

## Overview
- Complete deployment guide for launching the SaaS application on a cloud platform with production-ready configuration
- Provides step-by-step instructions for deploying the fully-featured SaaS application including all integrations
- Feature type: Infrastructure Setup

## Requirements

### Functional Requirements
- **Production Deployment**: Deploy containerized application stack to cloud platform (AWS, DigitalOcean, Google Cloud, Azure)
- **Domain Configuration**: Set up custom domain with SSL/TLS certificates and proper DNS configuration
- **Environment Management**: Configure production environment variables and secrets management
- **Service Integration**: Deploy and configure MySQL, Strapi CMS, Mautic, and Node.js application containers
- **Load Balancing**: Set up reverse proxy with NGINX for load balancing and SSL termination
- **Database Migration**: Initialize production database with proper schema and seed data
- **CDN Setup**: Configure content delivery network for static assets and media files
- **Monitoring**: Implement basic application and infrastructure monitoring
- **Backup Strategy**: Set up automated database backups and disaster recovery procedures

### Data Requirements
- **Environment Variables**: Secure storage of all API keys, database credentials, and application secrets
- **Database Schema**: Production MySQL database with all tables from Better Auth, Strapi, and custom schemas
- **Media Storage**: Production-ready file storage for Strapi uploads and user-generated content
- **SSL Certificates**: Valid SSL/TLS certificates for custom domain with automatic renewal
- **DNS Records**: Proper A/AAAA records, CNAME records, and MX records for email delivery

### Security Considerations
- **Secret Management**: Use cloud provider's secret management service (AWS Secrets Manager, Google Secret Manager)
- **Network Security**: Configure VPC, security groups, and firewall rules for production environment
- **SSL/TLS**: Enforce HTTPS with HSTS headers and proper cipher suites
- **Database Security**: Encrypted database storage with restricted network access
- **API Security**: Rate limiting, CORS configuration, and proper authentication headers
- **Backup Encryption**: Encrypted backups with secure access controls

### Performance Requirements
- **Application Response**: Page load times under 2 seconds on production environment
- **Database Performance**: Optimized queries with proper indexing and connection pooling
- **CDN Configuration**: Global content delivery with 95%+ cache hit ratio
- **Concurrent Users**: Support 100+ simultaneous users without performance degradation
- **Auto-scaling**: Configure horizontal scaling based on CPU and memory metrics

## Technical Specifications

### Dependencies
- **Cloud Platform**: AWS, DigitalOcean, Google Cloud Platform, or Azure account
- **Domain Registrar**: Custom domain name with DNS management capabilities
- **Docker**: Production-ready container orchestration (Docker Compose or Kubernetes)
- **Reverse Proxy**: NGINX or similar for SSL termination and load balancing
- **SSL Provider**: Let's Encrypt or cloud provider SSL certificate service
- **Monitoring**: Basic application monitoring service (New Relic, DataDog, or cloud native)

### Database Changes
- **Production Schema**: Initialize MySQL database with complete schema from development
- **Seed Data**: Production-appropriate seed data for Strapi content types
- **User Accounts**: Create initial admin accounts for Strapi and Mautic
- **Indexes**: Ensure proper database indexes for production performance
- **Backup Schedule**: Configure automated daily database backups with retention policy

### API Changes
- **Production URLs**: Update all API endpoints to use production domain names
- **CORS Configuration**: Restrict CORS to production domain only
- **Rate Limiting**: Implement production-appropriate rate limiting rules
- **Health Checks**: Add health check endpoints for load balancer monitoring
- **Webhook URLs**: Update all webhook endpoints to use production domain

### Environment Variables
- **DATABASE_URL**: Production MySQL connection string with SSL
- **BETTER_AUTH_URL**: Production authentication callback URL
- **STRAPI_URL**: Production Strapi CMS URL for API calls
- **MAUTIC_URL**: Production Mautic instance URL
- **STRIPE_WEBHOOK_ENDPOINT_SECRET**: Production Stripe webhook secret
- **LEMON_SQUEEZY_WEBHOOK_SECRET**: Production LemonSqueezy webhook secret
- **OPENAI_API_KEY**: Production OpenAI API key for content translation
- **EMAIL_SMTP_**: Production email server configuration for transactional emails
- **CDN_URL**: Content delivery network URL for static assets
- **MONITORING_API_KEY**: Application monitoring service API key

### Deployment Architecture
- **Load Balancer**: NGINX reverse proxy with SSL termination
- **Application Server**: Node.js SvelteKit application in Docker container
- **Database Server**: Managed MySQL service or containerized MySQL with persistent storage
- **CMS Server**: Strapi CMS container with persistent file storage
- **Marketing Server**: Mautic container with email delivery configuration
- **File Storage**: Cloud storage service for media files and uploads
- **Monitoring**: Application performance monitoring and error tracking

### Prerequisites
- Completed LA01-Launch-Checklist.md validation
- All environment variables configured per EV01-Env-File-Setup.md
- Environment validation working per EV02-Env-Validation.md
- Production secrets management per EV03-Secret-Management.md
- CI/CD pipeline configured per CI01-GitHub-Actions-Init.md
- All testing completed per TS01-Vitest-Setup.md and TS02-Playwright-Setup.md

### Security Configuration
- **Firewall Rules**: Restrict database access to application servers only
- **SSL Configuration**: TLS 1.3 with modern cipher suites and HSTS headers
- **Secret Rotation**: Automated secret rotation for database passwords and API keys
- **Access Logging**: Comprehensive access logs for security monitoring
- **Backup Security**: Encrypted backups with restricted access and retention policies

### Performance Optimization
- **Static Asset Caching**: Configure long-term caching for CSS, JS, and image files
- **Database Optimization**: Connection pooling, query optimization, and proper indexing
- **Application Caching**: Redis or similar for session storage and API response caching  
- **Image Optimization**: Automated image compression and WebP conversion
- **Bundle Optimization**: Minified and compressed application bundles

### Monitoring and Maintenance
- **Health Checks**: Application health endpoints for load balancer monitoring
- **Error Tracking**: Centralized error logging and alerting system
- **Performance Monitoring**: Application performance metrics and alerting
- **Database Monitoring**: Database performance and connection monitoring
- **Backup Verification**: Regular backup testing and restoration procedures

## Additional Context for AI Assistant

This deployment guide should provide comprehensive instructions for moving from development to production, including:

1. **Cloud Platform Selection**: Compare options and provide specific deployment steps for at least two major cloud providers
2. **Infrastructure as Code**: Consider using Terraform, CloudFormation, or similar for reproducible deployments
3. **Container Orchestration**: Provide both Docker Compose and Kubernetes deployment options
4. **SSL/TLS Setup**: Detailed SSL certificate configuration with automatic renewal
5. **Database Migration**: Safe production database initialization and migration procedures
6. **Domain Configuration**: Complete DNS setup including email delivery configuration
7. **Monitoring Setup**: Basic monitoring that provides visibility into application health
8. **Backup Strategy**: Automated backup procedures with disaster recovery testing
9. **Security Hardening**: Production security configuration beyond basic requirements
10. **Performance Tuning**: Production-specific performance optimizations

The guide should be actionable by a technical user with basic cloud platform experience, providing specific commands, configuration files, and troubleshooting steps for common deployment issues.