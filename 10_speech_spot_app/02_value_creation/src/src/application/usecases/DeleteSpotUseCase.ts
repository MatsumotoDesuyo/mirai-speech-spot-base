import type { ISpotRepository } from '@/domain/repositories/ISpotRepository';

export class DeleteSpotUseCase {
  constructor(
    private readonly spotRepository: ISpotRepository,
    private readonly adminPassword: string,
  ) {}

  async execute(spotId: string, password: string): Promise<void> {
    // R-AU-02: 管理者パスワード検証
    if (password !== this.adminPassword) {
      throw new AdminAuthenticationError('管理者パスワードが正しくありません');
    }

    await this.spotRepository.delete(spotId);
  }
}

export class AdminAuthenticationError extends Error {
  readonly name = 'AdminAuthenticationError';
}
