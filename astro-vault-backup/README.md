# Nimble RPG Vault

A comprehensive documentation site for the Nimble RPG system, built with Astro and Starlight.

## External Content System

This vault uses an external content system to keep sensitive RPG content in a separate private repository while maintaining the public codebase.

### How It Works

1. **External Repository**: RPG content is stored in `/Users/six/prototype/nimble-vault` (private repository)
2. **Build-time Fetching**: Content is automatically fetched before dev and build commands
3. **Git Exclusion**: Fetched content is excluded from the main repository via `.gitignore`
4. **Fallback System**: If content fetch fails, placeholder content is generated

### Content Structure

The external repository should contain:
```
nimble-vault/
└── vault-content/
    └── content/
        └── docs/
            ├── Heroes/           # Character creation, classes, ancestries
            ├── Magic/            # Spells, schools, magical items
            ├── Items/            # Equipment, weapons, armor
            ├── Foes/             # Monsters, creatures, NPCs
            ├── System/           # Game rules, mechanics
            └── Homebrew (Optional)/ # Optional content
```

### Development Commands

```bash
# Fetch content manually
npm run fetch-content

# Start development (auto-fetches content)
npm run dev

# Build for production (auto-fetches content)
npm run build
```

### Configuration

Content fetching is configured via environment variables:

```bash
# Repository location (default: local path)
VAULT_CONTENT_REPO=/Users/six/prototype/nimble-vault

# For remote repositories:
# VAULT_CONTENT_REPO=git@github.com:your-org/nimble-vault-content.git

# Branch to fetch (default: main)
VAULT_CONTENT_BRANCH=main
```

### Production Deployment

For production deployments:

1. **Private Repository Access**: Ensure the deployment environment can access the private content repository
2. **Environment Variables**: Set `VAULT_CONTENT_REPO` to the appropriate repository URL
3. **Authentication**: Configure Git credentials for private repository access
4. **Build Process**: Content is automatically fetched during the build process

### Local Development

For local development:
1. Content is fetched from the local private repository
2. Changes to content in the private repo are reflected after running `npm run fetch-content`
3. The fetch process is automatically triggered before dev and build commands

### Features

- **Fantasy Theme**: Parchment background with fantasy-appropriate fonts
- **Responsive Design**: Mobile-friendly layout with collapsible navigation
- **Search Functionality**: Built-in search across all content
- **Auto-generated Navigation**: Sidebar automatically generated from content structure
- **Fast Performance**: Static site generation with Astro

### Technical Details

- **Framework**: Astro with Starlight documentation theme
- **Content Format**: Markdown with frontmatter
- **Styling**: Custom CSS with fantasy theme
- **Search**: Built-in Starlight search functionality
- **Navigation**: Auto-generated from directory structure
