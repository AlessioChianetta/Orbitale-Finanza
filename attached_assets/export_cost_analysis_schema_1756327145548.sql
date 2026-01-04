
-- Tabelle per Analisi Costi e Break-Even

-- 1. Costi Fissi
CREATE TABLE IF NOT EXISTS fixed_costs (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL,
  month_key VARCHAR(7) DEFAULT 'default' NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 2. Costi Variabili
CREATE TABLE IF NOT EXISTS variable_costs (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  unit_type VARCHAR(50) NOT NULL,
  unit_cost DECIMAL(10,4) NOT NULL,
  month_key VARCHAR(7) DEFAULT 'default' NOT NULL,
  menu_item_id INTEGER REFERENCES menu_items(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. Costi Lavoro
CREATE TABLE IF NOT EXISTS labor_costs (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  date TIMESTAMP NOT NULL,
  employee_name VARCHAR(255),
  role VARCHAR(100) NOT NULL,
  hours_worked DECIMAL(5,2) NOT NULL,
  hourly_rate DECIMAL(8,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  shift VARCHAR(50),
  notes TEXT,
  month_key VARCHAR(7) DEFAULT 'default' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Analisi Break-Even
CREATE TABLE IF NOT EXISTS break_even_analysis (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  analysis_date TIMESTAMP NOT NULL,
  period VARCHAR(20) NOT NULL,
  total_fixed_costs DECIMAL(12,2) NOT NULL,
  avg_variable_cost_percentage DECIMAL(5,2) NOT NULL,
  break_even_revenue DECIMAL(12,2) NOT NULL,
  break_even_units INTEGER,
  actual_revenue DECIMAL(12,2),
  profit_loss DECIMAL(12,2),
  margin_of_safety DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 5. Analisi Costi Menu
CREATE TABLE IF NOT EXISTS menu_item_cost_analysis (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
  owner_id INTEGER NOT NULL REFERENCES users(id),
  food_cost DECIMAL(8,4) NOT NULL,
  labor_cost_per_portion DECIMAL(8,4) NOT NULL,
  overhead_cost_per_portion DECIMAL(8,4) NOT NULL,
  total_cost DECIMAL(8,4) NOT NULL,
  selling_price DECIMAL(8,2) NOT NULL,
  contribution_margin DECIMAL(8,4) NOT NULL,
  contribution_margin_percentage DECIMAL(5,2) NOT NULL,
  analysis_date TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 6. Gestione Fatturato Manuale
CREATE TABLE IF NOT EXISTS revenue_settings (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  month_key VARCHAR(7) NOT NULL,
  is_manual_mode BOOLEAN DEFAULT false NOT NULL,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS manual_revenue (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  month_key VARCHAR(7) NOT NULL,
  date VARCHAR(10) NOT NULL,
  daily_revenue DECIMAL(10,2),
  monthly_revenue DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 7. Note sui Costi
CREATE TABLE IF NOT EXISTS cost_notes (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  month_key VARCHAR(7) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(owner_id, section_type, section_key, month_key)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_fixed_costs_owner_month ON fixed_costs(owner_id, month_key);
CREATE INDEX IF NOT EXISTS idx_variable_costs_owner_month ON variable_costs(owner_id, month_key);
CREATE INDEX IF NOT EXISTS idx_labor_costs_owner_month ON labor_costs(owner_id, month_key);
CREATE INDEX IF NOT EXISTS idx_revenue_settings_owner_month ON revenue_settings(owner_id, month_key);
CREATE INDEX IF NOT EXISTS idx_manual_revenue_owner_date ON manual_revenue(owner_id, date);
CREATE INDEX IF NOT EXISTS idx_cost_notes_owner_month ON cost_notes(owner_id, month_key);
