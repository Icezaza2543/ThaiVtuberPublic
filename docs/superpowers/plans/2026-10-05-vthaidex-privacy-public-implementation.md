# VThaiDex Privacy-First Public Migration — Implementation Plan

**Date:** 2026-10-05  
**Design spec:** `docs/superpowers/specs/2026-10-05-vthaidex-privacy-public-architecture-design.md`  
**Public repo:** `Icezaza2543/ThaiVtuberPublic`  
**Operator repo:** `Icezaza2543/ThaiVtuberMaster`  
**Canonical source:** ThaiVtuber_DATA Google Sheet  
**Production project:** Vercel project `vthaidex`

## Objective

Migrate the current static VThaiDex prototype from full public JSON + hash routing + public GitHub-Issue intake to:

- real SEO-friendly public paths;
- legal/license pages;
- private server-side public snapshot storage;
- bounded creator API with opaque cursors;
- direct canonical projection from ThaiVtuber_DATA;
- signed push-only snapshot publishing;
- client-side encrypted private contribution intake;
- local-only ThaiVtuberMaster decryption/review;
- staged bot protection and firewall enforcement;
- no bulk dataset download/export path.

The existing visual language stays recognizable, but the form and navigation are simplified for usability.

---

# 1. Locked implementation choices

These choices are implementation-level decisions derived from the approved design.

### VThaiDex runtime

Keep VThaiDex as a mostly static HTML/CSS/JavaScript site and add Vercel Node.js Functions under `api/`. Do **not** migrate to Next.js in this project.

Reason: the current site is small, already deployed, and does not need a framework rewrite to obtain private storage and API routes.

### Test runner

Use Node's built-in test runner:

```bash
node --test
```

No Jest/Vitest dependency is required.

### Private storage

Use private Vercel Blob behind `lib/storage.js`.

No browser code receives Blob credentials or private Blob URLs.

### Canonical read path

ThaiVtuberMaster operator tooling reads ThaiVtuber_DATA directly through Google Sheets read-only auth.

Canonical spreadsheet ID defaults to the existing ThaiVtuber_DATA ID:

```text
1mScOlcwCt8Ewh2f53_idCv-SYsFwcC9YfdoFeHs17E8
```

Allow override with `VTUBER_DATA_SPREADSHEET_ID`.

Do not consume `ThaiVtuberMaster/web/data/site.json` for VThaiDex publishing.

### Public creator eligibility

For the first canonical projector:

- persona `review_status == verified`;
- persona type is one of `vtuber`, `mixed`, `unknown`, or blank, consistent with the current canonical SNA scope;
- exclude a persona with verified `content_rating=adult` flag;
- include accounts only through verified `ACCOUNT_LINKS` to the eligible persona;
- ignore rejected links;
- preserve only valid `http://` / `https://` canonical URLs;
- current agency comes from a current, non-rejected affiliation linked to a known organization;
- lifecycle status comes from canonical PERSONAS status, normalized to the VThaiDex public lifecycle vocabulary;
- debut year comes from canonical `PERSONAS.debut_date` when parseable.

Do not infer identity from names or handles.

### Cursor design

Use an AES-256-GCM encrypted cursor, not a readable base64 JSON token.

Cursor payload:

```json
{
  "v": 1,
  "snapshot": "snapshot-id",
  "pos": 24,
  "q": "",
  "platform": "",
  "status": "",
  "exp": 1791199999
}
```

The token is encrypted/authenticated with `VTHAIDEX_CURSOR_SECRET` and expires after 15 minutes.

### Publisher authentication

Use HMAC-SHA256 over:

```text
<timestamp>.<sha256(raw-request-body)>
```

Headers:

```text
X-VThaiDex-Timestamp
X-VThaiDex-Signature
```

Reject requests outside a 5-minute clock window.

Also reject a snapshot whose `generated_at` is older than or equal to the current snapshot, preventing simple replay rollback.

### Intake encryption

Use WebCrypto in the browser:

- RSA-OAEP with SHA-256, RSA 3072-bit keypair;
- AES-256-GCM per submission;
- 96-bit random GCM IV;
- envelope metadata used as AES-GCM additional authenticated data.

Private keys are encrypted PKCS#8 PEM files generated on the operator machine only.

### Intake admin authentication

Use a separate `VTHAIDEX_OPERATOR_SECRET` for ThaiVtuberMaster ↔ VThaiDex intake-review endpoints.

