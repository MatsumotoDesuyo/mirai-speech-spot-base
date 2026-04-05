export interface ApiKeyRecord {
  id: string;
  appName: string;
  keyHash: string;
  keyPrefix: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyWithUsage extends ApiKeyRecord {
  todayAccessCount: number;
}

export interface IApiKeyRepository {
  insert(data: { appName: string; keyHash: string; keyPrefix: string }): Promise<void>;
  findByHash(keyHash: string): Promise<{ id: string; appName: string; isActive: boolean } | null>;
  findAllWithTodayUsage(): Promise<ApiKeyWithUsage[]>;
  updateActiveStatus(keyId: string, isActive: boolean): Promise<void>;
}
