# TODO: Restrukturisasi Konfigurasi by Handler

## Struktur Config Baru

```javascript
{
  activeProfile: 'profile1',
  profiles: {
    profile1: {
      formSkrining: {
        url: '',                   // was surveySelector
        scrollToButton: true,      // was scrollToBottom (rename)
        radioButtonKeywords: '',
        dropdownKeywords: '',
        excludes: '',
        pinneds: {},
      },
      notChecked: {
        url: '',                   // URL pattern (tetap)
        notCheckedList: '',        // PINDAH dari profile-level ke sini
        automationDelay: 2000,
        itemDelay: 1000,
        reloadDelay: 1000,
        domTimeout: 5000,
      },
      skrining: {
        url: '',                   // was formSelector
      },
      zenMode: {
        domTimeout: 5000,          // hidden dari UI, dev/debug only
      },
    },
    profile2: { ... },
  },
}
```

---

## Agent 1 — UI (Popup/View)

### Files: `src/view/popup.html`, `src/view/popup.js`, `src/view/popup.css`

### Tasks:

- [x] **popup.html — Grup Ulang Layout** (section per handler, update IDs)
- [x] **popup.js — Update Load/Save Config** (baca/tulis dari struktur baru)
- [x] **popup.css** — Penyesuaian layout
- [x] **ProfileManager komponen** — `ProfileManager.js` + `ProfileManager.css`
- [x] **Ganti `<div class="section">` jadi `<details class="config-group" open>`**
- [x] **Tambah input `skrining.url` ke UI** (di grup Skrining Legacy)
- [x] **popup.css — Style `.config-group`**

---

## Agent 2 — Configuration + Handlers

### Files:

- `src/configuration.js`
- `src/main.js`
- `src/handlers/skriningform.js`
- `src/handlers/skrining-form-not-checked.js` (mungkin tidak perlu)
- `src/utils/notChecked.js`
- `src/utils/pinneds.js`
- `src/utils/excludes.js`

### Tasks:

- [x] **main.js** — routing: `config.skrining.url`, `config.formSkrining.url`, `config.notChecked.url`
- [x] **skriningform.js** — akses `config.formSkrining.xxx`
- [x] **utils/notChecked.js** — path `notChecked.notCheckedList`
- [x] **utils/pinneds.js** — path `formSkrining.pinneds`
- [x] **utils/excludes.js** — path `formSkrining.excludes`

- [x] **configuration.js — Hapus old keys setelah migrasi** (fix stale key loop)

- [ ] **configuration.js — REVISI: Profile name hilang setelah reload**
  - **Bug**: `applyConfigDefaults()` hanya copy 4 group (`formSkrining`, `notChecked`, `skrining`, `zenMode`), tidak copy field `name`
  - **Fix di 3 tempat**:
    1. `DEFAULT_CONFIG` — tambah `name`:
    ```javascript
    profile1: { name: 'Profile 1', formSkrining: {...}, ... },
    profile2: { name: 'Profile 2', formSkrining: {...}, ... },
    ```

    2. `applyConfigDefaults()` — spread `name`:
    ```javascript
    profiles[key] = {
      name: savedProfile.name || defaultProfile.name || '',
      formSkrining: { ... },
      ...
    };
    ```

    3. `migrateConfig()` — tambah `name` untuk migrated profiles:
    ```javascript
    profiles[profileKey] = {
      name: oldProfile.name || (profileKey === 'profile1' ? 'Profile 1' : 'Profile 2'),
      formSkrining: { ... },
      ...
    };
    ```
  - **Bug**: Old keys (`formSelector`, `surveySelector`, `scrollToBottom`, `notChecked`) tidak pernah dihapus setelah migrasi → setiap `getFullConfig()` migrasi ulang → timpa data user
  - **Fix di `getFullConfig()`**:

    ```javascript
    export function getFullConfig() {
      return browser.storage.local.get(null).then((result) => {
        const isOldFormat =
          result.formSelector !== undefined ||
          result.profiles?.profile1?.radioButtonKeywords !== undefined;
        const migrated = migrateConfig(result);

        if (isOldFormat) {
          setConfig(migrated);
          // Hapus old keys biar migrasi cuma sekali
          browser.storage.local.remove([
            'formSelector',
            'surveySelector',
            'scrollToBottom',
            'notChecked',
          ]);
        }

        return migrated;
      });
    }
    ```

  - **Ini fix 2 masalah sekaligus**: import bisa fallback + component/component save ke storage dengan benar