Compromise of this secret may expose ciphertext or allow queue tampering, but cannot decrypt intake.

### Retention

- pending: 60 days;
- reviewed: 7 days;
- rejected: 7 days.

Use a daily authenticated maintenance endpoint invoked by Vercel Cron to purge expired encrypted objects.

---

# 2. Target file map

## ThaiVtuberPublic / VThaiDex

Create:

```text
package.json
lib/
  cursor.js
  http.js
  intake.js
  publish-auth.js
  public-schema.js
  storage.js
api/
  stats.js
  creators.js
  intake-token.js
  intake.js
  maintenance.js
  internal/
    publish.js
    intake.js
assets/js/
  common.js
  overview.js
  directory.js
  contribute.js
  intake-crypto.js
keys/
  README.md
tests/
  cursor.test.js
  public-schema.test.js
  publish-auth.test.js
  creators-api.test.js
  intake.test.js
  storage-fake.js
index.html
directory.html
about.html
terms.html
terms-of-use.html
privacy.html
data-license.html
contribute.html
robots.txt
sitemap.xml
styles.css
vercel.json
README.md
```

Remove at cutover:

```text
data/public-summary.json
data/public-creators.json
scripts/publish.ps1   # only if no longer needed after repo creation
legacy GitHub-Issue submission code
CSV-template download code/control
```

The data-free `data/bootstrap-summary.json` may remain only until Phase 4 cutover; remove it after the API fallback UI is verified.

## ThaiVtuberMaster

Create:

```text
src/thaimaster/
  vthaidex_canonical.py
  vthaidex_projection.py
  vthaidex_signing.py
  vthaidex_intake.py
scripts/
  publish_vthaidex.py
  intake.py
  intake_keys.py
tests/
  test_vthaidex_canonical.py
  test_vthaidex_projection.py
  test_vthaidex_signing.py
  test_vthaidex_intake.py
```

Modify:

```text
requirements.txt
.gitignore
README.md
```

The existing `src/thaimaster/public_exporter.py` and `scripts/export_public.py` remain temporarily for migration compatibility, then are deleted in the coordinated cutover task.

---

# 3. Task 1 — Add the VThaiDex server/test skeleton

**Repo:** ThaiVtuberPublic

**Files:**
- Create `package.json`
- Create `lib/http.js`
- Create `tests/public-schema.test.js`
- Create `lib/public-schema.js`

### Red

Write `tests/public-schema.test.js` first.

Tests must assert:

1. a valid snapshot with only allowed public fields passes;
2. creator objects containing `persona_id`, `account_id`, `evidence`, `followers`, `network`, or `finance` fail;
3. invalid URL schemes fail or are normalized out according to the public schema;
4. page limit greater than 24 is rejected/normalized by the request parser;
5. lifecycle value outside the public vocabulary fails.

Run:

```bash
npm test
```

Expected: fail because implementation does not exist.

### Green

Add `package.json`:

- `"type": "module"`;
- `"scripts": {"test":"node --test"}`;
- dependency `@vercel/blob`.

Implement `lib/public-schema.js` using plain JavaScript validation rather than adding a schema library.

Export:

```js
validateSnapshot(value)
sanitizeCreator(value)
parseCreatorQuery(url)
```

Implement `lib/http.js` helpers:

```js
jsonResponse(status, body, extraHeaders = {})
noIndexHeaders()
methodNotAllowed(allowed)
```

### Verify

Run:

```bash
npm install
npm test
```

Commit:

```text
test(api): add VThaiDex public schema boundary
```

---

# 4. Task 2 — Build opaque cursor primitives

**Repo:** ThaiVtuberPublic

**Files:**
- Create `tests/cursor.test.js`
- Create `lib/cursor.js`

### Red

Tests:

- round-trip valid cursor;
- changing one byte fails authentication;
- expired cursor fails;
- cursor for a different snapshot fails;
- query/filter mismatch fails;
- malformed token fails without exposing crypto details.

### Green

Implement:

```js
encodeCursor(state, {secret, now})
decodeCursor(token, expected, {secret, now})
```

Use Node `crypto` AES-256-GCM.

`VTHAIDEX_CURSOR_SECRET` is a 32-byte random value encoded as base64url. Never reuse the publish/operator secrets as the cursor key.

