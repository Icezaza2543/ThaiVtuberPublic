# VThaiDex production provisioning runbook

VThaiDex keeps ThaiVtuber_DATA credentials off Vercel. Contributions go through an owner-managed
Google Form (owner decision 2026-10-05), so there is no intake endpoint, encryption key or key ceremony.

## Vercel project

- Project: `vthaidex`
- Project ID: `prj_sgmNjter1gl73Tl4m6mYQS4W6tm2`
- Team ID: `team_GCgIZE785geT2r3j1QlBitEJ`

## 1. Private Blob store (done 2026-10-05)

`vthaidex-private`, access **private**, region `sin1`, connected to Production and Preview; Vercel injects
`BLOB_READ_WRITE_TOKEN`. It holds only versioned sanitized snapshots and the `snapshots/current.json`
pointer. Never create a public Blob store for these objects.

## 2. Application secrets (done 2026-10-05)

```text
VTHAIDEX_PUBLISH_SECRET   >= 48 random bytes, base64url
VTHAIDEX_CURSOR_SECRET    exactly 32 random bytes, base64url
```

Targets: Production and Preview, marked sensitive. Generate them with a script that pipes values straight
into `vercel env add` and never prints them; any value that appears in a terminal transcript, chat/tool
log or screenshot is burned and must be regenerated.

## 3. Operator machine only

```text
VTHAIDEX_URL=https://vthaidex.vercel.app
VTHAIDEX_PUBLISH_SECRET=<same value as Vercel>
GOOGLE_APPLICATION_CREDENTIALS=<local canonical read credential>
```

The operator copy lives in `%LOCALAPPDATA%\ThaiVtuberSNA\vthaidex-operator.env` (outside every repo).
Never upload `GOOGLE_APPLICATION_CREDENTIALS` or the ThaiVtuber_DATA service-account JSON to Vercel.

## 4. Canonical snapshot gate

Before production cutover:

1. publish a sanitized canonical snapshot to preview/private storage;
2. verify `/api/stats`;
3. verify `/api/creators?limit=24`;
4. verify invalid/tampered cursors fail;
5. verify an older snapshot is rejected;
6. verify a schema-invalid snapshot leaves the current pointer unchanged;
7. recursively inspect public creator responses for forbidden internal keys.

## 5. Contribution form

`/contribute` links to the owner's Google Form (`#contributeFormLink` in `contribute.html`). The form
collects public creator facts only, does not collect email addresses, and is reviewed by the owner, who
applies accepted rows through the ThaiVtuberSNA review scripts.

## 6. Firewall rollout

Start log-only: observe `GET /api/creators` enumeration and unexpected `/api/internal/*` access. Test
challenge/rate-limit in Preview before changing Production. Publishing firewall rules is owner-controlled.

## 7. Rollback

If the private-backed API fails after cutover, roll back to the previous known-good deployment. Do not
restore full public creator JSON as a quick fix; keep the last valid private snapshot for diagnosis.
