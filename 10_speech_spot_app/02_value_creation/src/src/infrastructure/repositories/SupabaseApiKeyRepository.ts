import type { SupabaseClient } from '@supabase/supabase-js';
import type { IApiKeyRepository, ApiKeyWithUsage } from '../../domain/repositories/IApiKeyRepository';

export class SupabaseApiKeyRepository implements IApiKeyRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(data: { appName: string; keyHash: string; keyPrefix: string }): Promise<void> {
    const { error } = await this.supabase.from('api_keys').insert({
      app_name: data.appName,
      api_key_hash: data.keyHash,
      api_key_prefix: data.keyPrefix,
    });

    if (error) {
      throw new Error('APIキーの作成に失敗しました');
    }
  }

  async findByHash(keyHash: string): Promise<{ id: string; appName: string; isActive: boolean } | null> {
    const { data, error } = await this.supabase
      .from('api_keys')
      .select('id, app_name, is_active')
      .eq('api_key_hash', keyHash)
      .single();

    if (error || !data) {
      return null;
    }

    return { id: data.id, appName: data.app_name, isActive: data.is_active };
  }

  async findAllWithTodayUsage(): Promise<ApiKeyWithUsage[]> {
    const { data: keys, error: keysError } = await this.supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (keysError) {
      throw new Error('APIキー一覧の取得に失敗しました');
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    return Promise.all(
      (keys || []).map(async (key) => {
        const { count } = await this.supabase
          .from('api_access_logs')
          .select('*', { count: 'exact', head: true })
          .eq('api_key_id', key.id)
          .gte('accessed_at', todayStart.toISOString())
          .eq('response_status', 200);

        return {
          id: key.id,
          appName: key.app_name,
          keyHash: key.api_key_hash,
          keyPrefix: key.api_key_prefix,
          isActive: key.is_active,
          createdAt: key.created_at,
          updatedAt: key.updated_at,
          todayAccessCount: count ?? 0,
        };
      }),
    );
  }

  async updateActiveStatus(keyId: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('api_keys')
      .update({ is_active: isActive })
      .eq('id', keyId);

    if (error) {
      throw new Error('APIキーの更新に失敗しました');
    }
  }
}
