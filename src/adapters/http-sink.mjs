export class HttpSignalSink {
  constructor({url, token, timeoutMs = 1000, fetchImpl = fetch}) {
    this.url = new URL(url); this.token = token; this.timeoutMs = timeoutMs; this.fetchImpl = fetchImpl;
    if (!['http:', 'https:'].includes(this.url.protocol)) throw new TypeError('HTTP(S) URL required');
  }
  async publish(sample) {
    const response = await this.fetchImpl(this.url, {
      method: 'POST', signal: AbortSignal.timeout(this.timeoutMs),
      headers: {'content-type': 'application/json', ...(this.token ? {authorization: `Bearer ${this.token}`} : {})},
      body: JSON.stringify({schemaVersion: '1.0', type: 'vehicle-signal', sample})
    });
    if (!response.ok) throw new Error(`signal sink returned ${response.status}`);
  }
}
