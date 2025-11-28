# DB01-DB-Container-Setup.md

## Overview
Set up MySQL database container using Docker Compose to serve as the persistent data layer for the SaaS application. This database will support Strapi CMS, user authentication, payment records, and all application data with proper configuration for development and production environments.

**Business Value**: Establishes the foundational data persistence layer required for all subsequent features including content management, user authentication, and billing systems.

**Feature Type**: Infrastructure Setup

## Requirements

### Functional Requirements
- **Database Service**: MySQL 8.0+ container running via Docker Compose
- **Persistent Storage**: Database data must persist across container restarts
- **Network Access**: Database accessible to other containers in the Docker network
- **Admin Access**: Database accessible for direct administration and debugging
- **Initial Setup**: Database initializes with proper user accounts and permissions
- **Health Checks**: Container health monitoring to ensure database availability

**Acceptance Criteria**:
- [ ] MySQL container starts successfully via `docker-compose up`
- [ ] Database data persists when container is stopped and restarted
- [ ] Database is accessible from other containers using service name
- [ ] Database accepts connections with configured credentials
- [ ] Health check endpoint returns healthy status
- [ ] Database logs are accessible via `docker-compose logs db`

### Data Requirements
- **Database Engine**: MySQL 8.0 or higher
- **Character Set**: UTF8MB4 for full Unicode support (emojis, international characters)
- **Collation**: utf8mb4_unicode_ci for proper sorting of international content
- **Storage Engine**: InnoDB for ACID compliance and foreign key support
- **Initial Databases**: 
  - Application database (for Strapi and user data)
  - Test database (for automated testing)

### Security Considerations
- **Root Password**: Strong root password via environment variable
- **Application User**: Dedicated non-root user for application connections
- **Network Isolation**: Database only accessible within Docker network by default
- **Connection Limits**: Configure appropriate connection limits
- **SSL/TLS**: Optional SSL configuration for production deployment

### Performance Requirements
- **Memory Allocation**: Minimum 512MB, recommended 1GB for development
- **Connection Pool**: Support for at least 100 concurrent connections
- **Query Cache**: Enabled for improved read performance
- **Startup Time**: Container should be ready within 30 seconds

## Technical Specifications

### Dependencies
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **MySQL Image**: Official mysql:8.0 from Docker Hub

### Database Configuration
- **Port Mapping**: 3306:3306 (host:container)
- **Service Name**: `db` (for internal container communication)
- **Volume Mount**: Named volume for persistent data storage
- **Init Scripts**: Support for SQL initialization scripts if needed

### Environment Variables
The following environment variables must be configured:
- `MYSQL_ROOT_PASSWORD`: Strong password for MySQL root user
- `MYSQL_DATABASE`: Default database name for the application
- `MYSQL_USER`: Application database user (non-root)  
- `MYSQL_PASSWORD`: Password for application database user
- `DB_HOST`: Database hostname (should be `db` for Docker network)
- `DB_PORT`: Database port (3306)
- `DATABASE_URL`: Full connection string for Prisma/application use

### Container Specifications
- **Image**: mysql:8.0
- **Restart Policy**: unless-stopped
- **Memory Limit**: 1GB (configurable)
- **Health Check**: mysqladmin ping command
- **Logging**: JSON file driver with log rotation

### Network Configuration
- **Internal Network**: Custom Docker network for service communication
- **External Access**: Port 3306 exposed to localhost for development
- **Service Discovery**: Accessible via hostname `db` from other containers

## Integration Points

### Future Integrations
This database will be used by:
- **Strapi Container** (SP01-Strapi-Container-Setup.md): Content management data
- **Better Auth** (AU02-BetterAuth-Init.md): User authentication and session data  
- **Stripe/LemonSqueezy**: Payment and subscription records
- **Mautic Integration**: User contact and campaign data synchronization

### Development Tools
- **Database Administration**: Accessible via MySQL clients on localhost:3306
- **Backup/Restore**: Volume-based backup strategy for data persistence
- **Migrations**: Support for Prisma migrations and schema updates
- **Seeding**: Ready for initial data seeding scripts

## Additional Context for AI Assistant

This is the foundational database setup that must be completed before any other services can function. The database container should:

1. **Follow Docker Best Practices**:
   - Use official MySQL image with specific version tag
   - Implement proper health checks
   - Configure appropriate restart policies
   - Use named volumes for data persistence

2. **Support Development Workflow**:
   - Easy to start/stop via docker-compose commands
   - Accessible for direct SQL queries during development
   - Clear logging for troubleshooting
   - Fast startup for development iteration

3. **Prepare for Production**:
   - Environment variable configuration for sensitive data
   - Resource limits to prevent system overload
   - Network security considerations
   - Backup and recovery planning

4. **Enable Future Features**:
   - UTF8MB4 support for international content and AI translations
   - Sufficient connection limits for concurrent users
   - Performance configuration for production workloads
   - Schema flexibility for evolving application needs

The setup should be straightforward enough that a developer can run `docker-compose up db` and have a fully functional MySQL database ready for application development within minutes.