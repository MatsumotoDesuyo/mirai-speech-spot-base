/**
 * 振る舞いテスト: UpdateSpot
 *
 * 仕様根拠:
 *   - UseCase: UpdateSpot (UC-US-01 ~ UC-US-03, UC-US-E01 ~ UC-US-E02)
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
const mockUploadImage = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => getMockCreateClient()(),
}));

vi.mock('@/lib/r2/client', () => ({
  uploadImage: (...args: unknown[]) => mockUploadImage(...args),
}));

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('PASSCODE', 'test-passcode');

const { updateSpot } = await import('@/app/actions/spot');

describe('UpdateSpot', () => {
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
    it('UC-US-01: スポットの全項目を更新できる', async () => {
      mockSupabaseResponse({ data: { id: 'existing-spot-id' } });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        title: '更新後のタイトル',
        rating: 9,
        existingImages: [],
      });
      const result = await updateSpot(formData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('existing-spot-id');

      const updateCall = queryBuilder.update.mock.calls[0]?.[0];
      expect(updateCall.title).toBe('更新後のタイトル');
      expect(updateCall.rating).toBe(9);
    });

    it('UC-US-01: 更新時にbestTimeが昇順ソートされる', async () => {
      mockSupabaseResponse({ data: { id: 'existing-spot-id' } });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        bestTime: [19, 8, 12],
        existingImages: [],
      });
      await updateSpot(formData);

      const updateCall = queryBuilder.update.mock.calls[0]?.[0];
      expect(updateCall.best_time).toEqual([8, 12, 19]);
    });

    it('UC-US-01: 更新時にaudienceAttributesが定義順でソートされる', async () => {
      mockSupabaseResponse({ data: { id: 'existing-spot-id' } });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        audienceAttributes: ['高齢者', '学生', '主婦'],
        existingImages: [],
      });
      await updateSpot(formData);

      const updateCall = queryBuilder.update.mock.calls[0]?.[0];
      expect(updateCall.audience_attributes).toEqual(['主婦', '学生', '高齢者']);
    });

    it('UC-US-02: ピン位置（緯度・経度）を更新できる', async () => {
      mockSupabaseResponse({ data: { id: 'existing-spot-id' } });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        lat: 34.6937,
        lng: 135.5023,
        existingImages: [],
      });
      await updateSpot(formData);

      const updateCall = queryBuilder.update.mock.calls[0]?.[0];
      expect(updateCall.lat).toBe(34.6937);
      expect(updateCall.lng).toBe(135.5023);
    });

    it('UC-US-03: 既存画像を維持しつつ新規画像を追加できる', async () => {
      mockUploadImage.mockResolvedValue('https://r2.example.com/spots/new-image.jpg');
      mockSupabaseResponse({ data: { id: 'existing-spot-id' } });

      const newImage = new File(['new-image'], 'new.jpg', { type: 'image/jpeg' });
      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        existingImages: ['https://r2.example.com/spots/old-image.jpg'],
        images: [newImage],
      });
      await updateSpot(formData);

      const updateCall = queryBuilder.update.mock.calls[0]?.[0];
      expect(updateCall.images).toEqual([
        'https://r2.example.com/spots/old-image.jpg',
        'https://r2.example.com/spots/new-image.jpg',
      ]);
    });

    it('UC-US-01: updatedAtが更新される', async () => {
      mockSupabaseResponse({ data: { id: 'existing-spot-id' } });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        existingImages: [],
      });
      await updateSpot(formData);

      const updateCall = queryBuilder.update.mock.calls[0]?.[0];
      expect(updateCall.updated_at).toBeDefined();
    });
  });

  // ===========================================
  // 異常系
  // ===========================================

  describe('異常系', () => {
    it('UC-US-E01 / R-AU-01: パスコードが不正な場合は拒否される', async () => {
      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        passcode: 'wrong-passcode',
        existingImages: [],
      });
      const result = await updateSpot(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('パスコード');
      expect(queryBuilder.update).not.toHaveBeenCalled();
    });

    it('UC-US-E02: スポットIDが未指定の場合はエラーが返される', async () => {
      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        existingImages: [],
      });
      // spotIdフィールドを設定しない
      const result = await updateSpot(formData);

      expect(result.success).toBe(false);
      expect(queryBuilder.update).not.toHaveBeenCalled();
    });

    it('R-SV-01: タイトルが空の場合は拒否される', async () => {
      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        title: '',
        existingImages: [],
      });
      const result = await updateSpot(formData);

      expect(result.success).toBe(false);
      expect(queryBuilder.update).not.toHaveBeenCalled();
    });

    it('R-SV-03: carAccessibilityが不正値の場合は拒否される', async () => {
      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        carAccessibility: 'invalid',
        existingImages: [],
      });
      const result = await updateSpot(formData);

      expect(result.success).toBe(false);
      expect(queryBuilder.update).not.toHaveBeenCalled();
    });

    it('画像アップロードが失敗した場合はエラーが返される', async () => {
      mockUploadImage.mockRejectedValue(new Error('R2 upload failed'));

      const newImage = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        existingImages: [],
        images: [newImage],
      });
      const result = await updateSpot(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('画像');
      expect(queryBuilder.update).not.toHaveBeenCalled();
    });

    it('データベースエラーの場合はエラーが返される', async () => {
      mockSupabaseResponse({ error: { message: 'DB error' } });

      const formData = buildSpotFormData({
        ...VALID_SPOT_DATA,
        spotId: 'existing-spot-id',
        existingImages: [],
      });
      const result = await updateSpot(formData);

      expect(result.success).toBe(false);
    });
  });
});
