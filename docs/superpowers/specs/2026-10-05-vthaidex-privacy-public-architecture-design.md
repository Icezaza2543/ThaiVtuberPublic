# VThaiDex Privacy-First Public Architecture Design

**Date:** 2026-10-05  
**Status:** Approved design, pending implementation plan  
**Primary product:** VThaiDex (`vthaidex.vercel.app`)  
**Public repository:** `Icezaza2543/ThaiVtuberPublic`  
**Related systems:** ThaiVtuber_DATA, ThaiVtuberSNA, ThaiVtuberMaster

## 1. Goal

VThaiDex is the public, easy-to-understand view of the Thai VTuber ecosystem. It must:

- present useful public statistics and creator directory information without exposing internal research data;
- remain simple enough for casual users and mobile users to understand quickly;
- support search-engine indexing of public pages;
- provide a private submission flow that minimizes identifying information about submitters;
- avoid publishing bulk downloadable datasets or public full-dataset JSON files;
- keep ThaiVtuber_DATA isolated from compromise of the VThaiDex production environment;
- give ThaiVtuberMaster a private operator workflow for reviewing encrypted submissions.

The system is deliberately designed so that compromising VThaiDex alone is not sufficient to gain credentials for ThaiVtuber_DATA or decrypt stored intake submissions.

## 2. Product roles and system boundaries

The four projects have distinct responsibilities.

| System | Responsibility |
| --- | --- |
| **ThaiVtuber_DATA** | Canonical source of truth for reviewed creator identities, public accounts, affiliations, lifecycle state, and other canonical public facts. |
| **ThaiVtuberSNA** | Derived analytics and network analysis. It is not the canonical identity source. |
| **ThaiVtuberMaster** | Internal/research interface and operator tooling. It may review encrypted VThaiDex intake locally, but it is not the public data source for VThaiDex. |
| **VThaiDex** | Public-facing directory, public summary statistics, explanatory methodology, legal pages, and encrypted community intake. |

The public data path is:

```text
ThaiVtuber_DATA
      |
      | local/read-only canonical access
      v
VThaiDex public projector
      |
      | allowlist + schema validation + signed publish
      v
VThaiDex private snapshot storage
      |
      v
VThaiDex public API
      |
      v
VThaiDex frontend
```

ThaiVtuberSNA is not required for the first public-data migration. Future public analytics must enter VThaiDex through a separate sanitized projection contract rather than exposing SNA internals.

ThaiVtuberMaster participates in the intake-review path:

```text
VThaiDex encrypted intake
      |
      | authenticated operator fetch
      v
ThaiVtuberMaster local reviewer
      |
      | local-only decryption
      v
human review
      |
      v
canonical review / ThaiVtuber_DATA
```

## 3. Threat model

The design protects primarily against:

- bulk extraction of the compiled VThaiDex dataset;
- accidental publication of internal IDs, evidence, network data, raw metrics, or review metadata;
- compromise of VThaiDex being used to pivot into ThaiVtuber_DATA;
- theft of stored intake submissions from revealing their plaintext;
- automated spam and high-rate enumeration;
- accidental leakage of submitter identity through application storage.

The design does **not** claim:

- that information visible on a public web page cannot be copied;
- that Google/Bing indexing and anti-enumeration can be made perfectly compatible;
- that the infrastructure provider or ISP never observes request metadata;
- that client-side encryption protects plaintext on a compromised submitter device;
- that client-side encryption protects new submissions after an attacker gains control of the production frontend;
- that anonymous submission can be guaranteed with mathematical certainty.

The intended security property is:

> A breach of VThaiDex application storage by itself must not be sufficient to read stored intake plaintext or obtain credentials that read ThaiVtuber_DATA.

## 4. Public data publishing

### 4.1 Source

VThaiDex must project directly from canonical ThaiVtuber_DATA, not from `ThaiVtuberMaster/web/data/site.json`.

Operator tooling may live in the private ThaiVtuberMaster repository for convenience, but it must read canonical DATA directly. In that arrangement ThaiVtuberMaster is only the location of the operator tool; its website payload is not an input.

### 4.2 Allowlisted public creator shape

The projector may publish only fields approved for the public directory:

```json
{
  "name": "Creator name",
  "agency": "Agency or Independent",
  "status": "active",
  "debut_year": 2024,
  "platforms": [
    {"name": "youtube", "url": "https://..."}
  ]
}
```

The projector must not publish:

- persona IDs, account IDs, row IDs, canonical keys, or review IDs;
- evidence and review notes;
- confidence scores;
- source counts or source-history objects;
- audience/network data;
- private archives;
- financial observations;
- raw history;
- internal timestamps other than the public snapshot generation time.

### 4.3 Summary shape

The public snapshot may contain aggregate fields needed by the overview page:

