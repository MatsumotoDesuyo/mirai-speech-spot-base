import { ApiKeyValue } from '@/domain/models/api-key/ApiKeyValue';
import type { IApiKeyRepository } from '@/domain/repositories/IApiKeyRepository';
import type { IApiAccessLogRepository } from '@/domain/repositories/IApiAccessLogRepository';
import type { ISpotRepository } from '@/domain/repositories/ISpotRepository';
import type { Spot } from '@/domain/models/spot/Spot';

const DAILY_RATE_LIMIT = 10;

export interface GetSpotsApiResult {
  spots: Spot[];
}

export class GetSpotsApiUseCase {
  constructor(
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly accessLogRepository: IApiAccessLogRepository,
    private readonly spotRepository: ISpotRepository,
  ) {}

  async execute(rawApiKey: string | null, ipAddress: string | null): Promise<GetSpotsApiResult> {
    // UC-GA-E01: APIキー未指定
    if (!rawApiKey) {
      throw new InvalidApiKeyError('X-API-Key header is required.');
    }

    // UC-GA-E02: APIキー検証
    const keyHash = ApiKeyValue.hashOf(rawApiKey);
    const keyRecord = await this.apiKeyRepository.findByHash(keyHash);
    if (!keyRecord) {
      throw new InvalidApiKeyError('Invalid API key.');
    }

    // UC-GA-E03: 無効化済み
    if (!keyRecord.isActive) {
      throw new ApiKeyDisabledError('This API key has been disabled.');
    }

    // R-RL-01: レート制限チェック
    const todayCount = await this.accessLogRepository.countTodaySuccessful(keyRecord.id);
    if (todayCount >= DAILY_RATE_LIMIT) {
      // 超過もログ記録
      await this.accessLogRepository.insert({
        apiKeyId: keyRecord.id,
        responseStatus: 429,
        ipAddress,
      });
      throw new RateLimitExceededError(
        `Daily API limit (${DAILY_RATE_LIMIT} requests) exceeded. Try again tomorrow.`,
      );
    }

    // スポットデータ取得
    const spots = await this.spotRepository.findAll();

    // アクセスログ記録（成功）
    await this.accessLogRepository.insert({
      apiKeyId: keyRecord.id,
      responseStatus: 200,
      ipAddress,
    });

    return { spots };
  }
}

export class InvalidApiKeyError extends Error {
  readonly name = 'InvalidApiKeyError';
}

export class ApiKeyDisabledError extends Error {
  readonly name = 'ApiKeyDisabledError';
}

export class RateLimitExceededError extends Error {
  readonly name = 'RateLimitExceededError';
}
