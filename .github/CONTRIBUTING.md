# Contributing

## Prerequisites

- [pnpm](https://pnpm.io/) 9+
- Node.js 20+
- Firefox (for `web-ext lint` and `web-ext sign`)

## Quick Start

```bash
pnpm install
cp .env.example .env   # then fill in your env vars
pnpm build             # builds both Chrome and Firefox
pnpm verify:firefox    # runs web-ext lint
```

## Scripts

| Script                 | Description                            |
| ---------------------- | -------------------------------------- |
| `pnpm lint`            | Run oxlint on all files                |
| `pnpm lint:fix`        | Auto-fix lint errors                   |
| `pnpm format`          | Auto-format with oxfmt                 |
| `pnpm format:check`    | Check formatting (CI)                  |
| `pnpm build`           | Build Chrome + Firefox                 |
| `pnpm build:chrome`    | Build Chrome only → `dist/chrome/`     |
| `pnpm build:firefox`   | Build Firefox only → `dist/firefox/`   |
| `pnpm sign:firefox`    | Sign Firefox via AMO (requires `.env`) |
| `pnpm release:chrome`  | Build + zip Chrome → `artifacts/`      |
| `pnpm release:firefox` | Build + sign + copy XPI → `artifacts/` |
| `pnpm release`         | Release both                           |
| `pnpm verify:firefox`  | `web-ext lint` on `dist/firefox/`      |
| `pnpm clean`           | Delete `dist/`                         |
| `pnpm clean:chrome`    | Delete `dist/chrome/`                  |
| `pnpm clean:firefox`   | Delete `dist/firefox/`                 |

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable               | Required for  | Description                                                                     |
| ---------------------- | ------------- | ------------------------------------------------------------------------------- |
| `TARGET_HOST`          | build         | Semicolon-separated host permissions (e.g. `https://example.com;https://*.org`) |
| `FIREFOX_EXTENSION_ID` | build:firefox | Addon ID (e.g. `@dandelion`)                                                    |
| `AMO_JWT_ISSUER`       | sign:firefox  | AMO API key issuer                                                              |
| `AMO_JWT_SECRET`       | sign:firefox  | AMO API key secret                                                              |

Get AMO API keys at: https://addons.mozilla.org/en-US/developers/addon/api/key/

## Build Pipeline

All scripts run via `pnpm`. The bundler config (`rolldown.config.js`) is shared — the `OUTPUT_DIR` environment variable controls the target directory.

### Chrome

```
rolldown -c           → dist/chrome/ (JS bundles)
copy-static.js        → dist/chrome/ (HTML, CSS, icons)
build-chrome-manifest.js → dist/chrome/manifest.json
```

### Firefox

```
rolldown -c           → dist/firefox/ (JS bundles, same code)
copy-static.js        → dist/firefox/ (HTML, CSS, icons)
build-firefox-manifest.js → dist/firefox/manifest.json
                        (injects gecko.id, version, data_collection_permissions)
```

The JavaScript bundles are identical for both browsers — only the manifests differ (Firefox includes `browser_specific_settings.gecko`).

## Release & Distribution

### Chrome

```bash
pnpm release:chrome
```

Output: `artifacts/dandelion-chrome-v<version>.zip`

Submit to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

### Firefox

```bash
pnpm release:firefox
```

Requires `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` in `.env`.

Output: `artifacts/dandelion-firefox-v<version>-signed.xpi`

The extension must be registered on [AMO](https://addons.mozilla.org/) first.

## Versioning

- `package.json` version uses a pre-release tag: `1.0.0-alfa.1`
- Extension manifests (Chrome + Firefox) require purely numeric versions (`1.0.0`), so the pre-release suffix is stripped automatically during build
- When bumping, only edit `version` in `package.json` — manifests are updated automatically

## Code Quality

- `pnpm lint` must pass (0 errors, 0 warnings)
- `pnpm format:check` must pass
- CI (`ci.yml`) runs both on every push and PR

Known lint warnings (not actionable):

| Warning                                  | Reason                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `UNSAFE_VAR_ASSIGNMENT`                  | innerHTML usage in existing code                                                                        |
| `KEY_FIREFOX_UNSUPPORTED_BY_MIN_VERSION` | `data_collection_permissions` requires FF 140+, but `strict_min_version` is 109 for Windows 8.1 support |

## Offline License System

Extension ships with an embedded EC public key (`src/license/public-key.js`) for verifying offline JWT licenses (ES256 signed). Licenses grant a `total_limit` of weighted productivity points; once exhausted, a `daily_limit` from the JWT applies as a grace cap.

### Generator

```bash
# Generate a license JWT
node scripts/gen-license.mjs \
  -k keys/license-priv.pem \
  -e 90d \
  -p 30000 \
  -d 150 \
  --version-allowed "1.0.0,1.1.0" \
  --features "skriningform,skrining"
```

| Flag                   | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `-k, --private-key`    | Path to ES256 private key PEM (required)                 |
| `-e, --expiry`         | Duration: `90d`, `12m`, `1y`, or `2027-01-01` (required) |
| `-p, --point, --token` | Total limit (0 = unlimited)                              |
| `-d, --daily-limit`    | Grace daily limit after total exhausted (default: 100)   |
| `--version-allowed`    | Comma-separated allowed extension versions               |
| `--features`           | Comma-separated feature names                            |
| `--license-id`         | Custom license ID (default: auto-generated)              |

### Key Pair

```bash
# Generate key pair (one-time per version)
node scripts/generate-license-keys.js

# Output:
#   keys/license-priv.pem  → PRIVATE (keep secure, sign licenses)
#   keys/license-pub.pem   → PUBLIC  (embed in extension)

# The public key is already embedded in src/license/public-key.js.
# To update for a new release, replace the PEM and update version.
```

The public key is **committed** (`src/license/public-key.js`) — it is not a secret. No build-time injection or `.env` variable is needed.

**Key rolling is rarely needed.** One key pair can serve the project's lifetime. Only generate a new pair if:

| Scenario | Action |
|----------|--------|
| Private key leaked/committed | **Mandatory** — all existing licenses become invalid; users must re-activate |
| Intentional revocation of all licenses | Can be done — new key rejects all old signatures |
| Routine release | Not needed — use `version_allowed` in JWT instead |
| Minor update / bugfix | Not needed |

`version_allowed` in the JWT controls which extension versions accept the license — this is the primary mechanism for version gating, not key rotation.

### Feature Routing

Auto handlers in `main.js` are gated by `isFeatureEnabled(name)`:

| Feature string        | Handler               | Description      |
| --------------------- | --------------------- | ---------------- |
| `skriningform`        | `initializeSkriningForm` | Form skrining |
| `skrining`            | `initializeSkrining`     | Halaman skrining |
| `skrining-form-not-checked` | `initializeNotChecked` | Tidak periksa |

- **Free plan**: `isFeatureEnabled()` always returns `true` for all features.
- **Pro plan**: only features listed in the JWT `features[]` array are enabled.
- Unlisted features are silently skipped — the handler does not run on matching URLs.

### Bundle Initialisation

Each JS bundle is a separate IIFE with its own `license-manager` module scope. `init()` must be called explicitly in each entry point:

| Bundle | Entry | `init()` required? |
|--------|-------|--------------------|
| `main.js` | Content script | Yes — `await licenseInit()` |
| `popup.js` | Popup page | Yes — `await init()` |
| `index.js` | Config page | Yes — `await init()` |

Without `await init()`, `getStatus()` returns `isFreePlan: true` (default state) and the PRO UI / feature gates will not work.

### Limit Behaviour

| Scenario                     | Total limit | Daily cap              |
| ---------------------------- | ----------- | ---------------------- |
| Free plan (no JWT / invalid) | Unlimited   | 100/day                |
| Pro, within total limit      | From JWT    | Unlimited              |
| Pro, total exhausted         | —           | `daily_limit` from JWT |

## Project Structure

```
.github/
  workflows/ci.yml     — CI pipeline
  CONTRIBUTING.md      — this file
scripts/
  build-firefox-manifest.js — Firefox manifest injector
  build-chrome-manifest.js  — Chrome manifest injector
  copy-static.js        — copies HTML/CSS/icons
  gen-license.mjs       — license JWT generator
  generate-license-keys.js — EC key pair generator
  package.js            — Chrome zip + Firefox XPI copy
  remove-static.js      — rm -rf equivalent (fs.rmSync)
  sign-firefox.js       — AMO signing via web-ext API
src/
  manifest.json         — Chrome manifest template
  manifest.firefox.json — Firefox manifest template
  license/              — Offline license system
    public-key.js       — Embedded EC public key
    verify.js           — JWT verification (jose + ES256)
    cache.js            — Verification result cache (10 min TTL)
    license-manager.js  — Public API (init, canUseTokens, etc.)
rolldown.config.js      — shared bundler config
package.json            — scripts & dependencies
.env.example            — documented env vars
```
