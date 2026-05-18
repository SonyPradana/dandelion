# Dandelion Offline License System

## JWT Payload

```json
{
  "iss": "Dandelion",
  "aud": "dandelion-extension",
  "sub": "license",
  "license_id": "lic_xxx",
  "features": [],
  "total_limit": 30000,
  "daily_limit": 150,
  "version_allowed": ["1.0.0", "1.1.0"],
  "iat": 1747070400,
  "exp": 1778606400
}
```

## Limit Logic

| Scenario                                        | Total limit | Daily cap              |
| ----------------------------------------------- | ----------- | ---------------------- |
| Free plan (no JWT / invalid / version mismatch) | Unlimited   | 100/day                |
| Pro, within total limit                         | From JWT    | Unlimited              |
| Pro, total exhausted                            | —           | `daily_limit` from JWT |

## Files

| File                               | Role                                                                |
| ---------------------------------- | ------------------------------------------------------------------- |
| `src/license/public-key.js`        | Embedded EC public key (committed)                                  |
| `src/license/verify.js`            | `verifyLicense(jwt)` — ES256 via jose                               |
| `src/license/cache.js`             | browser.storage cache, TTL 10 menit                                 |
| `src/license/license-manager.js`   | API: init, getStatus, canUseTokens, saveLicense, removeLicense      |
| `scripts/gen-license.mjs`          | CLI: `-k priv.pem -e 90d -p 30000 -d 150 --version-allowed "1.0.0"` |
| `scripts/generate-license-keys.js` | Dev helper: EC P-256 key pair                                       |

## Generator Usage

```bash
node scripts/gen-license.mjs -k keys/license-priv.pem -e 90d -p 30000 -d 150 --version-allowed "1.0.0"
```

## Deferred

- UI input JWT di options page (tab License)
- Popup badge status
- Limit enforcement (warn-only)
