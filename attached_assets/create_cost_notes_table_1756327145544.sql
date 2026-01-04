
-- Create table for cost analysis notes
CREATE TABLE IF NOT EXISTS cost_notes (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL, -- 'fixed_costs', 'labor_costs', 'variable_costs', 'operational_costs', 'depreciation', 'debts'
  section_key VARCHAR(100) NOT NULL, -- nome del campo/voce specifica (es: 'rent', 'utilities', etc.)
  month_key VARCHAR(7) NOT NULL, -- formato YYYY-MM per storicizzazione
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner_id, section_type, section_key, month_key)
);

CREATE INDEX IF NOT EXISTS idx_cost_notes_owner_month ON cost_notes(owner_id, month_key);
CREATE INDEX IF NOT EXISTS idx_cost_notes_section ON cost_notes(owner_id, section_type);