- total reviewed public records/personas represented by the projection;
- per-platform creator counts, counted once per creator per platform;
- lifecycle status counts;
- known-debut-year counts;
- debut-year series derived from canonical debut-year facts;
- public snapshot generation timestamp.

No aggregate may imply complete national coverage when the underlying field coverage is partial.

### 4.4 Signed push, never production pull

VThaiDex production must not hold credentials that can read ThaiVtuber_DATA.

Publishing is push-only:

1. an operator-side publisher reads canonical data;
2. it builds the allowlisted public projection;
3. it validates the projection schema;
4. it signs the payload with a publish secret;
5. it sends the projection to a private VThaiDex publish endpoint;
6. VThaiDex validates signature, timestamp, payload hash, and schema;
7. VThaiDex stores a new versioned private snapshot;
8. the current snapshot pointer changes only after successful storage and validation.

An invalid or incomplete publish must leave the previous production snapshot active.

## 5. Public storage and API

### 5.1 Storage

Initial storage is Vercel Blob with private access. The browser never receives a Blob token or private Blob URL.

Versioned snapshots are retained privately to support atomic replacement and rollback. Old snapshots are pruned according to operational retention once a new snapshot is verified.

If the public projection later grows large enough that search latency or memory use becomes unsuitable, the storage layer may be migrated behind the same API contract without changing the frontend data model.

### 5.2 API surface

The first public API contains only:

```text
GET /api/stats
GET /api/creators?q=&platform=&status=&cursor=&limit=
```

Rules:

- default page size: 24;
- maximum page size: 24;
- no `offset` parameter;
- no arbitrary field sorting;
- no export endpoint;
- no dump endpoint;
- no public snapshot URL;
- no CSV or JSON download endpoint;
- no public API documentation that encourages bulk access.

The cursor is an opaque signed token bound to the active query/filter state and an expiration time. Invalid or modified cursors fail closed.

Search and filter responses return only the same allowlisted public creator shape as the directory.

### 5.3 Failure behavior

When the snapshot cannot be loaded, the UI displays a clear temporary-unavailable state. It must not silently manufacture zeroes or substitute unrelated stale values.

## 6. Anti-download and anti-enumeration policy

VThaiDex does not provide a bulk-download feature.

The public site removes or avoids:

- Download CSV;
- Download JSON;
- Export;
- dataset mirrors;
- full public creator JSON files;
- full public snapshot files;
- links labelled “Open Data” that imply the database is openly licensed.

The current “Open Data” action becomes **Methodology / Source Policy**.

This policy cannot prevent a user from copying information already rendered to their screen. The technical goal is to prevent easy bulk extraction and automated enumeration, not to claim impossible copy prevention.

## 7. SEO and routing

SEO is required for public pages. VThaiDex migrates away from hash-only navigation.

Indexable public routes:

```text
/
/directory
/about
/terms
/terms-of-use
/privacy
/data-license
```

Non-indexable routes:

```text
/contribute
/api/*
/internal/*
```

Requirements:

- real path-based navigation instead of `/#directory` and `/#about`;
- route-specific title, description, canonical URL, and social metadata;
- `robots.txt` disallowing API/internal/contribute paths;
- `sitemap.xml` listing indexable public pages;
- `X-Robots-Tag: noindex, nofollow` on API/internal responses and the contribution route;
- search/filter query variants must not create independently indexable duplicate pages.

The first migration does not create one static page per creator. The directory remains the indexable creator-discovery surface while creator records are loaded in bounded pages. This avoids turning a sitemap into a machine-readable list of every creator URL during the first anti-enumeration rollout.

## 8. UX and visual hierarchy

The UI keeps the current Stitch-derived visual language:

- light background;
- white cards;
- violet primary actions;
- sky-blue and pink support accents;
- rounded cards and pills;
- high-contrast Thai typography;
- generous negative space;
- mobile-first layout.

The product should read like a public community reference, not an enterprise analytics dashboard.

### 8.1 Overview

Visual order:

```text
Overview heading
  ↓
5 primary KPI cards
  ↓
Platform distribution + lifecycle status
  ↓
Debut/growth trend
  ↓
Directory call to action
  ↓
VThaiDex support / EasyDonate
```

Each card answers one question. Decorative or unsupported metrics are excluded.

### 8.2 Directory

The directory places search before filters.

```text
Search
  ↓
Platform pills
  ↓
Lifecycle pills
  ↓
Creator cards
```

Creator cards contain only public-safe fields and public platform links. There is no follower leaderboard or internal/raw metric display.

## 9. Contribution form UX

The current long form becomes a three-step wizard.

```text
1. ตัวตน  ━━━━━  2. ช่องทาง  ━━━━━  3. ตรวจสอบ
```

### Step 1 — Identity

Fields:

- public creator name (required);
- affiliation/agency;
- debut date/year when known;
- lifecycle status.

