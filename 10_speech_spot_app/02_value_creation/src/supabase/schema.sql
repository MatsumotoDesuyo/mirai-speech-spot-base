-- ===========================================
-- Mirai Speech Spot Base - Database Schema
-- ===========================================
-- Supabase SQL Editor で実行してください

-- 1. spots テーブル（コアデータ）
CREATE TABLE IF NOT EXISTS spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 10),
  best_time INTEGER[],
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  audience_attributes TEXT[],
  car_accessibility TEXT NOT NULL CHECK (car_accessibility IN ('allowed', 'brief_stop', 'not_allowed')),
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. spot_history テーブル（履歴・監査ログ）
CREATE TABLE IF NOT EXISTS spot_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL,
  snapshot JSONB NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_spots_rating ON spots(rating);
CREATE INDEX IF NOT EXISTS idx_spots_location ON spots(lat, lng);
CREATE INDEX IF NOT EXISTS idx_spot_history_spot_id ON spot_history(spot_id);

-- 3. updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_spots_updated_at
  BEFORE UPDATE ON spots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 履歴自動記録トリガー
CREATE OR REPLACE FUNCTION record_spot_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO spot_history (spot_id, snapshot, operation)
    VALUES (OLD.id, to_jsonb(OLD), 'DELETE');
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO spot_history (spot_id, snapshot, operation)
    VALUES (OLD.id, to_jsonb(OLD), 'UPDATE');
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO spot_history (spot_id, snapshot, operation)
    VALUES (NEW.id, to_jsonb(NEW), 'INSERT');
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_spot_history
  AFTER INSERT OR UPDATE OR DELETE ON spots
  FOR EACH ROW
  EXECUTE FUNCTION record_spot_history();

-- 5. RLS（Row Level Security）設定
-- 読み取りは全員許可、書き込みはServer Actions経由のみ
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_history ENABLE ROW LEVEL SECURITY;

-- 読み取りポリシー（全員許可）
CREATE POLICY "spots_select_policy" ON spots
  FOR SELECT USING (true);

CREATE POLICY "spot_history_select_policy" ON spot_history
  FOR SELECT USING (true);

-- 書き込みポリシー（サービスロール経由のみ）
-- Note: Server Actionsでservice_roleキーを使用する場合はRLSをバイパス可能
CREATE POLICY "spots_insert_policy" ON spots
  FOR INSERT WITH CHECK (true);

CREATE POLICY "spots_update_policy" ON spots
  FOR UPDATE USING (true);

CREATE POLICY "spots_delete_policy" ON spots
  FOR DELETE USING (true);

CREATE POLICY "spot_history_insert_policy" ON spot_history
  FOR INSERT WITH CHECK (true);

-- ===========================================
-- External API Tables
-- ===========================================

-- 6. api_keys テーブル（APIキー管理）
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  api_key_prefix TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. api_access_logs テーブル（利用ログ・レート制限）
CREATE TABLE IF NOT EXISTS api_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id),
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  response_status SMALLINT NOT NULL,
  ip_address TEXT
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_access_logs_key_id ON api_access_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_access_logs_accessed_at ON api_access_logs(accessed_at);
CREATE INDEX IF NOT EXISTS idx_api_access_logs_rate_limit ON api_access_logs(api_key_id, accessed_at, response_status);

-- updated_at 自動更新トリガー（api_keys用）
CREATE TRIGGER trigger_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select_policy" ON api_keys
  FOR SELECT USING (true);

CREATE POLICY "api_keys_insert_policy" ON api_keys
  FOR INSERT WITH CHECK (true);

CREATE POLICY "api_keys_update_policy" ON api_keys
  FOR UPDATE USING (true);

CREATE POLICY "api_access_logs_select_policy" ON api_access_logs
  FOR SELECT USING (true);

CREATE POLICY "api_access_logs_insert_policy" ON api_access_logs
  FOR INSERT WITH CHECK (true);
