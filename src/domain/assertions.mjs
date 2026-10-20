export function evaluateAssertion(assertion, state, nowMs) {
  const sample = state.get(assertion.signal);
  if (!sample) return result(assertion, false, 'signal unavailable', nowMs);
  let passed = false;
  switch (assertion.operator) {
    case 'eq': passed = sample.value === assertion.expected; break;
    case 'ne': passed = sample.value !== assertion.expected; break;
    case 'gt': passed = sample.value > assertion.expected; break;
    case 'gte': passed = sample.value >= assertion.expected; break;
    case 'lt': passed = sample.value < assertion.expected; break;
    case 'lte': passed = sample.value <= assertion.expected; break;
    case 'valid': passed = sample.validity === 'valid'; break;
    case 'fresh': passed = nowMs - sample.timestampMs <= assertion.maxAgeMs; break;
    default: return result(assertion, false, 'unsupported operator', nowMs);
  }
  return result(assertion, passed, passed ? 'satisfied' : `actual=${JSON.stringify(sample.value)} validity=${sample.validity}`, nowMs);
}
function result(assertion, passed, detail, nowMs) {
  return {id: assertion.id, signal: assertion.signal, passed, detail, evaluatedAtMs: nowMs};
}
