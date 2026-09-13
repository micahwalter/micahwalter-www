# Issue #153 — Requirements

**Issue**: [#153](https://github.com/micahwalter/micahwalter-www/issues/153) — Investigate sparse AI-generated photo tags  
**Related**: #104 (AI tags), #103 (photo cutover), #18 (Bedrock tagging), U2 enrichment  
**Depth**: Standard  
**Status**: Ready for review  
**Decisions**: See clarification answers below

## Intent analysis

| Field | Assessment |
|-------|------------|
| User request | Fix missing AI-generated photo tags (only city + generic `photography` showing) |
| Request type | Bug fix + observability hardening + backfill |
| Scope | `photo-upload-enrich` Lambda / Bedrock tagging; force re-enrich or CLI backfill for sparse ids |
| Complexity | Moderate — soft-fail hides failures; likely ops (model access/IAM) and/or parse/logging gaps |

## Clarification decisions

| Topic | Choice |
|-------|--------|
| Scope of work | Diagnose + fix Bedrock enrich path + backfill sparse ids 171, 174–181 |
| AWS access | User will `aws sso login --profile www` and notify when ready (CloudWatch) |
| Bedrock console | User verifies/enables model access for `us.anthropic.claude-sonnet-4-6` and enrich-role invoke |
| Enrichment status on AI failure | Keep `complete` soft-fail; improve logging/metrics so silent AI loss is obvious |
| Security Baseline | Disabled |
| Resiliency Baseline | Disabled |
| Property-Based Testing | Disabled |

## Problem statement

New uploads that run the enrich pipeline end up with `enrichmentStatus: complete` but tags that are only default `photography` plus reverse-geocoded city/country. Subject / mood / style AI tags from Bedrock vision are missing.

## Evidence (live API, 2026-09-12)

Sparse `complete` examples: ids **171, 174, 175, 176, 177, 178, 180, 181**.

Cover `photo-1200.jpg` exists for sample sparse photo (id 181); enrich soft-fails Bedrock and still marks complete (by design).

## Functional requirements

| ID | Requirement |
|----|-------------|
| FR-1 | New photo uploads that successfully load an optimized cover MUST receive 3–8 Bedrock vision tags merged into `tags` when Bedrock is available and reachable. |
| FR-2 | When Bedrock fails or returns no parseable tags, logs MUST include `photoId`, error and/or raw response snippet, parse/tag counts, and `bedrockOk: false`. |
| FR-3 | Geo tagging MUST continue to work independently of Bedrock outcome. |
| FR-4 | After the Bedrock path is fixed, backfill sparse complete photos **171, 174–181** (force re-enrich and/or `blog photos:tag`). |
| FR-5 | Keep `enrichmentStatus: complete` on Bedrock soft-fail (no new status enum); make AI failure visible via richer logs (and lightweight metrics if cheap). |

## Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Do not block photo publish on Bedrock (retain soft-fail availability). |
| NFR-2 | Prefer fixing root invoke/parse failure over logging-only changes. |
| NFR-3 | Keep model alignment with CLI (`us.anthropic.claude-sonnet-4-6` / Converse) unless ops requires a documented fallback. |
| NFR-4 | CloudWatch diagnosis is in-scope once SSO is available in this environment. |

## Out of scope

- Full-catalog retag beyond the listed sparse ids
- Public tag UI / PhotoCard `slice(0,4)` changes
- Fixing `coverImageKey` → missing `photo.jpeg` (separate cleanup; display uses sized variants)

## Success criteria

- [ ] CloudWatch confirms Bedrock success (`bedrockOk: true`) on a new test upload (or root cause + fix verified)
- [ ] Test upload shows non-geo AI tags via `GET https://api.micahwalter.com/photos/{id}`
- [ ] Sparse ids 171, 174–181 backfilled with AI tags
- [ ] Logging makes `bedrockOk: false` / empty parse cases obvious without changing status semantics
- [ ] #153 closable with root cause noted

## Extension compliance (this stage)

| Extension | Status | Rationale |
|-----------|--------|-----------|
| Security Baseline | N/A (disabled) | User opted out |
| Resiliency Baseline | N/A (disabled) | User opted out |
| Property-Based Testing | N/A (disabled) | User opted out |
