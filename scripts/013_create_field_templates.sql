-- Field templates table
CREATE TABLE IF NOT EXISTS field_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Template fields
CREATE TABLE IF NOT EXISTS template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES field_templates(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) DEFAULT 'string',
  field_options TEXT,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create default templates
INSERT INTO field_templates (name, description, is_system, created_by)
VALUES 
  ('Attendance', 'Track daily attendance with fields for each day of the month', true, NULL),
  ('Task Management', 'Basic task tracking with name, duration, dates, and status', true, NULL)
ON CONFLICT DO NOTHING;

-- Add fields for Attendance template
INSERT INTO template_fields (template_id, field_name, field_type, display_order)
SELECT id, 'Day ' || generate_series(1, 31), 'number', generate_series(1, 31)
FROM field_templates WHERE name = 'Attendance' AND is_system = true
ON CONFLICT DO NOTHING;

-- Add fields for Task Management template
WITH task_template AS (
  SELECT id FROM field_templates WHERE name = 'Task Management' AND is_system = true
)
INSERT INTO template_fields (template_id, field_name, field_type, display_order)
SELECT (SELECT id FROM task_template), 'Task Name', 'string', 1
UNION ALL
SELECT (SELECT id FROM task_template), 'Duration', 'number', 2
UNION ALL
SELECT (SELECT id FROM task_template), 'Start Date', 'date', 3
UNION ALL
SELECT (SELECT id FROM task_template), 'End Date', 'date', 4
UNION ALL
SELECT (SELECT id FROM task_template), 'Status', 'dropdown', 5
UNION ALL
SELECT (SELECT id FROM task_template), 'Assigned To', 'string', 6
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_field_templates_created_by ON field_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_template_fields_template ON template_fields(template_id);
