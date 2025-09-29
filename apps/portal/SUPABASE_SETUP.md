# Supabase CLI Setup

This guide shows how to set up and run Supabase migrations using the CLI.

## Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project created
2. **Node.js**: Make sure you have Node.js installed

## Setup Steps

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Get Your Supabase Project Information

**Project Reference ID:**
- Go to your Supabase dashboard: https://supabase.com/dashboard
- Select your project
- Go to Settings → General
- Copy the "Reference ID" (looks like `abcdefghijklmnop`)

**Database Password:**
- You'll need your database password from when you created the project
- Or reset it in Settings → Database

### 3. Link Your Project

```bash
cd apps/portal
supabase link --project-ref YOUR_PROJECT_REF
```

You'll be prompted to enter your database password.

### 4. Run the Migration

**Option A: Using CLI (Recommended)**
```bash
cd apps/portal
supabase db push
```

**Option B: Manual via Dashboard**
- Copy the contents of `supabase/migrations/20250129000001_create_user_management_tables.sql`
- Go to Supabase Dashboard → SQL Editor
- Paste and run the migration

## How It Works

The Supabase CLI will:
1. **Read** your migration files from `supabase/migrations/`
2. **Connect** to your Supabase project
3. **Apply** any new migrations to the database
4. **Track** which migrations have been applied

## File Structure

```
apps/portal/
├── supabase/
│   ├── config.toml              # Supabase configuration
│   └── migrations/
│       └── 20250129000001_create_user_management_tables.sql
└── SUPABASE_SETUP.md           # This file

.github/
└── workflows/
    └── supabase-deploy.yml     # GitHub Action
```

## Troubleshooting

**Action fails with "Project not found"**
- Check that `SUPABASE_PROJECT_REF` is correct
- Make sure the access token has the right permissions

**Permission denied errors**
- Verify your `SUPABASE_ACCESS_TOKEN` is valid
- Make sure the token has admin/owner permissions

**Migration already exists**
- This is usually safe to ignore
- Supabase will skip migrations that are already applied

## Security Notes

- ✅ Secrets are encrypted in GitHub
- ✅ Access tokens can be revoked from Supabase dashboard
- ✅ Only migrations in the specified path trigger deployments
- ✅ Manual workflow dispatch allows controlled deployments

## Next Steps

Once set up, any developer can:
1. Create new migration files in `apps/portal/supabase/migrations/`
2. Commit and push to `main` branch
3. GitHub automatically deploys the changes to Supabase

The migration system ensures your database schema is version controlled and automatically deployed!