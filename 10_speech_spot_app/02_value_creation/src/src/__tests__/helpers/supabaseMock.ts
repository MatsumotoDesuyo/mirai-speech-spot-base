/**
 * Supabase モックヘルパー
 *
 * Server Action / API Route が使用する Supabase クライアントのメソッドチェーンをモックする。
 *
 * 設計上の注意:
 *   - spot.ts / api-keys.ts / route.ts は module scope で `createClient()` を1回だけ呼ぶ。
 *     `createClient()` が返すオブジェクトの `.from()` は、常に最新のモック状態に
 *     動的に委譲する Proxy として構築する（beforeEach で差し替え可能にする）。
 *   - Supabase のクエリビルダーは「チェーン可能」かつ「thenable」（await 可能）。
 *     例: `await supabase.from('spots').delete().eq('id', x)` — eq() が最終呼び出し。
 *     例: `await supabase.from('spots').insert({}).select('id').single()` — single() が最終。
 *     そのため、各メソッドは自身を返し（チェーン継続）、かつ `.then()` を持つ必要がある。
 */
import { vi } from 'vitest';

// チェーン可能 & thenable なクエリビルダーのモック
export type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

export interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
}

// 現在のモック状態（beforeEach で差し替えられる）
let _queryBuilder: MockQueryBuilder;
let _currentFrom: (...args: unknown[]) => unknown;
// mockSupabaseResponse で設定される、thenable 時に返す結果
let _pendingResult: { data: unknown; error: unknown; count: unknown };

// module scope で createClient() が返す永続オブジェクト。
const _proxyClient = {
  from: (...args: unknown[]) => _currentFrom(...args),
};

/**
 * Supabase のモッククエリビルダーを初期化して返す。
 * テストファイルの beforeEach で呼び出す。
 */
export function createMockSupabaseClient(): {
  client: MockSupabaseClient;
  queryBuilder: MockQueryBuilder;
} {
  _pendingResult = { data: null, error: null, count: null };

  const queryBuilder = {} as MockQueryBuilder;

  // 全メソッド: 自身を返す（チェーン可能）
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'gte', 'single', 'order'] as const) {
    queryBuilder[method] = vi.fn().mockReturnValue(queryBuilder);
  }

  // then: await された時に _pendingResult を返す
  queryBuilder.then = vi.fn().mockImplementation(
    (resolve?: (value: unknown) => unknown) => {
      const result = _pendingResult;
      return resolve ? Promise.resolve(resolve(result)) : Promise.resolve(result);
    }
  );

  const fromFn = vi.fn().mockReturnValue(queryBuilder);

  _queryBuilder = queryBuilder;
  _currentFrom = fromFn;

  const client: MockSupabaseClient = { from: fromFn };
  return { client, queryBuilder };
}

/**
 * Supabase のモッククエリビルダーの最終戻り値を設定する。
 * await 時（.then() 経由）に返される { data, error, count } を指定する。
 */
export function mockSupabaseResponse(response: {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
}) {
  _pendingResult = {
    data: response.data ?? null,
    error: response.error ?? null,
    count: response.count ?? null,
  };
}

/**
 * createClient のモックファクトリ。vi.mock で使用する。
 */
export function getMockCreateClient() {
  return () => _proxyClient;
}

export function getMockClient(): MockSupabaseClient {
  return _proxyClient as unknown as MockSupabaseClient;
}

export function getMockQueryBuilder() {
  return _queryBuilder;
}

/**
 * from() の実装を直接差し替える。テーブル名ごとに異なるレスポンスが必要な場合に使用。
 */
export function setFromImplementation(impl: (table: string) => unknown) {
  _currentFrom = impl as (...args: unknown[]) => unknown;
}
