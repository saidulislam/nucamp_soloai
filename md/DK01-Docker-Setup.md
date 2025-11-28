# DK01-Docker-Setup.md

## Overview
Run the provided Docker Compose configuration to launch all required services (MySQL, Strapi, Mautic) for the SaaS application. This single-command setup provides a complete backend infrastructure for development.

**Feature Type**: Development Environment Setup

**Business Value**: Enables rapid development environment setup with all required services pre-configured and ready to use within minutes.

## Requirements

### Prerequisites
- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+ installed
- At least 8GB RAM available for Docker
- 10GB free disk space
- Ports 3306, 1337, 8080 available

### Provided Files
The course provides a complete `docker-compose.yml` file with:
- MySQL 8.0 LTS database
- Strapi 4.x CMS (port 1337)
- Mautic 5.x marketing automation (port 8080)
- All necessary environment configurations
- Volume mappings for data persistence
- Network configuration for service communication

## Setup Instructions

### Step 1: Download Course Files
```bash
# Clone the course repository or download the starter files
git clone [course-repo-url]
cd saas-course-starter

# Verify docker-compose.yml exists
ls -la docker-compose.yml
```

### Step 2: Review Docker Compose Configuration
```yaml
# docker-compose.yml (provided)
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: saas_mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: saas_db
      MYSQL_USER: saas_user
      MYSQL_PASSWORD: saas_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init-scripts:/docker-entrypoint-initdb.d
    networks:
      - saas_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  strapi:
    image: strapi/strapi:4.15.5-alpine
    container_name: saas_strapi
    environment:
      DATABASE_CLIENT: mysql
      DATABASE_HOST: mysql
      DATABASE_PORT: 3306
      DATABASE_NAME: strapi_db
      DATABASE_USERNAME: saas_user
      DATABASE_PASSWORD: saas_password
      JWT_SECRET: ${JWT_SECRET:-your-jwt-secret-here}
      ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET:-your-admin-jwt-secret-here}
      APP_KEYS: ${APP_KEYS:-key1,key2,key3,key4}
      API_TOKEN_SALT: ${API_TOKEN_SALT:-your-api-token-salt}
    ports:
      - "1337:1337"
    volumes:
      - strapi_data:/srv/app
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - saas_network

  mautic:
    image: mautic/mautic:5.0-apache
    container_name: saas_mautic
    environment:
      MAUTIC_DB_HOST: mysql
      MAUTIC_DB_USER: saas_user
      MAUTIC_DB_PASSWORD: saas_password
      MAUTIC_DB_NAME: mautic_db
      MAUTIC_URL: http://localhost:8080
      MAUTIC_ADMIN_EMAIL: admin@example.com
      MAUTIC_ADMIN_PASSWORD: admin123
    ports:
      - "8080:80"
    volumes:
      - mautic_data:/var/www/html
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - saas_network

volumes:
  mysql_data:
  strapi_data:
  mautic_data:

networks:
  saas_network:
    driver: bridge
```

### Step 3: Create Environment File
```bash
# Create .env file for sensitive values
cat > .env << 'EOL'
# MySQL
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_PASSWORD=saas_password

# Strapi
JWT_SECRET=your-jwt-secret-here-change-in-production
ADMIN_JWT_SECRET=your-admin-jwt-secret-here-change-in-production
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-api-token-salt-change-in-production

# Mautic
MAUTIC_ADMIN_EMAIL=admin@example.com
MAUTIC_ADMIN_PASSWORD=admin123
EOL
```

### Step 4: Initialize Database Scripts
```bash
# Create init-scripts directory for database initialization
mkdir -p init-scripts

# Create initialization script for multiple databases
cat > init-scripts/01-create-databases.sql << 'EOL'
-- Create Strapi database
CREATE DATABASE IF NOT EXISTS strapi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON strapi_db.* TO 'saas_user'@'%';

-- Create Mautic database
CREATE DATABASE IF NOT EXISTS mautic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON mautic_db.* TO 'saas_user'@'%';

-- Create main application database
CREATE DATABASE IF NOT EXISTS app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON app_db.* TO 'saas_user'@'%';

FLUSH PRIVILEGES;
EOL
```

### Step 5: Start Docker Services
```bash
# Start all services in detached mode
docker-compose up -d

# View logs to monitor startup
docker-compose logs -f

# Wait for all services to be healthy (about 2-3 minutes)
```

