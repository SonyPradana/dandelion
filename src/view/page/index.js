import { html } from 'htm/preact';
import { render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import browser from 'webextension-polyfill';
import { getAgreement, getFullConfig, setConfig as saveConfig } from '../../configuration';
import { showAgreementPopup } from '../../components/agreementPopup';
import { AGREEMENT_SECTIONS_HTML } from '../../agreement-text';
import { KeywordList } from '../components/KeywordList.js';
import { KeyValueList } from '../components/KeyValueList.js';
import { ProfileManager } from '../components/ProfileManager.js';
import {
  getTodaySummary,
  getYesterdaySummary,
  getRange,
  getMonthTotal,
  getWeekTotal,
  getOverallBreakdown,
  getFullHistory,
  MONTHLY_TARGET,
  TARGET_MODE,
} from '../../utils/productivityTracker';
import {
  init,
  getStatus,
  getDeviceId,
  getToken,
  saveToken,
  removeToken,
  getRemainingToday,
} from '../../quota/quota-manager.js';

function useTabs(initialHash) {
  const [activeTab, setActiveTab] = useState(initialHash || 'profile');

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '') || 'profile';
      setActiveTab(hash);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const switchTab = (tab) => {
    window.location.hash = tab;
    setActiveTab(tab);
  };

  return [activeTab, switchTab];
}

function rd(current, prev) {
  if (prev === null || prev === undefined) return html`<span class="pv">${current}</span>`;
  if (prev === 0 && current === 0) return html`<span class="pv zero">0</span>`;
  if (prev === 0)
    return html`<span class="pv">${current}</span> <span class="pd pos">(+${current})</span>`;
  const d = current - prev;
  if (d === 0) return html`<span class="pv">${current}</span>`;
  if (d > 0) return html`<span class="pv">${current}</span> <span class="pd pos">(+${d})</span>`;
  return html`<span class="pv">${current}</span> <span class="pd neg">(${d})</span>`;
}

