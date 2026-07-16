# Services — Issues #103 / #104

Service layer = orchestration across components (HTTP Lambdas, pipelines, jobs, UI).

---

## Photo Metadata API Service (extended `micahwalter-photo-upload`)

**Stack**: Existing photo-upload CloudFormation + new routes/Lambdas (Node.js)  
**Base path**: `https://api.micahwalter.com/photos`

### Responsibilities
- Auth (existing passcode → token) shared by upload, edit, gallery admin
- Presigned upload init (extended metadata: title, caption, featured per file)
- Public read APIs (query)
- Authenticated write APIs (command)
- Gallery admin + public gallery APIs
- Own DynamoDB tables (photos, galleries) in this stack
- IAM for DynamoDB, Bedrock, AWS Location (enricher), S3

### Orchestration
```text
Browser AdminUI --auth--> Auth Lambda
Browser AdminUI --init--> Init Lambda --> S3 presign (title, caption, featured metadata)
Browser --> S3 PUT
S3 event --> Process Lambda --> optimize --> tickets --> PhotoRepository.put (pending)
                      --> enqueue Enrichment
Enrichment Lambda --> EnrichmentService --> PhotoRepository.update
Browser PublicUI --> PhotoQueryService / GalleryQueryService
Browser AdminUI --> PhotoCommandService / GalleryAdminService
```

---

## Upload & Process Service

**Components**: UploadProcessPipeline, PhotoRepository, tickets client, image optimize  
**Trigger**: S3 ObjectCreated on uploads bucket  

**Flow**
1. Read object + S3 metadata (title, caption, featured)
2. Optimize → images bucket
3. Allocate id via tickets API
4. Persist photo (enrichmentStatus=`pending`)
5. Enqueue enrichment message
6. Never GitHub-commit markdown

---

## Enrichment Service (async)

**Components**: EnrichmentService, PhotoRepository, Bedrock, AWS Location  
**Trigger**: SQS (or EventBridge) from process  

**Flow**
1. Load photo + image
2. EXIF/GPS if needed
3. Fuzz public coordinates when GPS present
4. Reverse geocode → merge city/country into tags
5. Bedrock tags → merge
6. Set enrichmentStatus=`complete` or `failed` (photo remains published)

---

## Photo Public Experience Service (Next.js)

**Components**: PhotoPublicUI, `lib/photos-api.ts`, RedirectLayer (edge)  
**Hosting**: Static export shells + client fetch  

**Flow**
- Page load → helpers → PhotoQueryService
- Detail renders caption, tags, EXIF, static map URL from public geo (map provider later)
- Search uses live photo search endpoint

---

## Photo Admin Experience Service (Next.js)

**Components**: PhotoAdminUI, `lib/photos-api.ts`  

**Flow**
- `/upload` hub: unlock → multi-upload | edit list | galleries
- `/photos/[id]`: if owner session present → Edit shortcut → hub editor for id
- All mutations via authenticated APIs

---

## Feed Publisher Service

**Components**: FeedPublisher  
**Trigger**: EventBridge schedule  

**Flow**
1. Query recent/all public photos
2. Update RSS/sitemap artifacts with `/photos/<id>`
3. No full Next.js rebuild

---

## CLI Service

**Components**: PhotosCLI  
**Flow**: Local commands authenticate and call the same APIs as admin UI for import/tag.
