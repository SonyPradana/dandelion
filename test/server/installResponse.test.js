import { describe, expect, it } from 'vitest';
import {
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
  });
});

describe('renderShellInstaller', () => {
  it('uses the macOS policy domain and Linux policy dir per browser', () => {
    const chrome = renderShellInstaller('chrome', LINKS);
    expect(chrome).toContain('com.google.Chrome');
    expect(chrome).toContain('/etc/opt/chrome/policies/managed');

    const edge = renderShellInstaller('edge', LINKS);
    expect(edge).toContain('com.microsoft.Edge');
    expect(edge).toContain('/etc/opt/edge/policies/managed');

    const brave = renderShellInstaller('brave', LINKS);
    expect(brave).toContain('com.brave.Browser');
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
  });
});

describe('renderShellUninstaller', () => {
  it('removes the policy domain on macOS and policy file on Linux per browser', () => {
    const chrome = renderShellUninstaller('chrome', LINKS);
    expect(chrome).toContain('com.google.Chrome');
    expect(chrome).toContain('/etc/opt/chrome/policies/managed');
    expect(chrome).toContain('defaults delete');

    const edge = renderShellUninstaller('edge', LINKS);
    expect(edge).toContain('com.microsoft.Edge');
    expect(edge).toContain('/etc/opt/edge/policies/managed');

    const brave = renderShellUninstaller('brave', LINKS);
    expect(brave).toContain('com.brave.Browser');
    expect(brave).toContain('/etc/brave/policies/managed');

    expect(chrome).toContain('rm -f "$DIR/dandelion.json"');
  });
});
