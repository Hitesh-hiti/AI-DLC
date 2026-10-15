# Docker Security Execution Layer

This layer provides the container execution foundation for the AI-DLC security orchestrator.

## Components

- `DockerRunner` — executes security tools through Docker.
- `LocalRunner` — optional local CLI execution.
- `NucleiScanner` — DAST/web scanning.
- `SemgrepScanner` — SAST.
- `TrivyScanner` — SCA/IaC/filesystem scanning.
- `TruffleHogScanner` — secret detection.
- `docker-compose.security.yml` — shared scanner network.
- `Dockerfile` — optional container for the Node.js orchestrator.

## Important

The scanner adapters are intentionally separated from Playwright tests.

Tests call the orchestrator; the orchestrator calls scanner adapters; scanner adapters call runners.

Production image versions should be pinned instead of using `latest`.

## Next layer

The next implementation layer should add:

1. `SecurityFinding` normalization.
2. Scanner-specific parsers.
3. `SecurityOrchestrator`.
4. Deterministic policy enforcement.
5. DefectDojo reporting.
