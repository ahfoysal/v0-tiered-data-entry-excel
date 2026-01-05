-- Add missing columns to tiers table for field management and color support
ALTER TABLE tiers 
ADD COLUMN IF NOT EXISTS allow_field_management boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tier_color varchar DEFAULT NULL;
