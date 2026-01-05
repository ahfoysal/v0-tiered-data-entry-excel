-- Add display_order column to tiers table for ordering at same level
ALTER TABLE tiers 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing tiers with their order based on creation time
UPDATE tiers 
SET display_order = (
  SELECT COUNT(*) 
  FROM tiers AS t2 
  WHERE t2.parent_id IS NOT DISTINCT FROM tiers.parent_id 
  AND t2.created_at <= tiers.created_at
) - 1
WHERE display_order = 0;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_tiers_parent_order ON tiers(parent_id, display_order);
