-- Update tier_data to reference tier_fields instead of project_fields, and add text_value column
ALTER TABLE tier_data 
  DROP CONSTRAINT IF EXISTS tier_data_field_id_fkey;

ALTER TABLE tier_data 
  ADD COLUMN IF NOT EXISTS text_value VARCHAR(255);

ALTER TABLE tier_data 
  ADD CONSTRAINT tier_data_field_id_fkey 
  FOREIGN KEY (field_id) REFERENCES tier_fields(id) ON DELETE CASCADE;

-- Ensure field_options exists in tier_fields for dropdown support
ALTER TABLE tier_fields 
  ADD COLUMN IF NOT EXISTS field_options TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tier_data_tier ON tier_data(tier_id);
CREATE INDEX IF NOT EXISTS idx_tier_data_field ON tier_data(field_id);
