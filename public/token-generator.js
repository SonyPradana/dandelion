import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@6.2.3';

const privateKeyEl = document.getElementById('privateKey');
const form = document.getElementById('tokenForm');
const output = document.getElementById('output');
const jwtOutput = document.getElementById('jwtOutput');
const summary = document.getElementById('summary');
const copyBtn = document.getElementById('copyBtn');
const pastePemBtn = document.getElementById('pastePemBtn');
const importPemBtn = document.getElementById('importPemBtn');
const pemFileInput = document.getElementById('pemFileInput');
const pemIndicator = document.getElementById('pemIndicator');

function updateIndicator() {
  if (privateKeyEl.value.trim()) {
    pemIndicator.textContent = '\u2713 PEM loaded';
    pemIndicator.className = 'pem-indicator loaded';
  } else {
    pemIndicator.textContent = '(no key loaded)';
    pemIndicator.className = 'pem-indicator';
  }
}

pastePemBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    privateKeyEl.value = text;
    updateIndicator();
  } catch {
    alert('Unable to read from clipboard. Paste manually.');
  }
});

importPemBtn.addEventListener('click', () => pemFileInput.click());

pemFileInput.addEventListener('change', () => {
  const file = pemFileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    privateKeyEl.value = reader.result;
    updateIndicator();
  };
  reader.readAsText(file);
});

function parseExpiry(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value);
  }
  const match = value.match(/^(\d+)(d|m|y)$/);
  if (!match) throw new Error(`Invalid expiry format: ${value}. Use: 90d, 12m, 1y, or 2027-01-01`);
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();
  if (unit === 'd') now.setDate(now.getDate() + num);
  if (unit === 'm') now.setMonth(now.getMonth() + num);
  if (unit === 'y') now.setFullYear(now.getFullYear() + num);
  return now;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const privateKeyPEM = privateKeyEl.value.trim();
  const tokenId = document.getElementById('tokenId').value.trim();
  const expiry = document.getElementById('expiry').value.trim();
  const totalLimit = parseInt(document.getElementById('totalLimit').value, 10) || 0;
  const dailyLimit = parseInt(document.getElementById('dailyLimit').value, 10) || 100;
  const versionAllowedRaw = document.getElementById('versionAllowed').value.trim();

  if (!privateKeyPEM) {
    alert('Private key (PEM) is required.');
    return;
  }

  if (!tokenId) {
    alert('Token ID is required.');
    return;
  }

  const features = [
    ...document.querySelectorAll('#featuresGroup input[type="checkbox"]:checked'),
  ].map((cb) => cb.value);

  const versionAllowed = versionAllowedRaw
    ? versionAllowedRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['*'];

  let expDate = null;
  try {
    expDate = parseExpiry(expiry);
  } catch (error) {
    alert(error.message);
    return;
  }

  try {
    const privateKey = await importPKCS8(privateKeyPEM, 'ES256');

    const jwt = await new SignJWT({
      license_id: tokenId,
      features,
      total_limit: totalLimit,
      daily_limit: dailyLimit,
      version_allowed: versionAllowed,
    })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuer('Dandelion')
      .setAudience('dandelion-extension')
      .setSubject('license')
      .setIssuedAt()
      .setExpirationTime(expDate)
      .sign(privateKey);

    jwtOutput.value = jwt;
    summary.innerHTML = `
      <table>
        <tr><td>Token ID</td><td>${tokenId}</td></tr>
        <tr><td>Features</td><td>${features.join(', ') || '(none)'}</td></tr>
        <tr><td>Total limit</td><td>${totalLimit} (${totalLimit === 0 ? 'unlimited' : ''})</td></tr>
        <tr><td>Daily limit</td><td>${dailyLimit}</td></tr>
        <tr><td>Version allowed</td><td>${versionAllowed.join(', ') || '(all)'}</td></tr>
        <tr><td>Expires</td><td>${expDate.toISOString()}</td></tr>
      </table>
    `;
    output.classList.remove('hidden');
  } catch (error) {
    alert('Error generating token: ' + (error.message || error));
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(jwtOutput.value);
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
      copyBtn.classList.remove('copied');
    }, 2000);
  } catch {
    jwtOutput.select();
    document.execCommand('copy');
  }
});
