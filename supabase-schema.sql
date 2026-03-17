-- ===========================================
-- BUTTERFLY.GOV - Schéma Supabase PostgreSQL
-- ===========================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- https://supabase.com/dashboard/project/_/sql/new

-- 1. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  premium_until TIMESTAMP WITH TIME ZONE,
  stripe_cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table d'historique des lois
CREATE TABLE IF NOT EXISTS laws_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  law_text TEXT NOT NULL,
  winners TEXT,
  losers TEXT,
  butterfly_effect TEXT,
  score_economy INTEGER,
  score_social INTEGER,
  score_ecology INTEGER,
  score_overall INTEGER,
  is_debate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table de Rate Limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user_id
  identifier_type TEXT NOT NULL, -- 'ip' or 'user'
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier, identifier_type)
);

-- 4. Index pour les requêtes performantes
CREATE INDEX IF NOT EXISTS idx_laws_history_user ON laws_history(user_id);
CREATE INDEX IF NOT EXISTS idx_laws_history_created ON laws_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_laws_history_scores ON laws_history(score_overall DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, identifier_type);

-- 5. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger pour profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Fonction pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 8. Trigger pour auto-créer le profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 9. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE laws_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies pour laws_history (lecture publique pour le leaderboard)
CREATE POLICY "Anyone can view laws history"
  ON laws_history FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their laws"
  ON laws_history FOR INSERT
  WITH CHECK (true);

-- Policies pour rate_limits (service role uniquement)
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits FOR ALL
  USING (true);

-- 10. Migration : colonne stripe_cancel_at_period_end (à exécuter si table déjà créée)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- 11. Vue pour le leaderboard
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  id,
  law_text,
  score_economy,
  score_social,
  score_ecology,
  score_overall,
  created_at
FROM laws_history
WHERE score_overall IS NOT NULL
ORDER BY score_overall DESC
LIMIT 100;
