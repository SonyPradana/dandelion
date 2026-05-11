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
build-manifest.js     → dist/chrome/manifest.json
```

### Firefox

```
rolldown -c           → dist/firefox/ (JS bundles, same code)
copy-static.js        → dist/firefox/ (HTML, CSS, icons)
build-firefox.js      → dist/firefox/manifest.json
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

## Project Structure

```
.github/
  workflows/ci.yml     — CI pipeline
  CONTRIBUTING.md      — this file
scripts/
  build-firefox.js      — Firefox build orchestrator
  build-manifest.js     — Chrome manifest injector
  copy-static.js        — copies HTML/CSS/icons
  package.js            — Chrome zip + Firefox XPI copy
  remove-static.js      — rm -rf equivalent (fs.rmSync)
  sign-firefox.js       — AMO signing via web-ext API
src/
  manifest.json         — Chrome manifest template
  manifest.firefox.json — Firefox manifest template
rolldown.config.js      — shared bundler config
package.json            — scripts & dependencies
.env.example            — documented env vars
```
