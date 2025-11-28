# Strapi Container Setup

## Overview
Set up Strapi CMS as a containerized headless content management system to serve as the content backend for the SaaS application. This builds upon the MySQL database container established in `DB01-DB-Container-Setup.md` and provides the foundation for content management, localization workflows, and API-driven content delivery.

**Feature Type**: Technical Integration

## Requirements

### Service Details
- **Strapi Version**: 4.15+ (latest stable)
- **Node.js Version**: 18+ LTS
- **Database**: MySQL connection to existing 'db' container
- **Admin Panel**: Accessible web interface for content management
- **API**: RESTful and GraphQL endpoints for content delivery

### Integration Points
- **Database Connection**: Connect to MySQL container from `DB01-DB-Container-Setup.md`
- **Docker Network**: Use same Docker Compose network as database
- **Volume Persistence**: Strapi uploads, config, and app data must persist
- **Environment Configuration**: Database credentials, admin settings, API tokens

### Functional Requirements
1. **Container Startup**: Strapi container starts successfully and connects to MySQL database
2. **Admin Account**: Create initial admin user account for content management
3. **API Accessibility**: REST and GraphQL APIs accessible from host machine
4. **File Uploads**: Media upload functionality working with persistent storage
5. **Database Integration**: Strapi successfully creates and manages database tables
6. **Health Checks**: Container health monitoring and restart policies

### Data Requirements
- **Database Schema**: Strapi auto-generates core tables (users, roles, content types)
- **Admin User**: Store admin credentials securely
- **Media Storage**: Persistent volume for uploaded files and assets
- **Configuration**: Strapi settings and customizations persist across restarts

### Security Considerations
- **Admin Panel Access**: Secure admin interface with strong authentication
- **API Security**: Default API permissions (will be configured in future lessons)
- **Database Security**: Use dedicated Strapi database user with limited privileges
- **Network Isolation**: Container accessible only through defined ports
- **Secret Management**: Database passwords and admin JWT secrets via environment variables

### Performance Requirements
- **Startup Time**: Container ready within 60 seconds of start command
- **Memory Usage**: Minimum 512MB RAM allocation (1GB recommended)
- **Database Connections**: Support for multiple concurrent API requests
- **File Upload**: Handle media files up to 50MB

## Technical Specifications

### Dependencies
- **Docker & Docker Compose**: Container orchestration
- **MySQL Database**: Connection to existing 'db' container from `DB01-DB-Container-Setup.md`
- **Node.js 18+**: Runtime environment within container
- **Strapi 4.15+**: CMS framework

### Database Changes
- **New Database**: Create dedicated Strapi database in existing MySQL container
- **User Account**: Create Strapi-specific MySQL user with appropriate permissions
- **Connection String**: Configure database connection for Strapi container

### Docker Compose Configuration
- **Service Name**: 'strapi' for internal container communication
- **Port Mapping**: Expose Strapi on host port 1337
- **Volume Mounts**: 
  - Uploads directory for media files
  - App directory for Strapi application code and customizations
  - Config directory for Strapi configuration files
- **Environment Variables**: Database connection, admin JWT secret, app keys
- **Dependencies**: Ensure database container starts before Strapi
- **Restart Policy**: Auto-restart on failure

### Environment Variables
- `DATABASE_HOST`: Connection to 'db' container
- `DATABASE_PORT`: MySQL port (3306)
- `DATABASE_NAME`: Strapi-specific database name
- `DATABASE_USERNAME`: Strapi MySQL user
- `DATABASE_PASSWORD`: Strapi MySQL user password
- `DATABASE_SSL`: SSL configuration (false for development)
- `HOST`: Strapi host binding (0.0.0.0 for container access)
- `PORT`: Strapi port (1337)
- `APP_KEYS`: Strapi application keys for security
- `API_TOKEN_SALT`: Salt for API token generation
- `ADMIN_JWT_SECRET`: JWT secret for admin authentication
- `TRANSFER_TOKEN_SALT`: Transfer token salt for data transfer

### API Endpoints
- **Admin Panel**: `http://localhost:1337/admin` - Content management interface
- **REST API**: `http://localhost:1337/api` - RESTful content endpoints
- **GraphQL**: `http://localhost:1337/graphql` - GraphQL query endpoint
- **Upload API**: `http://localhost:1337/uploads` - Media file endpoints

## Additional Context for AI Assistant

### Prerequisites
- Complete `DB01-DB-Container-Setup.md` - MySQL database container must be running
- Docker and Docker Compose installed and configured
- Basic understanding of container networking and volumes

### Implementation Notes
1. **Database Setup**: Create Strapi database and user in existing MySQL container
2. **Container Configuration**: Add Strapi service to existing docker-compose.yml
3. **Volume Strategy**: Use named volumes for data persistence
4. **Network Configuration**: Ensure Strapi can communicate with database container
5. **Environment Management**: Set up .env file with required Strapi variables
6. **Admin User Creation**: Guide through first-time setup and admin account creation

### Future Integration Points
- **Content Types**: Will be configured in `SP02-Strapi-Content-Type.md`
- **API Permissions**: Will be set up in `SP04-Strapi-API-Permissions.md`
- **Frontend Connection**: Will connect to frontend in `SP05-Strapi-Frontend-Connect.md`
- **Localization**: Will integrate with AI translation workflow in later lessons

### Success Criteria
- Strapi admin panel accessible at `http://localhost:1337/admin`
- Admin user account created and can log in
- Database connection established and Strapi tables created
- Container starts automatically with `docker-compose up`
- Strapi API endpoints responding to requests
- File upload functionality working with persistent storage
- Container logs show successful startup without errors

### Common Issues to Address
- Database connection timeout on first startup
- Permission issues with volume mounts
- Memory allocation for Strapi container
- Network connectivity between containers
- Environment variable configuration errors
- Admin panel accessibility from host machine