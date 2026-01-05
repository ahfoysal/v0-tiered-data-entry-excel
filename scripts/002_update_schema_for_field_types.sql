-- Update tier_data to store text values as well as numeric
ALTER TABLE tier_data ADD COLUMN IF NOT EXISTS text_value TEXT;

-- Update the value column to be nullable for non-numeric types
ALTER TABLE tier_data ALTER COLUMN value DROP NOT NULL;
