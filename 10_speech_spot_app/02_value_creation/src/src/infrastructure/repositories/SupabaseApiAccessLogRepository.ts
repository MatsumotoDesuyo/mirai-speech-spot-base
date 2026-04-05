import type { SupabaseClient } from '@supabase/supabase-js';
import type { IApiAccessLogRepository } from '../../domain/repositories/IApiAccessLogRepository';

export class SupabaseApiAccessLogRepository implements IApiAccessLogRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async countTodaySuccessful(apiKeyId: string): Promise<number> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count, error } = await this.supabase
      .from('api_access_logs')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('accessed_at', todayStart.toISOString())
      .eq('response_status', 200);

    if (error) {
      throw new Error('An internal error occurred.');
    }

    return count ?? 0;
  }

  async insert(data: { apiKeyId: string; responseStatus: number; ipAddress: string | null }): Promise<void> {
    await this.supabase.from('api_access_logs').insert({
      api_key_id: data.apiKeyId,
      response_status: data.responseStatus,
      ip_address: data.ipAddress,
    });
  }
}
