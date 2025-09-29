-- =====================================================
-- Nimble Portal User Management Schema
-- =====================================================
-- This migration creates the user_tags and user_connections tables
-- for the federated authentication and access control system.

-- =====================================================
-- User Profiles Table
-- =====================================================
-- Unified user profiles that can be linked to multiple auth accounts
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT, -- Optional email (Discord doesn't provide email)
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- User Tags Table
-- =====================================================
-- Stores access control tags for unified user profiles
CREATE TABLE user_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  tag_name TEXT NOT NULL, -- e.g., 'patreon-patron', 'core-rules-owner', 'discord-member'
  granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  granted_by_auth_user_id UUID REFERENCES auth.users(id), -- Who granted this tag (NULL = system)
  expires_at TIMESTAMPTZ, -- Optional expiration date
  metadata JSONB DEFAULT '{}', -- Additional tag-specific data
  
  -- Ensure one tag per profile
  UNIQUE(profile_id, tag_name)
);

-- =====================================================
-- User Connections Table  
-- =====================================================
-- Tracks OAuth connections linking auth accounts to unified profiles
CREATE TABLE user_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'discord', 'patreon'
  provider_user_id TEXT NOT NULL, -- Provider's user ID
  provider_email TEXT, -- Provider's email (may differ from primary)
  provider_username TEXT, -- Provider's username/handle
  provider_avatar_url TEXT, -- Provider's avatar URL
  connected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(), -- Last time we verified this connection
  metadata JSONB DEFAULT '{}', -- Provider-specific data
  
  -- Ensure one auth user maps to one connection
  UNIQUE(auth_user_id),
  -- Ensure one provider account per profile
  UNIQUE(profile_id, provider, provider_user_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- User Tags Indexes
CREATE INDEX idx_user_tags_profile_id ON user_tags(profile_id);
CREATE INDEX idx_user_tags_tag_name ON user_tags(tag_name);
CREATE INDEX idx_user_tags_expires_at ON user_tags(expires_at) WHERE expires_at IS NOT NULL;

-- User Profiles Indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email) WHERE email IS NOT NULL;

