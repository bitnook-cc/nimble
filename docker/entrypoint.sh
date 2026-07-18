#!/bin/bash
set -e

echo "=== Nimble Dev Environment Setup ==="

# Fix execute bits (Windows checkout strips them)
find /workspace -name "*.sh" -not -path "*/node_modules/*" -exec chmod +x {} \;
chmod +x /workspace/.husky/pre-commit /workspace/.husky/pre-push 2>/dev/null || true

# Copy .env.example files if .env doesn't exist
copy_env() {
  local src="$1" dest="$2"
  if [ ! -f "$dest" ]; then
    echo "  Creating $dest from example..."
    cp "$src" "$dest"
  fi
}

copy_env apps/sidekick-api/.env.example apps/sidekick-api/.env
copy_env apps/sidekick/.env.example apps/sidekick/.env.local
copy_env apps/portal/.env.example apps/portal/.env.local
copy_env apps/vault/.env.example apps/vault/.env
copy_env apps/discord/.env.example apps/discord/.env

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Wait for database to be ready
echo "Waiting for database..."
for i in $(seq 1 30); do
  if node -e "
    const net = require('net');
    const s = net.createConnection({host:'db',port:5432});
    s.on('connect',()=>{s.end();process.exit(0)});
    s.on('error',()=>process.exit(1));
  " 2>/dev/null; then
    echo "  Database is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "  ERROR: Database not reachable after 30s"
    exit 1
  fi
  sleep 1
done

# Build all shared packages so apps can import them
echo "Building shared packages..."
npx turbo build --filter='./packages/*'

# Generate Prisma client and run migrations
echo "Setting up database..."
cd apps/sidekick-api
npx prisma generate
npx prisma migrate deploy
cd /workspace

echo ""
echo "=== Setup complete! ==="
echo ""

exec "$@"