### Verify

```bash
npm test
```

Commit:

```text
feat(api): add authenticated opaque cursors
```

---

# 5. Task 3 — Implement private snapshot storage abstraction

**Repo:** ThaiVtuberPublic

**Files:**
- Create `lib/storage.js`
- Create `tests/storage-fake.js`
- Extend tests for storage contract

Define a storage interface whose consumers do not depend directly on `@vercel/blob`.

Required exports:

```js
writeSnapshot(snapshot)
readCurrentSnapshot()
storeIntake(envelopeRecord)
listIntake(state)
moveIntake(id, fromState, toState)
deleteIntake(id, state)
purgeExpiredIntake(now)
```

Snapshot storage shape:

```text
snapshots/<snapshot-id>.json
snapshots/current.json
```

Intake shape:

```text
intake/pending/<id>.json
intake/reviewed/<id>.json
intake/rejected/<id>.json
```

No public Blob URLs.

### Red

Use an in-memory fake to define contract behavior:

- current pointer changes only after a versioned snapshot is written;
- failed snapshot write leaves previous pointer untouched;
- intake state moves are per-record and do not require a global mutable queue index;
- expired records are selected according to state-specific retention.

### Green

Implement the fake first, then the Vercel Blob adapter.

Blob adapter must use private access and server-only credentials.

### Cost/limit gate

Before production provisioning, record in the implementation log:

- current Vercel plan;
- private Blob availability;
- expected public snapshot size;
- expected intake object size;
- projected monthly storage/read/write magnitude.

If Blob is not materially suitable, stop before provisioning and substitute a private object-store adapter without changing the rest of the plan.

### Verify

```bash
npm test
```

Commit:

```text
feat(storage): isolate private snapshot and intake storage
```

---

# 6. Task 4 — Add snapshot publish authentication

**Repo:** ThaiVtuberPublic

**Files:**
- Create `tests/publish-auth.test.js`
- Create `lib/publish-auth.js`

### Red

Tests:

- valid signature succeeds;
- modified body fails;
- modified timestamp fails;
- timestamp older/newer than 5-minute window fails;
- constant-time signature comparison is used;
- missing secret fails closed.

### Green

Implement:

```js
verifyPublishRequest({rawBody, timestamp, signature}, {secret, now})
signingDigest(rawBody, timestamp, secret)
```

Do not parse/re-serialize JSON before signature verification; sign the exact raw request bytes.

### Verify

```bash
npm test
```

Commit:

```text
feat(security): authenticate canonical snapshot publishing
```

---

# 7. Task 5 — Add private publish + bounded public APIs

**Repo:** ThaiVtuberPublic

**Files:**
- Create `api/internal/publish.js`
- Create `api/stats.js`
- Create `api/creators.js`
- Create `tests/creators-api.test.js`
- Update `vercel.json`

### Publish endpoint

`POST /api/internal/publish`:

1. reject non-POST;
2. read raw body with a strict maximum size;
3. authenticate HMAC/timestamp;
4. parse JSON;
5. validate snapshot schema;
6. read current snapshot metadata;
7. reject `generated_at <= current.generated_at`;
8. write versioned snapshot;
9. update current pointer;
10. return only snapshot ID/generation timestamp.

Apply `X-Robots-Tag: noindex, nofollow`.

### Stats endpoint

`GET /api/stats` returns only the summary object.

### Creators endpoint

`GET /api/creators`:

- parse `q`, `platform`, `status`, `cursor`, `limit`;
- maximum limit 24;
- filter in memory from current private snapshot;
- deterministic stable ordering by normalized creator name;
- return `items` + `next_cursor`;
- bind cursor to snapshot ID and filters;
- no total raw dataset body;
- API responses noindex/nofollow;
- no permissive wildcard CORS.

### Red

API tests use the fake storage and assert:

- first page is max 24;
- second page continues without duplicates;
- modified cursor fails;
- changing filters with an old cursor fails;
- stale cursor after snapshot rotation fails;
- search works against name + agency only;
- API body never contains forbidden fields.

### Verify

```bash
npm test
```

Commit:

```text
feat(api): serve bounded VThaiDex public data
```

---

# 8. Task 6 — Build direct ThaiVtuber_DATA reader

**Repo:** ThaiVtuberMaster

