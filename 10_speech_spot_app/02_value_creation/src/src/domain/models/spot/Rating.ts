/** R-SV-02: 推奨Lv（1〜10の整数） */
export class Rating {
  private constructor(private readonly _value: number) {}

  static create(value: number): Rating {
    if (!Number.isInteger(value) || value < 1 || value > 10) {
      throw new Error('推奨Lvは1〜10の整数で指定してください');
    }
    return new Rating(value);
  }

  get value(): number {
    return this._value;
  }

  equals(other: Rating): boolean {
    return this._value === other._value;
  }
}
