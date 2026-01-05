-- Update tier_data foreign key to reference tier_fields instead of project_fields
-- First drop the old constraint
ALTER TABLE tier_data DROP CONSTRAINT IF EXISTS tier_data_field_id_fkey;

-- Add new foreign key constraint pointing to tier_fields
ALTER TABLE tier_data 
ADD CONSTRAINT tier_data_field_id_fkey 
FOREIGN KEY (field_id) REFERENCES tier_fields(id) ON DELETE CASCADE;