**Files:**
- Create `src/thaimaster/vthaidex_canonical.py`
- Create `tests/test_vthaidex_canonical.py`
- Modify `requirements.txt`

Use `google.auth.default` with Sheets readonly scope and `AuthorizedSession`.

Read only:

```text
PERSONAS
ACCOUNTS
ACCOUNT_LINKS
ORGANIZATIONS
AFFILIATIONS
PERSONA_FLAGS
```

Use fixed header maps matching canonical ThaiVtuber_DATA.

### Red

Mock the AuthorizedSession/reader and assert:

- only required ranges are read;
- header mismatch stops the publish flow;
- missing required canonical tabs fail explicitly;
- no write-capable Google API method is called.

### Green

Expose:

```python
read_canonical_public_source() -> dict[str, list[dict[str, str]]]
```

Normalize rows by header name rather than hard-coded positional reads in the projection layer.

### Verify

```bash
python -m unittest tests.test_vthaidex_canonical -v
```

Commit:

```text
feat(vthaidex): read canonical DATA directly
```

---

# 9. Task 7 — Replace Master-derived projection with canonical projection

**Repo:** ThaiVtuberMaster

**Files:**
- Create `src/thaimaster/vthaidex_projection.py`
- Create `tests/test_vthaidex_projection.py`

### Red

Fixture cases:

- verified VTuber persona with multiple YouTube accounts counts once for YouTube;
- verified link required for account inclusion;
- rejected link omitted;
- unverified persona omitted;
- other-V persona types omitted;
- verified adult-flagged persona omitted;
- current affiliation resolves agency;
- expired affiliation not selected;
- internal IDs/evidence/reviewer metadata never appear;
- debut trend remains partial and uses only valid canonical dates;
- malformed/non-http URLs become absent/null rather than executable links.

### Green

Implement:

```python
project_vthaidex(canonical_source: dict) -> dict
```

Output schema version becomes `2`.

Do not reuse the old `project_public(master_payload)` input contract.

### Verify

```bash
python -m unittest tests.test_vthaidex_projection -v
```

Commit:

```text
feat(vthaidex): project public data from canonical registry
```

---

# 10. Task 8 — Add signed operator-side publisher

**Repo:** ThaiVtuberMaster

**Files:**
- Create `src/thaimaster/vthaidex_signing.py`
- Create `tests/test_vthaidex_signing.py`
- Create `scripts/publish_vthaidex.py`
- Update `.gitignore`
- Update `README.md`

Environment:

```text
VTHAIDEX_URL=https://vthaidex.vercel.app
VTHAIDEX_PUBLISH_SECRET=<local secret>
VTUBER_DATA_SPREADSHEET_ID=<optional override>
```

### Red

Tests verify exact signature parity with the Node verifier test vectors.

Put one shared test vector in both repos' test fixtures:

- timestamp;
- raw body;
- secret;
- expected SHA-256 body hash;
- expected HMAC signature.

### Green

Publisher:

1. reads canonical source;
2. projects snapshot;
3. serializes deterministically as UTF-8 JSON;
4. signs exact bytes;
5. POSTs to `/api/internal/publish`;
6. prints snapshot timestamp/count/hash;
7. exits nonzero on any rejection.

No generated snapshot is written into the public repository.

### Verify

First against a local/fake endpoint, not production.

Then provision `VTHAIDEX_PUBLISH_SECRET` in Vercel and the same secret only on the operator machine.

Commit:

```text
feat(vthaidex): publish signed canonical snapshots
```

---

# 11. Task 9 — Create real SEO routes and legal pages

**Repo:** ThaiVtuberPublic

**Files:**
- Refactor `index.html`
- Create `directory.html`
- Create `about.html`
- Create `terms.html`
- Create `terms-of-use.html`
- Create `privacy.html`
- Create `data-license.html`
- Create `contribute.html`
- Create `assets/js/common.js`
- Update `styles.css`
- Create `robots.txt`
- Create `sitemap.xml`
- Update `vercel.json`

Use Vercel clean URLs, so:

```text
/directory -> directory.html
/about -> about.html
...
```

Do not use hash routing for page navigation.

### Legal copy requirements

Footer on every public page links:

```text
Terms
Terms of Use
Privacy
Data License
```

Data License states:

- VThaiDex-authored UI/explanatory text/docs: CC BY 4.0;
- database/compiled dataset/API collection: All Rights Reserved;
- third-party creator/platform material is not relicensed.

