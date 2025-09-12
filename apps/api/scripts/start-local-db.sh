#!/bin/bash

# Start local PostgreSQL container for development
# Only runs locally, not in CI/production

# Check if we're in a local environment
if [ "$NODE_ENV" = "production" ] || [ "$CI" = "true" ]; then
  echo "Skipping local database startup in production/CI environment"
  exit 0
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q '^nimble-postgres$'; then
  # Container exists, check if it's running
  if docker ps --format '{{.Names}}' | grep -q '^nimble-postgres$'; then
    echo "✅ PostgreSQL container 'nimble-postgres' is already running"
  else
    echo "Starting existing PostgreSQL container..."
    docker start nimble-postgres
    echo "✅ PostgreSQL container 'nimble-postgres' started"
  fi
else
  # Container doesn't exist, create it
  echo "Creating new PostgreSQL container..."
  docker run -d \
    --name nimble-postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=nimblelocal123 \
    -e POSTGRES_DB=nimbledb \
    -p 5432:5432 \
    -v nimble-postgres-data:/var/lib/postgresql/data \
    postgres:15-alpine
  
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 3
  echo "✅ PostgreSQL container 'nimble-postgres' created and started"
fi

# Wait for PostgreSQL to be ready
for i in {1..10}; do
  if docker exec nimble-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready for connections"
    
    # Run database migrations
    echo "📦 Running database migrations..."
    npx prisma db push --skip-generate
    
    if [ $? -eq 0 ]; then
      echo "✅ Database migrations complete"
    else
      echo "⚠️  Database migration failed, but continuing..."
    fi
    
    exit 0
  fi
  echo "⏳ Waiting for PostgreSQL to be ready... ($i/10)"
  sleep 1
done

echo "❌ PostgreSQL failed to start in time"
exit 1