-- Migration: Add preferred_language column to user profiles table
-- Supports: en (English), hi (Hindi), kn (Kannada), te (Telugu), bn (Bengali)

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en' 
CHECK (preferred_language IN ('en', 'hi', 'kn', 'te', 'bn'));

COMMENT ON COLUMN profiles.preferred_language IS 'ISO 639-1 code of user preferred interface language (en, hi, kn, te, bn)';