Terms of Use prohibit bulk extraction, automated enumeration, mirrors, redistribution, rate-limit circumvention, abusive bots, and attempts to re-identify private submitters.

Privacy Policy explains encrypted intake, no intentional submitter-identity collection in app storage, retention, Vercel/infrastructure metadata limitations, and any future adaptive challenge provider.

Do not promise absolute anonymity.

### SEO

Each page gets unique:

- `<title>`;
- meta description;
- canonical URL;
- Open Graph title/description.

`robots.txt` disallows:

```text
/api/
/contribute
/internal/
```

`sitemap.xml` lists only intended public legal/content pages.

`/contribute` gets noindex metadata and Vercel response header.

### Verify

Use HTML/link tests or simple Node checks to assert all footer links and metadata exist.

Commit:

```text
feat(seo): add real routes and legal policy pages
```

---

# 12. Task 10 — Migrate overview and directory to bounded APIs

**Repo:** ThaiVtuberPublic

**Files:**
- Create `assets/js/overview.js`
- Create `assets/js/directory.js`
- Create/update `assets/js/common.js`
- Update `index.html`
- Update `directory.html`
- Update `styles.css`

### Overview

Fetch only `/api/stats`.

Keep the Stitch-derived reading order:

1. overview heading;
2. five KPI cards;
3. platform distribution + lifecycle;
4. debut trend;
5. directory CTA;
6. EasyDonate support.

Do not derive agency split from a full creator array on the client. If agency split is wanted, add it as an aggregate in the public summary projection and schema.

### Directory

Fetch the first `/api/creators?limit=24`.

Search/filter resets pagination and fetches from server.

"Load more" passes only returned `next_cursor`.

Do not prefetch every page.

Do not keep a full creator dataset in browser state.

### UX details

- search input is first focusable control in filter panel;
- platform/status pills remain horizontally scrollable on small screens;
- loading skeleton or clear loading state;
- explicit error state with retry button;
- empty state distinguishes "no matches" from "data unavailable";
- creator cards preserve strong name → affiliation/status → platforms visual order.

### Verify

Tests use mocked fetch.

Commit:

```text
feat(ui): consume bounded private-backed public APIs
```

---

# 13. Task 11 — Generate and manage intake keys locally

**Repo:** ThaiVtuberMaster

**Files:**
- Create `scripts/intake_keys.py`
- Modify `requirements.txt`
- Modify `.gitignore`
- Document recovery in `README.md`

Add explicit dependency:

```text
cryptography>=46,<47
```

Ignore:

```text
.private/
```

Command:

```bash
python scripts/intake_keys.py generate \
  --kid vtd-2026-01 \
  --public-out ../ThaiVtuberPublic/keys/vtd-2026-01.jwk.json
```

Behavior:

- generate RSA-3072;
- require passphrase entry interactively;
- write encrypted PKCS#8 PEM to `.private/vtd-2026-01-private.pem`;
- write public JWK only to the public repo;
- print SHA-256 public-key fingerprint;
- refuse overwrite unless explicit `--rotate`/new `kid`.

Add `verify-backup` subcommand that loads encrypted private key and decrypts a local test envelope.

### Manual recovery gate

Before intake is enabled:

- copy encrypted private key to two separate offline media;
- record fingerprint separately;
- run `verify-backup` against each restored copy.

Do not upload backups to Vercel/GitHub.

Commit only code/public JWK, never private material.

Commit:

```text
feat(intake): add local encrypted key lifecycle tooling
```

---

# 14. Task 12 — Implement browser-side encrypted three-step intake

**Repo:** ThaiVtuberPublic

**Files:**
- Create `assets/js/intake-crypto.js`
- Create `assets/js/contribute.js`
- Rewrite `contribute.html`
- Update `styles.css`
- Add browser/crypto tests where feasible

Wizard:

```text
1 ตัวตน -> 2 ช่องทาง -> 3 ตรวจสอบ
```

Step 1:
- creator public name required;
- affiliation optional;
- debut year/date optional;
- lifecycle status.

Step 2:
- YouTube/X/other platform URLs;
- at least one valid public platform;
- visible helper text and inline validation.

Step 3:
- review card;
- public-information confirmation;
- Terms of Use confirmation;
- Privacy confirmation;
- final button: `เข้ารหัสและส่ง`.

### Crypto API

