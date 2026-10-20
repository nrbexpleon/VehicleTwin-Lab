import test from 'node:test';
import assert from 'node:assert/strict';
import {SignalCatalog} from '../src/domain/catalog.mjs';
import {TwinEngine} from '../src/domain/engine.mjs';

const catalog = new SignalCatalog([{id: 'Speed', type: 'number', min: 0, max: 300}]);
const base = {name: 'restart', seed: 1, durationMs: 300, tickMs: 100, initialState: {Speed: 10}, events: [], assertions: []};

test('ECU restart is edge-triggered once per fault activation', async () => {
  const run = await new TwinEngine({catalog}).run({...base, faults: [{id: 'restart-1', type: 'ecu-restart', signal: '*', atMs: 100, durationMs: 200}]});
  assert.equal(run.statistics.restarts, 1);
  assert.equal(run.trace.filter(item => item.kind === 'ecu-restart').length, 1);
});

test('invalid signal is published with zero quality', async () => {
  const run = await new TwinEngine({catalog}).run({...base, durationMs: 0, faults: [{id: 'invalid-1', type: 'invalid', signal: 'Speed', atMs: 0}]});
  const sample = run.trace.find(item => item.kind === 'signal');
  assert.equal(sample.validity, 'invalid');
  assert.equal(sample.quality, 0);
});
