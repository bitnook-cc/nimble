# Vault Content Setup

The Nimble Vault app is **public**, but the actual RPG content (markdown files) is stored in a **private repository** as a Git submodule.

## Repository Structure

```
nimble/ (PUBLIC)
├── apps/
│   ├── vault/ (PUBLIC - Next.js app code)
│   │   ├── external/
│   │   │   └── vault-content/ (PRIVATE - Git submodule)
│   │   └── [vault app code]
│   ├── web/
│   └── api/
└── packages/
```

## Initial Setup

### 1. Add the Vault Content Submodule

From the **monorepo root**:

```bash
cd apps/vault
git submodule add git@github.com:your-org/nimble-vault.git external/vault-content
cd ../..
git add .gitmodules apps/vault/external
git commit -m "Add vault content as private submodule"
```

### 2. Configure Velite to Read from Submodule

Update `velite.config.ts` to point to the submodule path:

```typescript
export default defineConfig({
  root: './external/vault-content', // Read from submodule
  // ... rest of config
})
```

## Development Workflow

### Clone with Submodules

**First time:**
```bash
git clone git@github.com:your-org/nimble.git
cd nimble
git submodule update --init --recursive
```

**Update vault content:**
```bash
cd apps/vault/external/vault-content
git pull origin main
cd ../../../..
git add apps/vault/external/vault-content
git commit -m "Update vault content to latest"
```

## Deployment (Vercel)

### Option 1: Deploy Key (Recommended)

1. **In Vercel Project Settings** → Git → Deploy Hooks
2. Generate an SSH deploy key
3. **In your private `nimble-vault` repo** → Settings → Deploy keys
4. Add the public key from Vercel
5. ✅ Vercel will automatically clone submodules during build

### Option 2: Personal Access Token

1. Create a GitHub Personal Access Token with `repo` scope
2. Add to Vercel environment variables as `GITHUB_TOKEN`
3. Update `.gitmodules`:
```ini
[submodule "apps/vault/external/vault-content"]
    path = apps/vault/external/vault-content
    url = https://$(GITHUB_TOKEN)@github.com/your-org/nimble-vault.git
```

## Public Users

Public users who clone the monorepo will:
- ✅ See all the vault app code (it's open source!)
- ✅ Can build and run everything except the vault
- ❌ Won't have access to the markdown content
- ⚠️ Get a submodule clone error (expected and harmless)

To make it friendly for contributors, add this to the root README:

```markdown
## Building the Vault App

The vault app requires private RPG content. If you don't have access:
- The vault app won't build (expected)
- All other apps (web, api) will work fine
- Contact us if you need vault content access
```

## .gitignore

Add to `apps/vault/.gitignore`:
```
# Vault content submodule (ignore if not cloned)
/external/vault-content/*
!/external/vault-content/.gitkeep
```

This prevents accidental commits of submodule contents.

## Benefits

✅ **Vault app code is public** - Open source, anyone can contribute
✅ **Content is private** - Protected RPG content
✅ **Version controlled** - Both app and content
✅ **Works in Vercel** - Automatic deployment
✅ **Separate update cycles** - Update content without touching code
