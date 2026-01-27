-- ============================================
-- 🗄️ AI Reselling Sniper - Supabase Schema
-- ============================================
-- Dieses SQL in Supabase SQL Editor ausführen

-- ============================================
-- Tabelle: items (Speichert die Artikel)
-- ============================================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Artikel-Basis-Daten
  platform_item_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  listing_price DECIMAL(10,2),
  image_url TEXT,
  
  -- Status-Tracking
  status TEXT DEFAULT 'NEW' CHECK (status IN (
    'NEW',           -- Gerade gefunden
    'ANALYZING',     -- AI analysiert gerade
    'NEGOTIATING',   -- In Verhandlung
    'BOUGHT',        -- Gekauft!
    'REJECTED',      -- Abgelehnt (zu teuer, Fake, etc.)
    'MANUAL_REQ'     -- Mensch muss entscheiden
  )),
  
  -- AI-Analyse Ergebnisse
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  max_sniping_price DECIMAL(10,2),
  projected_profit DECIMAL(10,2),
  condition_score INTEGER CHECK (condition_score BETWEEN 1 AND 10),
  defects JSONB DEFAULT '[]',
  is_scam BOOLEAN DEFAULT false,
  
  -- Chat & Verhandlung
  chat_history JSONB DEFAULT '[]',
  auto_reply_active BOOLEAN DEFAULT true,
  seller_name TEXT,
  seller_id TEXT,
  
  -- Timestamps
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index für schnelle Suche nach Status
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_platform_id ON items(platform_item_id);

-- ============================================
-- Tabelle: config (Globale Einstellungen)
-- ============================================
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  
  -- Business Logic
  min_profit_margin_percent INTEGER DEFAULT 30,   -- Mindest-Gewinnmarge
  platform_fee_percent INTEGER DEFAULT 15,        -- eBay/Kleinanzeigen Gebühren
  shipping_cost_estimate DECIMAL(10,2) DEFAULT 5.99,
  
  -- Sicherheit
  system_active BOOLEAN DEFAULT true,             -- Globaler Not-Aus
  auto_reply_enabled BOOLEAN DEFAULT true,        -- Auto-Antworten erlaubt?
  max_price_limit DECIMAL(10,2) DEFAULT 500.00,   -- Max Kaufpreis
  
  -- Humanizing / Anti-Ban
  min_reply_delay_seconds INTEGER DEFAULT 120,    -- Min. Wartezeit vor Antwort
  max_reply_delay_seconds INTEGER DEFAULT 600,    -- Max. Wartezeit vor Antwort
  
  -- Timestamps
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Initial Config einfügen
INSERT INTO config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Tabelle: activity_log (Für Monitoring)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,  -- 'ANALYZED', 'MESSAGE_SENT', 'ESCALATED', etc.
  details JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- ============================================
-- Helper: Update Timestamp Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_update_timestamp
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================
-- RLS (Row Level Security) - Optional
-- ============================================
-- Falls du Supabase Auth nutzt, aktiviere RLS:
-- ALTER TABLE items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE config ENABLE ROW LEVEL SECURITY;