`encryptSubmission(data, publicJwk)`:

- generate AES-GCM 256-bit key;
- 12-byte random IV;
- import RSA public JWK for OAEP SHA-256;
- encrypt exact UTF-8 JSON;
- wrap AES key;
- base64url encode binary values;
- include `v`, `kid`, `alg`.

Metadata `v/kid/alg` is encoded as AES-GCM additional authenticated data.

On any crypto failure, abort with no plaintext network fallback.

After accepted request, clear in-memory form object and reset DOM fields.

Do not use localStorage/sessionStorage.

No analytics script is included on this page.

### Verify

Browser test:

- fill all steps;
- back/next preserves in-memory values only;
- invalid URL blocks progression;
- refresh clears form;
- network request contains ciphertext envelope but no creator name/platform URL/evidence string.

Commit:

```text
feat(intake): encrypt contribution data in browser
```

---

# 15. Task 13 — Implement intake token + ciphertext-only API

**Repo:** ThaiVtuberPublic

**Files:**
- Create `lib/intake.js`
- Create `tests/intake.test.js`
- Create `api/intake-token.js`
- Create `api/intake.js`

### Form token

`GET /api/intake-token` returns a signed token containing:

- version;
- issued-at;
- expiry <= 15 minutes;
- random nonce.

No user ID/IP is embedded.

The token is not the primary anti-bot mechanism.

### Intake POST

Request body contains only:

```json
{
  "token": "...",
  "honeypot": "",
  "envelope": {
    "v": 1,
    "kid": "vtd-2026-01",
    "alg": "RSA-OAEP-256+A256GCM",
    "iv": "...",
    "wrapped_key": "...",
    "ciphertext": "..."
  }
}
```

No plaintext creator fields.

Validation:

- POST only;
- exact allowed Origin;
- JSON only;
- strict max body size;
- valid short-lived token;
- minimum elapsed time from token issue;
- honeypot empty;
- known key ID;
- bounded encoded field lengths;
- valid base64url fields.

Accepted record stored as ciphertext with server-generated random ID and `received_at`.

The stored record must not copy request IP, User-Agent, Referer, or cookies.

Return generic receipt only, no reusable tracking ID.

### Red

Tests assert plaintext marker strings are not present in stored object and bad token/origin/honeypot fail.

### Verify

```bash
npm test
```

Commit:

```text
feat(intake): accept ciphertext-only private submissions
```

---

# 16. Task 14 — Add ThaiVtuberMaster local intake reviewer

**Repo:** ThaiVtuberMaster

**Files:**
- Create `src/thaimaster/vthaidex_intake.py`
- Create `tests/test_vthaidex_intake.py`
- Create `scripts/intake.py`
- Update `README.md`

Environment:

```text
VTHAIDEX_URL=https://vthaidex.vercel.app
VTHAIDEX_OPERATOR_SECRET=<local secret>
VTHAIDEX_PRIVATE_KEY=.private/vtd-2026-01-private.pem
```

Commands:

```bash
python scripts/intake.py list
python scripts/intake.py expiring
python scripts/intake.py review <id>
```

`list` shows only:

- intake ID;
- received time;
- age;
- key ID;
- state.

It does not decrypt every item automatically.

`review <id>`:

1. authenticated fetch of one ciphertext;
2. prompt for private-key passphrase locally;
3. decrypt locally;
4. display public submitted facts;
5. operator chooses accept/reject/leave pending;
6. accept writes a local canonical-review proposal file, not ThaiVtuber_DATA directly;
7. call VThaiDex internal endpoint to move ciphertext to reviewed/rejected state.

The proposal format must fit the existing human-review workflow instead of bypassing it.

### Expiry UX

- <=14 days remaining: `expiring`;
- <=7 days remaining: urgent marker.

### Red

Tests cover:

- valid envelope decrypts;
- altered ciphertext fails GCM authentication;
- wrong private key fails;
- accepted proposal contains only submitted public creator facts;
- no server request contains private key/passphrase.

Commit:

```text
feat(intake): review encrypted VThaiDex submissions locally
```

---

# 17. Task 15 — Add authenticated internal intake queue + retention purge

**Repo:** ThaiVtuberPublic

**Files:**
- Create `api/internal/intake.js`
- Create `api/maintenance.js`
- Extend `tests/intake.test.js`
- Update `vercel.json`

