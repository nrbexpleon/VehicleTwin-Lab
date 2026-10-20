# VehicleTwin Lab

A deterministic vehicle digital twin and fault-injection laboratory for advanced automotive software validation. It simulates typed vehicle signals on a virtual clock, injects reproducible failures, evaluates engineering assertions, captures traces, and produces integrity-protected evidence.

> All values are simulation data. Physical actuation is not implemented. This tool supports engineering validation; it does not provide certification.

## What works

- OEM-neutral, VSS-mappable typed signal catalogue with units and valid ranges
- deterministic virtual clock and seeded pseudo-random noise
- time-indexed signal scenarios and repeatable replay
- fault injection: drop, freeze, offset, noise, invalid, stale, ECU restart, and network latency
- positive, boundary, validity, and freshness assertions
- trace timeline, run statistics, final state, and SHA-256 evidence integrity
- bounded REST API with optional bearer-token access
- HTTP signal sink for SmartVehicle or another isolated test endpoint
- responsive browser engineering console
- 30 dependency-free compiled/runtime tests

## Quick start

Requires Node.js 20 or later.

```bash
npm test
npm run demo
npm start
```

Open <http://127.0.0.1:8080>. For API protection:

```bash
API_TOKEN='replace-with-a-secret-from-your-vault' npm start
curl -H 'Authorization: Bearer replace-with-a-secret-from-your-vault' http://127.0.0.1:8080/api/catalog
```

Never commit the token.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Runtime health and version |
| GET | `/api/catalog` | Signal definitions |
| GET | `/api/scenarios/example` | Runnable example |
| POST | `/api/runs` | Validate and run a scenario |
| GET | `/api/runs/{id}` | Full trace and results |
| GET | `/api/runs/{id}/evidence` | Integrity-protected evidence |
| POST | `/api/evidence/verify` | Detect evidence tampering |

Request bodies are limited to 1,000,000 bytes. Duration is limited to 3,600,000 ms and scenarios to 10,000 events.

## Architecture

```mermaid
flowchart LR
  S[Scenario JSON] --> V[Validator]
  C[Signal Catalog] --> V
  V --> E[Deterministic Twin Engine]
  K[Virtual Clock + Seeded PRNG] --> E
  F[Fault Injectors] --> E
  E --> T[Trace + Final State]
  E --> A[Assertions]
  E --> H[HTTP / Memory sinks]
  T --> P[SHA-256 Evidence Pack]
  A --> P
  H -. optional .-> SV[SmartVehicle signal endpoint]
```

The domain engine has no network, UI, database, or vehicle-hardware dependency. Adapters can be replaced without changing scenario semantics.

## Scenario model

```json
{
  "name": "example",
  "seed": 42,
  "durationMs": 5000,
  "tickMs": 500,
  "initialState": {"Vehicle.Speed": 0},
  "events": [{"id":"accelerate","atMs":500,"signal":"Vehicle.Speed","value":45}],
  "faults": [{"id":"speed-drop","type":"drop","signal":"Vehicle.Speed","atMs":2000,"durationMs":500}],
  "assertions": [{"id":"bounded","signal":"Vehicle.Speed","operator":"lte","expected":60}]
}
```

## Integration roadmap

The next target adapters are a SmartVehicle-native sink, SocketCAN/vcan bridge, PCAP import, VSS catalogue import, OpenSCENARIO event mapping, distributed simulation coordination, persistent run storage, signed evidence, HIL execution, and role-based multi-tenant access. These are not claimed as implemented.

## Security and safety

See [SECURITY.md](SECURITY.md) and the [threat model](docs/threat-model.md). The default server binds only to loopback, emits restrictive browser headers, bounds resources, validates signal types/ranges, and supports bearer authentication. It must remain isolated from physical actuator networks unless separately safety-reviewed.

## License

Proprietary source-available commercial license. Production, commercial, customer, vehicle, embedded-system, or field use requires a separate written agreement. See [LICENSE](LICENSE) or contact `nagaraj.rbhagwat@expleogroup.com` or an authorized Expleo Group representative. Earlier versions validly released under prior terms retain those grants.
