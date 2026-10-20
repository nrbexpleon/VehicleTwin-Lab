export class MemorySink {
  records = [];
  async publish(sample) { this.records.push(structuredClone(sample)); }
}
