#!/bin/bash

# Initialize Prisma migrations for production deployment
# This creates a migration from the current schema

echo "Creating initial migration..."

# Create migration without applying it (since we already have the schema)
npx prisma migrate dev --name init --create-only

echo "✅ Migration created. You can now deploy to production."
echo ""
echo "For production deployment:"
echo "1. Commit the migration files in prisma/migrations/"
echo "2. Deploy to Vercel"
echo "3. The vercel-build script will run 'prisma migrate deploy' automatically"
echo ""
echo "Note: 'prisma migrate deploy' only runs migrations, it doesn't create new ones."