- [ ] **popup.js — REVISI: Import pake getFullConfig()** (sudah benar, tinggal verifikasi)
      loadedConfig = await getFullConfig(); // auto-migrate
      updateFormForProfile(loadedConfig.activeProfile);

  ```

  ```

### Detail (arsip):

1. **configuration.js — DEFAULT_CONFIG Baru + Migrasi**
   - Ubah `DEFAULT_CONFIG`:

   ```javascript
   const DEFAULT_CONFIG = {
     activeProfile: 'profile1',
     profiles: {
       profile1: {
         formSkrining: { url: '', scrollToButton: true, radioButtonKeywords: '', dropdownKeywords: '', excludes: '', pinneds: {} },
         notChecked: { url: '', notCheckedList: '', automationDelay: 2000, itemDelay: 1000, reloadDelay: 1000, domTimeout: 5000 },
         skrining: { url: '' },
         zenMode: { domTimeout: 5000 },
       },
       profile2: { ... },
     },
   };
   ```

   - `getFullConfig()`: deteksi format lama → migrasi otomatis
   - Deteksi format lama: `result.formSelector !== undefined` atau `result.profiles.profile1.radioButtonKeywords !== undefined`
   - Mapping migrasi:
     - `formSelector` → `profiles[].skrining.url`
     - `surveySelector` → `profiles[].formSkrining.url`
     - `scrollToBottom` → `profiles[].formSkrining.scrollToButton`
     - `radioButtonKeywords` → `profiles[].formSkrining.radioButtonKeywords`
     - `dropdownKeywords` → `profiles[].formSkrining.dropdownKeywords`
     - `excludes` → `profiles[].formSkrining.excludes`
     - `pinneds` → `profiles[].formSkrining.pinneds`
     - `notCheckedList` → `profiles[].notChecked.notCheckedList`
     - `notChecked.*` → tetap
   - Setelah migrasi, simpan config baru (`setConfig()`) agar next load langsung pake format baru
   - `getActiveConfig()`: return nested structure untuk handler
     ```javascript
     return {
       formSkrining: activeProfileSettings.formSkrining,
       notChecked: activeProfileSettings.notChecked,
       skrining: activeProfileSettings.skrining,
       zenMode: activeProfileSettings.zenMode,
       activeProfile: config.activeProfile,
     };
     ```
   - Hapus flattening `form`, `survey`, `scrollToBottom` dari return

2. **main.js — Update Routing**

   ```javascript
   if (config.notChecked?.url && currentURL.includes(config.notChecked.url)) {
     initializeNotChecked();
   } else if (config.formSkrining?.url && currentURL.includes(config.formSkrining.url)) {
     initializeSkriningForm();
   } else if (config.skrining?.url && currentURL.includes(config.skrining.url)) {
     initializeSkrining();
   }
   ```

3. **skriningform.js — Update Akses Config**
   - `config.radioButtonKeywords` → `config.formSkrining.radioButtonKeywords`
   - `config.dropdownKeywords` → `config.formSkrining.dropdownKeywords`
   - `config.pinneds` → `config.formSkrining.pinneds`
   - `config.excludes` → `config.formSkrining.excludes`

4. **utils/notChecked.js — Update Path**
   - `fullConfig.profiles[activeProfileName]?.notCheckedList`
     → `fullConfig.profiles[activeProfileName]?.notChecked?.notCheckedList`
   - `fullConfig.profiles[activeProfileName].notCheckedList`
     → `fullConfig.profiles[activeProfileName].notChecked.notCheckedList`

5. **utils/pinneds.js — Update Akses**
   - `config.pinneds` → `config.formSkrining.pinneds`
   - `config.profiles[activeProfile].pinneds` → `config.profiles[activeProfile].formSkrining.pinneds`

6. **utils/excludes.js — Update Path**
   - `fullConfig.profiles[activeProfileName]?.excludes` → `fullConfig.profiles[activeProfileName]?.formSkrining?.excludes`
   - `fullConfig.profiles[activeProfileName].excludes` → `fullConfig.profiles[activeProfileName].formSkrining.excludes`

---

## Catatan Penting

- **Export** → selalu pakai format baru
- **Import** → terima format lama & baru (migrasi di `getFullConfig`)
- **`skrining`** grup → tampil di UI dengan input URL (legacy)
- **`zenMode`** grup → tidak tampil di UI (internal/dev only)
- **`domTimeout`** di zenMode → hidden, hanya untuk dev/debug
- Semua handler **harus** di-test setelah perubahan
- Urutan prioritas routing main.js: notChecked → formSkrining → skrining
