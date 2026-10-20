// Renders the enterprise install artifacts served by serve.ts:
//   /updates/chrome.xml        → gupdate manifest (Chrome, Edge, Brave)
//   /install/<browser>.sh      → Linux policy script (auto sudo)
//
// Force-installing via policy keeps the extension updated through the same
// gupdate XML, so every artifact embeds the crx id + update URL.

export type InstallBrowser = 'chrome' | 'edge' | 'brave';

export const INSTALL_BROWSERS: readonly InstallBrowser[] = ['chrome', 'edge', 'brave'];

const BROWSER_LABELS: Record<InstallBrowser, string> = {
  chrome: 'Chrome',
  edge: 'Microsoft Edge',
  brave: 'Brave',
};

const LINUX_POLICY_DIRS: Record<InstallBrowser, string> = {
  chrome: '/etc/opt/chrome/policies/managed',
  edge: '/etc/opt/edge/policies/managed',
  brave: '/etc/brave/policies/managed',
};

export interface UpdateXmlInput {
  id: string;
  version: string;
  crxUrl: string;
}

export interface InstallLinks {
  id: string;
  updateUrl: string;
  origin: string;
  installUrl: string;
}

// Escapes XML entity characters. Applied to every value interpolated into
// generated XML so artifact metadata can never break out of an attribute.
export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&apos;')
    .replaceAll('"', '&quot;');
}

export function renderChromeUpdateXml({ id, version, crxUrl }: UpdateXmlInput): string {
  return `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${escapeXml(id)}'>
    <updatecheck codebase='${escapeXml(crxUrl)}' version='${escapeXml(version)}' />
  </app>
</gupdate>
`;
}

export function renderShellInstaller(browser: InstallBrowser, links: InstallLinks): string {
  const label = BROWSER_LABELS[browser];
  const linuxDir = LINUX_POLICY_DIRS[browser];
  return `#!/bin/sh
# Dandelion — pemasangan ${label} via kebijakan enterprise (Linux)
# Jalankan: curl -fsSL ${links.installUrl} | sh
set -eu

EXTENSION_ID='${links.id}'
UPDATE_XML_URL='${links.updateUrl}'
SOURCES='${links.origin}/*'

run_root() {
  if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi
}

if [ "$(uname -s)" != 'Linux' ]; then
  echo "OS tidak didukung: $(uname -s). Hanya Linux yang didukung." >&2
  exit 1
fi

DIR='${linuxDir}'
run_root mkdir -p "$DIR"
printf '{"ExtensionInstallForcelist":["%s"],"ExtensionInstallSources":["%s"],"ExtensionSettings":{"%s":{"update_url":"%s","override_update_url":true}}}\\n' "$EXTENSION_ID;$UPDATE_XML_URL" "$SOURCES" "$EXTENSION_ID" "$UPDATE_XML_URL" | run_root tee "$DIR/dandelion.json" >/dev/null
echo 'Selesai! Dandelion terpasang saat ${label} dibuka ulang.'
echo "Untuk mencopot: sudo rm $DIR/dandelion.json"
`;
}

export function renderShellUninstaller(browser: InstallBrowser, links: InstallLinks): string {
  const label = BROWSER_LABELS[browser];
  const linuxDir = LINUX_POLICY_DIRS[browser];
  return `#!/bin/sh
# Dandelion — pencopotan ${label} via kebijakan enterprise (Linux)
# Jalankan: curl -fsSL ${links.origin}/uninstall/${browser}.sh | sh
set -eu

run_root() {
  if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi
}

if [ "$(uname -s)" != 'Linux' ]; then
  echo "OS tidak didukung: $(uname -s). Hanya Linux yang didukung." >&2
  exit 1
fi

DIR='${linuxDir}'
run_root rm -f "$DIR/dandelion.json"
echo 'Selesai! Buka ulang ${label} untuk menerapkan perubahan.'
`;
}
