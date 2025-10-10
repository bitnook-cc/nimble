#!/bin/bash

# Vercel Private Submodule Workaround
# Creates a temporary .gitmodules with HTTPS authentication to clone private submodules
# Then copies vault content to the app's content directory

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

# Create symlink to vault content
echo "🔗 Creating symlink to premium content..."
if [ -d "apps/vault/external/vault-content" ]; then
  # Remove existing symlink if it exists
  rm -f apps/vault/content/premium

  # Create symlink named "premium" pointing to the vault content
  ln -s ../external/vault-content apps/vault/content/premium
  echo "✅ Premium content symlink created successfully!"
else
  echo "⚠️  Warning: vault-content directory not found in submodule"
fi

echo "✅ Submodule workaround completed successfully!"
