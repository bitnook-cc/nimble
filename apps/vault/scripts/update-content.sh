#!/bin/bash

# Update Vault Content Submodule
# This script pulls the latest changes from the private vault content repository
# and stages the submodule update for commit

set -e  # Exit on error

echo "🔄 Updating vault content submodule..."

# Navigate to submodule directory
cd external/vault-content

# Pull latest changes
echo "📥 Pulling latest changes from remote..."
git pull

# Navigate back to monorepo root
cd ../../../..

# Stage the submodule update
echo "📝 Staging submodule update..."
git add apps/vault/external/vault-content

echo ""
echo "✅ Vault content updated successfully!"
echo ""
echo "📋 Next steps:"
echo "   git commit -m \"Update vault content\""
echo "   git push"
echo ""
