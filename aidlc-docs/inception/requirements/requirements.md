# Requirements

## Intent Analysis

| Field | Assessment |
|-------|------------|
| **User Request** | Examine the current state of the brownfield project using AI-DLC; establish living documentation for ongoing development |
| **Request Type** | Analysis / documentation baseline (no immediate implementation) |
| **Scope Estimate** | Not applicable for current engagement — examination and documentation only |
| **Complexity Estimate** | Trivial (for current phase); future work TBD across multiple subsystems |
| **Requirements Depth** | Minimal |

## Business Context

### Goals
- Establish a **living documentation foundation** via AI-DLC artifacts that supports future development across multiple sessions
- Complete brownfield reverse engineering baseline (done)
- Maintain artifacts in `aidlc-docs/` as the authoritative planning record going forward

### Constraints
- No implementation scope defined for the current engagement
- All subsystems remain on the table for future work; no priority ranking yet
- User Stories stage deferred — revisit when a specific implementation scope emerges

### Success Criteria
- [x] Reverse engineering artifacts complete and approved
- [x] Requirements captured with identified future focus areas
- [ ] Workflow execution plan created (next stage)
- [ ] Living `aidlc-docs/` foundation maintained and updated as work progresses

## Functional Requirements

### FR-1: Brownfield Baseline Documentation (Complete)
The system shall have comprehensive reverse engineering documentation covering business overview, architecture, code structure, APIs, components, technology stack, dependencies, and code quality.

**Status**: Complete — see `aidlc-docs/inception/reverse-engineering/`

### FR-2: Living Documentation Foundation
AI-DLC artifacts shall be maintained in `aidlc-docs/` and updated as future work is scoped and executed across sessions.

**Status**: In progress — state tracking and audit log established

### FR-3: Future Work Backlog (Identified, Not Scoped)
The following areas have been identified as future improvement targets but are **out of scope** for the current engagement:

| Area | Description | Source |
|------|-------------|--------|
| **CLI improvements** | Enhance the `blog` CLI developer experience | User Q4 |
| **Deployment automation** | Improve and automate the deployment process | User Q4 |
| **GitHub issue triage** | Triage and resolve all open GitHub issues | User Q4 |

### FR-4: Open GitHub Issues (Reference Backlog)

Seven open issues represent concrete future work candidates:

| # | Title | Relevant Area |
|---|-------|---------------|
| [#71](https://github.com/micahwalter/micahwalter-www/issues/71) | Web-based photo upload with backend resize + EXIF and homepage featuring | Static site, CLI, infra |
| [#68](https://github.com/micahwalter/micahwalter-www/issues/68) | Developer preview for any branch | CI/CD, infra |
| [#59](https://github.com/micahwalter/micahwalter-www/issues/59) | Git-based commenting | Static site, infra |
| [#52](https://github.com/micahwalter/micahwalter-www/issues/52) | Color browsing | Static site, content |
| [#15](https://github.com/micahwalter/micahwalter-www/issues/15) | Missing S3 server access logs | Infrastructure |
| [#10](https://github.com/micahwalter/micahwalter-www/issues/10) | Featured post mode on homepage | Static site |
| [#8](https://github.com/micahwalter/micahwalter-www/issues/8) | CloudWatch dashboards for CloudFront and S3 | Infrastructure, observability |

These issues shall be considered during future Workflow Planning when implementation scope is defined.

## Non-Functional Requirements

### NFR-1: Documentation Maintainability
AI-DLC artifacts shall remain in `aidlc-docs/` only; application code stays in workspace root.

### NFR-2: Workflow Adaptability
Future engagements shall adapt AI-DLC stage depth and inclusion based on the specific change being implemented (per adaptive workflow principles).

### NFR-3: Extension Configuration
The following extensions are **disabled** for this project:

| Extension | Enabled | Rationale |
|-----------|---------|-----------|
| Security Baseline | No | User opted out — living documentation phase, not production hardening |
| Resiliency Baseline | No | User opted out — documentation phase |
| Property-Based Testing | No | User opted out — no test implementation planned |

## Out of Scope (Current Engagement)

- Code changes or deployments
- User Stories generation (deferred — revisit when scope emerges)
- Application Design, Units Generation, or Construction phases
- Security, resiliency, or PBT extension enforcement
- Prioritization among future work areas (CLI, deployment, issues)

## Assumptions

1. The brownfield reverse engineering artifacts accurately reflect the current codebase on `main`
2. Future implementation work will re-enter AI-DLC at Requirements Analysis or Workflow Planning with a defined scope
3. Open GitHub issues remain valid backlog items until triaged and closed
4. The `blog` CLI and GitHub Actions deploy pipeline are the primary targets for future automation improvements

## Traceability

| Requirement | Source |
|-------------|--------|
| FR-1 | Original user request + reverse engineering stage |
| FR-2 | Q1 (D), Q10 (D) |
| FR-3 | Q4 (custom answer) |
| FR-4 | Q4 + GitHub issue list |
| NFR-3 | Q6 (B), Q7 (B), Q8 (C) |
