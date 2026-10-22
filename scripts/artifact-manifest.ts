// Release selection shared by the HTTP layer. Kept out of serve.ts so the
// latest/nightly decision is pure and testable: importing serve.ts would boot
// the server, the database, and the file watchers.
//
// `latest` feeds the landing page download buttons, which install manually from
// an unpacked package. Enterprise updates use the signed CRX separately via
// latestStableCrx() in serve.ts.

export interface Artifact {
  fileName: string;
  browser: string;
  version: string;
  url: string;
  hash: string;
  size: number;
}

export interface Releases {
  latest: Record<string, Artifact>;
  nightly: Record<string, Artifact>;
}

const MANUAL_INSTALL_EXT: Record<string, string> = {
  chrome: '.zip',
  firefox: '.xpi',
};

export function cmpVer(a: string, b: string): number {
  const normalize = (v: string) =>
    v.startsWith('nightly-') ? v.slice(8).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3') : v;
  const pa = normalize(a).split('.').map(Number);
  const pb = normalize(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function isManualInstallArtifact(artifact: Artifact): boolean {
  const ext = MANUAL_INSTALL_EXT[artifact.browser];
  return ext ? artifact.fileName.endsWith(ext) : false;
}

export function selectReleases(artifacts: Artifact[]): Releases {
  const latest: Record<string, Artifact> = {};
  const nightly: Record<string, Artifact> = {};

  for (const artifact of artifacts) {
    if (artifact.version.startsWith('nightly-')) {
      const current = nightly[artifact.browser];
      if (!current || cmpVer(artifact.version, current.version) > 0) {
        nightly[artifact.browser] = artifact;
      }
      continue;
    }

    if (!isManualInstallArtifact(artifact)) continue;

    const current = latest[artifact.browser];
    if (!current || cmpVer(artifact.version, current.version) > 0) {
      latest[artifact.browser] = artifact;
    }
  }

  return { latest, nightly };
}