-- User Connections Indexes
CREATE INDEX idx_user_connections_profile_id ON user_connections(profile_id);
CREATE INDEX idx_user_connections_auth_user_id ON user_connections(auth_user_id);
CREATE INDEX idx_user_connections_provider ON user_connections(provider);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
-- Users can read and update profiles they're connected to
CREATE POLICY "Users can view connected profiles" ON user_profiles
  FOR SELECT USING (
    id IN (
      SELECT profile_id FROM user_connections 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update connected profiles" ON user_profiles
  FOR UPDATE USING (
    id IN (
      SELECT profile_id FROM user_connections 
      WHERE auth_user_id = auth.uid()
    )
  );

-- User Tags Policies
-- Users can read tags for profiles they're connected to
CREATE POLICY "Users can read connected profile tags" ON user_tags
  FOR SELECT USING (
    profile_id IN (
      SELECT profile_id FROM user_connections 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Only authenticated users can read tags (for admin purposes)
CREATE POLICY "Authenticated users can read all tags" ON user_tags
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only system/admin can insert/update/delete tags
-- (This will be handled via service role or admin functions)
CREATE POLICY "Service role can manage tags" ON user_tags
  FOR ALL USING (auth.role() = 'service_role');

-- User Connections Policies  
-- Users can read their own auth connections
CREATE POLICY "Users can read own connections" ON user_connections
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Users can insert connections for their own auth account
CREATE POLICY "Users can create own connections" ON user_connections
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Users can update their own connections
CREATE POLICY "Users can update own connections" ON user_connections
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Users can delete their own connections (for unlinking)
CREATE POLICY "Users can delete own connections" ON user_connections
  FOR DELETE USING (auth.uid() = auth_user_id);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to check if profile has a specific tag
CREATE OR REPLACE FUNCTION profile_has_tag(profile_uuid UUID, tag TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_tags 
    WHERE profile_id = profile_uuid 
    AND tag_name = tag 
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all active tags for a profile
CREATE OR REPLACE FUNCTION get_profile_tags(profile_uuid UUID)
RETURNS TABLE(tag_name TEXT, granted_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, metadata JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT ut.tag_name, ut.granted_at, ut.expires_at, ut.metadata
  FROM user_tags ut
  WHERE ut.profile_id = profile_uuid 
  AND (ut.expires_at IS NULL OR ut.expires_at > NOW())
  ORDER BY ut.granted_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant a tag to a profile
CREATE OR REPLACE FUNCTION grant_profile_tag(
  profile_uuid UUID, 
  tag TEXT, 
  granted_by_auth_user_uuid UUID DEFAULT NULL,
  expires TIMESTAMPTZ DEFAULT NULL,
  tag_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  tag_id UUID;
BEGIN
  INSERT INTO user_tags (profile_id, tag_name, granted_by_auth_user_id, expires_at, metadata)
  VALUES (profile_uuid, tag, granted_by_auth_user_uuid, expires, tag_metadata)
  ON CONFLICT (profile_id, tag_name) DO UPDATE SET
    granted_by_auth_user_id = granted_by_auth_user_uuid,
    expires_at = expires,
    metadata = tag_metadata,
    granted_at = NOW()
  RETURNING id INTO tag_id;
  
  RETURN tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get profile ID from auth user ID
CREATE OR REPLACE FUNCTION get_profile_id_from_auth_user(auth_user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  profile_uuid UUID;
BEGIN
  SELECT profile_id INTO profile_uuid
  FROM user_connections
  WHERE auth_user_id = auth_user_uuid;
  
  RETURN profile_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually link an auth user to a specific profile
CREATE OR REPLACE FUNCTION link_auth_user_to_profile(
  auth_user_uuid UUID,
  target_profile_uuid UUID,
  provider_name TEXT
)
RETURNS UUID AS $$
DECLARE
  connection_id UUID;
  user_email TEXT;
  user_metadata JSONB;
BEGIN
  -- Get user info from auth.users
  SELECT email, raw_user_meta_data INTO user_email, user_metadata
  FROM auth.users
  WHERE id = auth_user_uuid;
  
  -- Create the connection
  INSERT INTO user_connections (
    profile_id,
    auth_user_id,
    provider,
    provider_user_id,
    provider_email,
    provider_username,
    provider_avatar_url
  )
  VALUES (
    target_profile_uuid,
    auth_user_uuid,
    provider_name,
    user_metadata->>'provider_id',
    user_email,
    COALESCE(
      user_metadata->>'preferred_username',
      user_metadata->>'user_name', 
      user_metadata->>'name'
    ),
    user_metadata->>'avatar_url'
  )
  RETURNING id INTO connection_id;
  
  RETURN connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Database Triggers for Auto-User Creation
-- =====================================================

-- Function to handle user signup - creates new profile for each login
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_profile_id UUID;
  display_name TEXT;
  avatar_url TEXT;
  provider_name TEXT;
  user_email TEXT;
BEGIN
  -- Only handle OAuth signups (skip email signups)
  IF NOT (NEW.app_metadata ? 'provider' AND NEW.app_metadata->>'provider' != 'email') THEN
    RETURN NEW;
  END IF;
  
  -- Extract provider and user info
  provider_name := NEW.app_metadata->>'provider';
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'name', 
    NEW.raw_user_meta_data->>'preferred_username',
    'User'
  );
  avatar_url := NEW.raw_user_meta_data->>'avatar_url';
  user_email := NEW.email; -- May be NULL for Discord
  
  -- Always create new profile (no deduplication)
  INSERT INTO user_profiles (email, display_name, avatar_url)
  VALUES (user_email, display_name, avatar_url)
  RETURNING id INTO new_profile_id;
  
  -- Create connection linking auth user to profile
  INSERT INTO user_connections (
    profile_id, 
    auth_user_id, 
    provider, 
    provider_user_id, 
    provider_email, 
    provider_username, 
    provider_avatar_url
  )
  VALUES (
    new_profile_id,
    NEW.id,
    provider_name,
    NEW.raw_user_meta_data->>'provider_id',
    user_email,
    COALESCE(
      NEW.raw_user_meta_data->>'preferred_username', 
      NEW.raw_user_meta_data->>'user_name', 
      NEW.raw_user_meta_data->>'name'
    ),
    avatar_url
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new user signup
CREATE TRIGGER handle_new_user_signup_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE user_profiles IS 'Extended user profile information (auto-created on signup)';
COMMENT ON TABLE user_tags IS 'Stores access control tags for users (patreon-patron, discord-member, etc.)';
COMMENT ON TABLE user_connections IS 'Tracks OAuth provider connections to enable account linking';

COMMENT ON FUNCTION profile_has_tag(UUID, TEXT) IS 'Check if profile has a specific active tag';
COMMENT ON FUNCTION get_profile_tags(UUID) IS 'Get all active tags for a profile';
COMMENT ON FUNCTION grant_profile_tag(UUID, TEXT, UUID, TIMESTAMPTZ, JSONB) IS 'Grant a tag to a profile with optional expiration';
COMMENT ON FUNCTION get_profile_id_from_auth_user(UUID) IS 'Get profile ID from auth user ID via connections table';
COMMENT ON FUNCTION link_auth_user_to_profile(UUID, UUID, TEXT) IS 'Manually link an auth user to a specific profile';
COMMENT ON FUNCTION handle_new_user_signup() IS 'Auto-creates new profile for each OAuth signup (no deduplication)';

-- =====================================================
-- Example Usage (for testing)
-- =====================================================

-- Grant some example tags (run these manually in Supabase SQL editor after migration)
/*
-- Get profile ID by finding it through connections table
SELECT profile_id FROM user_connections WHERE auth_user_id = 'your-auth-user-id'::UUID;

-- Grant Discord member tag to profile
SELECT grant_profile_tag(
  '00000000-0000-0000-0000-000000000000'::UUID, -- Replace with actual profile ID
  'discord-member',
  NULL, -- System granted
  NULL, -- No expiration
  '{"discord_id": "123456789", "joined_at": "2025-01-29"}'::JSONB
);

-- Grant Patreon patron tag with expiration
SELECT grant_profile_tag(
  '00000000-0000-0000-0000-000000000000'::UUID, -- Replace with actual profile ID
  'patreon-patron',
  NULL, -- System granted
  '2025-12-31 23:59:59'::TIMESTAMPTZ, -- Expires end of year
  '{"tier": "premium", "pledge_amount": 10}'::JSONB
);

-- Example: Manually link Google and Discord auth accounts to same profile
-- (This is the primary way to link accounts since no automatic deduplication)
SELECT link_auth_user_to_profile(
  'auth-user-uuid-from-discord'::UUID,
  'profile-uuid-from-google-account'::UUID,
  'discord'
);
*/