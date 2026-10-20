import {randomUUID} from 'node:crypto';
import {VirtualClock} from './clock.mjs';
import {SeededRandom} from './prng.mjs';
import {validateFault, isFaultActive, applySignalFault} from './faults.mjs';
import {evaluateAssertion} from './assertions.mjs';

const MAX_DURATION_MS = 3_600_000;
const MAX_EVENTS = 10_000;
const clone = value => structuredClone(value);

export class TwinEngine {
  #catalog;
  #sinks;
  constructor({catalog, sinks = []}) {
    this.#catalog = catalog;
    this.#sinks = sinks;
  }

  async run(input) {
    const scenario = validateScenario(input, this.#catalog);
    const clock = new VirtualClock(scenario.startMs ?? 0);
    const random = new SeededRandom(scenario.seed);
    const state = new Map();
    const frozen = new Map();
    const trace = [];
    const delayed = [];
    const faults = scenario.faults.map(validateFault);
    const events = [...scenario.events].sort((a, b) => a.atMs - b.atMs);
    let eventIndex = 0;
    const statistics = {ticks: 0, published: 0, dropped: 0, faultsActivated: 0, restarts: 0, delayed: 0};
    const activated = new Set();

    for (const [id, value] of Object.entries(scenario.initialState)) {
      state.set(id, sample(id, value, clock.now(), 'valid', 'scenario'));
    }

    while (clock.now() <= scenario.durationMs) {
      const now = clock.now();
      statistics.ticks++;
      while (eventIndex < events.length && events[eventIndex].atMs <= now) {
        const event = events[eventIndex++];
        const check = this.#catalog.validate(event.signal, event.value);
        if (!check.ok) throw new Error(`invalid event ${event.id ?? eventIndex}: ${check.reason}`);
        state.set(event.signal, sample(event.signal, event.value, now, 'valid', 'scenario'));
        trace.push({timeMs: now, kind: 'input', signal: event.signal, value: event.value});
      }

      const activeFaults = faults.filter(fault => isFaultActive(fault, now));
      for (const fault of activeFaults) {
        if (!activated.has(fault.id)) {
          activated.add(fault.id); statistics.faultsActivated++;
          trace.push({timeMs: now, kind: 'fault-activated', faultId: fault.id, faultType: fault.type});
        }
      }

      if (activeFaults.some(f => f.type === 'ecu-restart')) {
        state.clear(); frozen.clear(); statistics.restarts++;
        trace.push({timeMs: now, kind: 'ecu-restart'});
      }

      for (const [id, base] of [...state]) {
        const applicable = activeFaults.filter(f => f.signal === id || f.signal === '*');
        if (applicable.some(f => f.type === 'drop')) { statistics.dropped++; continue; }
        let current = clone(base);
        for (const fault of applicable) {
          if (fault.type === 'freeze') {
            if (!frozen.has(fault.id)) frozen.set(fault.id, clone(current));
            current = clone(frozen.get(fault.id));
          } else if (fault.type === 'offset' || fault.type === 'noise') {
            if (typeof current.value === 'number') current.value = applySignalFault(current.value, fault, random);
          } else if (fault.type === 'invalid') current.validity = 'invalid';
          else if (fault.type === 'stale') current.validity = 'stale';
        }
        current.timestampMs = applicable.some(f => f.type === 'stale' || f.type === 'freeze') ? current.timestampMs : now;
        const latency = Math.max(0, ...applicable.filter(f => f.type === 'network-latency').map(f => Number(f.value ?? 0)));
        if (latency) {
          delayed.push({releaseMs: now + latency, data: current}); statistics.delayed++;
        } else await this.#publish(current, trace, statistics, now);
      }

      for (let index = delayed.length - 1; index >= 0; --index) {
        if (delayed[index].releaseMs <= now) {
          const [item] = delayed.splice(index, 1);
          await this.#publish(item.data, trace, statistics, now);
        }
      }
      clock.advance(scenario.tickMs);
    }

    const assertions = scenario.assertions.map(item => evaluateAssertion(item, state, scenario.durationMs));
    const result = assertions.every(item => item.passed) ? 'passed' : 'failed';
    return {runId: randomUUID(), scenario: scenario.name, seed: scenario.seed, result, statistics, assertions, trace, finalState: Object.fromEntries(state)};
  }

  async #publish(data, trace, statistics, now) {
    const record = {timeMs: now, kind: 'signal', ...clone(data)};
    trace.push(record); statistics.published++;
    for (const sink of this.#sinks) await sink.publish(clone(data));
  }
}

function sample(id, value, timestampMs, validity, source) {
  return {id, value, timestampMs, validity, source, quality: validity === 'valid' ? 1 : 0};
}

export function validateScenario(input, catalog) {
  if (!input || typeof input !== 'object' || !input.name) throw new TypeError('scenario name required');
  const scenario = clone(input);
  scenario.seed ??= 1; scenario.tickMs ??= 100; scenario.durationMs ??= 1000;
  scenario.initialState ??= {}; scenario.events ??= []; scenario.faults ??= []; scenario.assertions ??= [];
  if (!Number.isInteger(scenario.seed)) throw new TypeError('seed must be integer');
  if (!Number.isInteger(scenario.tickMs) || scenario.tickMs < 1 || scenario.tickMs > 60_000) throw new RangeError('tickMs out of range');
  if (!Number.isInteger(scenario.durationMs) || scenario.durationMs < 0 || scenario.durationMs > MAX_DURATION_MS) throw new RangeError('durationMs out of range');
  if (scenario.events.length > MAX_EVENTS) throw new RangeError('too many events');
  for (const [id, value] of Object.entries(scenario.initialState)) {
    const result = catalog.validate(id, value);
    if (!result.ok) throw new Error(`invalid initial signal ${id}: ${result.reason}`);
  }
  for (const assertion of scenario.assertions) {
    if (!assertion.id || !assertion.signal) throw new TypeError('assertion id and signal required');
  }
  return scenario;
}
