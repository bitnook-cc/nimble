# Database Deployment Guide

## Automatic Database Initialization on Vercel

The database will automatically initialize/migrate when deployed to Vercel using the configured build commands.

### How It Works

1. **Build Command**: `vercel-build` script in package.json runs:
   ```bash
   prisma generate && prisma migrate deploy && tsc
   ```

2. **What Each Step Does**:
   - `prisma generate`: Generates the Prisma Client
   - `prisma migrate deploy`: Applies all pending migrations to the database
   - `tsc`: Compiles TypeScript

### Initial Setup (One-Time)

**⚠️ IMPORTANT: Always use Prisma Migrate for all environments. NEVER use `db:push` as it bypasses migration tracking and causes database drift.**

#### Using Prisma Migrate (REQUIRED)

1. Create your first migration locally:
   ```bash
   npx prisma migrate dev --name init
   ```

2. This creates a `prisma/migrations` folder with SQL migration files

3. Commit the migration files to git

4. Deploy to Vercel - migrations will run automatically

#### ~~Option 2: Using db:push~~ (DEPRECATED - DO NOT USE)

**❌ DO NOT USE `db:push` - It causes database drift and breaks migration tracking**

The `db:push` command bypasses the migration system and directly synchronizes your schema with the database. This causes:
- Loss of migration history
- Database drift between environments
- Inability to rollback changes
- Deployment failures when migrations are out of sync

### Environment Variables on Vercel

Set these in your Vercel project settings:

```bash
DATABASE_URL=<your-vercel-postgres-url>
SESSION_SECRET=<at-least-32-characters>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
COOKIE_DOMAIN=.yourdomain.com  # If using subdomains
API_URL=https://api.yourdomain.com  # Your API URL
```

### Future Schema Changes

When you need to update the database schema:

1. Modify `prisma/schema.prisma`

2. Create a new migration:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```

3. Test locally

4. Commit and push - Vercel will automatically apply the migration

### Troubleshooting

#### If migrations fail on Vercel:

1. Check the build logs in Vercel dashboard
2. Ensure DATABASE_URL is set correctly
3. Verify the database is accessible from Vercel

#### To reset the database (development only):

```bash
npx prisma migrate reset
```

#### To check migration status:

```bash
npx prisma migrate status
```

### Local vs Production

- **Local**: Uses Docker PostgreSQL, runs `migrate deploy` for consistency with production
- **Production**: Uses Vercel Postgres, runs `migrate deploy` for proper migration tracking

Both environments use the same migration workflow to ensure consistency and prevent database drift.