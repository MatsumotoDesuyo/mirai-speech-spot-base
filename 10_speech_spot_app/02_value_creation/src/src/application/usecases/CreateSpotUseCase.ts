import { Spot } from '@/domain/models/spot/Spot';
import type { ISpotRepository } from '@/domain/repositories/ISpotRepository';
import type { IImageStorage } from '@/domain/repositories/IImageStorage';

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
  images: { buffer: Buffer; fileName: string; mimeType: string }[];
}

export class CreateSpotUseCase {
  constructor(
    private readonly spotRepository: ISpotRepository,
    private readonly imageStorage: IImageStorage,
    private readonly passcode: string,
  ) {}

  async execute(command: CreateSpotCommand): Promise<{ id: string }> {
    // R-AU-01: パスコード検証
    if (command.passcode !== this.passcode) {
      throw new AuthenticationError('パスコードが正しくありません');
    }

    // 画像アップロード
    const imageUrls: string[] = [];
    for (let i = 0; i < command.images.length; i++) {
      const img = command.images[i];
      try {
        const url = await this.imageStorage.upload(img.buffer, img.fileName, img.mimeType);
        imageUrls.push(url);
      } catch (err) {
        throw new ImageUploadError(
          `画像${i + 1}のアップロードに失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`,
        );
      }
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
      imageUrls,
    });

    return this.spotRepository.insert(spot);
  }
}

export class AuthenticationError extends Error {
  readonly name = 'AuthenticationError';
}

export class ImageUploadError extends Error {
  readonly name = 'ImageUploadError';
}
