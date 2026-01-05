-- Create dropdown tables if they don't exist
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed initial data from the CSV
INSERT INTO roles (name) VALUES
('Frontend Developer'),
('Backend Developer'),
('Backend Node'),
('Backend Python'),
('Backend Laravel'),
('AI Developer'),
('UI-UX Designer'),
('Flutter Developer')
ON CONFLICT (name) DO NOTHING;

INSERT INTO shifts (name) VALUES
('Day'),
('Night')
ON CONFLICT (name) DO NOTHING;

INSERT INTO statuses (name) VALUES
('Probation'),
('Permanent')
ON CONFLICT (name) DO NOTHING;

-- Seed teams from CSV
INSERT INTO teams (name) VALUES
('CyberMonk'),
('Runtime Terror'),
('Future Stack')
ON CONFLICT (name) DO NOTHING;
