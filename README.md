# SoloAI Starter

A complete development environment combining SvelteKit 5, MySQL, Mautic, and Strapi, all orchestrated with Docker.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Docker** (v20.10 or higher)
- **Docker Compose** (v2.0 or higher)
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nucamp/soloai_starter.git nucamp_soloai
cd nucamp_soloai
```

### 2. Initialize SvelteKit App

Initialize the SvelteKit application with the required dependencies:

```bash
npx sv create nucamp_soloai
```

When prompted, select the following options:
- **Prettier**: Yes
- **ESLint**: Yes
- **Tailwind CSS**: Yes
- **SvelteKit Adapter**: Yes
- **Paraglide**: Yes
  - Languages: `en, fr, hi, es, pt, de, it, ur, fi, nb, ar, ru`
- **MCP**: Yes

This will set up your SvelteKit project with internationalization support for 12 languages and all necessary development tools.

### 3. Configure Environment Variables

#### Create and Configure `.env` File

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file and update the following variables:

**CRITICAL: Update BASE_PATH**
```env
BASE_PATH=/absolute/path/to/your/docker-volumes
```
Replace this with an absolute path where Docker volumes will be stored. Example:
- Linux/Mac: `/home/username/docker-volumes/soloai`
- Windows: `D:/docker-volumes/soloai` or `/mnt/d/docker-volumes/soloai` (WSL)

**Configure API Keys**
```env
# OpenAI API Key - Get from https://platform.openai.com/api-keys (if using AI features)
OPENAI_API_KEY=your_openai_key_here

# Strapi API Token - Leave as placeholder, will be configured after Strapi setup
STRAPI_API_TOKEN=your_api_token_here

# Translation API Token - Leave as placeholder, will be configured later
TRANSLATION_API_TOKEN=your_secure_random_token_here
```

**Optional: Update Security Secrets**

For production environments, replace the default JWT secrets and salts with secure random strings:

```env
JWT_SECRET="your_new_jwt_secret"
ADMIN_JWT_SECRET="your_new_admin_jwt_secret"
APP_KEYS="your_new_app_keys"
API_TOKEN_SALT="your_new_api_token_salt"
TRANSFER_TOKEN_SALT="your_new_transfer_token_salt"
```

**Optional: Database Credentials**

For production, update the default passwords:

```env
MYSQL_PASSWORD=your_secure_password
MYSQL_ROOT_PASSWORD=your_secure_root_password
```

**Note:** If you change these passwords, you must also update them in `init-strapi-db.sql:5`

#### Verify `.mautic_env` File Exists

The `.mautic_env` file should already exist. It references environment variables from your `.env` file, so no changes are needed unless you have specific Mautic configuration requirements.

### 4. Install Node.js Dependencies

```bash
npm install
```

This will install all required packages for the SvelteKit application, including:
- SvelteKit and Svelte 5
- Tailwind CSS
- Strapi Client
- OpenAI SDK
- Testing tools (Playwright, Vitest)

### 5. Start Docker Services

Start all Docker containers:

```bash
docker-compose up -d
```

This will start the following services:
- **MySQL** (port 3307)
- **Strapi** (port 1337)
- **Mautic** (port 8080)
- **Nginx** (reverse proxy for Mautic)

### 6. Verify Services Are Running

Check that all containers are running:

```bash
docker-compose ps
```

All services should show as "running" or "healthy". Wait for health checks to complete (this may take 1-2 minutes on first startup).

Check logs if any service fails:

```bash
docker-compose logs -f [service-name]
# Example: docker-compose logs -f strapi
```

### 7. Access the Applications

Once all services are running:

**SvelteKit Development Server**
```bash
npm run dev
```
Then open: http://localhost:5173

**Strapi Admin Panel**

Open: http://localhost:1337/admin

On first launch, create an admin account by filling in the admin registration form.

**Mautic**

Open: http://localhost:8080

On first launch, complete the Mautic installation wizard:
1. Database configuration should auto-populate from environment variables
2. Create an admin account
3. Configure email settings (optional)

**MySQL Database**

Access MySQL directly if needed:
```bash
docker-compose exec db mysql -u root -p
# Password: value of MYSQL_ROOT_PASSWORD from .env
```

### 8. Configure Strapi API Token (Optional)

If you need to connect your SvelteKit app to Strapi:

1. Open Strapi admin panel at http://localhost:1337/admin
2. Go to Settings → API Tokens → Create new API Token
3. Set token name (e.g., "SvelteKit")
4. Set token type to "Full access" or configure custom permissions
5. Copy the generated token
6. Update your `.env` file: `STRAPI_API_TOKEN=<your_token>`
7. Restart the SvelteKit dev server: `npm run dev`

## Development

### SvelteKit Commands

```bash
# Start development server
npm run dev

# Start dev server and open browser
npm run dev -- --open

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run check

# Run linter
npm run lint

# Run unit tests
npm run test:unit

# Run end-to-end tests
npm run test:e2e

# Run all tests
npm run test
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart [service-name]

# Rebuild containers
docker-compose up -d --build
```

## Troubleshooting

### Containers Won't Start

1. Verify BASE_PATH in `.env` exists and has correct permissions
2. Check if ports 1337, 3307, or 8080 are already in use
3. Review logs: `docker-compose logs -f`

### Volume Mount Errors

If you see permission errors on Linux:
```bash
sudo chown -R $USER:$USER /your/base/path
```

### Database Connection Issues

1. Verify MySQL container is healthy: `docker-compose ps`
2. Check credentials in `.env` match those in `init-strapi-db.sql`
3. Restart database: `docker-compose restart db`

### Mautic Not Loading

1. Wait for mautic_web to be healthy: `docker-compose ps`
2. Check nginx logs: `docker-compose logs nginx`
3. Verify volume mounts are correct

### SvelteKit Build Errors

1. Clear node modules and reinstall: `rm -rf node_modules && npm install`
2. Clear SvelteKit cache: `rm -rf .svelte-kit`
3. Check Node.js version: `node --version` (should be v18+)

## Project Structure

```
web/
├── src/                    # SvelteKit source files
├── static/                 # Static assets
├── docker-compose.yml      # Docker orchestration
├── .env                    # Environment variables (create from .env.example)
├── .env.example            # Environment template
├── .mautic_env            # Mautic-specific environment variables
├── init-strapi-db.sql     # Strapi database initialization
├── nginx.conf             # Nginx configuration for Mautic
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## Services Overview

- **SvelteKit**: Frontend framework (dev server on port 5173)
- **Strapi**: Headless CMS for content management (port 1337)
- **Mautic**: Marketing automation platform (port 8080)
- **MySQL**: Database for both Mautic and Strapi (port 3307)
- **Nginx**: Reverse proxy for Mautic

## Next Steps

1. Explore the SvelteKit application structure in `/src`
2. Configure your Strapi content types at http://localhost:1337/admin
3. Set up your Mautic campaigns at http://localhost:8080
4. Review the example environment variables for additional features like OpenAI integration

## Additional Resources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Svelte 5 Documentation](https://svelte.dev/docs)
- [Strapi Documentation](https://docs.strapi.io)
- [Mautic Documentation](https://docs.mautic.org)
- [Docker Documentation](https://docs.docker.com)
