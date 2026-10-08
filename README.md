# VThaiDex

A privacy-first public directory and industry overview of Thai VTubers, built so that small and
independent creators are as easy to find as the big agencies. No rankings, no follower leaderboards.

Live site: https://vthaidex.vercel.app (production deploys are paused; see [Status](#status)).

## Product scope

VThaiDex shows only simple, public-friendly information:

- **Home**: a 3D "universe" of every creator (agencies as planets, independents as stars), a random
  independent-creator picker, and an indie spotlight where every independent has the same chance.
- **Directory** (`/directory`): search by name or agency, filter by platform, status and
  independent/agency, with links to each creator's official channels.
- **Industry analytics** (`/analytics`): totals, platform coverage, debut trends, and count-only
  insights such as share of independents, activity, YouTube follower bands, agency size, and
  livestream-platform combinations. Agencies are grouped as small (<100K), mid (100K–1M) and
  big (≥1M) by their members' summed YouTube followers; creators with no known agency count as
  independent.
- **About, legal and contribute pages**: counting rules, data sources, license, privacy, and a link to
  the owner's Google Form.

It deliberately excludes internal IDs, evidence/reviewer metadata, audience/network data, private
archives, financial observations, raw analytical data, and adult-flagged creators.

## Where the data comes from

The registry is built and reviewed in the private repository
[`ThaiVtuberData`](https://github.com/Icezaza2543/ThaiVtuberData) (canonical Google Sheet
**ThaiVtuber_DATA**). Sources are listed publicly on `/data-license#sources`: Thai VTuber directories
(vtuberthai.com, VtuberThaiInfo archive), public channel data from YouTube/Twitch/TikTok, public social
profiles, creator-support profile pages (name and link only), official link hubs and agency
announcements, and reviewed contributions from the Google Form.

## Architecture

```text
ThaiVtuber_DATA (Google Sheet, private)
      |
      | read on the operator's machine only
      v
ThaiVtuberData/master/scripts/publish_vthaidex.py
  sanitized projection + count-only insights
      |
      | signed push (POST /api/internal/publish)
      v
private Vercel Blob snapshot
      |
      +--> GET /api/stats
      +--> GET /api/creators?cursor=...
      |
      v
VThaiDex frontend (this repo)
```

VThaiDex production does **not** receive credentials that can read ThaiVtuber_DATA. The public
frontend does not ship a full creator JSON/CSV dataset: directory access is paginated and bounded to
24 creator records per request, and `lib/public-schema.js` rejects any snapshot field outside a strict
allowlist.

## Contribution flow

Contributions go through an owner-managed **Google Form** linked from `/contribute`. The form branches
by request type (new creator, correction, graduation, removal by the owner of a channel), collects no
email and needs no sign-in. The site itself has no submission endpoint and stores no contributor data.
The owner reviews answers against public evidence and applies accepted changes in ThaiVtuber_DATA
through the normal review scripts; the next snapshot publish updates VThaiDex.

## Public routes

```text
/
/directory
/analytics
/about
/contribute
/terms
/terms-of-use
/privacy
/data-license
```

Public content routes use clean URLs for SEO. `/contribute`, `/api/*`, and internal endpoints are
noindex.

## API boundaries

```text
GET  /api/stats
GET  /api/creators?q=&platform=&status=&cursor=&limit=

POST /api/internal/publish
```

The publish endpoint requires its own secret. Public API responses never expose canonical IDs or review
metadata.

## Security boundaries

Vercel holds sanitized private snapshots and the publish/cursor secrets. It must **not** hold
ThaiVtuber_DATA Google credentials, so a VThaiDex breach cannot pivot into the canonical database.
`vercel.json` sets a strict Content-Security-Policy (`default-src 'self'`): fonts, icons and images are
self-hosted and the site makes no third-party requests.

## Licensing

- source code: **AGPL-3.0-only** (`LICENSE`): anyone may use, modify and share it; a modified version
  offered to users over a network must publish its source under AGPL-3.0
- VThaiDex-authored UI text, explanatory text and documentation: **CC BY-NC-ND 4.0** (attribution,
  non-commercial, no derivatives)
- compiled database / dataset / API collection: **All Rights Reserved**
- third-party names, marks, logos, media, and creator-owned material remain with their owners.

See `LICENSE`, `LICENSE.md` and `/data-license`.

## Development

React 19 + Tailwind CSS v4, built by Vite as a multi-page site (one HTML entry per route, so each page
keeps its own SEO head). Pages live in `src/pages/`, shared layout in `src/components/`, API helpers in
`src/lib/api.js`, theme tokens and components in `src/styles.css`.

The visual design is the "Night Stage" theme (dark stage purple with pink and sky accents, a light theme
from the same tokens), adapted from a Google Stitch mockup; the brief is in `docs/design/DESIGN.md`.
Redesigns change the look only: layout, functions and copy stay. The home page's 3D universe
(`src/components/Universe.jsx`, three.js via react-three-fiber) is lazy-loaded and drawn only from
aggregate stats.

Requires Node.js 22+.

```bash
npm install
npm run dev      # http://localhost:5173, /api proxied to production
npm test         # API, schema, static-page and data-helper tests
npm run build    # dist/
```

`VTHAIDEX_SNAPSHOT_FILE=<snapshot.json> npm run dev` serves every `/api` route from a local snapshot
through the real handlers, e.g. to preview a new snapshot before it is published. Vercel builds with
`npm run build` and serves `dist/` plus the functions in `api/`.

## Production provisioning

Admin-only provisioning steps are documented in:

```text
docs/operations/vthaidex-production-provisioning.md
```

## Support

EasyDonate for the website developer:

https://ezdn.app/icezaza

Support is for VThaiDex development/project costs and is not connected to VTubers listed in the
directory.

## Status

Feature-complete (owner, 2026-10-08) and merged to `main`. Automatic production deploys from `main` are
paused with `"git": {"deploymentEnabled": {"main": false}}` in `vercel.json`, so vthaidex.vercel.app
still serves the previous release. To launch: remove that setting, publish a fresh snapshot from
ThaiVtuberData, and deploy.
