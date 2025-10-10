#!/bin/bash

# Vercel Private Submodule Workaround
# Adapted from: https://github.com/beeinger/vercel-private-submodule
# This script temporarily rewrites .gitmodules to use HTTPS with token authentication,
# clones the submodules, then restores the original .gitmodules

set -e  # Exit on error

echo "🔧 Starting submodule workaround script..."

# Check if token is set
if [ -z "$CONTENT_REPOSITORY_TOKEN" ]; then
  echo "❌ Error: CONTENT_REPOSITORY_TOKEN environment variable is not set"
  exit 1
fi

# Backup original .gitmodules
echo "📋 Backing up .gitmodules..."
cp .gitmodules .gitmodules.bak

# Replace git@ URLs with https:// URLs containing the token
echo "🔄 Rewriting .gitmodules with authentication token..."
sed -i.tmp "s|git@github.com:|https://${CONTENT_REPOSITORY_TOKEN}@github.com/|g" .gitmodules
rm -f .gitmodules.tmp

# Initialize and update submodules
echo "📦 Initializing and updating submodules..."
git submodule update --init --recursive

# Restore original .gitmodules
echo "♻️  Restoring original .gitmodules..."
mv .gitmodules.bak .gitmodules

echo "✅ Submodule workaround completed successfully!"