function doExport() {
  getFullConfig().then((cfg) => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dandelion-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function ProfileTab({ configRef, onChange }) {
  if (!configRef.current) return null;
  return html`
    <div class="pane-header">👤 Profil</div>
    <div class="pane-body">
      <${ProfileManager}
        profiles=${configRef.current.profiles}
        activeProfile=${configRef.current.activeProfile}
        onSwitch=${(key) => {
          configRef.current.activeProfile = key;
          onChange();
        }}
        onChange=${onChange}
      />
    </div>
  `;
}

function FormSkriningTab({ configRef, onChange }) {
  const [form, setForm] = useState(null);
  const [pinned, setPinned] = useState({});

  useEffect(() => {
    if (!configRef.current) return;
    const f = configRef.current.profiles[configRef.current.activeProfile]?.formSkrining || {};
    setForm({
      url: f.url || '',
      scrollToButton: f.scrollToButton ?? true,
      radioButtonKeywords: f.radioButtonKeywords || '',
      dropdownKeywords: f.dropdownKeywords || '',
      excludes: f.excludes || '',
    });
    setPinned(f.pinneds || {});
  }, [configRef.current?.activeProfile]);

  if (!form) return null;
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = () => {
    const ps = configRef.current.profiles[configRef.current.activeProfile];
    if (!ps.formSkrining) ps.formSkrining = {};
    Object.assign(ps.formSkrining, form);
    ps.formSkrining.pinneds = pinned;
    onChange();
  };

  return html`
    <div class="pane-header">📋 Form Skrining</div>
    <div class="pane-body">
      <div class="form-group">
        <label for="form-skrining-url">URL</label>
        <input
          type="text"
          id="form-skrining-url"
          placeholder="Masukkan pola URL form skrining"
          value=${form.url}
          onInput=${(e) => update('url', e.target.value)}
        />
      </div>
      <div class="form-group">
        <div class="checkbox-item">
          <input
            type="checkbox"
            id="form-skrining-scroll-to-button"
            checked=${form.scrollToButton}
            onChange=${(e) => update('scrollToButton', e.target.checked)}
          />
          <label for="form-skrining-scroll-to-button">Scroll ke tombol setelah selesai</label>
        </div>
      </div>
      <div class="form-group">
        <label>Kata Kunci Tombol Radio</label>
        <${KeywordList}
          id="form-skrining-radio-keywords"
          value=${form.radioButtonKeywords}
          onChange=${(v) => update('radioButtonKeywords', v)}
        />
      </div>
      <div class="form-group">
        <label>Kata Kunci Dropdown</label>
        <${KeywordList}
          id="form-skrining-dropdown-keywords"
          value=${form.dropdownKeywords}
          onChange=${(v) => update('dropdownKeywords', v)}
        />
      </div>
      <div class="form-group">
        <label for="form-skrining-excludes">Data dikecualikan</label>
        <input
          type="text"
          id="form-skrining-excludes"
          placeholder="Kecualikan atau lewati survei"
          value=${form.excludes}
          onInput=${(e) => update('excludes', e.target.value)}
        />
      </div>
      <div class="form-group">
        <label>Nilai Tersemat</label>
        <${KeyValueList} data=${pinned} onChange=${setPinned} />
      </div>
      <button class="btn btn-primary" onClick=${save}>Simpan</button>
    </div>
  `;
}

function SkriningTab({ configRef, onChange }) {
  const [val, setVal] = useState('');

  useEffect(() => {
    setVal(configRef.current?.profiles?.[configRef.current?.activeProfile]?.skrining?.url || '');
  }, [configRef.current?.activeProfile]);

  const save = () => {
    const ps = configRef.current.profiles[configRef.current.activeProfile];
    if (!ps.skrining) ps.skrining = {};
    ps.skrining.url = val;
    onChange();
  };

  return html`
    <div class="pane-header">🔗 Skrining</div>
    <div class="pane-body">
      <div class="form-group">
        <label for="skrining-url">URL Halaman Skrining</label>
        <input
          type="text"
          id="skrining-url"
          placeholder="Masukkan pola URL skrining"
          value=${val}
          onInput=${(e) => setVal(e.target.value)}
        />
      </div>
      <button class="btn btn-primary" onClick=${save}>Simpan</button>
    </div>
  `;
}

function NotCheckedTab({ configRef, onChange }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!configRef.current) return;
    const n = configRef.current.profiles[configRef.current.activeProfile]?.notChecked || {};
    setForm({
      url: n.url || '',
      list: n.notCheckedList || '',
      automationDelay: n.automationDelay || 2000,
      itemDelay: n.itemDelay || 1000,
      reloadDelay: n.reloadDelay || 1000,
    });
  }, [configRef.current?.activeProfile]);

  if (!form) return null;
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = () => {
    const ps = configRef.current.profiles[configRef.current.activeProfile];
    if (!ps.notChecked) ps.notChecked = {};
    Object.assign(ps.notChecked, {
      url: form.url,
      notCheckedList: form.list,
      automationDelay: parseInt(form.automationDelay) || 2000,
      itemDelay: parseInt(form.itemDelay) || 1000,
      reloadDelay: parseInt(form.reloadDelay) || 1000,
    });
    onChange();
  };

  return html`
    <div class="pane-header">✅ Tidak Periksa</div>
    <div class="pane-body">
      <div class="form-group">
        <label for="not-checked-url">URL</label>
        <input
          type="text"
          id="not-checked-url"
          placeholder="Masukkan pola URL (pemeriksaan)"
          value=${form.url}
          onInput=${(e) => update('url', e.target.value)}
        />
      </div>
      <div class="form-group">
        <label>Daftar Master 'Tidak Periksa'</label>
        <${KeywordList}
          id="not-checked-list"
          value=${form.list}
          placeholder="Tambah ID baris (rowfrm...)"
          onChange=${(v) => update('list', v)}
        />
      </div>
      <div class="delay-settings-grid">
        <div class="form-group-sm">
          <label for="not-checked-automation-delay">Jeda Awal</label>
          <input
            type="number"
            id="not-checked-automation-delay"
            min="500"
            max="10000"
            value=${form.automationDelay}
            onInput=${(e) => update('automationDelay', e.target.value)}
          />
        </div>
        <div class="form-group-sm">
          <label for="not-checked-item-delay">Jeda Item</label>
          <input
            type="number"
            id="not-checked-item-delay"
            min="100"
            max="5000"
            value=${form.itemDelay}
            onInput=${(e) => update('itemDelay', e.target.value)}
          />
        </div>
        <div class="form-group-sm">
          <label for="not-checked-reload-delay">Jeda Reload</label>
          <input
            type="number"
            id="not-checked-reload-delay"
            min="500"
            max="15000"
            value=${form.reloadDelay}
            onInput=${(e) => update('reloadDelay', e.target.value)}
          />
        </div>
      </div>
      <button class="btn btn-primary" onClick=${save}>Simpan</button>
    </div>
  `;
}

