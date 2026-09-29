# Security Policy

Dandelion is a browser extension that fills in forms you configure yourself, plus
a Bun server that hosts releases and a quota token generator. Reports are taken
seriously.

## Reporting a vulnerability

Use GitHub's private advisory channel:

**[Report a vulnerability](https://github.com/SonyPradana/dandelion/security/advisories/new)**

Do not open a public issue, discussion, or pull request about a vulnerability, even
if you think it is minor. Do not post proof of concept code in a public place. Do
not access data that does not belong to you, testing stays within accounts you own.

## What to include

- Extension version, shown in the popup and on the config page
- Browser and browser version, operating system
- What the vulnerability lets an attacker do
- Steps to reproduce, or a proof of concept
- Logs or screenshots, blurred if they contain personal data

## In scope

- Handling of the form values a user configures, and of the local storage that
  holds them. No form value is sent to a server.
- The quota token system: ES256 signing with the key in `keys/license-priv.pem`, and
  offline verification of tokens.
- The update server in `serve.ts`: the `/token-generator.html`, `/update.json`,
  `/manifest.json` and `/artifacts/` routes, and the SQLite database under `data/`.
- Manifest permissions, host permissions, and what content scripts can reach.

## Out of scope

- Vulnerabilities in the sites the extension runs on. Report those to whoever
  operates them.
- TLS or certificate problems in a setup you control yourself.
- Findings that need physical access to an unlocked machine.
- Anything reachable only by the user themselves, such as inspecting their own
  stored data with devtools.

## Response

Reports are usually acknowledged within a few days. Fix timelines depend on
severity and on whether the bug also affects the update server. Credit in the
advisory is available on request.

<!--
## Supported versions

Uncomment this once the support policy is decided. GitHub renders the table only
when the heading and the table below are plain text, not inside a comment.

| Version | Supported |
| ------- | --------- |
| 1.7.2   | Yes       |
-->
