# VThaiDex

A public directory and industry overview of Thai VTubers, built so that small and independent
creators are as easy to find as the big agencies. No rankings, no follower leaderboards.

Live site: https://vthaidex.vercel.app

## What it shows

- **Home**: a 3D universe of every creator and an independent-creator spotlight.
- **Directory**: search by name or agency, filter by platform and status, links to official channels.
- **Analytics**: count-only industry insights (platforms, debuts, activity, agency size).
- **About, legal and contribute pages**: counting rules, data sources, license and privacy.

Only public, simple information is shown. Adult-flagged creators and audience data are excluded.
Data sources are listed on `/data-license#sources`.

## Contributing

Use the Google Form linked from `/contribute` (new creator, correction, graduation, removal).
It needs no sign-in and collects no email.

## Development

React 19, Tailwind CSS v4 and Vite. Requires Node.js 22+.

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # dist/
```

## License

- Source code: **AGPL-3.0-only** (`LICENSE`)
- Site text and documentation: **CC BY-NC-ND 4.0**
- Compiled dataset and API collection: **All Rights Reserved**
- Third-party names, marks and creator-owned material remain with their owners.

See `LICENSE`, `LICENSE.md` and `/data-license`.

## Support

EasyDonate for the website developer: https://ezdn.app/icezaza
(Supports VThaiDex development; not connected to the VTubers listed.)
