-- ===========================================
-- External API - Database Migration
-- ===========================================
-- Supabase SQL Editor で実行してください

-- 1. api_keys テーブル（APIキー管理）
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  api_key_prefix TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. api_access_logs テーブル（利用ログ・レート制限）
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
-- レート制限クエリ用の複合インデックス
CREATE INDEX IF NOT EXISTS idx_api_access_logs_rate_limit ON api_access_logs(api_key_id, accessed_at, response_status);

-- 3. updated_at 自動更新トリガー（api_keys用）
CREATE TRIGGER trigger_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS（Row Level Security）設定
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_logs ENABLE ROW LEVEL SECURITY;

-- api_keys: SELECT/INSERT/UPDATE 許可
CREATE POLICY "api_keys_select_policy" ON api_keys
  FOR SELECT USING (true);

CREATE POLICY "api_keys_insert_policy" ON api_keys
  FOR INSERT WITH CHECK (true);

CREATE POLICY "api_keys_update_policy" ON api_keys
  FOR UPDATE USING (true);

-- api_access_logs: SELECT/INSERT 許可
CREATE POLICY "api_access_logs_select_policy" ON api_access_logs
  FOR SELECT USING (true);

CREATE POLICY "api_access_logs_insert_policy" ON api_access_logs
  FOR INSERT WITH CHECK (true);
