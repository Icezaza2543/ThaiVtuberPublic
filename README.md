# VThaiDex

A lightweight public-facing overview of the Thai VTuber ecosystem.

## Product scope

This site intentionally exposes only simple, public-friendly information:

- total reviewed VTuber records/personas
- platform coverage by unique creator record
- reviewed lifecycle status
- partial debut-year trend where the debut year is known
- a searchable public creator directory

It does **not** expose internal IDs, evidence records, reviewer metadata, audience/network data, private archives, financial observations, or raw analytics.

## Data flow

```text
ThaiVtuber_DATA -> ThaiVtuberSNA -> ThaiVtuberMaster -> public exporter -> VThaiDex
```

Generate Master data first, then from `ThaiVtuberMaster` run:

```bash
python scripts/export_public.py --output ../ThaiVtuberPublic/data
```

This writes:

```text
data/public-summary.json
data/public-creators.json
```

If these files are absent, the frontend uses the data-free bootstrap state and displays `—` instead of invented metrics.

## Local preview

```bash
python -m http.server 5501
```

Open `http://127.0.0.1:5501`.

## Support link

VThaiDex includes an optional support call-to-action for the website developer:

- EasyDonate: https://ezdn.app/icezaza

The UI explicitly states that donations support the website developer and are not connected to VTubers listed in the database.

## Deploy

The repository is static and Vercel-ready. After creating the GitHub repository and pushing `main`, connect it to Vercel with the project root at the repository root.
