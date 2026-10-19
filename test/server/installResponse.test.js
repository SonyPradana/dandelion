import { describe, expect, it } from 'vitest';
import {
  escapeXml,
  renderChromeUpdateXml,
  renderPowerShellInstaller,
  renderPowerShellUninstaller,
  renderShellInstaller,
  renderShellUninstaller,
} from '../../scripts/install-response.js';

const ID = 'bppmaeamamkihhpackebpafedaaeanle';
const LINKS = {
  id: ID,
  updateUrl: 'https://dandelion.web.id/updates/chrome.xml',
  origin: 'https://dandelion.web.id',
  installUrl: 'https://dandelion.web.id/install/chrome.ps1',
};

describe('escapeXml', () => {
  it('escapes every XML entity character once', () => {
    expect(escapeXml(`&<>'"`)).toBe('&amp;&lt;&gt;&apos;&quot;');
    expect(escapeXml('1.8.0')).toBe('1.8.0');
  });
});

describe('renderChromeUpdateXml', () => {
  it('emits a gupdate manifest with appid, codebase, and version', () => {
    const xml = renderChromeUpdateXml({
      id: ID,
      version: '1.8.0',
      crxUrl: `https://dandelion.web.id/artifacts/dandelion-chrome-v1.8.0.crx`,
    });
    expect(xml).toContain(`xmlns='http://www.google.com/update2/response'`);
    expect(xml).toContain(`appid='${ID}'`);
    expect(xml).toContain(
      `codebase='https://dandelion.web.id/artifacts/dandelion-chrome-v1.8.0.crx'`,
    );
    expect(xml).toContain(`version='1.8.0'`);
  });

  it('escapes XML special characters in attribute values', () => {
    const xml = renderChromeUpdateXml({
      id: 'abc&<>',
      version: `1.0.0'`,
      crxUrl: `https://x.test/a'b&c`,
    });
    expect(xml).toContain(`appid='abc&amp;&lt;&gt;'`);
    expect(xml).toContain(`codebase='https://x.test/a&apos;b&amp;c'`);
    expect(xml).toContain(`version='1.0.0&apos;'`);
  });
});

describe('renderPowerShellInstaller', () => {
  it('targets the registry policy path of each browser', () => {
    expect(renderPowerShellInstaller('chrome', LINKS)).toContain(
      String.raw`HKLM:\SOFTWARE\Policies\Google\Chrome`,
    );
    expect(renderPowerShellInstaller('edge', LINKS)).toContain(
      String.raw`HKLM:\SOFTWARE\Policies\Microsoft\Edge`,
    );
    expect(renderPowerShellInstaller('brave', LINKS)).toContain(
      String.raw`HKLM:\SOFTWARE\Policies\BraveSoftware\Brave`,
    );
  });

  it('embeds the extension id, update XML URL, and self-elevates via UAC', () => {
    const script = renderPowerShellInstaller('edge', {
      ...LINKS,
      installUrl: 'https://dandelion.web.id/install/edge.ps1',
    });
    expect(script).toContain(ID);
    expect(script).toContain('https://dandelion.web.id/updates/chrome.xml');
    expect(script).toContain('https://dandelion.web.id/install/edge.ps1');
    expect(script).toContain('-Verb RunAs');
    expect(script).toContain('ExtensionInstallForcelist');
    expect(script).toContain('ExtensionInstallSources');
    expect(script).toContain('[scriptblock]::Create');
    expect(script).not.toContain('| iex');
  });

  it('preserves other policy entries instead of overwriting value name 1', () => {
    const script = renderPowerShellInstaller('chrome', LINKS);
    expect(script).toContain('function Set-ListEntry');
    expect(script).toContain('while ($props -contains "$n")');
    expect(script).not.toContain("-Name '1'");
  });
});

describe('renderShellInstaller', () => {
  it('uses the Linux policy dir per browser', () => {
    const chrome = renderShellInstaller('chrome', LINKS);
    expect(chrome).toContain('/etc/opt/chrome/policies/managed');

    const edge = renderShellInstaller('edge', LINKS);
    expect(edge).toContain('/etc/opt/edge/policies/managed');

    const brave = renderShellInstaller('brave', LINKS);
    expect(brave).toContain('/etc/brave/policies/managed');
  });

  it('escalates with sudo when not root and embeds policy values', () => {
    const script = renderShellInstaller('chrome', LINKS);
    expect(script).toContain('sudo');
    expect(script).toContain(ID);
    expect(script).toContain('https://dandelion.web.id/updates/chrome.xml');
    expect(script).toContain('https://dandelion.web.id/*');
    expect(script).toContain('dandelion.json');
  });

  it('rejects non-Linux platforms', () => {
    const script = renderShellInstaller('chrome', LINKS);
    expect(script).toContain('Gunakan Windows atau Linux.');
    expect(script).not.toContain('Darwin');
    expect(script).not.toContain('defaults write');
  });
});

describe('renderPowerShellUninstaller', () => {
  it('targets the registry policy path of each browser', () => {
    expect(renderPowerShellUninstaller('chrome', LINKS)).toContain(
      String.raw`HKLM:\SOFTWARE\Policies\Google\Chrome`,
    );
    expect(renderPowerShellUninstaller('edge', LINKS)).toContain(
      String.raw`HKLM:\SOFTWARE\Policies\Microsoft\Edge`,
    );
    expect(renderPowerShellUninstaller('brave', LINKS)).toContain(
      String.raw`HKLM:\SOFTWARE\Policies\BraveSoftware\Brave`,
    );
  });

  it('removes only entries belonging to Dandelion and self-elevates via UAC', () => {
    const script = renderPowerShellUninstaller('chrome', LINKS);
    expect(script).toContain('https://dandelion.web.id/uninstall/chrome.ps1');
    expect(script).toContain('-Verb RunAs');
    expect(script).toContain(`"$ExtensionId;*"`);
    expect(script).toContain('Remove-ItemProperty');
    expect(script).toContain('ExtensionInstallForcelist');
    expect(script).toContain('ExtensionInstallSources');
    expect(script).toContain('[scriptblock]::Create');
    expect(script).not.toContain('| iex');
  });
});

describe('renderShellUninstaller', () => {
  it('removes the Linux policy file per browser', () => {
    const chrome = renderShellUninstaller('chrome', LINKS);
    expect(chrome).toContain('/etc/opt/chrome/policies/managed');

    const edge = renderShellUninstaller('edge', LINKS);
    expect(edge).toContain('/etc/opt/edge/policies/managed');

    const brave = renderShellUninstaller('brave', LINKS);
    expect(brave).toContain('/etc/brave/policies/managed');

    expect(chrome).toContain('rm -f "$DIR/dandelion.json"');
    expect(chrome).not.toContain('defaults delete');
  });
});
