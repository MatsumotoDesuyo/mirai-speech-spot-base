/**
 * 振る舞いテスト: DeleteSpot
 *
 * 仕様根拠:
 *   - UseCase: DeleteSpot (UC-DS-01, UC-DS-E01 ~ UC-DS-E02)
 *   - Rule: Authentication (R-AU-02)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabaseClient,
  mockSupabaseResponse,
  getMockCreateClient,
  getMockQueryBuilder,
} from '../../helpers/supabaseMock';

// --- Mocks ---
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => getMockCreateClient()(),
}));

vi.mock('@/lib/r2/client', () => ({
  uploadImage: vi.fn(),
}));

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('ADMIN_PASSWORD', 'test-admin-password');

const { deleteSpot } = await import('@/app/actions/spot');

describe('DeleteSpot', () => {
  let queryBuilder: ReturnType<typeof getMockQueryBuilder>;

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockSupabaseClient();
    queryBuilder = mock.queryBuilder;
  });

  // ===========================================
  // 正常系
  // ===========================================

  describe('正常系', () => {
    it('UC-DS-01: 正しい管理者パスワードでSpotが削除される', async () => {
      mockSupabaseResponse({ data: null, error: null });

      const result = await deleteSpot('spot-id-to-delete', 'test-admin-password');

      expect(result.success).toBe(true);
      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'spot-id-to-delete');
    });
  });

  // ===========================================
  // 異常系
  // ===========================================

  describe('異常系', () => {
    it('UC-DS-E01 / R-AU-02: 管理者パスワードが不正な場合は拒否される', async () => {
      const result = await deleteSpot('spot-id', 'wrong-password');

      expect(result.success).toBe(false);
      expect(result.error).toContain('管理者パスワード');
      expect(queryBuilder.delete).not.toHaveBeenCalled();
    });

    it('データベースエラーの場合はエラーが返される', async () => {
      mockSupabaseResponse({ error: { message: 'DB error' } });

      const result = await deleteSpot('spot-id', 'test-admin-password');

      expect(result.success).toBe(false);
      expect(result.error).toContain('削除');
    });
  });
});