Internal intake endpoint authenticates `VTHAIDEX_OPERATOR_SECRET`.

Supported operations:

- list pending metadata with bounded pagination;
- fetch one encrypted record by random ID;
- move pending → reviewed;
- move pending → rejected.

It never returns plaintext because none exists server-side.

`api/maintenance.js`:

- requires `Authorization: Bearer <CRON_SECRET>`;
- purges pending >60 days;
- purges reviewed/rejected >7 days;
- returns counts only.

Configure a once-daily Vercel Cron in `vercel.json`.

### Verify

Tests assert no unauthenticated queue access and state-specific purge boundaries.

Commit:

```text
feat(intake): add private review queue retention
```

---

# 18. Task 16 — Provision production secrets/storage without canonical credentials

**Systems:** Vercel + operator machine

Generate separate random secrets:

```text
VTHAIDEX_PUBLISH_SECRET
VTHAIDEX_CURSOR_SECRET
VTHAIDEX_OPERATOR_SECRET
CRON_SECRET
```

Vercel also receives the private Blob integration credential automatically.

Vercel must **not** receive:

```text
GOOGLE_APPLICATION_CREDENTIALS
ThaiVtuber_DATA service-account JSON
VThaiDex intake RSA private key
private-key passphrase
```

Operator machine receives:

```text
VTHAIDEX_PUBLISH_SECRET
VTHAIDEX_OPERATOR_SECRET
canonical Google credentials
encrypted intake private key + passphrase knowledge
```

### Verify separation

Inspect Vercel environment variable names and confirm no canonical Google credential/private-key variable exists.

Record only variable names, never secret values, in the rollout checklist.

No code commit required unless README/env-example docs change.

---

# 19. Task 17 — Publish first private canonical snapshot in preview

**Repos/systems:** ThaiVtuberMaster + VThaiDex preview

1. run all Master tests;
2. generate canonical VThaiDex projection locally;
3. print record counts + public field inventory;
4. verify forbidden keys by recursive scan;
5. publish to a preview/test VThaiDex endpoint/storage namespace;
6. call preview `/api/stats`;
7. call preview `/api/creators?limit=24`;
8. verify page/cursor/search/filter;
9. intentionally publish an older `generated_at` snapshot and verify rejection;
10. intentionally publish a schema-invalid snapshot and verify current pointer remains unchanged.

Only after this passes, publish the same current projection to production.

Commit only test/code fixes if needed; do not commit snapshot data.

---

# 20. Task 18 — Coordinated production cutover

**Repo:** ThaiVtuberPublic

This is the Phase 4 cutover from the approved spec.

Before cutover:

- encrypted intake storage verified;
- local backup restore drill verified;
- Master reviewer can decrypt preview intake;
- private snapshot API verified;
- current public JSON still available as rollback reference locally, not newly exposed.

Cutover commit performs together:

- overview uses `/api/stats`;
- directory uses bounded `/api/creators`;
- contribution uses encrypted private intake;
- GitHub-Issue submission code removed;
- CSV-template download button/code removed;
- `data/public-summary.json` removed;
- `data/public-creators.json` removed;
- `data/bootstrap-summary.json` removed if no longer used;
- `.gitignore` entries for those generated public files removed;
- old `scripts/export_public.py` workflow removed from public README;
- “Open Data” wording replaced with “Methodology / Source Policy”.

In ThaiVtuberMaster, remove the old Master-payload public exporter only after the canonical publisher is production-verified:

- delete `scripts/export_public.py`;
- delete or archive `src/thaimaster/public_exporter.py`;
- replace README public-export instructions with canonical publisher instructions;
- update/delete old tests accordingly.

Commit public repo:

```text
feat: cut over VThaiDex to private-backed public data
```

Commit Master repo:

```text
refactor(vthaidex): retire Master-payload public export
```

---

# 21. Task 19 — Security headers and privacy-sensitive page isolation

**Repo:** ThaiVtuberPublic

Update `vercel.json`.

Global headers:

- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- a CSP compatible with the actual static assets;
- `Permissions-Policy` disabling unused sensitive features.

For `/contribute`:

- `X-Robots-Tag: noindex, nofollow`;
- stricter referrer policy, preferably `no-referrer`;
- CSP with no analytics hosts;
- no third-party JS;
- fonts/assets should be self-hosted if the final CSP/privacy test shows the existing Google Fonts request is undesirable for the contribution page.

