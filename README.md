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

## Contribution flow

Contributions go through an owner-managed **Google Form** linked from `/contribute`. The site itself has no
submission endpoint and stores no contributor data. The owner reviews answers against public evidence and
applies accepted changes in ThaiVtuber_DATA through the normal review scripts; the next snapshot publish
updates VThaiDex.

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

POST /api/internal/publish
```

The publish endpoint requires its own secret. Public API responses never expose canonical IDs or review metadata.

## Security boundaries

Vercel holds sanitized private snapshots and the publish/cursor secrets. It must **not** hold
ThaiVtuber_DATA Google credentials, so a VThaiDex breach cannot pivot into the canonical database.

## Licensing

- source code: **AGPL-3.0-only** (`LICENSE`) — anyone may use, modify and share it; a modified version offered to users over a network must publish its source under AGPL-3.0
- VThaiDex-authored UI, explanatory text, and documentation: **CC BY 4.0**
- compiled database / dataset / API collection: **All Rights Reserved**
- third-party names, marks, logos, media, and creator-owned material remain with their owners.

See `LICENSE`, `LICENSE.md` and `/data-license`.

## Development

React 19 + Tailwind CSS v4, built by Vite as a multi-page site (one HTML entry per route, so each page keeps
its own SEO head). Pages live in `src/pages/`, shared layout in `src/components/`, API helpers in
`src/lib/api.js`. The home page's 3D universe (`src/components/Universe.jsx`, three.js via
react-three-fiber) is lazy-loaded and is drawn only from aggregate stats: agencies are planets sized by
member count, independent creators are points in a spiral disc coloured by platform mix.

Requires Node.js 22+.

```bash
npm install
npm run dev      # http://localhost:5173, /api proxied to production
npm test         # API, schema and data-helper tests
npm run build    # dist/
```

`VTHAIDEX_STATS_FILE=<summary.json> npm run dev` serves `/api/stats` from a local file, e.g. a summary that
has not been published yet. Fonts are self-hosted through `@fontsource`; the site makes no third-party
requests. Vercel builds with `npm run build` and serves `dist/` plus the functions in `api/`.

## Production provisioning

Admin-only provisioning steps are documented in:

```text
docs/operations/vthaidex-production-provisioning.md
```

## Support

EasyDonate for the website developer:

https://ezdn.app/icezaza

Support is for VThaiDex development/project costs and is not connected to VTubers listed in the directory.

## Status

This branch is a staged migration. Production cutover waits for the first canonical snapshot publish and the API checks in the provisioning runbook.