function ProduktifitasPage() {
  const [pd, setPd] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    (async () => {
      const [today, yesterday, overall, history, periodTotal] = await Promise.all([
        getTodaySummary(),
        getYesterdaySummary(),
        getOverallBreakdown(),
        getFullHistory(),
        TARGET_MODE === 'weekly' ? getWeekTotal() : getMonthTotal(),
      ]);
      const dataDays = Object.values(history).filter((d) => d.dayTotal > 0).length;
      let chartDays = 7;
      if (dataDays >= 30) chartDays = 30;
      else if (dataDays >= 14) chartDays = 14;
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - (chartDays - 1));
      const fm = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
      const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const rangeData = await getRange(fm, to);
      const maxVal = Math.max(1, ...rangeData.map((d) => (d ? d.dayTotal : 0)));
      const status = getStatus();
      let licenseInfo = null;
      if (!status.isFreePlan && status.payload) {
        const p = status.payload;
        const lf = new Date(p.iat * 1000);
        const lt = new Date();
        const lfs = `${lf.getFullYear()}-${String(lf.getMonth() + 1).padStart(2, '0')}-${String(lf.getDate()).padStart(2, '0')}`;
        const lts = `${lt.getFullYear()}-${String(lt.getMonth() + 1).padStart(2, '0')}-${String(lt.getDate()).padStart(2, '0')}`;
        const lrd = await getRange(lfs, lts);
        const used = lrd.reduce((s, d) => s + (d ? d.dayTotal : 0), 0);
        const pct = Math.min(100, Math.round((used / (p.total_limit || 1)) * 100));
        const months = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'Mei',
          'Jun',
          'Jul',
          'Agu',
          'Sep',
          'Okt',
          'Nov',
          'Des',
        ];
        const fmt = (ts) => {
          const d = new Date(ts * 1000);
          return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        };
        licenseInfo = { pct, used, limit: p.total_limit, from: fmt(p.iat), to: fmt(p.exp) };
      }
      setPd({ today, yesterday, overall, periodTotal, chartDays, rangeData, maxVal, licenseInfo });
      setLoading(false);
    })();
  };

  useEffect(fetchData, []);

  if (loading || !pd) {
    return html`
      <div class="pane-header">
        Produktivitas<button class="pane-header-btn" onClick=${fetchData} title="Refresh">↻</button>
      </div>
      <div class="pane-body"><div class="prod-row" style="color:#999">Memuat...</div></div>
    `;
  }

  const { today, yesterday, overall, periodTotal, chartDays, rangeData, maxVal, licenseInfo } = pd;
  const prev = yesterday ? yesterday.counts : null;
  const periodLabel = TARGET_MODE === 'weekly' ? 'Minggu' : 'Bulan';

  return html`
    <div class="pane-header">
      Produktivitas<button class="pane-header-btn" onClick=${fetchData} title="Refresh">↻</button>
    </div>
    <div class="pane-body" id="produktifitas-page-content">
      <div class="prod-grid">
        <div class="prod-col">
          <div class="prod-col-header">Hari Ini</div>
          ${today
            ? html`
                <div class="prod-row">
                  <span class="label">📻 Radio</span
                  ><span class="value"
                    >${rd(today.counts.radio, prev?.radio ?? null)}<span class="po"
                      >/ ${overall.counts.radio.toLocaleString()}</span
                    ></span
                  >
                </div>
                <div class="prod-row">
                  <span class="label">📝 Teks</span
                  ><span class="value"
                    >${rd(today.counts.freetext, prev?.freetext ?? null)}<span class="po"
                      >/ ${overall.counts.freetext.toLocaleString()}</span
                    ></span
                  >
                </div>
                <div class="prod-row">
                  <span class="label">📋 Dropdown</span
                  ><span class="value"
                    >${rd(today.counts.dropdown, prev?.dropdown ?? null)}<span class="po"
                      >/ ${overall.counts.dropdown.toLocaleString()}</span
                    ></span
                  >
                </div>
                <div class="prod-row">
                  <span class="label">❌ Tidak Periksa</span
                  ><span class="value"
                    >${rd(today.counts.formNotChecked, prev?.formNotChecked ?? null)}<span
                      class="po"
                      >/ ${overall.counts.formNotChecked.toLocaleString()}</span
                    ></span
                  >
                </div>
                <div class="prod-row">
                  <span class="label">🧘 Zen</span
                  ><span class="value"
                    >${rd(today.counts.formZen, prev?.formZen ?? null)}<span class="po"
                      >/ ${overall.counts.formZen.toLocaleString()}</span
                    ></span
                  >
                </div>
                <div class="prod-total">
                  <span>Total</span
                  ><span
                    >${rd(today.dayTotal, yesterday?.dayTotal ?? null)}<span class="po"
                      >/ ${overall.grandTotal.toLocaleString()}</span
                    ></span
                  >
                </div>
              `
            : html`<div class="prod-row" style="color:#999">Belum ada data hari ini.</div>`}
        </div>
        <div class="prod-col">
          <div class="prod-col-header">Ringkasan</div>
          <div class="prod-row">
            <span class="label">🏆 Grand Total</span
            ><span class="value">${overall.grandTotal.toLocaleString()}</span>
          </div>
          <div class="prod-row">
            <span class="label">📆 Hari Aktif</span><span class="value">${overall.activeDays}</span>
          </div>
          <div class="prod-row">
            <span class="label">⚡ Rata-rata/hari</span
            ><span class="value">${overall.average}</span>
          </div>
          <div style="margin-top:12px">
            <div class="prod-header">
              Progress ${periodLabel} Ini (target ${MONTHLY_TARGET.toLocaleString()} poin)
            </div>
            <div class="prod-bar-track">
              <div
                class="prod-bar-fill"
                style="width:${Math.min(100, Math.round((periodTotal / MONTHLY_TARGET) * 100))}%"
              ></div>
            </div>
            <div style="font-size:12px;color:#888;margin-top:4px">
              ${periodTotal.toLocaleString()} / ${MONTHLY_TARGET.toLocaleString()} poin
            </div>
          </div>
          ${licenseInfo
            ? html`
                <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb">
                  <div class="prod-header" style="color:#065f46">🏅 Total Limit (Pro Tier)</div>
                  <div class="prod-bar-track">
                    <div class="prod-bar-fill" style="width:${licenseInfo.pct}%"></div>
                  </div>
                  <div style="font-size:12px;color:#888;margin-top:4px">
                    ${licenseInfo.used.toLocaleString()} / ${licenseInfo.limit.toLocaleString()}
                    poin (sejak lisensi)
                  </div>
                  <div style="font-size:12px;color:#888;margin-top:8px">
                    Periode Token: ${licenseInfo.from} - ${licenseInfo.to}
                  </div>
                </div>
              `
            : html`
                <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb">
                  <div class="prod-header" style="color:#92400e">🆓 Free Tier</div>
                  <div style="font-size:12px;color:#888">50 poin/hari · tanpa total limit</div>
                </div>
              `}
        </div>
      </div>
      <div class="prod-chart-section">
        <h3>Grafik Produktivitas ${chartDays}H Terakhir</h3>
        <div class="prod-chart">
          ${rangeData.map((day) => {
            const pct = day ? Math.round((day.dayTotal / maxVal) * 100) : 0;
            const label = day ? day.date.slice(5) : '';
            return html`<div class="prod-chart-bar-wrapper">
              <div class="prod-chart-bar" style="height:${Math.max(pct, 2)}%"></div>
              <div class="prod-chart-label">${label}</div>
            </div>`;
          })}
        </div>
      </div>
    </div>
  `;
}

