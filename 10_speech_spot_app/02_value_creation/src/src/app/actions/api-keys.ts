'use server';

import { createClient } from '@supabase/supabase-js';
import {
  CreateApiKeyUseCase,
  ListApiKeysUseCase,
  ToggleApiKeyUseCase,
  ApiAdminAuthError,
} from '@/application/usecases/ApiKeyUseCases';
import { SupabaseApiKeyRepository } from '@/infrastructure/repositories/SupabaseApiKeyRepository';
import type { ApiResponse, ApiKeyWithUsage } from '@/types/spot';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const apiKeyRepository = new SupabaseApiKeyRepository(supabase);

export async function createApiKey(
  appName: string,
  passcode: string
): Promise<ApiResponse<{ api_key: string; prefix: string }>> {
  try {
    const useCase = new CreateApiKeyUseCase(apiKeyRepository, process.env.API_ADMIN_PASSCODE!);
    const result = await useCase.execute(appName, passcode);
    return { success: true, data: { api_key: result.apiKey, prefix: result.prefix } };
  } catch (err) {
    if (err instanceof ApiAdminAuthError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}

export async function listApiKeys(
  passcode: string
): Promise<ApiResponse<ApiKeyWithUsage[]>> {
  try {
    const useCase = new ListApiKeysUseCase(apiKeyRepository, process.env.API_ADMIN_PASSCODE!);
    const keys = await useCase.execute(passcode);

    // ドメイン型 → API型に変換 (camelCase → snake_case)
    const mapped: ApiKeyWithUsage[] = keys.map((k) => ({
      id: k.id,
      app_name: k.appName,
      api_key_hash: k.keyHash,
      api_key_prefix: k.keyPrefix,
      is_active: k.isActive,
      created_at: k.createdAt,
      updated_at: k.updatedAt,
      today_access_count: k.todayAccessCount,
    }));

    return { success: true, data: mapped };
  } catch (err) {
    if (err instanceof ApiAdminAuthError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}

export async function toggleApiKey(
  keyId: string,
  isActive: boolean,
  passcode: string
): Promise<ApiResponse> {
  try {
    const useCase = new ToggleApiKeyUseCase(apiKeyRepository, process.env.API_ADMIN_PASSCODE!);
    await useCase.execute(keyId, isActive, passcode);
    return { success: true };
  } catch (err) {
    if (err instanceof ApiAdminAuthError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: '予期せぬエラーが発生しました' };
  }
}
