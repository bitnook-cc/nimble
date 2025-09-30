# Nimble RPG Vault

The Nimble RPG Vault is a Next.js application that provides comprehensive documentation and reference materials for the Nimble tabletop role-playing game system.

## Features

- **Authentication Integration**: JWT-based authentication with the Nimble Portal
- **Comprehensive Documentation**: Complete rules, lore, and reference materials
- **Responsive Design**: Mobile-friendly interface using shadcn/ui components
- **Debug Logging**: Extensive authentication debugging for development

## Development Setup

### Prerequisites

- Node.js 18+
- Access to the same Supabase project as the Nimble Portal

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Configure Supabase settings in `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
   ```

   Get these values from your Supabase project dashboard: Settings → API

### Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The vault will be available at http://localhost:4321

## Authentication Flow

The vault uses Supabase sessions shared with the Nimble Portal for authentication:

1. **User logs in** via Portal (http://localhost:4000) using Supabase Auth
2. **Portal creates Supabase session** with secure access tokens
3. **Session tokens shared** across localhost domains via browser storage
4. **Vault verifies session** using Supabase client with shared project credentials
5. **Authentication status** displayed in top navigation bar with real-time updates

### Authentication API

- **`GET /api/auth/verify`** - Verifies Supabase session and returns user info
  - Returns 401 if no valid session
  - Returns 500 if Supabase not configured
  - Returns 200 with user data if authenticated

## Development Commands

```bash
npm run dev        # Start development server with Turbopack
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

## Architecture

- **Framework**: Next.js 15 with App Router
- **UI Library**: shadcn/ui with Tailwind CSS
- **Authentication**: JWT verification using @nimble/shared-auth
- **Port**: 4321 (configured in package.json)

## Troubleshooting

### "Authentication not configured" Error

This means the Supabase environment variables are not set. Ensure:

1. You have copied `.env.example` to `.env`
2. `NEXT_PUBLIC_SUPABASE_URL` is set to your Supabase project URL
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set to your Supabase anonymous public key
4. Both variables match the Portal's Supabase configuration

### Authentication Not Working

Supabase sessions are shared across localhost ports by default. If authentication isn't working:

1. Check browser developer tools for Supabase session data
2. Verify the Portal and Vault use the same Supabase project
3. Check console logs for authentication debug messages
4. Ensure both apps have identical Supabase configuration

### Debug Logging

The vault includes extensive debug logging for authentication:

```javascript
// Client-side logs (browser console)
[TopNav] Checking Supabase auth status...
[TopNav] Supabase user found: {...}

// Server-side logs (terminal)
[Auth API] Received auth verification request
[Auth API] Authorization header present: true/false
[Auth API] Supabase user verified: {...}
```
