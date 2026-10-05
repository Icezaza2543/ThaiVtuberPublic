# VThaiDex

A privacy-first public-facing reference for the Thai VTuber ecosystem.

## Product scope

VThaiDex intentionally exposes only simple, public-friendly information:

- total reviewed VTuber records/personas;
- platform coverage by unique public creator record;
- reviewed lifecycle status;
- partial debut-year trend where a canonical debut date/year is known;
- a searchable public creator directory.

It deliberately excludes internal IDs, evidence/reviewer metadata, audience/network data, private archives, financial observations, and raw analytical data.

## Architecture

```text
ThaiVtuber_DATA
      |
      | read locally / operator side only
      v
sanitized VThaiDex projection
      |
      | signed push
      v
private Vercel Blob
      |
      +--> /api/stats
      +--> /api/creators?cursor=...
      |
      v
VThaiDex frontend
```

VThaiDex production does **not** receive credentials that can read ThaiVtuber_DATA.

The public frontend does not ship a full creator JSON/CSV dataset. Directory access is paginated and bounded to 24 creator records per request.

## Private contribution flow

```text
browser form
   |
   | AES-256-GCM content encryption
   | RSA-OAEP-SHA256 key wrapping
   v
ciphertext-only intake
   |
   v
private storage
   |
   | authenticated operator fetch
   v
ThaiVtuberMaster local review
   |
   | private key stays local
   v
canonical human-review workflow
```

Contribution is **disabled by default**. `VTHAIDEX_INTAKE_ENABLED=true` is set only after the public key, offline key backups, private storage, local decrypt/review flow, and preview submission have all been verified.

## Public routes

```text
/
/directory
/about
/terms
/terms-of-use
/privacy
/data-license
/contribute
```

Public content routes use clean URLs for SEO. `/contribute`, `/api/*`, and internal endpoints are noindex.

## API boundaries

```text
GET  /api/stats
GET  /api/creators?q=&platform=&status=&cursor=&limit=
POST /api/intake
GET  /api/intake-token

POST /api/internal/publish
GET|PATCH /api/internal/intake
GET /api/maintenance
```

Internal endpoints require separate secrets. Public API responses never expose canonical IDs or review metadata.

## Security boundaries

Vercel may hold:

- sanitized private snapshots;
- encrypted intake ciphertext;
- publish/cursor/operator/form-token/cron secrets.

Vercel must **not** hold:

- ThaiVtuber_DATA Google credentials;
- the RSA intake private key;
- the intake private-key passphrase.

A VThaiDex application/storage breach alone should therefore not be enough to read stored intake plaintext or pivot into the canonical database.

## Licensing

- VThaiDex-authored UI, explanatory text, and documentation: **CC BY 4.0**
- compiled database / dataset / API collection: **All Rights Reserved**
- third-party names, marks, logos, media, and creator-owned material remain with their owners.

See `LICENSE.md` and `/data-license`.

## Development

Requires Node.js 22+ for the API/unit test suite.

```bash
npm install
npm test
```

The site remains mostly static HTML/CSS/JavaScript with Vercel Functions under `api/`.

## Production provisioning

Admin-only provisioning and key-recovery steps are documented in:

```text
docs/operations/vthaidex-production-provisioning.md
```

Do not enable private intake until every recovery and ciphertext-only verification gate in that runbook passes.

## Support

EasyDonate for the website developer:

https://ezdn.app/icezaza

Support is for VThaiDex development/project costs and is not connected to VTubers listed in the directory.

## Status

This branch is a staged migration. Production cutover is intentionally blocked until private storage, environment secrets, the local intake key recovery drill, first canonical snapshot publish, encrypted intake preview test, and final security review have all passed.
