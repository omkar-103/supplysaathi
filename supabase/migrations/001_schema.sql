-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  business_type TEXT NOT NULL CHECK (business_type IN ('kirana', 'dairy', 'weaver')),
  phone TEXT,
  monthly_limit NUMERIC(12, 2) NOT NULL DEFAULT 10000,
  language_pref TEXT NOT NULL DEFAULT 'en-IN' CHECK (language_pref IN ('en-IN', 'hi-IN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers table (public reference)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  reliability_score NUMERIC(3, 1) NOT NULL CHECK (reliability_score >= 0 AND reliability_score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory per user
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reorder_threshold NUMERIC(12, 2) NOT NULL DEFAULT 10,
  unit TEXT NOT NULL DEFAULT 'kg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions (purchases)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  item_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  prava_txn_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit ledger (financial history)
CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  running_total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  txn_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

-- Public read policies for the hackathon demo (reads are open, writes stay restricted)
CREATE POLICY users_public_read ON users FOR SELECT USING (true);
CREATE POLICY users_self_write ON users FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY suppliers_public ON suppliers FOR ALL USING (true) WITH CHECK (false);
CREATE POLICY inventory_public_read ON inventory FOR SELECT USING (true);
CREATE POLICY inventory_self_write ON inventory FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY transactions_public_read ON transactions FOR SELECT USING (true);
CREATE POLICY transactions_self_write ON transactions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ledger_public_read ON credit_ledger FOR SELECT USING (true);
CREATE POLICY ledger_self_write ON credit_ledger FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Seed demo user
INSERT INTO users (id, name, email, business_type, phone, monthly_limit, language_pref)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Ramesh Kirana',
  'ramesh@demo.com',
  'kirana',
  '9876543210',
  10000,
  'hi-IN'
)
ON CONFLICT (id) DO NOTHING;

-- Seed suppliers
INSERT INTO suppliers (name, category, item_name, unit_price, reliability_score) VALUES
-- Kirana staples
('Agra Grains', 'kirana', 'rice', 52.00, 4.5),
('Bharat Rice Mill', 'kirana', 'rice', 48.00, 3.8),
('Best Price', 'kirana', 'rice', 50.00, 4.7),
('Agra Grains', 'kirana', 'wheat flour', 38.00, 4.5),
('Bharat Mills', 'kirana', 'wheat flour', 36.00, 3.9),
('Best Price', 'kirana', 'wheat flour', 37.00, 4.7),
('Agra Grains', 'kirana', 'sugar', 42.00, 4.5),
('Bharat Mills', 'kirana', 'sugar', 40.00, 3.8),
('Best Price', 'kirana', 'sugar', 41.00, 4.7),
('Agra Grains', 'kirana', 'pulses', 92.00, 4.5),
('Bharat Mills', 'kirana', 'pulses', 88.00, 3.8),
('Best Price', 'kirana', 'pulses', 90.00, 4.7),
-- Dairy
('Krishna Feed', 'dairy', 'cattle feed', 28.00, 4.6),
('Gau Sevak', 'dairy', 'cattle feed', 25.00, 3.7),
('Dairy Best', 'dairy', 'cattle feed', 27.00, 4.8),
('Krishna Feed', 'dairy', 'medicine', 145.00, 4.6),
('Gau Sevak', 'dairy', 'medicine', 135.00, 3.7),
('Dairy Best', 'dairy', 'medicine', 140.00, 4.8),
-- Weaver
('Silk House', 'weaver', 'yarn', 320.00, 4.4),
('Thread Masters', 'weaver', 'yarn', 310.00, 4.1),
('Silk House', 'weaver', 'dye', 85.00, 4.4),
('Thread Masters', 'weaver', 'dye', 80.00, 4.1)
ON CONFLICT DO NOTHING;

-- Seed inventory for demo user
INSERT INTO inventory (user_id, item_name, current_stock, reorder_threshold, unit) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'rice', 8, 10, 'kg'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'wheat flour', 15, 12, 'kg'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sugar', 4, 8, 'kg'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'pulses', 6, 7, 'kg')
ON CONFLICT DO NOTHING;

-- Seed credit ledger for demo user
INSERT INTO credit_ledger (user_id, running_total_spent, txn_count)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 0, 0)
ON CONFLICT (user_id) DO NOTHING;

-- Function to update credit ledger on transaction insert
CREATE OR REPLACE FUNCTION update_credit_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    INSERT INTO credit_ledger (user_id, running_total_spent, txn_count, updated_at)
    VALUES (NEW.user_id, NEW.amount, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      running_total_spent = credit_ledger.running_total_spent + EXCLUDED.running_total_spent,
      txn_count = credit_ledger.txn_count + 1,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_credit_ledger ON transactions;
CREATE TRIGGER trg_update_credit_ledger
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_credit_ledger();