Labels remain visible above inputs. Helper text explains expectations; placeholder text is not the only instruction.

### Step 2 — Public platforms

Fields:

- YouTube;
- X / Twitter;
- additional public platform URLs.

At least one public platform is required. URLs are validated in the browser before proceeding.

### Step 3 — Review and consent

The user reviews the complete plaintext submission in the browser before encryption.

Required confirmations:

- the submitted information is public information;
- the submitter agrees to Terms of Use and Privacy Policy.

The final action is labelled **เข้ารหัสและส่ง**.

If encryption fails, the system sends nothing. There is no plaintext fallback.

After a successful submission, the UI confirms receipt without exposing a reusable tracking identifier or submission-history feature.

## 10. Privacy-minimizing intake

The application does not intentionally collect:

- submitter name;
- submitter email;
- submitter social account;
- login identity;
- IP address in application storage;
- User-Agent in application storage;
- referrer in the intake record;
- client-side submission history.

The contribution page does not persist the form to localStorage or sessionStorage.

Plaintext form state is cleared after successful encryption/submission.

Third-party analytics and tracking are disabled on `/contribute`.

Privacy language must state that VThaiDex minimizes identifying information but cannot guarantee that infrastructure providers, network providers, or a compromised client device never observe request metadata.

## 11. Client-side encrypted intake

### 11.1 Cryptographic envelope

The browser uses hybrid encryption:

1. generate a random AES-256-GCM content key;
2. encrypt the submission JSON with AES-GCM;
3. encrypt the AES key using the current VThaiDex RSA-OAEP public key with SHA-256;
4. send only the encrypted envelope.

Envelope shape:

```json
{
  "v": 1,
  "kid": "vtd-2026-01",
  "alg": "RSA-OAEP-256+A256GCM",
  "iv": "...",
  "wrapped_key": "...",
  "ciphertext": "..."
}
```

The encryption public key is intentionally public.

### 11.2 Private key placement

The corresponding private key exists only in the operator/reviewer environment used by ThaiVtuberMaster.

It is not stored in:

- GitHub;
- Vercel;
- Vercel environment variables;
- VThaiDex private Blob storage;
- the browser.

The private key must be encrypted at rest and backed up offline. The reviewer decrypts intake locally.

### 11.3 Key rotation

Every encryption key has a stable `kid`.

A rotation publishes a new public key while the reviewer keeps old private keys until all intake encrypted with those keys has been reviewed or expired.

Old private keys are not deleted while pending ciphertext still references them.

## 12. Intake API and bot protection

### 12.1 Intake endpoint

The public submission endpoint accepts only encrypted envelopes.

Requirements:

- POST only;
- JSON content type only;
- strict body-size limit;
- same-origin checks;
- valid envelope version and algorithm;
- recognized current/retained public-key ID;
- schema checks on the encrypted envelope;
- no plaintext form fields.

A short-lived signed form token may be required to reject obviously stale or malformed direct posts. The token contains no user identity and is not treated as the primary bot-defense mechanism.

### 12.2 Bot and abuse layers

Defense is layered:

1. browser-side honeypot field;
2. minimum realistic form-completion timing;
3. URL and field validation;
4. strict payload and method validation;
5. Vercel Firewall logging and rate-limit rules;
6. challenge/deny only after staged traffic review.

Vercel's platform DDoS protections remain enabled.

Firewall rollout follows:

```text
log
  ↓
review real traffic
  ↓
challenge/deny in preview
  ↓
production enforcement
```

New production blocking rules are not enabled blindly.

Public search receives a higher legitimate request allowance than encrypted intake. Internal publish receives the strictest authentication and rate controls.

## 13. ThaiVtuberMaster operator integration

ThaiVtuberMaster remains private/internal and gains operator tooling for two tasks.

### 13.1 Public snapshot publisher

The operator-side publisher:

- reads canonical ThaiVtuber_DATA directly;
- applies the VThaiDex public projection allowlist;
- validates the projection;
- signs and pushes it to VThaiDex.

It does not use ThaiVtuberMaster's generated website payload as the source.

### 13.2 Intake review

The local reviewer can:

- fetch pending encrypted envelopes through an authenticated operator path;
- decrypt them locally using the private key;
- display one submission for human review;
- accept or reject it;
- move accepted public facts into the existing canonical review workflow;
- never copy submitter-identifying metadata into canonical data.

Intake does not directly mutate canonical DATA without human review.

## 14. Intake retention

Application retention targets:

| State | Retention |
| --- | ---: |
| Pending encrypted intake | 30 days |
| Reviewed encrypted intake | 7 days |
| Rejected encrypted intake | 7 days |

Expired encrypted intake is deleted.

Canonical public facts accepted through the normal review workflow are governed by the canonical DATA lifecycle rather than intake retention.

