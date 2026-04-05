import type { Spot } from '../models/spot/Spot';

export interface ISpotRepository {
  insert(spot: Spot): Promise<{ id: string }>;
  update(spot: Spot): Promise<{ id: string }>;
  delete(spotId: string): Promise<void>;
  findAll(): Promise<Spot[]>;
}
