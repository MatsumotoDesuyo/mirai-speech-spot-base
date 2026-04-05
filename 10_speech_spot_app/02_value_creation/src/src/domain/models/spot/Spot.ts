import { Rating } from './Rating';
import { Location } from './Location';
import { CarAccessibility } from './CarAccessibility';
import { BestTime } from './BestTime';
import { AudienceAttributes } from './AudienceAttributes';

/** Spot 集約ルート */
export interface SpotProps {
  id: string;
  title: string;
  description: string | null;
  rating: Rating;
  location: Location;
  carAccessibility: CarAccessibility;
  bestTime: BestTime;
  audienceAttributes: AudienceAttributes;
  images: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpotInput {
  title: string;
  description: string | null;
  rating: number;
  lat: number;
  lng: number;
  carAccessibility: string;
  bestTime: number[];
  audienceAttributes: string[];
  imageUrls: string[];
}

export interface UpdateSpotInput {
  title: string;
  description: string | null;
  rating: number;
  lat: number;
  lng: number;
  carAccessibility: string;
  bestTime: number[];
  audienceAttributes: string[];
  images: string[];
}

export class Spot {
  private constructor(private readonly props: SpotProps) {}

  /** 新規作成（バリデーション + ソート適用） */
  static create(input: CreateSpotInput): Spot {
    const title = validateTitle(input.title);

    return new Spot({
      id: '', // DB が自動生成
      title,
      description: input.description || null,
      rating: Rating.create(input.rating),
      location: Location.create(input.lat, input.lng),
      carAccessibility: CarAccessibility.create(input.carAccessibility),
      bestTime: input.bestTime.length > 0
        ? BestTime.create(input.bestTime)
        : BestTime.empty(),
      audienceAttributes: input.audienceAttributes.length > 0
        ? AudienceAttributes.create(input.audienceAttributes)
        : AudienceAttributes.empty(),
      images: Object.freeze([...input.imageUrls]),
      createdAt: '',
      updatedAt: '',
    });
  }

  /** DB レコードからの復元（バリデーションなし） */
  static reconstruct(props: SpotProps): Spot {
    return new Spot(props);
  }

  /** 更新用ファクトリ（バリデーション + ソート適用）。既存 Spot を持たずに ID 指定で更新データを構築 */
  static forUpdate(spotId: string, input: UpdateSpotInput): Spot {
    const title = validateTitle(input.title);

    return new Spot({
      id: spotId,
      title,
      description: input.description || null,
      rating: Rating.create(input.rating),
      location: Location.create(input.lat, input.lng),
      carAccessibility: CarAccessibility.create(input.carAccessibility),
      bestTime: input.bestTime.length > 0
        ? BestTime.create(input.bestTime)
        : BestTime.empty(),
      audienceAttributes: input.audienceAttributes.length > 0
        ? AudienceAttributes.create(input.audienceAttributes)
        : AudienceAttributes.empty(),
      images: Object.freeze([...input.images]),
      createdAt: '',
      updatedAt: new Date().toISOString(),
    });
  }

  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get rating(): Rating { return this.props.rating; }
  get location(): Location { return this.props.location; }
  get carAccessibility(): CarAccessibility { return this.props.carAccessibility; }
  get bestTime(): BestTime { return this.props.bestTime; }
  get audienceAttributes(): AudienceAttributes { return this.props.audienceAttributes; }
  get images(): readonly string[] { return this.props.images; }
  get createdAt(): string { return this.props.createdAt; }
  get updatedAt(): string { return this.props.updatedAt; }

  /** DB INSERT 用のプレーンオブジェクト */
  toInsertRecord(): Record<string, unknown> {
    return {
      title: this.title,
      description: this.description,
      rating: this.rating.value,
      lat: this.location.lat,
      lng: this.location.lng,
      car_accessibility: this.carAccessibility.value,
      best_time: this.bestTime.toNullable(),
      audience_attributes: this.audienceAttributes.toNullable(),
      images: [...this.images],
    };
  }

  /** DB UPDATE 用のプレーンオブジェクト */
  toUpdateRecord(): Record<string, unknown> {
    return {
      ...this.toInsertRecord(),
      updated_at: this.updatedAt,
    };
  }
}

/** R-SV-01: タイトル必須 */
function validateTitle(title: string): string {
  if (!title || title.trim() === '') {
    throw new Error('必須項目が入力されていません');
  }
  return title;
}
