-- Add is_system column to field_templates table if it doesn't exist
ALTER TABLE field_templates
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_field_templates_is_system ON field_templates(is_system);
