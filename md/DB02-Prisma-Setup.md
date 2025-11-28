# DB02-Prisma-Setup.md

## Overview
Install and configure Prisma ORM to connect the SvelteKit application to the MySQL database container established in DB01-DB-Container-Setup.md. Set up Prisma Client for type-safe database queries and prepare the foundation for Better Auth integration, which requires Prisma for automatic table generation and migrations.

**Business Value**: Establishes type-safe database access layer for the application, enabling secure user authentication, content management, and data persistence with full TypeScript support.

**Feature Type**: Infrastructure Setup

## Requirements

### Functional Requirements
- **Prisma Installation**: Install Prisma CLI and Prisma Client packages with TypeScript support
- **Database Connection**: Configure connection to dedicated `soloai_db` database in existing MySQL container
- **Schema Configuration**: Set up Prisma schema file with MySQL provider and connection settings
- **Client Generation**: Generate Prisma Client for type-safe database operations
- **Environment Integration**: Configure DATABASE_URL environment variable following existing patterns
- **Migration Support**: Prepare Prisma migration system for future schema changes

**Acceptance Criteria**:
- [ ] Prisma packages successfully installed via npm
- [ ] `prisma/schema.prisma` file created with MySQL configuration
- [ ] DATABASE_URL configured in .env and validated
- [ ] `soloai_db` database created in MySQL container
- [ ] Prisma Client successfully generated
- [ ] Connection to database verified via Prisma
- [ ] TypeScript types available for database operations

### Data Requirements
- **Database Name**: `soloai_db` (separate from Strapi and Mautic databases)
- **Database User**: Dedicated MySQL user `soloai_db_user` for isolation
- **Connection String**: Standard MySQL connection URL format
- **Character Set**: UTF8MB4 for full Unicode support (inherited from MySQL setup)
- **Provider**: MySQL via Prisma's mysql provider

### Security Considerations
- **Connection String Security**: DATABASE_URL must be stored in .env, never committed to git
- **User Permissions**: Dedicated `soloai_db_user` with access only to `soloai_db` database
- **SSL Configuration**: SSL disabled for local development, must be enabled for production
- **Password Security**: Use strong password from MySQL configuration
- **Environment Isolation**: Development, testing, and production use separate DATABASE_URL values

### Performance Requirements
- **Connection Pooling**: Prisma automatically manages connection pool
- **Query Performance**: Prisma generates optimized SQL queries
- **Type Generation**: Prisma Client generation completes within 10 seconds
- **Startup Time**: Database connection established within 2 seconds on application start

## Technical Specifications

### Dependencies
- **@prisma/client**: Prisma Client for database queries and type generation
- **prisma**: Prisma CLI for migrations, schema management, and client generation (dev dependency)
- **MySQL**: Existing MySQL 8.0+ container from DB01-DB-Container-Setup.md
- **TypeScript**: Full TypeScript support for type-safe queries

### Installation Steps
```bash
# Install Prisma packages
npm install @prisma/client
npm install -D prisma

# Initialize Prisma (creates prisma/schema.prisma and updates .env)
npx prisma init

# Generate Prisma Client
npx prisma generate

# Verify database connection (after .env configuration)
npx prisma db push
```

### Environment Variables
Add to existing `.env` configuration:
```env
# Prisma Database Connection
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
# Note: Port 3307 is the host port mapped to container's 3306
DATABASE_URL="mysql://soloai_db_user:superSecretUserPwd@localhost:3307/soloai_db"
```

Update `.env.example`:
```env
# Prisma Database Connection (DB02-Prisma-Setup.md)
DATABASE_URL="mysql://soloai_db_user:your_password@localhost:3307/soloai_db"
```

### Database Configuration
The `soloai_db` database must be created in the MySQL container. Update `init-strapi-db.sql`:
```sql
-- Create SoloAI application database (for SvelteKit app with Prisma and Better Auth)
CREATE DATABASE IF NOT EXISTS soloai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create SoloAI user and grant privileges
CREATE USER IF NOT EXISTS 'soloai_db_user'@'%' IDENTIFIED BY 'superSecretUserPwd';
GRANT ALL PRIVILEGES ON soloai_db.* TO 'soloai_db_user'@'%';

-- Existing Strapi database setup
CREATE DATABASE IF NOT EXISTS strapi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'strapi_db_user'@'%' IDENTIFIED BY 'superSecretUserPwd';
GRANT ALL PRIVILEGES ON strapi_db.* TO 'strapi_db_user'@'%';
FLUSH PRIVILEGES;
```

