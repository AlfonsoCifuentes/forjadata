# Forjadata — case study

## Context and problem

Creating an enterprise material combines heterogeneous documents, forms, human judgement and
a strict target system. The risk is not only lead time: duplicate records, lost provenance and
invalid synchronizations degrade master data.

## Users and solution

Forjadata serves requesters, Data Stewards, SAP specialists, analysts, UAT testers and admins.
It guides a request from source document to approved material: extraction and normalization,
evidence-backed suggestions, duplicate detection, human review, an authorized state machine
and a validated SAP synchronization.

## Key decisions

- Vue 3 SPA, Composition API, strict TypeScript and lazy routes.
- A modular monolith on Azure Functions to keep cohesion and operating cost low.
- Versioned REST/OpenAPI with shared Zod contracts.
- Pinia only for cross-cutting client state.
- AG Grid Community, avoiding a commercial runtime dependency.
- Ports and adapters shared by demo, local and Azure modes.
- Clearly labelled deterministic mocks; configuration is never reported as a successful real
  connection.
- Polling for the first delivery because jobs are short and the operational surface is smaller.

## Architecture and experience

The SPA calls a v1 API whose use cases depend on ports for PostgreSQL, Blob, Service Bus,
Document Intelligence, Azure OpenAI, SAP, email and telemetry. Bicep/AZD provides managed
identity and RBAC. Vercel hosts a credential-free standalone demo.

The responsive shell supports light/dark themes, Spanish/English, keyboard operation and
explicit loading, empty, error and permission states. AG Grid handles the catalogue while
ECharts and Three.js are lazy-loaded; the 3D viewer includes an accessible 2D fallback.

## Reliability, AI and SAP

Requests carry correlation IDs and normalized errors. Jobs are idempotent, time-bounded and
retryable. AI output must pass JSON Schema and Zod validation, retain evidence and undergo
deterministic rules plus human review. The SAP simulator and OData v2/v4 adapter implement the
same contract.

## Quality and synthetic results

Vitest, contract tests, MSW, Playwright, axe, visual snapshots, Lighthouse, Functions Core
Tools, OpenAPI, Bicep validation, dependency audit and CodeQL form the quality chain. Domain
line coverage is above 80%.

In a synthetic scenario, the demo engine uses 40 materials and 8 requests, while the extended
PostgreSQL seed contains 250 materials. It completes creation, review, duplicate resolution,
approval and SAP Simulator synchronization without external services. These figures
demonstrate behavior, not real business impact.

## Security, limitations and learning

Backend RBAC, optimistic concurrency, log redaction, managed identity, escaped HTML, upload
limits and append-only audit reduce risk. No real SAP endpoint is available or claimed as
tested; cloud email remains disabled and the public demo persists per browser.

For production I would add load testing, backup/restore drills, private networking, formal
SLOs and model evaluation on authorized representative data. The main lesson is that AI and
cloud create value only when governed by contracts, evidence, permissions and observable
operations.
