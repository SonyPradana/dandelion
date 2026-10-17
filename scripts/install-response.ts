// Renders the enterprise install artifacts served by serve.ts:
//   /updates/chrome.xml        → gupdate manifest (Chrome, Edge, Brave)
//   /install/<browser>.ps1     → Windows policy script (self-elevating)
//   /install/<browser>.sh      → macOS + Linux policy script (auto sudo)
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

const WINDOWS_POLICY_PATHS: Record<InstallBrowser, string> = {
  chrome: 'HKLM:\\SOFTWARE\\Policies\\Google\\Chrome',
  edge: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge',
  brave: 'HKLM:\\SOFTWARE\\Policies\\BraveSoftware\\Brave',
};

const MACOS_DOMAINS: Record<InstallBrowser, string> = {
  chrome: 'com.google.Chrome',
  edge: 'com.microsoft.Edge',
  brave: 'com.brave.Browser',
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

export function renderChromeUpdateXml({ id, version, crxUrl }: UpdateXmlInput): string {
  return `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${id}'>
    <updatecheck codebase='${crxUrl}' version='${version}' />
  </app>
</gupdate>
`;
}

export function renderPowerShellInstaller(browser: InstallBrowser, links: InstallLinks): string {
  const label = BROWSER_LABELS[browser];
  const policyPath = WINDOWS_POLICY_PATHS[browser];
  return `# Dandelion — pemasangan ${label} via kebijakan enterprise (Windows)
# Jalankan di PowerShell: irm ${links.installUrl} | iex
$ErrorActionPreference = 'Stop'

$InstallUrl = '${links.installUrl}'
$ExtensionId = '${links.id}'
$UpdateXmlUrl = '${links.updateUrl}'
$Origin = '${links.origin}/*'
$PolicyPath = '${policyPath}'

$principal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host 'Meminta hak administrator...' -ForegroundColor Yellow
  Start-Process powershell -Verb RunAs -ArgumentList @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
    "irm '$InstallUrl' | iex"
  )
  exit
}

Write-Host 'Mengonfigurasi kebijakan ${label}...' -ForegroundColor Cyan

$SourcesPath = "$PolicyPath\\ExtensionInstallSources"
if (-not (Test-Path $SourcesPath)) { New-Item -Path $SourcesPath -Force | Out-Null }
New-ItemProperty -Path $SourcesPath -Name '1' -Value $Origin -PropertyType String -Force | Out-Null

$ForcelistPath = "$PolicyPath\\ExtensionInstallForcelist"
if (-not (Test-Path $ForcelistPath)) { New-Item -Path $ForcelistPath -Force | Out-Null }
New-ItemProperty -Path $ForcelistPath -Name '1' -Value "$ExtensionId;$UpdateXmlUrl" -PropertyType String -Force | Out-Null

Write-Host 'Selesai! Dandelion terpasang saat ${label} dibuka ulang.' -ForegroundColor Green
Write-Host "Untuk mencopot: hapus ExtensionInstallForcelist dan ExtensionInstallSources di $PolicyPath, lalu buka ulang ${label}."
`;
}

export function renderShellInstaller(browser: InstallBrowser, links: InstallLinks): string {
  const label = BROWSER_LABELS[browser];
  const macDomain = MACOS_DOMAINS[browser];
  const linuxDir = LINUX_POLICY_DIRS[browser];
  return `#!/bin/sh
# Dandelion — pemasangan ${label} via kebijakan enterprise (macOS & Linux)
# Jalankan: curl -fsSL ${links.installUrl} | sh
set -eu

EXTENSION_ID='${links.id}'
UPDATE_XML_URL='${links.updateUrl}'
SOURCES='${links.origin}/*'

run_root() {
  if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi
}

case "$(uname -s)" in
  Darwin)
    DOMAIN='${macDomain}'
    run_root defaults write "/Library/Preferences/$DOMAIN" ExtensionInstallForcelist -array "$EXTENSION_ID;$UPDATE_XML_URL"
    run_root defaults write "/Library/Preferences/$DOMAIN" ExtensionInstallSources -array "$SOURCES"
    echo 'Selesai! Dandelion terpasang saat ${label} dibuka ulang.'
    echo "Untuk mencopot: sudo defaults delete \\"/Library/Preferences/$DOMAIN\\" ExtensionInstallForcelist && sudo defaults delete \\"/Library/Preferences/$DOMAIN\\" ExtensionInstallSources"
    ;;
  Linux)
    DIR='${linuxDir}'
    run_root mkdir -p "$DIR"
    printf '{"ExtensionInstallForcelist":["%s"],"ExtensionInstallSources":["%s"]}\\n' "$EXTENSION_ID;$UPDATE_XML_URL" "$SOURCES" | run_root tee "$DIR/dandelion.json" >/dev/null
    echo 'Selesai! Dandelion terpasang saat ${label} dibuka ulang.'
    echo "Untuk mencopot: sudo rm $DIR/dandelion.json"
    ;;
  *)
    echo "OS tidak didukung: $(uname -s). Gunakan Windows, macOS, atau Linux." >&2
    exit 1
    ;;
esac
`;
}

export function renderPowerShellUninstaller(browser: InstallBrowser, links: InstallLinks): string {
  const label = BROWSER_LABELS[browser];
  const policyPath = WINDOWS_POLICY_PATHS[browser];
  return `# Dandelion — pencopotan ${label} via kebijakan enterprise (Windows)
# Jalankan di PowerShell: irm ${links.origin}/uninstall/${browser}.ps1 | iex
$ErrorActionPreference = 'Stop'

$UninstallUrl = '${links.origin}/uninstall/${browser}.ps1'
$ExtensionId = '${links.id}'
$Origin = '${links.origin}/*'
$PolicyPath = '${policyPath}'

$principal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host 'Meminta hak administrator...' -ForegroundColor Yellow
  Start-Process powershell -Verb RunAs -ArgumentList @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
    "irm '$UninstallUrl' | iex"
  )
  exit
}

Write-Host 'Mencopot kebijakan ${label}...' -ForegroundColor Cyan

function Remove-Entry($Path, $Pattern) {
  if (-not (Test-Path $Path)) { return }
  foreach ($name in (Get-Item $Path).Property) {
    $value = (Get-ItemProperty -Path $Path -Name $name).$name
    if ($value -like $Pattern) { Remove-ItemProperty -Path $Path -Name $name }
  }
  if (-not (Get-Item $Path).Property) { Remove-Item -Path $Path -Force }
}

Remove-Entry "$PolicyPath\\ExtensionInstallForcelist" "$ExtensionId;*"
Remove-Entry "$PolicyPath\\ExtensionInstallSources" $Origin

Write-Host 'Selesai! Buka ulang ${label} untuk menerapkan perubahan.' -ForegroundColor Green
Write-Host "Entri kebijakan lain di $PolicyPath tidak diubah."
`;
}

export function renderShellUninstaller(browser: InstallBrowser, links: InstallLinks): string {
  const label = BROWSER_LABELS[browser];
  const macDomain = MACOS_DOMAINS[browser];
  const linuxDir = LINUX_POLICY_DIRS[browser];
  return `#!/bin/sh
# Dandelion — pencopotan ${label} via kebijakan enterprise (macOS & Linux)
# Jalankan: curl -fsSL ${links.origin}/uninstall/${browser}.sh | sh
set -eu

run_root() {
  if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi
}

case "$(uname -s)" in
  Darwin)
    DOMAIN='${macDomain}'
    run_root defaults delete "/Library/Preferences/$DOMAIN" ExtensionInstallForcelist 2>/dev/null || true
    run_root defaults delete "/Library/Preferences/$DOMAIN" ExtensionInstallSources 2>/dev/null || true
    echo 'Selesai! Buka ulang ${label} untuk menerapkan perubahan.'
    ;;
  Linux)
    DIR='${linuxDir}'
    run_root rm -f "$DIR/dandelion.json"
    echo 'Selesai! Buka ulang ${label} untuk menerapkan perubahan.'
    ;;
  *)
    echo "OS tidak didukung: $(uname -s). Gunakan Windows, macOS, atau Linux." >&2
    exit 1
    ;;
esac
`;
}
