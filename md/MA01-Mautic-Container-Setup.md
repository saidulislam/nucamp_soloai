# Mautic Container Setup

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
Set up Mautic marketing automation platform as a containerized service using Docker Compose, connecting it to the existing MySQL database infrastructure. This establishes the marketing automation foundation for user provisioning, email campaigns, and lead management workflows that will be integrated throughout the SaaS application.

**Feature Type**: Infrastructure Setup

## Requirements

### Functional Requirements
- **Container Service**: Deploy Mautic 5.0+ as a Docker container service accessible at http://localhost:8080
- **Database Integration**: Connect to existing MySQL database from DB01-DB-Container-Setup.md using dedicated Mautic database and user
- **Admin Access**: Create initial admin user account for marketing campaign management and configuration
- **Persistent Storage**: Maintain Mautic configuration, media uploads, and plugin data across container restarts
- **Health Monitoring**: Implement container health checks and auto-restart policies for reliability
- **API Readiness**: Ensure Mautic API endpoints are accessible for future user provisioning and campaign automation

### Data Requirements
- **Database Schema**: Create dedicated `mautic` database in existing MySQL container
- **User Permissions**: Create `mautic_user` with appropriate database permissions (SELECT, INSERT, UPDATE, DELETE)
- **Data Persistence**: Mount volumes for `/var/www/html/media/files`, `/var/www/html/media/images`, and `/var/www/html/app/config`
- **Character Encoding**: Use UTF8MB4 with utf8mb4_unicode_ci collation for full Unicode support in marketing content

### Security Considerations
- **Network Isolation**: Container accessible only through defined ports within Docker network
- **Credential Management**: Use environment variables for database connection and admin credentials
- **Admin Account**: Create secure admin user with strong password for initial configuration
- **File Permissions**: Proper file system permissions for web server and application files

### Performance Requirements
- **Resource Allocation**: Minimum 1GB RAM, 2GB recommended for marketing automation workflows
- **Startup Time**: Container should be ready within 60 seconds with successful health check
- **Concurrent Users**: Support for 50+ concurrent admin users and API requests
- **Database Connections**: Configure connection pooling for optimal database performance

## Technical Specifications

### Dependencies
- **Base Image**: mautic/mautic:v5-apache (official Mautic Docker image)
- **Database**: Existing MySQL 8.0+ container from DB01-DB-Container-Setup.md
- **PHP Extensions**: Included in official image (PHP 8.1+, required extensions pre-installed)
- **Web Server**: Apache 2.4+ (included in base image)

### Database Changes
- **New Database**: Create `mautic` database in existing MySQL container
- **New User**: Create `mautic_user` with database-specific permissions
- **Connection**: Use existing MySQL container network connection
- **Migration**: Mautic will auto-create tables on first startup

### API Endpoints (Available After Setup)
- **REST API**: http://localhost:8080/api/ (for future user provisioning)
- **Webhook Endpoints**: http://localhost:8080/webhook/ (for future campaign automation)
- **Admin Panel**: http://localhost:8080/ (for campaign management)

### Environment Variables
- `MAUTIC_DB_HOST`: Reference to MySQL container service name
- `MAUTIC_DB_PORT`: MySQL port (3306)
- `MAUTIC_DB_NAME`: Database name for Mautic
- `MAUTIC_DB_USER`: Database user for Mautic
- `MAUTIC_DB_PASSWORD`: Database password
- `MAUTIC_ADMIN_USERNAME`: Initial admin username
- `MAUTIC_ADMIN_PASSWORD`: Initial admin password
- `MAUTIC_ADMIN_EMAIL`: Admin email address
- `MAUTIC_SECRET_KEY`: Secret key for encryption

### Container Configuration
- **Port Mapping**: 8080:80 (HTTP access to Mautic)
- **Volume Mounts**:
  - `mautic_media:/var/www/html/media`
  - `mautic_config:/var/www/html/app/config`
  - `mautic_plugins:/var/www/html/plugins`
- **Network**: Use existing Docker Compose network
- **Dependencies**: Depends on database container from DB01-DB-Container-Setup.md
- **Health Check**: HTTP GET to /mautic/s/config every 30 seconds

### Integration Points for Future Features
- **User Provisioning**: API endpoints ready for MA02-Mautic-API-Auth.md and MA05-Mautic-Frontend-Connect.md
- **Campaign Management**: Admin interface ready for MA03-Mautic-Create-Campaign.md
- **Webhook Integration**: Endpoints prepared for MA04-Mautic-Campaign-Automation.md
- **Email Localization**: Campaign structure ready for AI03-Email-Translation-Manager.md

## Acceptance Criteria
1. Mautic container starts successfully and connects to existing MySQL database
2. Mautic admin panel accessible at http://localhost:8080 with created admin user
3. Database tables created automatically in dedicated Mautic database
4. Container persists configuration and media files across restarts
5. Health checks pass and container auto-restarts on failure
6. API endpoints respond correctly for future integration testing
7. Container logs show successful database connection and application startup
8. Admin user can log in and access campaign management features

## Prerequisites
- DB01-DB-Container-Setup.md: MySQL container must be running and accessible

## Next Steps
After completing this setup, the following integrations will be possible:
- MA02-Mautic-API-Auth.md: Generate API credentials for programmatic access
- MA03-Mautic-Create-Campaign.md: Create welcome campaigns using admin interface
- MA05-Mautic-Frontend-Connect.md: Connect signup forms to Mautic for user provisioning