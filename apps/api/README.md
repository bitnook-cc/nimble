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
