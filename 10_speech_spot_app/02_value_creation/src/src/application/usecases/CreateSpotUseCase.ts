import { Spot } from '@/domain/models/spot/Spot';
import type { ISpotRepository } from '@/domain/repositories/ISpotRepository';

const MAX_IMAGES = 10;

export interface CreateSpotCommand {
  passcode: string;
  title: string;
  description: string;
  rating: number;
  lat: number;
  lng: number;
  bestTime: number[];
  audienceAttributes: string[];
  carAccessibility: string;
  imageUrls: string[];
}

export class CreateSpotUseCase {
  constructor(
    private readonly spotRepository: ISpotRepository,
    private readonly passcode: string,
  ) {}

  async execute(command: CreateSpotCommand): Promise<{ id: string }> {
    // R-AU-01: パスコード検証
    if (command.passcode !== this.passcode) {
      throw new AuthenticationError('パスコードが正しくありません');
    }

    // R-SV-07: 画像枚数制限
    if (command.imageUrls.length > MAX_IMAGES) {
      throw new ImageLimitError(`画像は最大${MAX_IMAGES}枚までです`);
    }

    // ドメインモデル生成（バリデーション + ソート）
    const spot = Spot.create({
      title: command.title,
      description: command.description || null,
      rating: command.rating,
      lat: command.lat,
      lng: command.lng,
      carAccessibility: command.carAccessibility,
      bestTime: command.bestTime,
      audienceAttributes: command.audienceAttributes,
      imageUrls: command.imageUrls,
    });

    return this.spotRepository.insert(spot);
  }
}

export class AuthenticationError extends Error {
  readonly name = 'AuthenticationError';
}

export class ImageLimitError extends Error {
  readonly name = 'ImageLimitError';
}
