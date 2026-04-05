/** R-SV-04: 緯度・経度（-90≤lat≤90, -180≤lng≤180） */
export class Location {
  private constructor(
    private readonly _lat: number,
    private readonly _lng: number,
  ) {}

  static create(lat: number, lng: number): Location {
    if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error('緯度は-90〜90の範囲で指定してください');
    }
    if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error('経度は-180〜180の範囲で指定してください');
    }
    return new Location(lat, lng);
  }

  get lat(): number {
    return this._lat;
  }

  get lng(): number {
    return this._lng;
  }

  equals(other: Location): boolean {
    return this._lat === other._lat && this._lng === other._lng;
  }
}
