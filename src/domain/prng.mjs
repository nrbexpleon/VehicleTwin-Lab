export class SeededRandom {
  #state;
  constructor(seed = 1) {
    if (!Number.isInteger(seed)) throw new TypeError('seed must be an integer');
    this.#state = seed >>> 0 || 1;
  }
  next() {
    let x = this.#state;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.#state = x >>> 0;
    return this.#state / 0x100000000;
  }
  between(min, max) { return min + this.next() * (max - min); }
}
