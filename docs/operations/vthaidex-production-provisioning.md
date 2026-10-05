# VThaiDex production provisioning runbook

This runbook exists because the implementation deliberately keeps ThaiVtuber_DATA credentials and intake decryption keys off Vercel.

## Vercel project

- Project: `vthaidex`
- Project ID: `prj_sgmNjter1gl73Tl4m6mYQS4W6tm2`
- Team ID: `team_GCgIZE785geT2r3j1QlBitEJ`

## 1. Create one private Blob store

Create a **private** Vercel Blob store linked to the `vthaidex` project. Region `sin1` is preferred for this project unless the owner chooses another region.

The store is used only for:

- versioned sanitized public snapshots;
- encrypted intake ciphertext;
- small pointer/metadata objects.

Do not create a public Blob store for these objects.

After connecting the store to the project, Vercel should inject the Blob credential into the project environment. Do not copy the Blob credential into the browser.

## 2. Create separate application secrets

Generate independent random values for:

```text
VTHAIDEX_PUBLISH_SECRET
VTHAIDEX_CURSOR_SECRET
VTHAIDEX_OPERATOR_SECRET
VTHAIDEX_INTAKE_TOKEN_SECRET
CRON_SECRET
```

Targets: Production and Preview.

Recommended minimums:

- `VTHAIDEX_CURSOR_SECRET`: exactly 32 random bytes encoded base64url;
- all other secrets: at least 32 random bytes, preferably 48 bytes, encoded base64url.

Do not reuse one secret for another purpose.

Generate **fresh values at the successful provisioning session**. Any value that appeared in a failed provisioning attempt, terminal transcript, chat/tool log, screenshot, or support ticket is considered burned and must not be reused.

## 3. Keep intake disabled during provisioning

Set:

```text
VTHAIDEX_INTAKE_ENABLED=false
```

Do not set it to `true` yet.

After the owner generates the RSA intake keypair locally and commits only the approved public JWK, set:

```text
VTHAIDEX_INTAKE_KEY_IDS=vtd-2026-01
```

The exact key ID must match `keys/current.json`.

## 4. Operator machine only

The operator machine needs:

```text
VTHAIDEX_URL=https://vthaidex.vercel.app
VTHAIDEX_PUBLISH_SECRET=<same value as Vercel>
VTHAIDEX_OPERATOR_SECRET=<same value as Vercel>
GOOGLE_APPLICATION_CREDENTIALS=<local canonical read credential>
VTHAIDEX_PRIVATE_KEY=<local encrypted PKCS#8 path>
```

The operator machine may also use `VTUBER_DATA_SPREADSHEET_ID` to override the canonical sheet ID.

Do **not** upload these to Vercel:

```text
GOOGLE_APPLICATION_CREDENTIALS
ThaiVtuber_DATA service-account JSON
VTHAIDEX_PRIVATE_KEY
intake private-key passphrase
```

## 5. Recovery gate before enabling intake

On the operator machine:

1. generate RSA-3072 keypair with `ThaiVtuberMaster/scripts/intake_keys.py`;
2. keep the private key encrypted at rest;
3. create two encrypted offline backups on separate removable media;
4. record the printed public-key SHA-256 fingerprint separately;
5. restore each backup and run `verify-backup`;
6. commit only the public JWK to this repository;
7. point `keys/current.json` at/copy the approved current public JWK;
8. deploy preview and run an encrypted submission;
9. confirm Vercel-side storage contains ciphertext only;
10. decrypt the same submission locally through ThaiVtuberMaster.

Only after all ten checks pass may `VTHAIDEX_INTAKE_ENABLED=true` be set.

## 6. Canonical snapshot gate

Before production cutover:

1. publish a sanitized canonical snapshot to preview/private storage;
2. verify `/api/stats`;
3. verify `/api/creators?limit=24`;
4. verify invalid/tampered cursors fail;
5. verify an older snapshot is rejected;
6. verify a schema-invalid snapshot leaves the current pointer unchanged;
7. recursively inspect public creator responses for forbidden internal keys.

VThaiDex production must contain no credential that can read ThaiVtuber_DATA.

## 7. Firewall rollout

Do not start with blocking rules.

Stage three log-only rule groups:

- `GET /api/creators`: observe high-rate enumeration;
- `GET /api/intake-token` and `POST /api/intake`: observe spam/automation;
- `/api/internal/*`: observe unexpected public access; application authentication remains mandatory.

Review real traffic first. Test challenge/rate-limit in Preview before changing Production behavior. Publishing firewall drafts is an owner-controlled step.

## 8. Rollback

If the new private-backed API fails after cutover:

- roll back to the previous known-good deployment;
- do not restore full public creator JSON as a quick fix;
- keep contribution disabled rather than restore GitHub Issue intake;
- retain the last valid private snapshot for diagnosis.

If encryption/reviewer fails, disable submission and keep ciphertext unchanged. Never add plaintext fallback.
