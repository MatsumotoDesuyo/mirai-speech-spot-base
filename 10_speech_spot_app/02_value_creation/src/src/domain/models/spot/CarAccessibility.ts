/** R-SV-03: 選挙カー利用可否 */
const CAR_ACCESSIBILITY_VALUES = ['allowed', 'brief_stop', 'not_allowed'] as const;
export type CarAccessibilityValue = (typeof CAR_ACCESSIBILITY_VALUES)[number];

export class CarAccessibility {
  private constructor(private readonly _value: CarAccessibilityValue) {}

  static create(value: string): CarAccessibility {
    if (!CAR_ACCESSIBILITY_VALUES.includes(value as CarAccessibilityValue)) {
      throw new Error('選挙カー利用可否を選択してください');
    }
    return new CarAccessibility(value as CarAccessibilityValue);
  }

  get value(): CarAccessibilityValue {
    return this._value;
  }

  equals(other: CarAccessibility): boolean {
    return this._value === other._value;
  }
}
