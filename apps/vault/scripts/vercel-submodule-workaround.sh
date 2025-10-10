#!/bin/bash

# Vercel Private Submodule Workaround
# Creates a temporary .gitmodules with HTTPS authentication to clone private submodules

set -e  # Exit on error

echo "🔧 Starting submodule workaround script..."

# Check if token is set
if [ -z "$CONTENT_REPOSITORY_TOKEN" ]; then
  echo "❌ Error: CONTENT_REPOSITORY_TOKEN environment variable is not set"
  exit 1
fi

# Navigate to repo root (script runs from apps/vault/)
cd ../..

# Create .gitmodules with HTTPS authentication
echo "📝 Creating .gitmodules with authentication..."
cat > .gitmodules << EOF
[submodule "apps/vault/external/vault-content"]
	path = apps/vault/external/vault-content
	url = https://${CONTENT_REPOSITORY_TOKEN}@github.com/bitnook-cc/nimble-content.git
EOF

# Initialize and update submodules
echo "📦 Initializing and updating submodules..."
git submodule update --init --recursive

echo "✅ Submodule workaround completed successfully!"
