import type { SupabaseClient } from '@supabase/supabase-js';
import { Spot } from '../../domain/models/spot/Spot';
import { Rating } from '../../domain/models/spot/Rating';
import { Location } from '../../domain/models/spot/Location';
import { CarAccessibility } from '../../domain/models/spot/CarAccessibility';
import { BestTime } from '../../domain/models/spot/BestTime';
import { AudienceAttributes } from '../../domain/models/spot/AudienceAttributes';
import type { ISpotRepository } from '../../domain/repositories/ISpotRepository';

export class SupabaseSpotRepository implements ISpotRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(spot: Spot): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from('spots')
      .insert(spot.toInsertRecord())
      .select('id')
      .single();

    if (error) {
      throw new Error('データベースへの保存に失敗しました');
    }

    return { id: data.id };
  }

  async update(spot: Spot): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from('spots')
      .update(spot.toUpdateRecord())
      .eq('id', spot.id)
      .select('id')
      .single();

    if (error) {
      throw new Error('データベースの更新に失敗しました');
    }

    return { id: data.id };
  }

  async delete(spotId: string): Promise<void> {
    const { error } = await this.supabase
      .from('spots')
      .delete()
      .eq('id', spotId);

    if (error) {
      throw new Error('削除に失敗しました');
    }
  }

  async findAll(): Promise<Spot[]> {
    const { data, error } = await this.supabase
      .from('spots')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch spots data.');
    }

    return (data || []).map((row) =>
      Spot.reconstruct({
        id: row.id,
        title: row.title,
        description: row.description,
        rating: Rating.create(row.rating),
        location: Location.create(row.lat, row.lng),
        carAccessibility: CarAccessibility.create(row.car_accessibility),
        bestTime: row.best_time ? BestTime.create(row.best_time) : BestTime.empty(),
        audienceAttributes: row.audience_attributes
          ? AudienceAttributes.create(row.audience_attributes)
          : AudienceAttributes.empty(),
        images: row.images || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }),
    );
  }
}
