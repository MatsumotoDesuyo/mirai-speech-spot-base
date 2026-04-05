/**
 * 振る舞いテスト: getUploadUrls
 *
 * 仕様根拠:
 *   - UseCase: CreateSpot (UC-CS-04, UC-CS-E04)
 *   - Rule: Authentication (R-AU-01)
 *   - Rule: SpotValidation (R-SV-07, R-SV-08)
 *
 * Presigned URL方式による画像アップロードのサーバーサイドテスト。
 * クライアントからR2へ直接アップロードするためのPresigned URLを生成する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---
const mockGetSignedUrl = vi.fn();

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class MockS3Client {},
  PutObjectCommand: class MockPutObjectCommand {
    constructor(public readonly input: unknown) {}
  },
}));

vi.stubEnv('R2_ACCOUNT_ID', 'test-account-id');
vi.stubEnv('R2_ACCESS_KEY_ID', 'test-access-key');
vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-secret-key');
vi.stubEnv('R2_BUCKET_NAME', 'test-bucket');
vi.stubEnv('NEXT_PUBLIC_R2_PUBLIC_URL', 'https://r2.example.com');
vi.stubEnv('PASSCODE', 'test-passcode');

// Supabase mock (spot.ts で import される)
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({}) }),
}));
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

const { getUploadUrls } = await import('@/app/actions/spot');

describe('getUploadUrls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================
  // 正常系
  // ===========================================

  describe('正常系', () => {
    it('UC-CS-04: 正しいパスコードでPresigned URLが取得できる', async () => {
      mockGetSignedUrl.mockResolvedValue('https://test-bucket.r2.cloudflarestorage.com/signed-url');

      const result = await getUploadUrls(
        'test-passcode',
        [{ fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].uploadUrl).toBe('https://test-bucket.r2.cloudflarestorage.com/signed-url');
      expect(result.data![0].publicUrl).toMatch(/^https:\/\/r2\.example\.com\/spots\//);
    });

    it('UC-CS-04: 複数画像のPresigned URLを一括取得できる', async () => {
      mockGetSignedUrl
        .mockResolvedValueOnce('https://signed-url-1')
        .mockResolvedValueOnce('https://signed-url-2')
        .mockResolvedValueOnce('https://signed-url-3');

      const result = await getUploadUrls(
        'test-passcode',
        [
          { fileName: 'photo1.jpg', mimeType: 'image/jpeg' },
          { fileName: 'photo2.png', mimeType: 'image/png' },
          { fileName: 'photo3.webp', mimeType: 'image/webp' },
        ],
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(mockGetSignedUrl).toHaveBeenCalledTimes(3);
    });

    it('UC-CS-04: ファイル名がサニタイズされてキーに使用される', async () => {
      mockGetSignedUrl.mockResolvedValue('https://signed-url');

      const result = await getUploadUrls(
        'test-passcode',
        [{ fileName: '写真 テスト.jpg', mimeType: 'image/jpeg' }],
      );

      expect(result.success).toBe(true);
      // publicUrlにサニタイズされたファイル名が含まれる
      expect(result.data![0].publicUrl).not.toContain('写真');
      expect(result.data![0].publicUrl).toContain('.jpg');
    });
  });

  // ===========================================
  // 異常系
  // ===========================================

  describe('異常系', () => {
    it('UC-CS-E04: パスコードが不正な場合はPresigned URLの取得が拒否される', async () => {
      const result = await getUploadUrls(
        'wrong-passcode',
        [{ fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('パスコード');
      expect(mockGetSignedUrl).not.toHaveBeenCalled();
    });

    it('R-SV-07: 画像が10枚を超える場合は拒否される', async () => {
      const files = Array.from({ length: 11 }, (_, i) => ({
        fileName: `photo${i}.jpg`,
        mimeType: 'image/jpeg',
      }));

      const result = await getUploadUrls('test-passcode', files);

      expect(result.success).toBe(false);
      expect(result.error).toContain('10');
      expect(mockGetSignedUrl).not.toHaveBeenCalled();
    });

    it('空のファイルリストの場合は空配列が返される', async () => {
      const result = await getUploadUrls('test-passcode', []);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('Presigned URL生成が失敗した場合はエラーが返される', async () => {
      mockGetSignedUrl.mockRejectedValue(new Error('S3 signing error'));

      const result = await getUploadUrls(
        'test-passcode',
        [{ fileName: 'photo.jpg', mimeType: 'image/jpeg' }],
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
