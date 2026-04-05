import { Spot } from '@/domain/models/spot/Spot';
import type { ISpotRepository } from '@/domain/repositories/ISpotRepository';
import { AuthenticationError, ImageLimitError } from './CreateSpotUseCase';

const MAX_IMAGES = 10;

export interface UpdateSpotCommand {
  passcode: string;
  spotId: string;
  title: string;
  description: string;
  rating: number;
  lat: number;
  lng: number;
  bestTime: number[];
  audienceAttributes: string[];
  carAccessibility: string;
  existingImages: string[];
  newImageUrls: string[];
}

export class UpdateSpotUseCase {
  constructor(
    private readonly spotRepository: ISpotRepository,
    private readonly passcode: string,
  ) {}

  async execute(command: UpdateSpotCommand): Promise<{ id: string }> {
    // R-AU-01: パスコード検証
    if (command.passcode !== this.passcode) {
      throw new AuthenticationError('パスコードが正しくありません');
    }

    if (!command.spotId) {
      throw new Error('スポットIDが指定されていません');
    }

    const allImages = [...command.existingImages, ...command.newImageUrls];

    // R-SV-07: 画像枚数制限
    if (allImages.length > MAX_IMAGES) {
      throw new ImageLimitError(`画像は最大${MAX_IMAGES}枚までです`);
    }

    // ドメインモデルでバリデーション + ソート適用
    const spot = Spot.forUpdate(command.spotId, {
      title: command.title,
      description: command.description || null,
      rating: command.rating,
      lat: command.lat,
      lng: command.lng,
      carAccessibility: command.carAccessibility,
      bestTime: command.bestTime,
      audienceAttributes: command.audienceAttributes,
      images: allImages,
    });

    return this.spotRepository.update(spot);
  }
}
