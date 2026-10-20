# Architecture and contracts

## Layers

1. **Domain:** signal catalogue, virtual time, deterministic PRNG, scenarios, faults, assertions, evidence.
2. **Application:** scenario execution and run retention.
3. **Adapters:** memory sink, bounded HTTP sink, REST API, browser console.
4. **External systems:** SmartVehicle, HIL, CAN, data lake, evidence repository—only through adapters.

## Determinism

A run is reproducible when scenario content, catalogue, seed, tick interval, and engine version are unchanged. Run IDs and evidence generation timestamps are intentionally unique and are excluded when comparing deterministic traces.

## Fault semantics

- `drop`: suppress matching publication.
- `freeze`: hold the first active value and timestamp.
- `offset`: add a numeric bias.
- `noise`: add seeded uniform numeric noise.
- `invalid`: publish with invalid validity.
- `stale`: preserve acquisition timestamp and mark stale.
- `ecu-restart`: clear simulated ECU state.
- `network-latency`: queue matching samples until virtual release time.

## Evidence

Evidence includes the scenario identity, seed, outcome, statistics, assertions, and trace. SHA-256 detects accidental or malicious post-generation modification. It is not a digital signature; production provenance requires signing through an approved key-management system.
