export interface IApiAccessLogRepository {
  countTodaySuccessful(apiKeyId: string): Promise<number>;
  insert(data: { apiKeyId: string; responseStatus: number; ipAddress: string | null }): Promise<void>;
}
