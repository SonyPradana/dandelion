import { html } from 'htm/preact';
import { render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import browser from 'webextension-polyfill';
import { getAgreement, setAgreement, getFullConfig, setConfig as saveConfig } from '../configuration';
import { AGREEMENT_SECTIONS_HTML } from '../agreement-text';
import { KeywordList } from './components/KeywordList.js';
import { KeyValueList } from './components/KeyValueList.js';
import { ProfileManager } from './components/ProfileManager.js';
import {
  getTodaySummary,
  getYesterdaySummary,
  getOverallBreakdown,
  getMonthTotal,
  getWeekTotal,
  getRange,
  MONTHLY_TARGET,
  TARGET_MODE,
} from '../utils/productivityTracker';
import { init, getStatus } from '../quota/quota-manager.js';

function rd(current, prev) {
  if (prev === null || prev === undefined) return html`<span class="pv">${current}</span>`;
  if (prev === 0 && current === 0) return html`<span class="pv zero">0</span>`;
  if (prev === 0) return html`<span class="pv">${current}</span> <span class="pd pos">(+${current})</span>`;
  const d = current - prev;
  if (d === 0) return html`<span class="pv">${current}</span>`;
  if (d > 0) return html`<span class="pv">${current}</span> <span class="pd pos">(+${d})</span>`;
  return html`<span class="pv">${current}</span> <span class="pd neg">(${d})</span>`;
}

function AgreementTab() {
  const [checked, setChecked] = useState(false);
  useEffect(() => { getAgreement().then(setChecked); }, []);
  useEffect(() => { setAgreement(checked); }, [checked]);

  return html`
    <div class="header"><h1>SYARAT DAN KETENTUAN PENGGUNAAN</h1></div>
    <div class="content">
      <div dangerouslySetInnerHTML=${{ __html: AGREEMENT_SECTIONS_HTML }} />
      <div class="checkbox-group">
        <h3 style="margin-bottom:16px;font-size:15px;color:#333">KONFIRMASI</h3>
        <div class="checkbox-item">
          <input type="checkbox" id="agree-checkbox" checked=${checked} onChange=${(e) => setChecked(e.target.checked)} />
          <label for="agree-checkbox">Saya telah membaca dan menyetujui syarat dan ketentuan.</label>
        </div>
      </div>
    </div>
  `;
}

function ConfigTab() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(null);
  const [pinned, setPinned] = useState({});
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const configRef = useRef(null);

  useEffect(() => { getFullConfig().then((c) => { configRef.current = c; setConfig(c); }); }, []);

  const activeProfile = config?.activeProfile;
  const profileSettings = config?.profiles?.[activeProfile];

  useEffect(() => {
    if (!profileSettings) return;
    const fs = profileSettings.formSkrining || {};
    const nc = profileSettings.notChecked || {};
    const sk = profileSettings.skrining || {};
    setForm({
      fsUrl: fs.url || '',
      scrollToButton: fs.scrollToButton ?? true,
      radioButtonKeywords: fs.radioButtonKeywords || '',
      dropdownKeywords: fs.dropdownKeywords || '',
      excludes: fs.excludes || '',
      ncUrl: nc.url || '',
      ncList: nc.notCheckedList || '',
      ncAutomationDelay: nc.automationDelay || 2000,
      ncItemDelay: nc.itemDelay || 1000,
      ncReloadDelay: nc.reloadDelay || 1000,
      skUrl: sk.url || '',
    });
    setPinned(fs.pinneds || {});
  }, [activeProfile, profileSettings]);

  if (!config || !form) return html`<div class="header"><h1>Konfigurasi</h1></div><div class="content">Memuat...</div>`;

  const update = (key, val) => {
    if (key.endsWith('Delay')) val = parseInt(val) || 0;
    setForm((prev) => ({ ...prev, [key]: val }));
  };
  const refresh = () => setConfig({ ...configRef.current });

  const handleSwitchProfile = (key) => {
    configRef.current.activeProfile = key;
    saveConfig(configRef.current);
    refresh();
  };

  const handleChangeProfiles = () => {
    saveConfig(configRef.current);
    refresh();
  };

  const handleSave = () => {
    const ps = configRef.current.profiles[configRef.current.activeProfile];
    if (!ps.formSkrining) ps.formSkrining = {};
    if (!ps.notChecked) ps.notChecked = {};
    if (!ps.skrining) ps.skrining = {};
    ps.formSkrining.url = form.fsUrl;
    ps.formSkrining.scrollToButton = form.scrollToButton;
    ps.formSkrining.radioButtonKeywords = form.radioButtonKeywords;
    ps.formSkrining.dropdownKeywords = form.dropdownKeywords;
    ps.formSkrining.excludes = form.excludes;
    ps.formSkrining.pinneds = pinned;
    ps.skrining.url = form.skUrl;
    ps.notChecked.url = form.ncUrl;
    ps.notChecked.notCheckedList = form.ncList;
    ps.notChecked.automationDelay = form.ncAutomationDelay || 2000;
    ps.notChecked.itemDelay = form.ncItemDelay || 1000;
    ps.notChecked.reloadDelay = form.ncReloadDelay || 1000;
    saveConfig(configRef.current);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const doExport = () => {
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
  };

  return html`
    <div class="header"><h1>Konfigurasi</h1></div>
    <div class="content">
      <div class="form-group">
        <label>Profile</label>
        <${ProfileManager} profiles=${configRef.current.profiles} activeProfile=${configRef.current.activeProfile}
          onSwitch=${handleSwitchProfile} onChange=${handleChangeProfiles} />
      </div>
      <details class="config-group" open>
        <summary>Form Skrining</summary>
        <div class="form-group">
          <label for="form-skrining-url">URL</label>
          <input type="text" id="form-skrining-url" placeholder="Masukkan pola URL form skrining" value=${form.fsUrl} onInput=${(e) => update('fsUrl', e.target.value)} />
        </div>
        <div class="form-group">
          <div class="checkbox-item">
            <input type="checkbox" id="form-skrining-scroll-to-button" checked=${form.scrollToButton} onChange=${(e) => update('scrollToButton', e.target.checked)} />
            <label for="form-skrining-scroll-to-button">Scroll ke tombol setelah selesai</label>
          </div>
        </div>
        <div class="form-group">
          <label>Kata Kunci Tombol Radio</label>
          <${KeywordList} id="form-skrining-radio-keywords" value=${form.radioButtonKeywords} onChange=${(v) => update('radioButtonKeywords', v)} />
        </div>
        <div class="form-group">
          <label>Kata Kunci Dropdown</label>
          <${KeywordList} id="form-skrining-dropdown-keywords" value=${form.dropdownKeywords} onChange=${(v) => update('dropdownKeywords', v)} />
        </div>
        <div class="form-group">
          <label for="form-skrining-excludes">Data dikecualikan</label>
          <input type="text" id="form-skrining-excludes" placeholder="Kecualikan atau lewati survei" value=${form.excludes} onInput=${(e) => update('excludes', e.target.value)} />
        </div>
        <div class="form-group">
          <label>Nilai Tersemat</label>
          <${KeyValueList} data=${pinned} onChange=${setPinned} />
        </div>
      </details>
      <details class="config-group" open>
        <summary>Form Tidak Periksa</summary>
        <div class="form-group">
          <label for="not-checked-url">URL</label>
          <input type="text" id="not-checked-url" placeholder="Masukkan pola URL (pemeriksaan)" value=${form.ncUrl} onInput=${(e) => update('ncUrl', e.target.value)} />
        </div>
        <div class="form-group">
          <label>Daftar Master 'Tidak Periksa'</label>
          <${KeywordList} id="not-checked-list" value=${form.ncList} placeholder="Tambah ID baris (rowfrm...)" onChange=${(v) => update('ncList', v)} />
        </div>
        <div class="delay-settings-grid">
          <div class="form-group-sm">
            <label for="not-checked-automation-delay">Jeda Awal</label>
            <input type="number" id="not-checked-automation-delay" min="500" max="10000" value=${form.ncAutomationDelay} onInput=${(e) => update('ncAutomationDelay', e.target.value)} />
          </div>
          <div class="form-group-sm">
            <label for="not-checked-item-delay">Jeda Item</label>
            <input type="number" id="not-checked-item-delay" min="100" max="5000" value=${form.ncItemDelay} onInput=${(e) => update('ncItemDelay', e.target.value)} />
          </div>
          <div class="form-group-sm">
            <label for="not-checked-reload-delay">Jeda Reload</label>
            <input type="number" id="not-checked-reload-delay" min="500" max="15000" value=${form.ncReloadDelay} onInput=${(e) => update('ncReloadDelay', e.target.value)} />
          </div>
        </div>
      </details>
      <details class="config-group">
        <summary>Skrining</summary>
        <div class="form-group">
          <label for="skrining-url">URL</label>
          <input type="text" id="skrining-url" placeholder="Masukkan pola URL skrining" value=${form.skUrl} onInput=${(e) => update('skUrl', e.target.value)} />
        </div>
      </details>
      <button id="save-config-btn" class="btn" onClick=${handleSave}>${saved ? 'Tersimpan!' : 'Simpan'}</button>
      <div class="action-links">
        <a href="#" onClick=${(e) => { e.preventDefault(); doExport(); }}>Ekspor</a>
        <a href="#" onClick=${(e) => { e.preventDefault(); document.getElementById('import-file-input').click(); }}>Impor</a>
      </div>
      ${importMsg ? html`<div class="import-msg ${importMsg.type}">${importMsg.text}</div>` : ''}
      <a href="#" class="open-page-link" onClick=${(e) => { e.preventDefault(); browser.tabs.create({ url: browser.runtime.getURL('view/page/index.html#profile') }); }}>⚙️ Konfigurasi Lengkap</a>
      <input type="file" id="import-file-input" style="display:none" accept=".json" onChange=${async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const imported = JSON.parse(text);
          if (!imported.profiles || !imported.activeProfile) throw new Error('Invalid config file format.');
          saveConfig(imported);
          getFullConfig().then((c) => { configRef.current = c; setConfig(c); });
          setImportMsg({ type: 'success', text: 'Konfigurasi berhasil diimpor.' });
          setTimeout(() => setImportMsg(null), 3000);
        } catch {
          setImportMsg({ type: 'error', text: 'Gagal mengimpor. Pastikan format file valid.' });
          setTimeout(() => setImportMsg(null), 3000);
        }
      }} />
    </div>
  `;
}

function ProduktifitasTab() {
  const [pd, setPd] = useState(null);

  useEffect(() => {
    (async () => {
      const [today, yesterday, overall, periodTotal] = await Promise.all([
        getTodaySummary(), getYesterdaySummary(), getOverallBreakdown(),
        TARGET_MODE === 'weekly' ? getWeekTotal() : getMonthTotal(),
      ]);
      const status = getStatus();
      let licenseInfo = null;
      if (!status.isFreePlan && status.payload) {
        const p = status.payload;
        const from = new Date(p.iat * 1000);
        const to = new Date();
        const f = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
        const t = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
        const rangeData = await getRange(f, t);
        const used = rangeData.reduce((s, d) => s + (d ? d.dayTotal : 0), 0);
        const pct = Math.min(100, Math.round((used / (p.total_limit || 1)) * 100));
        const daysLeft = Math.ceil((p.exp * 1000 - Date.now()) / 86_400_000);
        licenseInfo = { pct, daysLeft, used, limit: p.total_limit };
      }
      setPd({ today, yesterday, overall, periodTotal, licenseInfo });
    })();
  }, []);

  if (!pd) return html`<div class="header"><h1>Produktifitas</h1></div><div class="content"><div class="prod-row" style="color:#999">Memuat...</div></div>`;

  const { today, yesterday, overall, periodTotal, licenseInfo } = pd;
  const prev = yesterday ? yesterday.counts : null;
  const periodLabel = TARGET_MODE === 'weekly' ? 'Minggu' : 'Bulan';
  const barPct = Math.min(100, Math.round((periodTotal / MONTHLY_TARGET) * 100));

  return html`
    <div class="header"><h1>Produktifitas</h1></div>
    <div class="content" id="produktifitas-content">
      ${licenseInfo ? html`
        <div class="prod-license pro">
          <span class="license-badge-sm pro">PRO</span>
          <span class="license-text">${licenseInfo.pct}% digunakan</span>
          <span class="license-sep">·</span>
          <span class="license-text">${licenseInfo.daysLeft <= 0 ? 'Kedaluwarsa' : `Berakhir dalam ${licenseInfo.daysLeft} hari`}</span>
        </div>
      ` : ''}
      <div class="prod-header">Hari Ini</div>
      ${today ? html`
        <div class="prod-row"><span class="label">📻 Radio</span><span class="value">${rd(today.counts.radio, prev?.radio ?? null)}</span></div>
        <div class="prod-row"><span class="label">📝 Teks</span><span class="value">${rd(today.counts.freetext, prev?.freetext ?? null)}</span></div>
        <div class="prod-row"><span class="label">📋 Dropdown</span><span class="value">${rd(today.counts.dropdown, prev?.dropdown ?? null)}</span></div>
        <div class="prod-row"><span class="label">❌ Tidak Periksa</span><span class="value">${rd(today.counts.formNotChecked, prev?.formNotChecked ?? null)}</span></div>
        <div class="prod-row"><span class="label">🧘 Zen</span><span class="value">${rd(today.counts.formZen, prev?.formZen ?? null)}</span></div>
        <div class="prod-total"><span>Total Hari Ini</span><span>${rd(today.dayTotal, yesterday?.dayTotal ?? null)}</span></div>
      ` : html`<div class="prod-row" style="color:#999">Belum ada data hari ini.</div>`}
      <div class="prod-grand"><span>Grand Total</span><span>${overall.grandTotal.toLocaleString()}</span></div>
      <div class="prod-progress">
        <div class="prod-header">Progress ${periodLabel} Ini (target ${MONTHLY_TARGET.toLocaleString()} poin)</div>
        <div class="label-row"><span>${periodTotal.toLocaleString()} / ${MONTHLY_TARGET.toLocaleString()} poin</span></div>
        <div class="prod-bar-track"><div class="prod-bar-fill" style="width:${barPct}%"></div></div>
      </div>
    </div>
    <div class="content" style="padding-top:0">
      <a href="#" class="open-page-link" onClick=${(e) => { e.preventDefault(); browser.tabs.create({ url: browser.runtime.getURL('view/page/index.html#produktifitas') }); }}>⚙️ Konfigurasi Lanjutan</a>
    </div>
  `;
}

function PopupApp() {
  const [activeTab, setActiveTab] = useState('agreement');
  const [config, setConfig] = useState(null);

  useEffect(() => { init(); getFullConfig().then(setConfig); }, []);

  return html`
    <div class="container">
      <div class="tab-nav">
        <button class="tab-button${activeTab === 'agreement' ? ' active' : ''}" onClick=${() => setActiveTab('agreement')}>Persetujuan</button>
        <button class="tab-button${activeTab === 'config' ? ' active' : ''}" onClick=${() => setActiveTab('config')}>Konfigurasi</button>
        <button class="tab-button${activeTab === 'produktifitas' ? ' active' : ''}" onClick=${() => setActiveTab('produktifitas')}>Produktivitas</button>
      </div>
      <div id="agreement" class="tab-content${activeTab === 'agreement' ? ' active' : ''}"><${AgreementTab} /></div>
      <div id="config" class="tab-content${activeTab === 'config' ? ' active' : ''}"><${ConfigTab} /></div>
      ${activeTab === 'produktifitas' ? html`<div id="produktifitas" class="tab-content active"><${ProduktifitasTab} /></div>` : ''}
    </div>
  `;
}

render(html`<${PopupApp} />`, document.getElementById('app'));
