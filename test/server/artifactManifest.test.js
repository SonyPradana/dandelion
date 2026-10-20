import { describe, expect, it } from 'vitest';
import { selectReleases } from '../../scripts/artifact-manifest.js';

const makeArtifact = (browser, version, ext = '.zip') => {
  const fileName = version.startsWith('nightly-')
    ? `dandelion-${browser}-${version}.zip`
    : `dandelion-${browser}-v${version}${ext}`;
  return {
    fileName,
    browser,
    version,
    url: `https://example.test/artifacts/${fileName}`,
    hash: 'sha256:0',
    size: 1,
  };
};

describe('selectReleases', () => {
  it('picks the zip over a CRX of the same version for Chrome', () => {
    const { latest } = selectReleases([
      makeArtifact('chrome', '1.8.0', '.crx'),
      makeArtifact('chrome', '1.8.0', '.zip'),
    ]);

    expect(latest.chrome.fileName).toBe('dandelion-chrome-v1.8.0.zip');
  });

  it('keeps the CRX out of latest even when its version is newer', () => {
    const { latest } = selectReleases([
      makeArtifact('chrome', '1.9.0', '.crx'),
      makeArtifact('chrome', '1.8.0', '.zip'),
    ]);

    expect(latest.chrome.version).toBe('1.8.0');
  });

  it('omits latest Chrome when only a CRX is available', () => {
    const { latest } = selectReleases([makeArtifact('chrome', '1.9.0', '.crx')]);

    expect(latest.chrome).toBeUndefined();
  });

  it('selects the highest stable manual install package per browser', () => {
    const { latest } = selectReleases([
      makeArtifact('firefox', '1.7.2', '-signed.xpi'),
      makeArtifact('chrome', '1.8.0', '.zip'),
      makeArtifact('firefox', '1.8.0', '-signed.xpi'),
      makeArtifact('chrome', '1.7.2', '.zip'),
    ]);

    expect(latest.chrome.fileName).toBe('dandelion-chrome-v1.8.0.zip');
    expect(latest.firefox.fileName).toBe('dandelion-firefox-v1.8.0-signed.xpi');
  });

  it('selects the newest nightly by date without affecting stable latest', () => {
    const { latest, nightly } = selectReleases([
      makeArtifact('chrome', 'nightly-20261012'),
      makeArtifact('chrome', 'nightly-20261020'),
      makeArtifact('chrome', '1.8.0', '.zip'),
    ]);

    expect(nightly.chrome.version).toBe('nightly-20261020');
    expect(latest.chrome.version).toBe('1.8.0');
  });
});
