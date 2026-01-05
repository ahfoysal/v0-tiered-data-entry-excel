-- Change unique constraint from (project_id, name) to (parent_id, name)
-- This allows the same tier name in different branches while preventing duplicate siblings
ALTER TABLE tiers 
DROP CONSTRAINT IF EXISTS tiers_project_id_name_key;

ALTER TABLE tiers 
ADD CONSTRAINT tiers_parent_id_name_key UNIQUE(parent_id, name);

-- Also add a constraint for root tiers (where parent_id is null)
-- PostgreSQL treats NULL as distinct, so this naturally works correctly
