import { Spot } from '@/domain/models/spot/Spot';
import type { ISpotRepository } from '@/domain/repositories/ISpotRepository';
import type { IImageStorage } from '@/domain/repositories/IImageStorage';
import { AuthenticationError, ImageUploadError } from './CreateSpotUseCase';

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
  newImages: { buffer: Buffer; fileName: string; mimeType: string }[];
}

export class UpdateSpotUseCase {
  constructor(
    private readonly spotRepository: ISpotRepository,
    private readonly imageStorage: IImageStorage,
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

    // 新規画像アップロード
    const newImageUrls: string[] = [];
    for (let i = 0; i < command.newImages.length; i++) {
      const img = command.newImages[i];
      try {
        const url = await this.imageStorage.upload(img.buffer, img.fileName, img.mimeType);
        newImageUrls.push(url);
      } catch (err) {
        throw new ImageUploadError(
          `画像${i + 1}のアップロードに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`,
        );
      }
    }

    const allImages = [...command.existingImages, ...newImageUrls];

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
