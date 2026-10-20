export class VirtualClock {
  #now;
  constructor(startMs = 0) {
    if (!Number.isInteger(startMs) || startMs < 0) throw new RangeError('startMs must be a non-negative integer');
    this.#now = startMs;
  }
  now() { return this.#now; }
  advance(deltaMs) {
    if (!Number.isInteger(deltaMs) || deltaMs < 0) throw new RangeError('deltaMs must be non-negative');
    this.#now += deltaMs;
    return this.#now;
  }
  set(timeMs) {
    if (!Number.isInteger(timeMs) || timeMs < this.#now) throw new RangeError('virtual time cannot move backward');
    this.#now = timeMs;
  }
}
