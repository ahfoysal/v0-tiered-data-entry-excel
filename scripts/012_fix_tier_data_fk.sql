-- Drop the old foreign key constraint and create a new one
ALTER TABLE tier_data 
DROP CONSTRAINT tier_data_field_id_fkey;

-- Add new foreign key constraint pointing to tier_fields instead of project_fields
ALTER TABLE tier_data 
ADD CONSTRAINT tier_data_field_id_fkey 
FOREIGN KEY (field_id) 
REFERENCES tier_fields(id) 
ON DELETE CASCADE;