### Prisma Schema Configuration
Create/modify `prisma/schema.prisma`:
```prisma
// Prisma Schema for SoloAI SvelteKit Application
// Database: MySQL 8.0+ (soloai_db)
// Generated: [DATE]

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Models will be auto-generated by Better Auth
// Additional custom models can be added here
```

### File Structure
New files created by this setup:
```
/prisma/
  schema.prisma          # Prisma schema definition
/node_modules/
  @prisma/
    client/              # Generated Prisma Client (gitignored)
/.env                    # DATABASE_URL added (gitignored)
/.env.example            # DATABASE_URL template added
```

### npm Scripts
Add to `package.json` scripts section:
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",
    "postinstall": "prisma generate"
  }
}
```

## Integration Points

### Database Container Integration
- Connects to MySQL container from DB01-DB-Container-Setup.md
- Uses port 3307 (host) mapped to 3306 (container)
- Shares MySQL instance with Strapi and Mautic (separate databases)
- Benefits from existing health checks and restart policies

### Better Auth Integration
- Better Auth (AU02-BetterAuth-Init.md) uses Prisma as database adapter
- Better Auth auto-generates user, session, account, and verification tables
- Prisma migrations track Better Auth schema changes
- Type-safe access to auth tables via Prisma Client

### Environment Variable Integration
- Extends EV01-Env-File-Setup.md with DATABASE_URL
- Validated by EV02-Env-Validation.md environment checks
- Follows EV03-Secret-Management.md security patterns

### Future Integrations
- Payment records (Stripe/LemonSqueezy webhooks)
- Custom user profile extensions
- Application-specific data models
- Analytics and usage tracking tables

## Additional Context for AI Assistant

### Prerequisites
This feature builds upon:
- **DB01-DB-Container-Setup.md**: MySQL database container must be running
- **EV01-Env-File-Setup.md**: Environment variable management system
- **DK01-Docker-Setup.md**: Docker Compose configuration

### Next Steps
This setup prepares for:
- **AU01-Install-BetterAuth.md**: Better Auth package installation
- **AU02-BetterAuth-Init.md**: Better Auth initialization with Prisma adapter
- Custom data model development for application features

### Development Workflow
1. Ensure MySQL container is running: `docker-compose up -d db`
2. Install Prisma packages: `npm install @prisma/client && npm install -D prisma`
3. Initialize Prisma: `npx prisma init`
4. Update DATABASE_URL in .env with correct credentials
5. Ensure soloai_db exists in MySQL (via init-strapi-db.sql)
6. Generate Prisma Client: `npx prisma generate`
7. Test connection: `npx prisma db push`
8. Optional: Open Prisma Studio to inspect database: `npx prisma studio`

### Database Connection Details
**Why Port 3307?**
The docker-compose.yml maps MySQL container port 3306 to host port 3307:
```yaml
ports:
  - "3307:3306"
```
This allows the host application (SvelteKit) to connect via localhost:3307 while avoiding conflicts with any local MySQL installations on port 3306.

**Database Isolation Strategy:**
- `mautic_db`: Used by Mautic marketing automation
- `strapi_db`: Used by Strapi CMS
- `soloai_db`: Used by SvelteKit application (Better Auth + custom data)

This isolation ensures that each service has its own schema namespace while sharing the same MySQL instance for simplified infrastructure.

### Prisma Best Practices
- Always run `npx prisma generate` after schema changes
- Use `npx prisma migrate dev` for development schema changes
- Use `npx prisma migrate deploy` for production deployments
- Never commit generated Prisma Client to git (handled by .gitignore)
- Run `npx prisma studio` to visually inspect and edit database data
- Keep schema.prisma in sync with actual database state

### Troubleshooting
**Connection Issues:**
- Verify MySQL container is running: `docker-compose ps db`
- Check DATABASE_URL format and credentials
- Ensure soloai_db exists: `docker-compose exec db mysql -u root -p -e "SHOW DATABASES;"`
- Verify user permissions on soloai_db

**Generation Issues:**
- Clear Prisma cache: `rm -rf node_modules/.prisma`
- Regenerate client: `npx prisma generate`
- Check schema.prisma syntax

**Migration Issues:**
- Reset database (development only): `npx prisma migrate reset`
- Push schema without migrations: `npx prisma db push`
- Check migration status: `npx prisma migrate status`
