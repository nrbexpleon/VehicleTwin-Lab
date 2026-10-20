import {createHash} from 'node:crypto';

export function createEvidence(run) {
  const body = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    runId: run.runId,
    scenario: run.scenario,
    seed: run.seed,
    result: run.result,
    statistics: run.statistics,
    assertions: run.assertions,
    trace: run.trace
  };
  const canonical = JSON.stringify(body);
  return {...body, integrity: {algorithm: 'sha256', digest: createHash('sha256').update(canonical).digest('hex')}};
}

export function verifyEvidence(evidence) {
  const {integrity, ...body} = evidence;
  return integrity?.algorithm === 'sha256' && createHash('sha256').update(JSON.stringify(body)).digest('hex') === integrity.digest;
}
