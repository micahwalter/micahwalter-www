# U3 — Business Rules (light)

| ID | Rule |
|----|------|
| BR-U3-01 | Passcode unlock required before file selection/upload (existing auth). |
| BR-U3-02 | Selection accepts at most **20** JPEG/PNG files; over-cap rejected with message. |
| BR-U3-03 | Non JPEG/PNG rejected in the UI before calling upload-url. |
| BR-U3-04 | Each file has its own title, caption, featured; no batch defaults across files. |
| BR-U3-05 | Title pre-fills from filename (strip extension); user may edit before upload. |
| BR-U3-06 | Uploads run with concurrency **3**; each file shows independent progress/status. |
| BR-U3-07 | On 401 from upload-url → clear token, return to locked, prompt re-auth. |
| BR-U3-08 | Success marks that row `done`; stay on form; allow more uploads / clear done. |
| BR-U3-09 | U3 does not wait for enrichment or site deploy; photo appears via API after process. |
| BR-U3-10 | `/upload` page in U3 is **upload-focused** — no Edit/Galleries hub sections yet. |
