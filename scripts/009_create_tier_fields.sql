-- Create tier_fields table for tier-specific fields
CREATE TABLE IF NOT EXISTS tier_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID NOT NULL REFERENCES tiers(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL DEFAULT 'string',
  display_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tier_id, field_name)
);

CREATE INDEX idx_tier_fields_tier_id ON tier_fields(tier_id);
