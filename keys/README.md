# VThaiDex intake public key

Production intake uses a public RSA-OAEP key generated on the operator machine with `ThaiVtuberMaster/scripts/intake_keys.py`.

Only the public JWK may be copied into this directory. The encrypted PKCS#8 private key and its passphrase must never be committed or uploaded to Vercel.

The active browser path is `/keys/current.json`. During initial provisioning/rotation, verify the public-key fingerprint and then copy the approved versioned public JWK to `keys/current.json` on the feature branch before enabling intake.
