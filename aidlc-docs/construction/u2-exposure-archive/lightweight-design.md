# U2 Lightweight Design — Exposure Archive API + Site

**Unit**: U2  
**Issue**: #127

## Scope

Public Exposure archive: DynamoDB table, `api.micahwalter.com/exposures` read API, site `/exposures` + `/exposures/[n]`. Create helper for U3 (no schedule/counter in U2).

## Data (Exposures table)

| Field | Type | Notes |
|-------|------|-------|
| `issueNumber` | string (PK) | `"1"`, `"2"`, … |
| `gsi1pk` | string | `EXPOSURE` |
| `gsi1sk` | string | `{sentAt}#{issueNumber}` newest-first via Query ScanIndexForward=false |
| `photoId` | string | |
| `title` | string | |
| `caption` | string | optional |
| `folderName` | string | for CoverImage |
| `coverImageKey` | string | |
| `sentAt` | string | ISO |
| `createdAt` | string | ISO |

## API (`ExposuresApi` + mapping key `exposures`)

| Route | Auth | Behavior |
|-------|------|----------|
| `GET /` | Public | List newest-first (limit/cursor) |
| `GET /{n}` | Public | Detail by issue number |

Same Lambda zip; handler `src/exposures-api.handler`. CORS like photos.

## Site

- `/exposures` — listing client grid
- `/exposures/[n]` — detail shell + client fetch (static export placeholder like photos)
- `lib/exposures-api.ts` — base URL derived from photo API `/photos` → `/exposures`

## Out of U2

Counter, EventBridge, eligibility UI, production send
