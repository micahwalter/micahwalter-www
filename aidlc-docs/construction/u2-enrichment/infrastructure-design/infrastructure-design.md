# U2 — Infrastructure Design

**Stack**: Extend `micahwalter-photo-upload` (`infra/photo-upload.yml` + `infra/photo-upload-lambdas/`)  
**Region**: us-east-1  
**Decisions**: Infra plan Q1–Q8 = A

---

## Logical → AWS mapping

| Logical component | AWS / impl |
|-------------------|------------|
| EnrichmentWorker | New Lambda `photo-upload-enrich` — handler `src/enrich.handler`, **60s / 1024 MB**, same zip |
| PhotoStore | Existing DynamoDB `micahwalter-photos` (UpdateItem enrichment fields) |
| ImageObjectReader | S3 GetObject on `micahwalter-www-images` |
| GpsExtractor | In-process EXIF GPS parse from original bytes |
| PlaceReverseGeocoder | AWS Location **Place Index** `micahwalter-photos-place-index` (Esri) + SearchPlaceIndexForPosition (or equivalent reverse) |
| BedrockTagger | Bedrock Runtime Converse — model `us.anthropic.claude-sonnet-4-6` |
| TagMerger | In-process helper |
| PublicDtoProjector | Extend `src/lib/photo-dto.js` (`city`, `country`, public coords) |
| EventBridgeArchive | Archive on `photo-bus`, **14-day** retention |

---

## EventBridge

| Resource | Spec |
|----------|------|
| Bus | Existing `photo-bus` |
| Rule | Name e.g. `photo-pending-enrichment` |
| Event pattern | `source`: `micahwalter.photos`, `detail-type`: `PhotoPendingEnrichment` |
| Target | Enrichment Lambda (async) |
| Detail | `{ "photoId": "<id>" }` (U1 emit unchanged) |
| Archive | `photo-bus-archive` (or similar), retention **14 days**, event source = `photo-bus` |

No enricher SQS queue/DLQ in U2 (replay via archive).

---

## Enrichment Lambda

| Property | Value |
|----------|-------|
| FunctionName | `photo-upload-enrich` |
| Runtime | nodejs20.x arm64 |
| Handler | `src/enrich.handler` |
| Timeout | 60 |
| Memory | 1024 |
| Code | Same `photo-upload.zip` |
| Env | `PHOTOS_TABLE`, `IMAGES_BUCKET`, `PLACE_INDEX_NAME`, `BEDROCK_MODEL_ID` (default `us.anthropic.claude-sonnet-4-6`) |

### IAM (EnrichFnRole)

- `dynamodb:GetItem`, `UpdateItem` on `micahwalter-photos` (+ index if needed)  
- `s3:GetObject` on `arn:aws:s3:::micahwalter-www-images/images/*`  
- `bedrock:InvokeModel` / Converse on the Sonnet inference profile / model ARN in us-east-1  
- `geo:SearchPlaceIndexForPosition` (and describe if required) on the Place Index  
- Basic Lambda execution logs  

### Image keys for Bedrock

Resolve in order under `images/posts/{folderName}/`:

1. `photo-1200.jpg`  
2. `photo-1200.webp`  
3. Fall back to basename of `coverImageKey` / related optimize names  

GPS uses `originalKey` (or `images/originals/posts/{folder}/photo.*`).

---

## AWS Location Place Index

| Property | Value |
|----------|-------|
| Name | `micahwalter-photos-place-index` |
| DataSource | **Esri** |
| IntendedUse | SingleUse (or Storage if required by reverse-geocode pattern — prefer SingleUse for on-demand enrichment) |

Created in this CloudFormation stack.

---

## Bedrock prerequisite (ops)

- Operator enables model access for **`us.anthropic.claude-sonnet-4-6`** (inference profile) in **us-east-1** before expecting AI tags.  
- Not managed by CloudFormation.  
- If invoke fails → soft-fail per FD; log clearly.

---

## Public API / DTO (no new routes)

Extend existing photos-api PublicPhotoDTO:

- `city`, `country`  
- `publicLatitude`, `publicLongitude` when set  
- `tags`, `enrichmentStatus` as today  

---

## CI IAM (`GitHubActionsDeployPhotoUpload`)

Add permissions to manage:

- Lambda `photo-upload-enrich` (+ EventInvokeConfig if any)  
- IAM role `photo-upload-enrich-fn-role`  
- EventBridge **rule + targets** on `photo-bus`  
- EventBridge **archive** on `photo-bus`  
- Location Place Index create/update/delete/tag  

Bedrock invoke is runtime-only (enricher role), not required for CI deploy principal beyond Lambda/IAM/EventBridge/Location resources.

**Ops note**: Redeploy `micahwalter-www-github-actions` after policy update (manual, as with U1).

---

## Explicitly out of U2 infra

| Item | Notes |
|------|-------|
| Enricher SQS DLQ | Archive/replay instead |
| Multi-region | U7 |
| New API routes | None |
| Separate Lambda zip | Same artifact |

---

## Rollback

- Remove/disable EventBridge rule target or redeploy previous template/zip.  
- Place Index and archive can remain (low cost) or be retained for history.  
- DynamoDB enrichment fields remain on items (safe).  
