export const SignalType = Object.freeze({ BOOLEAN: 'boolean', INTEGER: 'integer', NUMBER: 'number', STRING: 'string' });

export class SignalCatalog {
  #signals = new Map();

  constructor(definitions = []) {
    for (const definition of definitions) this.register(definition);
  }

  register(definition) {
    if (!definition?.id || !Object.values(SignalType).includes(definition.type)) {
      throw new TypeError('signal id and supported type are required');
    }
    if (this.#signals.has(definition.id)) throw new Error(`duplicate signal: ${definition.id}`);
    const normalized = Object.freeze({
      id: definition.id,
      type: definition.type,
      unit: definition.unit ?? '',
      min: definition.min,
      max: definition.max,
      description: definition.description ?? '',
      safetyRelevant: Boolean(definition.safetyRelevant)
    });
    this.#signals.set(normalized.id, normalized);
    return normalized;
  }

  get(id) { return this.#signals.get(id); }
  list() { return [...this.#signals.values()]; }

  validate(id, value) {
    const signal = this.get(id);
    if (!signal) return {ok: false, reason: 'unknown-signal'};
    if (signal.type === SignalType.NUMBER && typeof value !== 'number') return {ok: false, reason: 'type'};
    if (signal.type === SignalType.INTEGER && (!Number.isInteger(value))) return {ok: false, reason: 'type'};
    if (signal.type === SignalType.BOOLEAN && typeof value !== 'boolean') return {ok: false, reason: 'type'};
    if (signal.type === SignalType.STRING && typeof value !== 'string') return {ok: false, reason: 'type'};
    if (typeof value === 'number' && (!Number.isFinite(value) || (signal.min != null && value < signal.min) || (signal.max != null && value > signal.max))) {
      return {ok: false, reason: 'range'};
    }
    return {ok: true};
  }
}
