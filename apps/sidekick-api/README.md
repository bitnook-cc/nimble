# Nimble API Server

## Google OAuth Setup

To enable Google authentication, you need to:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - In the APIs & Services dashboard, enable "Google+ API"

3. **Create OAuth 2.0 Credentials**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3001/auth/google/callback`
     - For production: `https://yourdomain.com/api/auth/google/callback`

4. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Add your credentials:
     ```
     GOOGLE_CLIENT_ID=your_client_id_here
     GOOGLE_CLIENT_SECRET=your_client_secret_here
     SESSION_SECRET=generate_a_random_string_here
     CLIENT_URL=http://localhost:3000
     ```

5. **Generate a Session Secret**
   ```bash
   openssl rand -base64 32
   ```

## Running the Server

```bash
# Development
npm run dev

# Production build
npm run build
npm run start
```

## API Endpoints

- `GET /health` - Health check
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - OAuth callback (handled automatically)
- `GET /auth/user` - Get current authenticated user
- `POST /auth/logout` - Logout current user
- `GET /api/protected` - Example protected endpoint

## Campaigns and deployment compatibility

Campaigns add membership, invitations, party inventory, treasury and transaction history. Apply the committed `20260910000000_campaigns` migration with `npm run db:migrate:deploy` before starting the updated API. Never use `db:push`. The migration preserves existing users, character backups and game sessions.

Deploy the updated Sidekick frontend and API together. Live sharing now requires authenticated private Pusher channels, so older clients must reload to join sessions. Configure Pusher on both applications and set `SESSION_SECRET` to a random secret of at least 32 characters; the API refuses to start with a missing or short secret.

Character sync requests from the updated frontend include `protocolVersion: 2`. If a campaign transfer has changed a character's inventory, an older client receives HTTP 409 with `SYNC_CONFLICT` rather than replacing unsaved local edits with the cloud character. Unconflicted older characters can still sync. Updated clients preserve local edits and offer inventory review before retrying.

Run `npm test` to check campaign permissions, inventory transfers and all migration SQL against disposable PostgreSQL-compatible PGlite storage. These tests do not access the configured production database. Production PostgreSQL concurrency and live Google OAuth/Pusher credentials still need deployment validation.
