import { ApiKeyValue } from '@/domain/models/api-key/ApiKeyValue';
import type { IApiKeyRepository, ApiKeyWithUsage } from '@/domain/repositories/IApiKeyRepository';

export class CreateApiKeyUseCase {
  constructor(
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly adminPasscode: string,
  ) {}

  async execute(appName: string, passcode: string): Promise<{ apiKey: string; prefix: string }> {
    if (passcode !== this.adminPasscode) {
      throw new ApiAdminAuthError('パスコードが正しくありません');
    }

    if (!appName.trim()) {
      throw new Error('アプリ名を入力してください');
    }

    const keyValue = ApiKeyValue.generate();

    await this.apiKeyRepository.insert({
      appName: appName.trim(),
      keyHash: keyValue.hash,
      keyPrefix: keyValue.prefix,
    });

    return { apiKey: keyValue.rawKey, prefix: keyValue.prefix };
  }
}

export class ListApiKeysUseCase {
  constructor(
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly adminPasscode: string,
  ) {}

  async execute(passcode: string): Promise<ApiKeyWithUsage[]> {
    if (passcode !== this.adminPasscode) {
      throw new ApiAdminAuthError('パスコードが正しくありません');
    }

    return this.apiKeyRepository.findAllWithTodayUsage();
  }
}

export class ToggleApiKeyUseCase {
  constructor(
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly adminPasscode: string,
  ) {}

  async execute(keyId: string, isActive: boolean, passcode: string): Promise<void> {
    if (passcode !== this.adminPasscode) {
      throw new ApiAdminAuthError('パスコードが正しくありません');
    }

    await this.apiKeyRepository.updateActiveStatus(keyId, isActive);
  }
}

export class ApiAdminAuthError extends Error {
  readonly name = 'ApiAdminAuthError';
}
