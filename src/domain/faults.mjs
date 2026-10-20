const supported = new Set(['freeze', 'drop', 'offset', 'noise', 'invalid', 'stale', 'ecu-restart', 'network-latency']);

export function validateFault(fault) {
  if (!fault?.id || !supported.has(fault.type)) throw new TypeError('fault id and supported type required');
  if (!Number.isInteger(fault.atMs) || fault.atMs < 0) throw new RangeError('fault atMs must be non-negative');
  if (fault.durationMs != null && (!Number.isInteger(fault.durationMs) || fault.durationMs < 0)) throw new RangeError('fault duration invalid');
  return Object.freeze({...fault});
}

export function isFaultActive(fault, now) {
  return now >= fault.atMs && (fault.durationMs == null || now < fault.atMs + fault.durationMs);
}

export function applySignalFault(value, fault, random) {
  switch (fault.type) {
    case 'offset': return value + Number(fault.value ?? 0);
    case 'noise': return value + random.between(-Math.abs(Number(fault.value ?? 1)), Math.abs(Number(fault.value ?? 1)));
    case 'invalid': return value;
    default: return value;
  }
}
