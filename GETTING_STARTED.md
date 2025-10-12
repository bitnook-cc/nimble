# Getting Started with Nimble Navigator

This guide will help you set up and run the Nimble Navigator monorepo locally.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js** (v18 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`

- **npm** (v9 or higher, comes with Node.js)
  - Verify installation: `npm --version`

- **Git**
  - Download from [git-scm.com](https://git-scm.com/)
  - Verify installation: `git --version`

- **Docker Desktop** (for local database)
  - Download from [docker.com](https://www.docker.com/products/docker-desktop)
  - Required for running the API server with PostgreSQL
  - Verify installation: `docker --version`

### Optional but Recommended

- **Visual Studio Code** or your preferred code editor
- **Supabase CLI** (for database migrations)
  - Install: `npm install -g supabase`

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nimble
```

### 2. Install Dependencies

Install all dependencies for the monorepo:

```bash
npm install
```

This will install dependencies for all apps and packages in the monorepo using Turborepo's workspace configuration.

### 3. Environment Configuration

Each app has its own environment configuration. Copy the example files and configure them:

#### Portal App (`apps/portal/`)

```bash
cp apps/portal/.env.example apps/portal/.env.local
```

**Required environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)
- `NEXT_PUBLIC_SITE_URL` - Your local site URL (usually `http://localhost:3000`)

**Optional OAuth providers:**
- `PATREON_CLIENT_ID` - For Patreon account linking
- `PATREON_CLIENT_SECRET` - For Patreon account linking

**App URLs** (for navigation):
- `VAULT_APP_URL` - URL to vault documentation (default: `http://localhost:4321`)
- `CHARACTERS_APP_URL` - URL to character sheets app
- `DICE_APP_URL` - URL to dice roller app

#### API Server (`apps/api/`)

```bash
cp apps/api/.env.example apps/api/.env
```

**Required environment variables:**
- `DATABASE_URL` - PostgreSQL connection string
  - Local development: `postgresql://postgres:nimblelocal123@localhost:5432/nimbledb?schema=public`
  - Production: Vercel Postgres connection string
- `SESSION_SECRET` - Random string for session encryption
- `GOOGLE_CLIENT_ID` - For Google OAuth (if using API auth)
- `GOOGLE_CLIENT_SECRET` - For Google OAuth (if using API auth)

**Optional:**
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage token for character images
- `PORT` - API server port (default: 3001)

#### Vault Documentation (`apps/vault/`)

```bash
cp apps/vault/.env.example apps/vault/.env
```

**Required environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NIMBLE_JWT_PUBLIC_KEY` - Public key for JWT verification (from shared-auth package)

### 4. Database Setup (for API)

The API app uses PostgreSQL. For local development, the database automatically starts when you run `npm run dev`.

**Automatic Setup:**

```bash
# Start all apps (includes database auto-start)
npm run dev
```

The first time you run this, it will:
1. Start a PostgreSQL Docker container (`nimble-postgres`)
2. Run all pending Prisma migrations
3. Generate the Prisma client

**Manual Database Commands** (if needed):

```bash
cd apps/api

# Start PostgreSQL container
npm run db:start-local

# Run migrations
npm run db:migrate:deploy

# Create a new migration (after schema changes)
npm run db:migrate:dev

# Open Prisma Studio (database GUI)
npm run db:studio
```

**Important:** Always use migrations for schema changes. Never use `db:push` as it bypasses migration tracking.

## Running the Development Server

### Start All Apps

From the root directory:

```bash
npm run dev
```

This will start:
- **Portal** (`apps/portal`) at `http://localhost:3000`
- **API Server** (`apps/api`) at `http://localhost:3001`
- **Vault Documentation** (`apps/vault`) at `http://localhost:4321`
- **PostgreSQL Database** (Docker container on port 5432)

### Start Individual Apps

You can also run specific apps:

```bash
# Portal only
npm run dev:portal

# API only
npm run dev:api

# Vault only
npm run dev:vault

# Web app only (character sheets)
npm run dev:web
```

Or using Turbo filters:

```bash
npx turbo dev --filter=@nimble/portal
npx turbo dev --filter=@nimble/api
npx turbo dev --filter=@nimble/vault
npx turbo dev --filter=@nimble/web
```

## Verifying Your Setup

### Check Portal App

1. Open `http://localhost:3000`
2. You should see the Nimble Navigator landing page
3. Click "Login" and try authenticating with Google/Discord (if configured)

### Check API Server

1. Open `http://localhost:3001`
2. You should see: `"Welcome to the Nimble Navigator API"`
3. Check health endpoint: `http://localhost:3001/health`

### Check Vault Documentation

1. Open `http://localhost:4321`
2. You should see the Nimble RPG documentation homepage
3. Browse through the rules and lore sections

### Check Database

```bash
cd apps/api
npm run db:studio
```

This opens Prisma Studio at `http://localhost:5555` where you can view and edit database records.

## Common Issues

### Port Already in Use

If you get "port already in use" errors:

```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Find process using port 3001
lsof -ti:3001 | xargs kill -9

# Find process using port 5432 (PostgreSQL)
docker stop nimble-postgres
```

### Docker Not Running

If the database fails to start:

1. Ensure Docker Desktop is running
2. Check Docker status: `docker ps`
3. Manually start database: `cd apps/api && npm run db:start-local`

### Database Connection Issues

If you get database connection errors:

```bash
cd apps/api

# Stop and remove existing container
docker stop nimble-postgres
docker rm nimble-postgres

# Remove volume (WARNING: deletes all data)
docker volume rm nimble-postgres-data

# Restart dev server (will recreate everything)
npm run dev
```

### Missing Environment Variables

If you see errors about missing environment variables:

1. Ensure you've created `.env.local` or `.env` files in each app directory
2. Copy from `.env.example` files
3. Fill in all required values
4. Restart the development server

### Supabase Setup

If you don't have a Supabase project yet:

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy your project URL and keys to the appropriate `.env` files
5. Enable Google/Discord OAuth in Authentication > Providers

## Next Steps

- **Explore the Portal**: Navigate through the authentication and settings features
- **Read the Documentation**: Check out the vault app to understand the Nimble RPG system
- **Build Characters**: Use the web app to create and manage characters
- **API Development**: Explore the API endpoints and database schema
- **Contributing**: See `CLAUDE.md` for detailed architecture documentation

## Additional Commands

### Build

```bash
# Build all apps
npm run build

# Build specific app
npx turbo build --filter=@nimble/portal
```

### Testing

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run E2E tests (web app)
cd apps/web
npm run test:e2e
```

### Code Quality

```bash
# Lint all code
npm run lint

# Type check all code
npm run typecheck

# Format code
npm run format
```

### Database Management

```bash
cd apps/api

# Create a new migration
npm run db:migrate:dev

# Apply migrations
npm run db:migrate:deploy

# Reset database (WARNING: deletes all data)
npm run db:migrate:reset

# Generate Prisma client
npm run db:generate
```

## Getting Help

- **Documentation**: See `CLAUDE.md` for comprehensive architecture details
- **Database Guide**: See `apps/api/DATABASE_DEPLOYMENT.md` for database setup
- **Issues**: Report bugs or request features on GitHub

## Environment Files Quick Reference

| App | File Location | Purpose |
|-----|--------------|---------|
| Portal | `apps/portal/.env.local` | Supabase config, OAuth providers, site URL |
| API | `apps/api/.env` | Database URL, session secrets, Google OAuth |
| Vault | `apps/vault/.env` | Supabase config, JWT public key |
| Web | `apps/web/.env.local` | (If needed for future features) |

All apps have `.env.example` files showing the required variables with explanations.
