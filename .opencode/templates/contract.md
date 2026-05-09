# Contract Antar Agent

## 1. Interface Config

Agent Logic **menyediakan** interface ini ke Agent UI:

```javascript
// configuration.js — exports yang boleh dipakai Agent UI
export function getFullConfig()     // → { activeProfile, profiles }
export function getActiveConfig()   // → { formSkrining, notChecked, skrining, zenMode }
export function setConfig(config)   // → void (simpan ke storage)
export function setActiveProfile(key) // → void
```

Agent UI **hanya boleh** panggil 4 fungsi di atas. Tidak boleh akses `browser.storage` langsung.

## 2. Data Contract

```javascript
// Struktur config yang disepakati
{
  activeProfile: 'profile1',
  profiles: {
    profile1: {
      name: 'Profile 1',                        // display name (Agent UI domain)
      formSkrining: { url, scrollToButton, radioButtonKeywords, dropdownKeywords, excludes, pinneds },
      notChecked: { url, notCheckedList, automationDelay, itemDelay, reloadDelay, domTimeout },
      skrining: { url },
      zenMode: { domTimeout },
    },
  },
}
```

**Perubahan data wajib lewat `setConfig()`**, bukan edit storage langsung.

## 3. Boundary File

| Direktori | Pemilik | Diakses oleh |
|---|---|---|
| `src/configuration.js` | Agent Logic | Semua agent (read/write via exports) |
| `src/main.js` | Agent Logic | - |
| `src/handlers/*` | Agent Logic | - |
| `src/utils/*` | Agent Logic | Handler + Component |
| `src/components/*` | Agent Logic | In-content UI (bukan popup) |
| `src/view/*` | Agent UI | Popup saja |
| `src/view/components/*` | Agent UI | Popup saja |

## 4. Rules of Engagement

1. **Tidak overlap domain.** Agent UI tidak edit handler/utils. Agent Logic tidak edit view.
2. **Kalau butuh data baru**: Agent Logic tambah di DEFAULT_CONFIG + migration. Agent UI baca via getFullConfig().
3. **Migration wajib backward compatible.** Old config harus tetap jalan.
4. **SetConfig safety**: `setConfig()` hanya boleh menyimpan `{ activeProfile, profiles }`. Jangan timpa `termsAgreed` atau key storage lain.
5. **Commit per agent.** Satu commit untuk Agent UI, commit terpisah untuk Agent Logic.
6. **Lint + format sebelum commit.** Jalankan `pnpm lint` dan `pnpm format` sebelum commit.

## 5. Flow Update Config

```
User action (popup / in-content)
  → Agent UI component (ProfileManager, KeywordList, etc)
  → modify this.profiles / this.loadedConfig (reference sharing)
  → call setConfig(loadedConfig)
  → Agent Logic getFullConfig() → applyConfigDefaults() → return merged
  → Agent UI getFullConfig() → updateFormForProfile()
```

## 6. Versioning Contract

- Format config: `v2` (grouped by handler)
- Old format `v1` (flat) dideteksi otomatis dan dimigrasi sekali
- Stale old keys (`formSelector`, `surveySelector`, `scrollToBottom`, `notChecked`) di-cleanup setelah migrasi