function LainnyaTab({ onChange }) {
  const [importMsg, setImportMsg] = useState(null);

  return html`
    <div class="pane-header">⚙️ Lainnya</div>
    <div class="pane-body">
      <h3 class="pane-title">Ekspor &amp; Impor Konfigurasi</h3>
      <div class="action-group">
        <a
          href="#"
          class="action-btn"
          onClick=${(e) => {
            e.preventDefault();
            doExport();
          }}
          >📥 Ekspor Konfigurasi</a
        >
        <a
          href="#"
          class="action-btn"
          onClick=${(e) => {
            e.preventDefault();
            document.getElementById('page-import-file-input').click();
          }}
          >📤 Impor Konfigurasi</a
        >
      </div>
      ${importMsg
        ? html`<div class="license-message ${importMsg.type}">${importMsg.text}</div>`
        : ''}
      <input
        type="file"
        id="page-import-file-input"
        style="display:none"
        accept=".json"
        onChange=${async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            const text = await file.text();
            const imported = JSON.parse(text);
            if (!imported.profiles || !imported.activeProfile)
              throw new Error('Invalid config file format.');
            saveConfig(imported);
            onChange();
            setImportMsg({ type: 'success', text: 'Konfigurasi berhasil diimpor.' });
            setTimeout(() => setImportMsg(null), 3000);
          } catch {
            setImportMsg({ type: 'error', text: 'Gagal mengimpor. Pastikan format file valid.' });
            setTimeout(() => setImportMsg(null), 3000);
          }
        }}
      />
    </div>
  `;
}

