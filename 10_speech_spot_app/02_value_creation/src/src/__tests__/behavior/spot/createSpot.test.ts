/**
 * 振る舞いテスト: CreateSpot
 *
 * 仕様根拠:
 *   - UseCase: CreateSpot (UC-CS-01 ~ UC-CS-03, UC-CS-E01 ~ UC-CS-E03)
 *   - Rule: SpotValidation (R-SV-01 ~ R-SV-06)
 *   - Rule: Authentication (R-AU-01)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabaseClient,
  mockSupabaseResponse,
  getMockCreateClient,
  getMockQueryBuilder,
} from '../../helpers/supabaseMock';
import {
  buildSpotFormData,
  VALID_SPOT_DATA,
} from '../../helpers/formDataHelper';

// --- Mocks ---
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => getMockCreateClient()(),
}));

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('PASSCODE', 'test-passcode');

// Server Action のインポート（モック設定後）
const { createSpot } = await import('@/app/actions/spot');

describe('CreateSpot', () => {
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
    it('UC-CS-01: 正しいパスコードと有効データでSpotが作成される', async () => {
      mockSupabaseResponse({ data: { id: 'new-spot-id' } });

      const formData = buildSpotFormData(VALID_SPOT_DATA);
      const result = await createSpot(formData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('new-spot-id');
    });

    it('UC-CS-01: bestTimeが昇順ソートされて保存される', async () => {
      mockSupabaseResponse({ data: { id: 'new-spot-id' } });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        bestTime: [14, 8, 10],
      });
      await createSpot(formData);

      const insertCall = queryBuilder.insert.mock.calls[0]?.[0];
      expect(insertCall.best_time).toEqual([8, 10, 14]);
    });

    it('UC-CS-01: audienceAttributesが定義順でソートされて保存される', async () => {
      mockSupabaseResponse({ data: { id: 'new-spot-id' } });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        audienceAttributes: ['ファミリー', '学生', '主婦'],
      });
      await createSpot(formData);

      const insertCall = queryBuilder.insert.mock.calls[0]?.[0];
      expect(insertCall.audience_attributes).toEqual(['主婦', '学生', 'ファミリー']);
    });

    it('UC-CS-02: 画像URL付きでSpotが作成される', async () => {
      mockSupabaseResponse({ data: { id: 'new-spot-id' } });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        imageUrls: ['https://r2.example.com/spots/image1.jpg', 'https://r2.example.com/spots/image2.jpg'],
      });
      const result = await createSpot(formData);

      expect(result.success).toBe(true);
      const insertCall = queryBuilder.insert.mock.calls[0]?.[0];
      expect(insertCall.images).toEqual(['https://r2.example.com/spots/image1.jpg', 'https://r2.example.com/spots/image2.jpg']);
    });

    it('UC-CS-03: 任意項目なしでSpotが作成される', async () => {
      mockSupabaseResponse({ data: { id: 'new-spot-id' } });

      const formData = buildSpotFormData({
        passcode: 'test-passcode',
        title: '必須項目のみテスト',
        rating: 5,
        lat: 35.0,
        lng: 139.0,
        bestTime: [],
        audienceAttributes: [],
        carAccessibility: 'not_allowed',
      });
      const result = await createSpot(formData);

      expect(result.success).toBe(true);
      const insertCall = queryBuilder.insert.mock.calls[0]?.[0];
      expect(insertCall.description).toBeNull();
      expect(insertCall.best_time).toBeNull();
      expect(insertCall.audience_attributes).toBeNull();
    });
  });

  // ===========================================
  // 異常系
  // ===========================================

  describe('異常系', () => {
    it('UC-CS-E01 / R-AU-01: パスコードが不正な場合は拒否される', async () => {
      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        passcode: 'wrong-passcode',
      });
      const result = await createSpot(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('パスコード');
      expect(queryBuilder.insert).not.toHaveBeenCalled();
    });

    it('UC-CS-E02 / R-SV-01: タイトルが空の場合は拒否される', async () => {
      mockSupabaseResponse({ data: null });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        title: '',
      });
      const result = await createSpot(formData);

      expect(result.success).toBe(false);
      expect(queryBuilder.insert).not.toHaveBeenCalled();
    });

    it('UC-CS-E03 / R-SV-02: rating が 0 の場合は拒否される', async () => {
      mockSupabaseResponse({ data: null });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        rating: 0,
      });
      const result = await createSpot(formData);

      expect(result.success).toBe(false);
      expect(queryBuilder.insert).not.toHaveBeenCalled();
    });

    it('R-SV-03: carAccessibility が不正値の場合は拒否される', async () => {
      mockSupabaseResponse({ data: null });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        carAccessibility: 'invalid_value',
      });
      const result = await createSpot(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('選挙カー');
      expect(queryBuilder.insert).not.toHaveBeenCalled();
    });

    it('R-SV-07: 画像が10枚を超える場合は拒否される', async () => {
      const imageUrls = Array.from({ length: 11 }, (_, i) => `https://r2.example.com/spots/image${i}.jpg`);
      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        imageUrls,
      });
      const result = await createSpot(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('10');
      expect(queryBuilder.insert).not.toHaveBeenCalled();
    });

    it('データベースエラーの場合はエラーが返される', async () => {
      mockSupabaseResponse({ error: { message: 'DB error' } });

      const formData = buildSpotFormData(VALID_SPOT_DATA);
      const result = await createSpot(formData);

      expect(result.success).toBe(false);
    });
  });
});
