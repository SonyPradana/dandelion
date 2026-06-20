# Contributing

## Prerequisites

- [pnpm](https://pnpm.io/) 11+
- Node.js 22+
- [Bun](https://bun.sh/) (for `bun run serve.ts`)
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

| Variable               | Required for         | Description                                                                     |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `TARGET_HOST`          | build                | Semicolon-separated host permissions (e.g. `https://example.com;https://*.org`) |
| `FIREFOX_EXTENSION_ID` | build:firefox        | Addon ID (e.g. `@dandelion`)                                                    |
| `AMO_JWT_ISSUER`       | sign:firefox         | AMO API key issuer                                                              |
| `AMO_JWT_SECRET`       | sign:firefox         | AMO API key secret                                                              |
| `CHROME_EXTENSION_KEY` | build:chrome         | Base64-encoded public key (extension ID derivation)                             |
| `HOST`                 | build:firefox, serve | Server hostname (default: `localhost`) — Firefox update_url derivs from this    |
| `PORT`                 | serve                | Starting port for incremental scan (default: `3000`)                            |
| `TLS_CERT`             | serve                | TLS certificate path (default: `keys/localhost.pem`)                            |
| `TLS_KEY`              | serve                | TLS private key path (default: `keys/localhost-key.pem`)                        |

Get AMO API keys at: https://addons.mozilla.org/en-US/developers/addon/api/key/

## Build Pipeline

All scripts run via `pnpm`. The bundler config (`rolldown.config.js`) is shared — the `OUTPUT_DIR` environment variable controls the target directory.

### Chrome

```
rolldown -c           → dist/chrome/ (JS bundles)
copy-static.js        → dist/chrome/ (HTML, CSS, icons)
build-chrome-manifest.js → dist/chrome/manifest.json
```

The `CHROME_EXTENSION_KEY` environment variable injects a `manifest.key` into
`manifest.json` during this step. This makes the Chrome extension ID
**deterministic** — without it Chrome generates a random ID on every load.

The key lives in `keys/development.pem` (RSA private key). Generate it once:

```bash
# One-time: extract public key → base64 → paste into .env as CHROME_EXTENSION_KEY
openssl rsa -pubout -in keys/development.pem | openssl base64 -A
```

After the value is saved in `.env`, the PEM file is no longer needed — only
`CHROME_EXTENSION_KEY` is read at build time and by the update server for
extension ID derivation.

**If the PEM and/or `CHROME_EXTENSION_KEY` are both lost**, generate a new key
pair — the extension ID will change and existing installs become a separate
extension.

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

Chrome auto-update is not supported for self-hosted extensions since v117+. Users install via `chrome://extensions` (developer mode) → Load unpacked from `dist/chrome/`. The `.zip` serves as a distribution archive for manual installation.

### Firefox

```bash
pnpm release:firefox
```

Requires `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` in `.env`.

Output: `artifacts/dandelion-firefox-v<version>-signed.xpi`

The extension must be registered on [AMO](https://addons.mozilla.org/) first.

## Server (`serve.ts`)

The Bun server hosts the update manifest, artifact downloads (`.zip` / `.xpi`), and the token generator.

### Setup

```bash
cp .env.example .env   # ensure HOST, PORT are configured
```

### Run

```bash
bun run serve.ts
```

### TLS Setup

The server auto-detects TLS certs at `keys/localhost.pem` and `keys/localhost-key.pem`.
Generate them with [mkcert](https://github.com/FiloSottile/mkcert) for local development:

```bash
mkcert -install                          # one-time CA install
mkcert -key-file keys/localhost-key.pem -cert-file keys/localhost.pem localhost 127.0.0.1
```

For production, see [Deployment](#deployment) below.

### Endpoints

| Endpoint                | Description                        |
| ----------------------- | ---------------------------------- |
| `/`                     | Landing page (GET & HEAD)          |
| `/health`               | Health check endpoint (GET & HEAD) |
| `/token-generator.html` | Token generator UI page            |
| `/update.json`          | Firefox addon auto-update manifest |
| `/manifest.json`        | Artifact listing + latest version  |
| `/api/versions`         | Alias for `/manifest.json`         |
| `/artifacts/<file>`     | Download `.zip` or `.xpi`          |
| `/<any public file>`    | Static files from `public/`        |

### Auto-Update Flow

Firefox declares `gecko.update_url` in its manifest → Firefox polls `/update.json` → downloads new signed `.xpi` if available. Chrome does not support auto-update for self-hosted extensions since v117+.

### Production

The server must be served over HTTPS — required by Firefox for extension auto-updates.
See [Deployment](#deployment) below for recommended setups.

## Deployment

### PM2 + Bun (Production Ready)

Keep the server alive across reboots with [PM2](https://pm2.keymetrics.io/).  
An `ecosystem.config.cjs` is provided with production-ready defaults:

| Config                  | Value     | Description                          |
| ----------------------- | --------- | ------------------------------------ |
| `interpreter`           | `bun`     | Runtime                              |
| `max_memory_restart`    | `500M`    | Auto-restart if memory exceeds 500MB |
| `autorestart`           | `true`    | Restart on crash                     |
| `restart_delay`         | `5000ms`  | Wait 5s before restarting            |
| `max_restarts`          | `10`      | Limit consecutive restarts           |
| `kill_timeout`          | `10000ms` | Graceful shutdown timeout            |
| `listen_timeout`        | `3000ms`  | Wait for app to listen               |
| `error_file`/`out_file` | `logs/`   | Rotated log files (gitignored)       |

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup       # generates systemd boot command
```

#### Maintenance

Stop, pull updates, and restart (graceful):

```bash
pm2 stop dandelion                 # stop server
git pull origin main               # pull latest code
pm2 start dandelion                # start server again
pm2 save                           # persist process list
```

Or restart in one step (no need to stop first):

```bash
git pull origin main
pm2 restart dandelion
pm2 save
```

### Cloudflare Tunnel

[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) exposes your local server at a public HTTPS URL without opening any firewall ports.

1. Install `cloudflared` from the [official downloads page](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).

2. Authenticate and create a tunnel:

   ```bash
   cloudflared tunnel login
   cloudflared tunnel create dandelion
   ```

3. Configure `~/.cloudflared/config.yml`:

   ```yaml
   tunnel: <tunnel-id>
   credentials-file: ~/.cloudflared/<tunnel-id>.json

   ingress:
     - hostname: your-domain.com
       service: http://localhost:3000
     - service: http_status:404
   ```

4. Route DNS and test:

   ```bash
   cloudflared tunnel route dandelion your-domain.com
   cloudflared tunnel run dandelion    # Ctrl+C to stop
   ```

5. Install as a system service (auto-start on boot):

   ```bash
   sudo cloudflared service install
   sudo systemctl enable --now cloudflared
   ```

6. Set your `.env`:
   ```env
   HOST=localhost
   PORT=3000
   ```

The tunnel serves your server at `https://your-domain.com` — no ports to open.

## Versioning

- `package.json` version uses a Semantic Versioning
- Extension manifests (Chrome + Firefox) require purely numeric versions (`1.0.0`)
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

## Quota & Tier System

Extension ships with an embedded EC public key (`src/quota/public-key.js`) for verifying offline JWT quota tokens (ES256 signed). Tokens grant a `total_limit` of weighted productivity points; once exhausted, a `daily_limit` from the token applies as a grace cap.

| UI label                 | Code namespace    | Description              |
| ------------------------ | ----------------- | ------------------------ |
| "Batas Pemakaian"        | `src/quota/`      | Tab name on options page |
| "Free Tier" / "Pro Tier" | —                 | Plan labels              |
| "Token"                  | `QUOTA_TOKEN_KEY` | Storage key for the JWT  |

### Generator

```bash
# Generate a quota token
bun scripts/gen-quota-token.js \
  -k keys/license-priv.pem \
  -e 7d \
  -p 30000 \
  -d 150 \
  --version-allowed "1.*" \
  --features "skriningform,skrining"
```

| Flag                   | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `-k, --private-key`    | Path to ES256 private key PEM (required)               |
| `-e, --expiry`         | Duration: `7d`, `12m`, `1y`, or date (required)        |
| `-p, --point, --token` | Total limit (0 = unlimited)                            |
| `-d, --daily-limit`    | Grace daily limit after total exhausted (default: 100) |
| `--version-allowed`    | Comma-separated allowed extension versions             |
| `--features`           | Comma-separated feature names                          |
| `--token-id`           | Custom token ID (default: auto-generated)              |

### Key Pair

```bash
# Generate key pair (one-time per version)
node scripts/generate-license-keys.js

# Output:
#   keys/license-priv.pem  → PRIVATE (keep secure, sign tokens)
#   keys/license-pub.pem   → PUBLIC  (embed in extension)

# The public key is already embedded in src/quota/public-key.js.
# To update for a new release, replace the PEM and update version.
```

The public key is **committed** (`src/quota/public-key.js`) — it is not a secret. No build-time injection or `.env` variable is needed.

**Key rolling is rarely needed.** One key pair can serve the project's lifetime. Only generate a new pair if:

| Scenario                             | Action                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Private key leaked/committed         | **Mandatory** — all existing tokens become invalid; users must re-activate |
| Intentional revocation of all tokens | Can be done — new key rejects all old signatures                           |
| Routine release                      | Not needed — use `version_allowed` in JWT instead                          |
| Minor update / bugfix                | Not needed                                                                 |

`version_allowed` in the JWT controls which extension versions accept the token — this is the primary mechanism for version gating, not key rotation.

### Feature Routing

Auto handlers in `main.js` are gated by `isFeatureEnabled(name)`:

| Feature string              | Handler                  | Description      |
| --------------------------- | ------------------------ | ---------------- |
| `skriningform`              | `initializeSkriningForm` | Form skrining    |
| `skrining`                  | `initializeSkrining`     | Halaman skrining |
| `skrining-form-not-checked` | `initializeNotChecked`   | Tidak periksa    |

- **Free Tier**: `isFeatureEnabled()` always returns `true` for all features.
- **Pro Tier**: only features listed in the token `features[]` array are enabled.
- Unlisted features are silently skipped — the handler does not run on matching URLs.

### Bundle Initialisation

Each JS bundle is a separate IIFE with its own `quota-manager` module scope. `init()` must be called explicitly in each entry point:

| Bundle     | Entry          | `init()` call       |
| ---------- | -------------- | ------------------- |
| `main.js`  | Content script | `await quotaInit()` |
| `popup.js` | Popup page     | `await init()`      |
| `index.js` | Config page    | `await init()`      |

Without `await init()`, `getStatus()` returns `isFreePlan: true` (default state) and the Pro Tier UI / feature gates will not work.

### Limit Behaviour

| Scenario                       | Total limit | Daily cap                |
| ------------------------------ | ----------- | ------------------------ |
| Free Tier (no token / invalid) | Unlimited   | 50/day                   |
| Pro Tier, within total limit   | From token  | Unlimited                |
| Pro Tier, total exhausted      | —           | `daily_limit` from token |

## Project Structure

```
.github/
  workflows/ci.yml     — CI pipeline
  CONTRIBUTING.md      — this file
scripts/
  build-firefox-manifest.js — Firefox manifest injector
  build-chrome-manifest.js  — Chrome manifest injector
  copy-static.js        — copies HTML/CSS/icons
  gen-quota-token.js   — quota token generator
  generate-license-keys.js — EC key pair generator
  package.js            — Chrome zip + Firefox XPI copy
  remove-static.js      — rm -rf equivalent (fs.rmSync)
  sign-firefox.js       — AMO signing via web-ext API
src/
  manifest.json         — Chrome manifest template
  manifest.firefox.json — Firefox manifest template
  quota/                — Offline quota system
    public-key.js       — Embedded EC public key
    verify.js           — JWT verification (jose + ES256)
    cache.js            — Verification result cache (8 hours TTL)
    quota-manager.js    — Public API (init, getStatus, canUseTokens, isFeatureEnabled, saveToken, removeToken, getToken)
rolldown.config.js      — shared bundler config
package.json            — scripts & dependencies
.env.example            — documented env vars
```
