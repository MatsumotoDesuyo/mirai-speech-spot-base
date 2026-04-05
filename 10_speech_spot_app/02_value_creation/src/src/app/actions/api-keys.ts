'use server';

import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'crypto';
import type { ApiResponse, ApiKeyWithUsage } from '@/types/spot';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API_ADMIN_PASSCODE = process.env.API_ADMIN_PASSCODE;

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function createApiKey(
  appName: string,
  passcode: string
): Promise<ApiResponse<{ api_key: string; prefix: string }>> {
  try {
    if (passcode !== API_ADMIN_PASSCODE) {
      return { success: false, error: 'パスコードが正しくありません' };
    }

    if (!appName.trim()) {
      return { success: false, error: 'アプリ名を入力してください' };
    }

    // APIキー生成: mssb_ + 64文字のランダムhex
    const rawKey = randomBytes(32).toString('hex');
    const apiKey = `mssb_${rawKey}`;
    const keyHash = hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 13); // "mssb_" + 8文字

    const { error } = await supabase.from('api_keys').insert({
      app_name: appName.trim(),
      api_key_hash: keyHash,
      api_key_prefix: keyPrefix,
    });

    if (error) {
      console.error('Create API key error:', error);
      return { success: false, error: 'APIキーの作成に失敗しました' };
    }

    return { success: true, data: { api_key: apiKey, prefix: keyPrefix } };
  } catch (err) {
    console.error('Create API key error:', err);
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}

export async function listApiKeys(
  passcode: string
): Promise<ApiResponse<ApiKeyWithUsage[]>> {
  try {
    if (passcode !== API_ADMIN_PASSCODE) {
      return { success: false, error: 'パスコードが正しくありません' };
    }

    // 全APIキー取得
    const { data: keys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (keysError) {
      console.error('List API keys error:', keysError);
      return { success: false, error: 'APIキー一覧の取得に失敗しました' };
    }

    // 本日のアクセス数を取得
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const keysWithUsage: ApiKeyWithUsage[] = await Promise.all(
      (keys || []).map(async (key) => {
        const { count } = await supabase
          .from('api_access_logs')
          .select('*', { count: 'exact', head: true })
          .eq('api_key_id', key.id)
          .gte('accessed_at', todayStart.toISOString())
          .eq('response_status', 200);

        return {
          ...key,
          today_access_count: count ?? 0,
        };
      })
    );

    return { success: true, data: keysWithUsage };
  } catch (err) {
    console.error('List API keys error:', err);
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}

export async function toggleApiKey(
  keyId: string,
  isActive: boolean,
  passcode: string
): Promise<ApiResponse> {
  try {
    if (passcode !== API_ADMIN_PASSCODE) {
      return { success: false, error: 'パスコードが正しくありません' };
    }

    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: isActive })
      .eq('id', keyId);

    if (error) {
      console.error('Toggle API key error:', error);
      return { success: false, error: 'APIキーの更新に失敗しました' };
    }

    return { success: true };
  } catch (err) {
    console.error('Toggle API key error:', err);
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}
