export class PriceCurve {
  readonly demandArray: readonly number[];

  constructor(demandArray: number[]) {
    for (let i = 1; i < demandArray.length; i++) {
      if (demandArray[i] > demandArray[i - 1]) {
        throw new Error(
          `Demand array must be non-ascending: index ${i} (${demandArray[i]}) > index ${i - 1} (${demandArray[i - 1]})`
        );
      }
    }
    this.demandArray = Object.freeze([...demandArray]);
  }

  get length() {
    return this.demandArray.length;
  }

  valueAt(priceStep: number): number {
    if (priceStep < 0 || priceStep >= this.demandArray.length) {
      throw new RangeError(`Price step ${priceStep} out of bounds [0, ${this.demandArray.length})`);
    }
    return this.demandArray[priceStep];
  }

  add(other: PriceCurve): PriceCurve {
    if (this.demandArray.length !== other.demandArray.length) {
      throw new Error('Cannot add PriceCurves of different lengths');
    }
    const result = new Array(this.demandArray.length);
    for (let i = 0; i < this.demandArray.length; i++) {
      result[i] = this.demandArray[i] + other.demandArray[i];
    }
    return new PriceCurve(result);
  }
}
