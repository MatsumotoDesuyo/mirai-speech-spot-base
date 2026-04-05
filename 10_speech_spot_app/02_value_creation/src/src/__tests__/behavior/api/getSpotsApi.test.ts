/**
 * 振る舞いテスト: GetSpotsApi
 *
 * 仕様根拠:
 *   - UseCase: GetSpotsApi (UC-GA-01, UC-GA-E01 ~ UC-GA-E04)
 *   - Rule: Authentication (R-AU-04)
 *   - Rule: RateLimit (R-RL-01, R-RL-02)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  createMockSupabaseClient,
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

const { GET } = await import('@/app/api/v1/spots/route');

// テスト用のスポットデータ
const MOCK_SPOTS = [
  {
    id: 'spot-1',
    title: 'テストスポット1',
    description: 'テスト説明',
    rating: 8,
    best_time: [10, 14],
    lat: 35.6762,
    lng: 139.7447,
    audience_attributes: ['主婦', '学生'],
    car_accessibility: 'allowed',
    images: ['https://r2.example.com/image1.jpg'],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const VALID_API_KEY = 'valid-api-key';

function createRequest(headers: Record<string, string> = {}): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/v1/spots', {
    method: 'GET',
    headers,
  });
  return req;
}

describe('GetSpotsApi', () => {
  let queryBuilder: MockQueryBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    const mock = createMockSupabaseClient();
    queryBuilder = mock.queryBuilder;

    // from() の呼び出しをテーブル名で区別してレスポンスを返す
    setFromImplementation((table: string) => {
      if (table === 'api_keys') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'key-id-1',
              app_name: 'Test App',
              is_active: true,
            },
            error: null,
          }),
        };
      }

      if (table === 'api_access_logs') {
        const logsBuilder = {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
        return logsBuilder;
      }

      if (table === 'spots') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: MOCK_SPOTS,
              error: null,
            }),
          }),
        };
      }

      return queryBuilder;
    });
  });

  // ===========================================
  // 正常系
  // ===========================================

  describe('正常系', () => {
    it('UC-GA-01: 有効なAPIキーでGeoJSON形式のスポットデータが返却される', async () => {
      const request = createRequest({ 'X-API-Key': VALID_API_KEY });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.type).toBe('FeatureCollection');
      expect(body.features).toHaveLength(1);
      expect(body.features[0].type).toBe('Feature');
      expect(body.features[0].geometry.type).toBe('Point');
      // GeoJSON座標は [lng, lat] 順
      expect(body.features[0].geometry.coordinates).toEqual([139.7447, 35.6762]);
      expect(body.features[0].properties.id).toBe('spot-1');
      expect(body.features[0].properties.title).toBe('テストスポット1');
    });

    it('UC-GA-01: メタデータが含まれる', async () => {
      const request = createRequest({ 'X-API-Key': VALID_API_KEY });
      const response = await GET(request);
      const body = await response.json();

      expect(body.metadata).toBeDefined();
      expect(body.metadata.attribution).toBeDefined();
      expect(body.metadata.license).toBeDefined();
      expect(body.metadata.generated_at).toBeDefined();
      expect(body.metadata.total_count).toBe(1);
    });

    it('UC-GA-01: Cache-Control: no-store ヘッダーが付与される', async () => {
      const request = createRequest({ 'X-API-Key': VALID_API_KEY });
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
  });

  // ===========================================
  // 異常系
  // ===========================================

  describe('異常系', () => {
    it('UC-GA-E01 / R-AU-04: APIキーが未指定の場合は401が返却される', async () => {
      const request = createRequest({});
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error.code).toBe('INVALID_API_KEY');
    });

    it('UC-GA-E02 / R-AU-04: 存在しないAPIキーの場合は401が返却される', async () => {
      setFromImplementation((table: string) => {
        if (table === 'api_keys') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          };
        }
        return queryBuilder;
      });

      const request = createRequest({ 'X-API-Key': 'non-existent-key' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error.code).toBe('INVALID_API_KEY');
    });

    it('UC-GA-E03: APIキーが無効化されている場合は403が返却される', async () => {
      setFromImplementation((table: string) => {
        if (table === 'api_keys') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'key-id-1',
                app_name: 'Test App',
                is_active: false, // 無効化
              },
              error: null,
            }),
          };
        }
        return queryBuilder;
      });

      const request = createRequest({ 'X-API-Key': VALID_API_KEY });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('API_KEY_DISABLED');
    });

    it('UC-GA-E04 / R-RL-01: 日次リクエスト上限（10回）を超過した場合は429が返却される', async () => {
      setFromImplementation((table: string) => {
        if (table === 'api_keys') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'key-id-1',
                app_name: 'Test App',
                is_active: true,
              },
              error: null,
            }),
          };
        }
        if (table === 'api_access_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return queryBuilder;
      });

      const request = createRequest({ 'X-API-Key': VALID_API_KEY });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(429);
      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('R-RL-01: レート制限超過時もアクセスログにステータス429として記録される', async () => {
      let logInsertCalled = false;
      let logInsertArgs: unknown = null;

      setFromImplementation((table: string) => {
        if (table === 'api_keys') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'key-id-1',
                app_name: 'Test App',
                is_active: true,
              },
              error: null,
            }),
          };
        }
        if (table === 'api_access_logs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
                }),
              }),
            }),
            insert: vi.fn().mockImplementation((args: unknown) => {
              logInsertCalled = true;
              logInsertArgs = args;
              return Promise.resolve({ error: null });
            }),
          };
        }
        return queryBuilder;
      });

      const request = createRequest({ 'X-API-Key': VALID_API_KEY });
      await GET(request);

      expect(logInsertCalled).toBe(true);
      expect(logInsertArgs).toMatchObject({
        api_key_id: 'key-id-1',
        response_status: 429,
      });
    });
  });
});
