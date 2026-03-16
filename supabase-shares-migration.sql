-- ============================================================
-- Migration: shares table for social sharing + OG images
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- nanoid() function for short readable IDs
CREATE OR REPLACE FUNCTION nanoid(size INT DEFAULT 10)
RETURNS TEXT AS $$
DECLARE
  id TEXT := '';
  i INT := 0;
  urlAlphabet CHAR(36)[] := ARRAY[
    '0','1','2','3','4','5','6','7','8','9',
    'a','b','c','d','e','f','g','h','i','j',
    'k','l','m','n','o','p','q','r','s','t',
    'u','v','w','x','y','z'
  ];
  bytes BYTEA := gen_random_bytes(size);
  byte INT;
BEGIN
  WHILE i < size LOOP
    byte := get_byte(bytes, i);
    id := id || urlAlphabet[1 + (byte % 36)];
    i := i + 1;
  END LOOP;
  RETURN id;
END
$$ LANGUAGE PLPGSQL VOLATILE;

-- shares table
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY DEFAULT nanoid(10),
  type TEXT NOT NULL DEFAULT 'analyse',         -- 'analyse' | 'debat'
  proposition TEXT NOT NULL,                    -- Law text (for analyse) or Loi A (for debat)
  score_global INTEGER,
  scores JSONB,                                 -- { economy, social, ecology, faisabilite }
  gagnants TEXT,
  perdants TEXT,
  effet_papillon TEXT,
  loi_a_titre TEXT,                             -- Debate: Loi A text
  loi_b_titre TEXT,                             -- Debate: Loi B text
  loi_a_scores JSONB,
  loi_b_scores JSONB,
  verdict TEXT,                                 -- Debate verdict
  created_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_shares_id ON shares(id);
CREATE INDEX IF NOT EXISTS idx_shares_created_at ON shares(created_at DESC);

-- RPC to safely increment view count
CREATE OR REPLACE FUNCTION increment_share_views(share_id TEXT)
RETURNS VOID AS $$
  UPDATE shares SET view_count = view_count + 1 WHERE id = share_id;
$$ LANGUAGE SQL;

-- RLS (Row Level Security)
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Anyone can read shares (needed for OG image generation)
CREATE POLICY "shares_select_all" ON shares FOR SELECT USING (true);

-- Only authenticated users can create shares
CREATE POLICY "shares_insert_auth" ON shares FOR INSERT WITH CHECK (true);
