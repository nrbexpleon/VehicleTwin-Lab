# Threat model

## Assets

Scenario intellectual property, signal catalogues, run traces, fault campaigns, evidence, API credentials, and external-system endpoints.

## Trust boundaries

Browser/API, API/domain engine, scenario/catalogue input, external HTTP sink, evidence export, and any future vehicle/HIL interface.

## Threats and controls

| Threat | Current control | Remaining production work |
|---|---|---|
| Malformed or oversized scenario | JSON parsing, type/range checks, 1,000,000-byte body, duration/event bounds | JSON Schema and fuzzing |
| Unauthorized API use | Optional bearer token, loopback bind | OIDC, roles, tenant isolation |
| Script injection | Text escaping, CSP, no inline scripts | Automated browser security tests |
| SSRF through sink | Explicit HTTP(S) URL and injected adapter | Endpoint allow-list, egress policy, vault |
| Evidence tampering | SHA-256 integrity verification | Digital signature, timestamp authority, immutable store |
| Resource exhaustion | bounded runs/events/body/duration | rate limiting, worker quotas, durable queues |
| Unsafe physical command | no actuator adapter | independent safety gateway and review |
| Sensitive trace disclosure | local-only default | encryption, retention, redaction, access audit |

Do not use production vehicle data, credentials, or client information in public scenarios.
