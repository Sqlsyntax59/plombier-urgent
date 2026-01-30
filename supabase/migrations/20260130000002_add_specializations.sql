-- Add specializations column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN profiles.specializations IS 'Array of specialization values for the artisan trade';
