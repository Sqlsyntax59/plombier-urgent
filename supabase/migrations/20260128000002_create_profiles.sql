-- Migration: Create profiles table
-- Story: 1.2 - Configuration Supabase et Schema Initial
-- AC3: Table profiles creee
-- AC4: RLS policies configurees

-- Table profiles (extension de auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vertical_id UUID REFERENCES verticals(id),
  role TEXT NOT NULL DEFAULT 'artisan' CHECK (role IN ('artisan', 'admin', 'super_admin')),
  first_name TEXT,
  city TEXT,
  phone TEXT,
  whatsapp_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  credits INTEGER DEFAULT 0,
  google_place_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance RLS
CREATE INDEX idx_profiles_vertical_id ON profiles(vertical_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger auto-creation profil a l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Admins can view profiles in their vertical
CREATE POLICY "Admins can view profiles in their vertical"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
      AND p.vertical_id = profiles.vertical_id
    )
  );