function QuotaTab() {
  const [state, setState] = useState(null);
  const [jwtInput, setJwtInput] = useState('');
  const [msg, setMsg] = useState(null);

  const refresh = () => {
    const status = getStatus();
    getRemainingToday().then((remaining) => {
      getToken().then((jwt) => {
        setState({ status, remaining, jwt });
        setJwtInput(jwt || '');
      });
    });
  };

  useEffect(refresh, []);

  if (!state)
    return html`<div class="pane-header">🔑 Batas Pemakaian</div>
      <div class="pane-body">Memuat...</div>`;

  const { status, remaining } = state;
  const isFree = status.isFreePlan;
  const deviceId = getDeviceId();

  const copyDeviceId = async () => {
    const btn = document.getElementById('device-id-copy-btn');
    try {
      await navigator.clipboard.writeText(deviceId || '');
      if (btn) btn.textContent = 'Tersalin!';
      setTimeout(() => {
        if (btn) btn.textContent = 'Salin';
      }, 1500);
    } catch {
      if (btn) btn.textContent = 'Gagal';
      setTimeout(() => {
        if (btn) btn.textContent = 'Salin';
      }, 1500);
    }
  };

  const activateToken = async () => {
    const val = jwtInput.trim().split('\n')[0].trim();
    if (!val) {
      setMsg({ type: 'error', text: 'Masukkan token terlebih dahulu.' });
      return;
    }
    try {
      await saveToken(val);
      setMsg({ type: 'success', text: 'Token berhasil diaktifkan!' });
      setTimeout(refresh, 1000);
    } catch (error) {
      setMsg({ type: 'error', text: `Gagal: ${error.message}` });
    }
  };

  const removeTokenAction = async () => {
    await removeToken();
    setMsg({ type: 'success', text: 'Token dihapus, kembali ke Free Tier.' });
    setTimeout(refresh, 1000);
  };

  let infoHtml = '';
  if (!isFree && status.payload) {
    const p = status.payload;
    const expDate = p.exp ? new Date(p.exp * 1000).toLocaleDateString('id-ID') : '-';
    const featList =
      Array.isArray(p.features) && p.features.length > 0 ? p.features.join(', ') : '-';
    const verList =
      Array.isArray(p.version_allowed) && p.version_allowed.length > 0
        ? p.version_allowed.join(', ')
        : '-';
    infoHtml = html`
      <div class="license-info-grid">
        <div class="license-info-item">
          <div class="label">Total Limit</div>
          <div class="value">${(p.total_limit ?? 0).toLocaleString()}</div>
        </div>
        <div class="license-info-item">
          <div class="label">Grace Daily</div>
          <div class="value">${(p.daily_limit ?? 100).toLocaleString()}</div>
        </div>
        <div class="license-info-item">
          <div class="label">Berlaku Sampai</div>
          <div class="value">${expDate}</div>
        </div>
        <div class="license-info-item">
          <div class="label">Sisa Hari Ini</div>
          <div class="value">${remaining.toLocaleString()}</div>
        </div>
        <div class="license-info-item" style="grid-column:1/-1">
          <div class="label">Fitur</div>
          <div class="value">${featList}</div>
        </div>
        <div class="license-info-item" style="grid-column:1/-1">
          <div class="label">Versi Diizinkan</div>
          <div class="value">${verList}</div>
        </div>
      </div>
    `;
  }

  return html`
    <div class="pane-header">🔑 Batas Pemakaian</div>
    <div class="pane-body" id="license-page-content">
      <div class="license-status ${isFree ? 'free' : 'pro'}">
        ${isFree
          ? html`<span class="license-badge free">FREE</span>`
          : html`<span class="license-badge pro">PRO</span>`}
        ${isFree ? 'Free Tier (50 poin/hari)' : 'Pro Tier'}
      </div>
      <div class="device-id-section">
        <div class="device-id-label">Device ID</div>
        <div class="device-id-row">
          <span class="device-id-value">${deviceId || '-'}</span>
          <button class="device-id-copy" id="device-id-copy-btn" onClick=${copyDeviceId}>
            Salin
          </button>
        </div>
        <div class="device-id-hint">Gunakan ID ini untuk mendapatkan token</div>
      </div>
      ${infoHtml}
      <div class="pane-title">Aktifkan Token</div>
      <textarea
        class="license-jwt-input"
        id="quota-jwt-input"
        placeholder="Tempel token (JWT) di sini..."
        value=${jwtInput}
        onInput=${(e) => setJwtInput(e.target.value)}
      ></textarea>
      <div class="license-actions">
        <button class="license-btn activate" onClick=${activateToken}>Aktifkan</button>
        <button
          class="license-btn remove"
          onClick=${removeTokenAction}
          disabled=${isFree}
          style=${isFree ? 'opacity:0.4;cursor:not-allowed' : ''}
        >
          Hapus Token
        </button>
      </div>
      ${msg ? html`<div class="license-message ${msg.type}">${msg.text}</div>` : ''}
    </div>
  `;
}

