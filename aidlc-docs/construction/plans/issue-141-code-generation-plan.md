# Code Generation Plan — Issue #141 U1 Exposure queue admin

- [x] Add `isExposureQueueRoute` helper + unit tests
- [x] Handle `GET /exposure-queue` in `photos-api.js` (auth, `listExposureCandidates`, public DTOs)
- [x] Reserve `exposure-queue` so `GET /{id}` cannot claim it
- [x] Add API Gateway route on primary and secondary templates; primary stage `DependsOn`
- [x] Add `getExposureQueue` in `lib/photos-api.ts`
- [x] Add `ExposuresAdminPanel` and Exposures tab in `UploadHub`
- [x] Run Lambda unit tests and `npm run build`