### Step 6: Verify Services

#### Check Service Status
```bash
# Check all containers are running
docker-compose ps

# Expected output:
# NAME           IMAGE                    STATUS       PORTS
# saas_mysql     mysql:8.0               Up (healthy)  0.0.0.0:3306->3306/tcp
# saas_strapi    strapi/strapi:4.15.5    Up           0.0.0.0:1337->1337/tcp
# saas_mautic    mautic/mautic:5.0       Up           0.0.0.0:8080->80/tcp
```

#### Test Service Access
1. **MySQL Database**:
   ```bash
   # Test MySQL connection
   docker exec -it saas_mysql mysql -u saas_user -psaas_password -e "SHOW DATABASES;"
   ```

2. **Strapi CMS**:
   - Open browser: http://localhost:1337/admin
   - First-time setup: Create admin account

3. **Mautic**:
   - Open browser: http://localhost:8080
   - Login: admin@example.com / admin123
   - First-time setup will run automatically

## Troubleshooting

### Common Issues and Solutions

#### Port Conflicts
```bash
# If ports are in use, check what's using them
lsof -i :3306  # Mac/Linux
netstat -ano | findstr :3306  # Windows

# Stop conflicting services or change ports in docker-compose.yml
```

#### Service Won't Start
```bash
# Check logs for specific service
docker-compose logs strapi
docker-compose logs mautic
docker-compose logs mysql

# Restart individual service
docker-compose restart strapi
```

#### Database Connection Issues
```bash
# Ensure MySQL is fully started before other services
docker-compose up -d mysql
# Wait 30 seconds
docker-compose up -d strapi mautic
```

#### Reset Everything
```bash
# Stop and remove all containers and volumes (CAUTION: Deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Resource Management

#### Check Resource Usage
```bash
# Monitor container resource usage
docker stats

# Limit resources if needed (add to docker-compose.yml)
services:
  strapi:
    mem_limit: 2g
    cpus: '1.0'
```

## Service Configuration Details

### MySQL Configuration
- **Host**: localhost (from host machine) or `mysql` (from containers)
- **Port**: 3306
- **Root Password**: rootpassword
- **Application User**: saas_user
- **Application Password**: saas_password
- **Databases**: 
  - `saas_db` (main app)
  - `strapi_db` (Strapi CMS)
  - `mautic_db` (Mautic)
  - `app_db` (SvelteKit app)

### Strapi Configuration
- **URL**: http://localhost:1337
- **Admin Panel**: http://localhost:1337/admin
- **API**: http://localhost:1337/api
- **Database**: Automatically connected to MySQL

### Mautic Configuration
- **URL**: http://localhost:8080
- **Admin Login**: admin@example.com / admin123
- **Database**: Automatically connected to MySQL
- **Cron Jobs**: Handled by Mautic container

## Development Workflow

### Daily Development
```bash
# Start services in the morning
docker-compose up -d

# Check status
docker-compose ps

# View logs if needed
docker-compose logs -f [service-name]

# Stop services at end of day (preserves data)
docker-compose stop
```

### Data Persistence
All data is persisted in Docker volumes:
- `mysql_data`: Database files
- `strapi_data`: Strapi uploads and configuration
- `mautic_data`: Mautic files and cache

### Backup Data
```bash
# Backup MySQL databases
docker exec saas_mysql mysqldump -u root -prootpassword --all-databases > backup.sql

# Backup volumes
docker run --rm -v saas_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

## Next Steps
1. Verify all services are running
2. Access Strapi admin and create first admin user
3. Access Mautic and complete setup wizard
4. Proceed to A00-Manual-Init.md to set up the SvelteKit application

## Important Notes
- This is a development setup - do NOT use these credentials in production
- Change all passwords and secrets before deploying
- The provided docker-compose.yml includes health checks to ensure proper startup order
- Data persists between restarts unless you explicitly delete volumes

## Success Criteria
- [ ] Docker Compose runs without errors
- [ ] All three containers show as "Up" or "Up (healthy)"
- [ ] Can access Strapi at http://localhost:1337/admin
- [ ] Can access Mautic at http://localhost:8080
- [ ] Can connect to MySQL on port 3306
- [ ] Databases are created and accessible