## 15. Licensing and legal structure

VThaiDex uses separate legal treatment for the website and compiled data.

### 15.1 CC BY 4.0

VThaiDex-authored UI, explanatory text, and documentation are licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)** unless another notice applies.

The footer states the license and links to the Data License page.

Third-party marks, platform logos, creator-owned content, and other third-party material are not relicensed by VThaiDex.

### 15.2 Database and API

The compiled database, dataset, public API responses as a compiled collection, and dataset mirrors are **All Rights Reserved** unless explicit permission is granted.

Terms prohibit:

- bulk extraction;
- automated scraping;
- automated enumeration intended to reconstruct the dataset;
- dataset mirroring;
- redistribution of the compiled dataset;
- circumvention of rate limits or access controls;
- abusive botting;
- attempts to re-identify anonymous/private submitters.

### 15.3 Required pages

VThaiDex publishes:

- `/terms` — Terms of Service;
- `/terms-of-use` — acceptable and prohibited use;
- `/privacy` — data minimization, encrypted intake, infrastructure limitations, retention;
- `/data-license` — CC BY scope vs database/API restrictions.

Legal copy must describe the system accurately and must not promise absolute anonymity, absolute security, or perfect data accuracy.

## 16. Migration plan

### Phase 1 — Route and UX foundation

- convert hash navigation to real public routes;
- add legal pages;
- add the three-step contribution UI;
- add SEO metadata, sitemap, and robots policy;
- keep the current bootstrap state during the transition.

### Phase 2 — Canonical public projection

- add direct canonical DATA projection on the operator side;
- add schema validation and signed publish;
- create private versioned snapshot storage;
- expose `/api/stats` and bounded `/api/creators`.

### Phase 3 — Remove public full-dataset files

- migrate the frontend away from `public-summary.json` and `public-creators.json`;
- delete public full-snapshot/export paths;
- remove download/export controls;
- rename “Open Data” to Methodology / Source Policy.

### Phase 4 — Encrypted intake

- generate the initial encryption keypair;
- publish only the public key;
- add browser encryption;
- add encrypted intake storage;
- add ThaiVtuberMaster local fetch/decrypt/review tooling;
- verify that a Vercel-side storage dump contains no plaintext intake.

### Phase 5 — Firewall enforcement

- add firewall rules in logging mode;
- inspect production traffic;
- test challenge/rate-limit behavior in preview;
- enforce production rules only after validating that legitimate users and SEO crawlers are unaffected.

## 17. Verification requirements

The implementation is not complete until the following are verified.

### Routing and UI

- `/`, `/directory`, `/about`, `/terms`, `/terms-of-use`, `/privacy`, `/data-license`, and `/contribute` load directly;
- mobile layouts at approximately 360–430 px remain usable;
- desktop layouts retain clear visual hierarchy;
- keyboard navigation and focus states are usable;
- labels, helper text, validation errors, and wizard progress are understandable.

### Public data

- no public full creator snapshot exists;
- no CSV/JSON export endpoint exists;
- page size cannot exceed 24;
- invalid/modified cursor fails;
- public API returns only allowlisted fields;
- schema-invalid publish does not replace the active snapshot;
- VThaiDex production contains no credential that can read ThaiVtuber_DATA.

### Encrypted intake

- plaintext submission does not leave the browser;
- encryption failure sends no request containing form plaintext;
- stored intake is ciphertext only;
- Vercel does not hold the intake private key;
- ThaiVtuberMaster can decrypt valid intake locally;
- wrong key or altered ciphertext fails authentication/decryption;
- rejected/expired intake can be purged;
- no submitter email/name/social identity is collected.

### SEO and bots

- public pages are indexable;
- `/api/*`, `/internal/*`, and `/contribute` are noindex;
- sitemap includes only intended public pages;
- robots policy excludes private/API paths;
- firewall rules are reviewed in log mode before production blocking.

### Legal and license

- footer links to Terms, Terms of Use, Privacy, and Data License;
- CC BY 4.0 scope is stated clearly;
- database/API restrictions are stated separately;
- no copy claims absolute anonymity or impossible anti-copy guarantees.

## 18. Success criteria

The migration succeeds when:

1. a normal visitor can understand the Thai VTuber overview and find a creator without understanding the internal data stack;
2. VThaiDex no longer ships the creator database as a public downloadable JSON/CSV snapshot;
3. Google/Bing can index the intended public pages;
4. a breach of VThaiDex storage alone does not reveal intake plaintext or canonical DATA credentials;
5. ThaiVtuberMaster can review encrypted intake locally;
6. accepted submissions still pass through human canonical review;
7. legal/licensing language clearly separates CC BY 4.0 website content from restricted compiled data;
8. the production rollout is staged and verifiably preserves legitimate user and crawler access.
