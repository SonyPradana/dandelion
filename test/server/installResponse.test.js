import { describe, expect, it } from 'vitest';
import {
  escapeXml,
  renderChromeUpdateXml,
  renderShellInstaller,
  renderShellUninstaller,
} from '../../scripts/install-response.js';

const ID = 'bppmaeamamkihhpackebpafedaaeanle';
const LINKS = {
  id: ID,
  updateUrl: 'https://dandelion.web.id/updates/chrome.xml',
  origin: 'https://dandelion.web.id',
  installUrl: 'https://dandelion.web.id/install/chrome.sh',
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

  it('forces subsequent updates to use the server update XML', () => {
    const script = renderShellInstaller('chrome', LINKS);
    expect(script).toContain('"ExtensionSettings":{"%s"');
    expect(script).toContain('"override_update_url":true');
    expect(script).toContain('"$EXTENSION_ID" "$UPDATE_XML_URL"');
  });

  it('rejects non-Linux platforms', () => {
    const script = renderShellInstaller('chrome', LINKS);
    expect(script).toContain('Hanya Linux yang didukung.');
    expect(script).not.toContain('Windows atau Linux');
    expect(script).not.toContain('Darwin');
    expect(script).not.toContain('defaults write');
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