For `/api/*` and `/internal/*`:

- `X-Robots-Tag: noindex, nofollow`;
- `Cache-Control: no-store` where sensitive/queue data is involved.

### Verify

Fetch deployed headers for every route class.

Commit:

```text
security: harden VThaiDex public and intake routes
```

---

# 22. Task 20 — Stage Vercel Firewall rules

**System:** Vercel Firewall

Do not publish blocking rules immediately.

Candidate rule groups:

### Public creator API

Match:

```text
path starts /api/creators
```

Initial action: log.

Set a generous threshold based on observed legitimate search behavior before moving to rate limit/challenge.

### Intake

Match:

```text
POST /api/intake
GET /api/intake-token
```

Initial action: log.

Use a substantially lower expected rate than creator search.

### Internal endpoints

Match:

```text
path starts /api/internal/
```

Initial action: log plus application authentication remains mandatory.

Firewall is defense in depth, not the authentication mechanism.

### Staged rollout

For every rule:

1. add as log;
2. publish draft manually;
3. observe real traffic;
4. test challenge/rate-limit in preview;
5. verify Google/Bing/public users unaffected;
6. only then change production action;
7. user manually publishes the final firewall draft.

If spam still occurs after rate controls, add adaptive Turnstile/equivalent only to suspicious intake traffic and update Privacy Policy before enabling it.

No code commit unless challenge integration is actually introduced.

---

# 23. Task 21 — End-to-end verification

Use fresh verification, not assumptions.

## Public repo automated

```bash
npm test
```

Must report zero failing tests.

## Master automated

```bash
python -m unittest discover -s tests -v
```

Must report zero failing tests.

## Browser verification

Verify production/preview with a real browser:

- `/`;
- `/directory`;
- `/about`;
- `/terms`;
- `/terms-of-use`;
- `/privacy`;
- `/data-license`;
- `/contribute`.

At approximately:

- 360 px;
- 430 px;
- desktop >=1280 px.

Check:

- no console errors;
- keyboard tab order;
- visible focus;
- form progress and errors;
- API loading/error/empty states;
- no layout overflow.

## Privacy network verification

On `/contribute`:

1. fill a unique marker string in creator name/evidence;
2. submit;
3. inspect outgoing network request body;
4. assert marker does **not** occur in the request;
5. inspect stored intake through internal API;
6. assert marker does **not** occur in stored JSON;
7. decrypt locally in Master;
8. assert marker appears only after local decryption.

## Data extraction verification

- request `limit=999`; verify max 24/rejection behavior;
- tamper cursor; verify error;
- reuse cursor with different filter; verify error;
- call removed public JSON paths; verify 404;
- confirm no CSV/JSON export buttons;
- recursively inspect API creator objects for forbidden keys.

## SEO verification

- direct-load every clean URL;
- inspect title/description/canonical;
- fetch `robots.txt`;
- fetch `sitemap.xml`;
- verify public pages indexable;
- verify contribution/API/internal noindex.

## Isolation verification

List Vercel environment variable names and confirm:

- no canonical Google service-account credential;
- no intake private key;
- no intake private-key passphrase.

Only after all checks pass may the migration be called complete.

---

# 24. Rollback plan

If the new API fails after production cutover:

- roll back Vercel to the previous known-good deployment;
- do **not** re-publish full creator JSON as a quick fix;
- leave contribution disabled rather than re-enable public GitHub-Issue intake;
- retain the last valid private snapshot for diagnosis.

If intake encryption/reviewer fails:

- disable `/contribute` submission action;
- keep already-stored ciphertext untouched;
- fix/redeploy;
- never introduce plaintext fallback.

If canonical publish fails:

- preserve the current private snapshot pointer;
- fix publisher/projection;
- retry only after local validation.

---

# 25. Suggested execution batches

This plan is large enough that execution should be checkpointed.

**Batch A — public backend foundation:** Tasks 1–5.  
**Batch B — canonical publisher:** Tasks 6–10.  
**Batch C — privacy intake:** Tasks 11–17.  
**Batch D — production cutover + hardening:** Tasks 18–21.

After each batch:

- run its full automated tests;
- inspect git diff;
- commit;
- report actual pass/fail evidence before starting the next batch.

The firewall stage remains a separate operator-controlled rollout after application verification.
