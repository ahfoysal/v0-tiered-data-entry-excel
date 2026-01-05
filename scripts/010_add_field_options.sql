-- Add field_options column to tier_fields table for dropdown options
ALTER TABLE tier_fields 
ADD COLUMN field_options TEXT;

-- Add text_value column to tier_data for storing string values
ALTER TABLE tier_data 
ADD COLUMN IF NOT EXISTS text_value TEXT;
