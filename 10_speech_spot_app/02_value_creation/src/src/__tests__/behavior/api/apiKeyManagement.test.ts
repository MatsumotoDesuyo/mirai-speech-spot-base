/**
 * 振る舞いテスト: ApiKey Management
 *
 * 仕様根拠:
 *   - Rule: Authentication (R-AU-05)
 *   - Model: ApiKey (キー生成ルール、不変条件)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabaseClient,
  mockSupabaseResponse,
  getMockCreateClient,
  setFromImplementation,
  type MockQueryBuilder,
} from '../../helpers/supabaseMock';

// --- Mocks ---
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => getMockCreateClient()(),
}));

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('API_ADMIN_PASSCODE', 'test-api-admin-passcode');

const { createApiKey, listApiKeys, toggleApiKey } = await import('@/app/actions/api-keys');

describe('ApiKey Management', () => {
  let queryBuilder: MockQueryBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockSupabaseClient();
    queryBuilder = mock.queryBuilder;
  });

  // ===========================================
  // createApiKey
  // ===========================================

  describe('createApiKey', () => {
    it('R-AU-05: 正しいパスコードでAPIキーが作成される', async () => {
      mockSupabaseResponse({ data: null, error: null });

      const result = await createApiKey('Test App', 'test-api-admin-passcode');

      expect(result.success).toBe(true);
      expect(result.data?.api_key).toBeDefined();
      expect(result.data?.prefix).toBeDefined();
    });

    it('APIキーはmssb_プレフィックスを持つ', async () => {
      mockSupabaseResponse({ data: null, error: null });

      const result = await createApiKey('Test App', 'test-api-admin-passcode');

      expect(result.data?.api_key).toMatch(/^mssb_/);
    });

    it('APIキーは mssb_ + 64文字のhexで構成される', async () => {
      mockSupabaseResponse({ data: null, error: null });

      const result = await createApiKey('Test App', 'test-api-admin-passcode');

      // mssb_ (5文字) + 64文字hex = 69文字
      expect(result.data?.api_key).toHaveLength(69);
      expect(result.data?.api_key).toMatch(/^mssb_[0-9a-f]{64}$/);
    });

    it('prefixはキーの先頭13文字である', async () => {
      mockSupabaseResponse({ data: null, error: null });

      const result = await createApiKey('Test App', 'test-api-admin-passcode');

      expect(result.data?.prefix).toHaveLength(13);
      expect(result.data?.api_key?.startsWith(result.data?.prefix ?? '')).toBe(true);
    });

    it('keyHashはSHA-256で保存される', async () => {
      mockSupabaseResponse({ data: null, error: null });

      await createApiKey('Test App', 'test-api-admin-passcode');

      const insertCall = queryBuilder.insert.mock.calls[0]?.[0];
      // SHA-256 hex は 64文字
      expect(insertCall.api_key_hash).toHaveLength(64);
      expect(insertCall.api_key_hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('R-AU-05: パスコードが不正な場合は拒否される', async () => {
      const result = await createApiKey('Test App', 'wrong-passcode');

      expect(result.success).toBe(false);
      expect(result.error).toContain('パスコード');
      expect(queryBuilder.insert).not.toHaveBeenCalled();
    });

    it('アプリ名が空の場合は拒否される', async () => {
      const result = await createApiKey('', 'test-api-admin-passcode');

      expect(result.success).toBe(false);
      expect(queryBuilder.insert).not.toHaveBeenCalled();
    });

    it('アプリ名が空白のみの場合は拒否される', async () => {
      const result = await createApiKey('   ', 'test-api-admin-passcode');

      expect(result.success).toBe(false);
      expect(queryBuilder.insert).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // listApiKeys
  // ===========================================

  describe('listApiKeys', () => {
    it('R-AU-05: 正しいパスコードでAPIキー一覧が取得できる', async () => {
      setFromImplementation((table: string) => {
        if (table === 'api_keys') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'key-1',
                  app_name: 'App 1',
                  api_key_hash: 'hash1',
                  api_key_prefix: 'mssb_12345678',
                  is_active: true,
                  created_at: '2026-01-01T00:00:00Z',
                  updated_at: '2026-01-01T00:00:00Z',
                },
              ],
              error: null,
            }),
          };
        }
        if (table === 'api_access_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
                }),
              }),
            }),
          };
        }
        return queryBuilder;
      });

      const result = await listApiKeys('test-api-admin-passcode');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].app_name).toBe('App 1');
      expect(result.data?.[0].today_access_count).toBe(3);
    });

    it('R-AU-05: パスコードが不正な場合は拒否される', async () => {
      const result = await listApiKeys('wrong-passcode');

      expect(result.success).toBe(false);
      expect(result.error).toContain('パスコード');
    });
  });

  // ===========================================
  // toggleApiKey
  // ===========================================

  describe('toggleApiKey', () => {
    it('R-AU-05: 正しいパスコードでAPIキーを無効化できる', async () => {
      mockSupabaseResponse({ data: null, error: null });

      const result = await toggleApiKey('key-id', false, 'test-api-admin-passcode');

      expect(result.success).toBe(true);
      expect(queryBuilder.update).toHaveBeenCalledWith({ is_active: false });
    });

    it('R-AU-05: 正しいパスコードでAPIキーを有効化できる', async () => {
      mockSupabaseResponse({ data: null, error: null });

      const result = await toggleApiKey('key-id', true, 'test-api-admin-passcode');

      expect(result.success).toBe(true);
      expect(queryBuilder.update).toHaveBeenCalledWith({ is_active: true });
    });

    it('R-AU-05: パスコードが不正な場合は拒否される', async () => {
      const result = await toggleApiKey('key-id', false, 'wrong-passcode');

      expect(result.success).toBe(false);
      expect(result.error).toContain('パスコード');
      expect(queryBuilder.update).not.toHaveBeenCalled();
    });

    it('データベースエラーの場合はエラーが返される', async () => {
      mockSupabaseResponse({ error: { message: 'DB error' } });

      const result = await toggleApiKey('key-id', false, 'test-api-admin-passcode');

      expect(result.success).toBe(false);
    });
  });
});
