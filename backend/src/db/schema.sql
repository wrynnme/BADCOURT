-- ════ BadCourt Database Schema ════
-- Run this in Supabase SQL Editor to create all tables
-- NOTE: ใช้ LINE Authentication (ไม่ใช่ Supabase Auth)
-- Backend verify LIFF ID Token เอง ไม่ต้องใช้ RLS กับ auth.uid()

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════ Users Table ════
CREATE TABLE IF NOT EXISTS users (
  line_user_id TEXT PRIMARY KEY,  -- LINE user ID เป็น string ไม่ใช่ UUID
  display_name TEXT NOT NULL,
  picture_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  total_games INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════ Sessions Table ════
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  court_count INT NOT NULL DEFAULT 1,
  max_players INT NOT NULL,
  fee_per_hour NUMERIC NOT NULL,
  billing_mode TEXT DEFAULT 'equal' CHECK (billing_mode IN ('equal', 'by_games')),
  default_match_mode TEXT DEFAULT 'random' CHECK (default_match_mode IN ('random', 'rotation', 'winner_stays', 'manual')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'playing', 'ended')),
  created_by TEXT REFERENCES users(line_user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════ Registrations Table ════
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(line_user_id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  picture_url TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('qr', 'transfer', 'onsite')),
  paid_status TEXT DEFAULT 'pending' CHECK (paid_status IN ('pending', 'approved', 'rejected', 'onsite')),
  slip_url TEXT,
  amount_due NUMERIC,
  games_played INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- ════ Matches Table ════
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  court_number INT NOT NULL,
  round_number INT NOT NULL,
  match_mode TEXT NOT NULL CHECK (match_mode IN ('random', 'rotation', 'winner_stays', 'manual')),
  team1_players TEXT[] NOT NULL,
  team2_players TEXT[] NOT NULL,
  score1 INT,
  score2 INT,
  winner TEXT CHECK (winner IN ('team1', 'team2', NULL)),
  status TEXT DEFAULT 'playing' CHECK (status IN ('playing', 'done')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════ Payments Table ════
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  slip_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT REFERENCES users(line_user_id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════ Notifications Log Table ════
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(line_user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  payload JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true
);

-- ════ Indexes ════
CREATE INDEX IF NOT EXISTS idx_sessions_date_status ON sessions(date, status);
CREATE INDEX IF NOT EXISTS idx_registrations_session_paid ON registrations(session_id, paid_status);
CREATE INDEX IF NOT EXISTS idx_matches_session_status ON matches(session_id, status, round_number);
CREATE INDEX IF NOT EXISTS idx_matches_team1 ON matches USING gin(team1_players);
CREATE INDEX IF NOT EXISTS idx_matches_team2 ON matches USING gin(team2_players);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications_log(user_id, sent_at);

-- ════ Row Level Security (RLS) ════
-- สำหรับ LINE Mini App: Backend verify LINE ID Token เอง
-- RLS นี้ใช้ service_role key ดังนั้นจะ bypass ทั้งหมด
-- แต่ถ้าใช้ anon key จะต้องมี policies ที่เหมาะสม

-- ปิด RLS ชั่วคราวเพราะ backend ใช้ service_role key (bypass RLS)
-- หรือจะเปิดแต่ต้องใช้ anon key + JWT แทน

-- ให้ความเห็นออกบรรทัดด้านล่างถ้าต้องการเปิด RLS
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- ถ้าเปิด RLS ต้องใช้ policies แบบง่าย (ไม่ใช้ auth.uid() เพราะไม่ได้ใช้ Supabase Auth)
-- ปิด RLS ไปก่อนจนกว่าจะมี auth helper สำหรับ LINE

-- ════ Functions ════

-- Function to update games_played count when a match is completed
CREATE OR REPLACE FUNCTION update_games_played()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status = 'playing' THEN
    -- Update team1 players
    UPDATE registrations 
    SET games_played = games_played + 1
    WHERE session_id = NEW.session_id 
    AND user_id = ANY(NEW.team1_players);
    
    -- Update team2 players
    UPDATE registrations 
    SET games_played = games_played + 1
    WHERE session_id = NEW.session_id 
    AND user_id = ANY(NEW.team2_players);
    
    -- Update user stats
    UPDATE users SET
      total_games = total_games + 1,
      total_wins = total_wins + CASE WHEN NEW.winner = 'team1' THEN 2 ELSE 0 END
    WHERE line_user_id = ANY(NEW.team1_players);
    
    UPDATE users SET
      total_games = total_games + 1,
      total_wins = total_wins + CASE WHEN NEW.winner = 'team2' THEN 2 ELSE 0 END
    WHERE line_user_id = ANY(NEW.team2_players);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating games played
DROP TRIGGER IF EXISTS trigger_update_games_played ON matches;
CREATE TRIGGER trigger_update_games_played
  AFTER UPDATE OF status ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_games_played();

-- ════ Enable Realtime ════
-- Run these in Supabase Dashboard > Database > Replication
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE registrations;