function PersetujuanTab() {
  return html`
    <div class="pane-header">🛡️ Persetujuan</div>
    <div class="pane-body" id="persetujuan-content">
      <div class="overview" dangerouslySetInnerHTML=${{ __html: AGREEMENT_SECTIONS_HTML }} />
    </div>
  `;
}

function PageApp() {
  const [activeTab, switchTab] = useTabs(window.location.hash.replace('#', ''));
  const configRef = useRef(null);
  const [, forceRender] = useState(0);

  const refresh = () =>
    getFullConfig().then((c) => {
      configRef.current = c;
      forceRender((n) => n + 1);
    });

  useEffect(() => {
    init();
    refresh();
  }, []);

  const activePopupRef = useRef(null);

  useEffect(() => {
    const handler = (changes, area) => {
      if (area === 'local' && changes.dandelion_terms) {
        const terms = changes.dandelion_terms.newValue;
        const version = browser.runtime.getManifest().version;
        const shouldShow = !terms?.agreed || terms.version !== version;
        if (shouldShow && !activePopupRef.current) {
          const popup = showAgreementPopup();
          activePopupRef.current = popup;
          popup.promise.then(() => {
            activePopupRef.current = null;
          });
        } else if (!shouldShow && activePopupRef.current) {
          activePopupRef.current.remove();
          activePopupRef.current = null;
        }
      }
    };
    browser.storage.onChanged.addListener(handler);
    return () => browser.storage.onChanged.removeListener(handler);
  }, []);

  useEffect(() => {
    getAgreement().then((agreed) => {
      if (!agreed) showAgreementPopup();
    });
  }, []);

  const sidebarTab = (tab, icon, label) => html`
    <button
      class="tab-btn${activeTab === tab ? ' active' : ''}"
      data-tab=${tab}
      onClick=${() => switchTab(tab)}
    >
      <span class="tab-icon">${icon}</span>
      <span class="tab-label">${label}</span>
    </button>
  `;

  const onChange = () => {
    saveConfig(configRef.current);
    refresh();
  };

  const renderTab = (tab, component) => html`
    <section class="tab-pane${activeTab === tab ? ' active' : ''}" id="tab-${tab}">
      ${component}
    </section>
  `;

  if (!configRef.current) {
    return html`
      <div id="config-container">
        <div id="config-body">
          <div class="main"><div class="pane-body">Memuat...</div></div>
        </div>
      </div>
    `;
  }

  return html`
    <div id="config-container">
      <div id="config-body">
        <nav class="sidebar">
          <div class="tab-group">${sidebarTab('profile', '👤', 'Profil')}</div>
          <div class="tab-divider"></div>
          <div class="tab-group">
            ${sidebarTab('form-skrining', '📋', 'Form Skrining')}
            ${sidebarTab('skrining', '🔗', 'Skrining')}
            ${sidebarTab('not-checked', '✅', 'Tidak Periksa')}
          </div>
          <div class="tab-divider"></div>
          <div class="tab-group">${sidebarTab('produktifitas', '📊', 'Produktivitas')}</div>
          <div class="tab-group">${sidebarTab('lainnya', '⚙️', 'Lainnya')}</div>
          <div class="tab-divider"></div>
          <div class="tab-group">${sidebarTab('quota', '🔑', 'Batas Pemakaian')}</div>
          <div class="tab-divider"></div>
          <div class="tab-group">${sidebarTab('persetujuan', '🛡️', 'Persetujuan')}</div>
        </nav>
        <div class="main">
          <header class="app-header"><h1>Konfigurasi Dandelion</h1></header>
          ${renderTab(
            'profile',
            html`<${ProfileTab} configRef=${configRef} onChange=${onChange} />`,
          )}
          ${renderTab(
            'form-skrining',
            html`<${FormSkriningTab} configRef=${configRef} onChange=${onChange} />`,
          )}
          ${renderTab(
            'skrining',
            html`<${SkriningTab} configRef=${configRef} onChange=${onChange} />`,
          )}
          ${renderTab(
            'not-checked',
            html`<${NotCheckedTab} configRef=${configRef} onChange=${onChange} />`,
          )}
          ${renderTab('produktifitas', html`<${ProduktifitasPage} />`)}
          ${renderTab('lainnya', html`<${LainnyaTab} onChange=${onChange} />`)}
          ${renderTab('quota', html`<${QuotaTab} />`)}
          ${renderTab('persetujuan', html`<${PersetujuanTab} />`)}
        </div>
      </div>
    </div>
  `;
}

render(html`<${PageApp} />`, document.getElementById('app'));
