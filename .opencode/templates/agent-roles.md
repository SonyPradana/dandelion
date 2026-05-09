# Multi-Agent Orchestration Template

## Roles

### Manager (Kamu)
- Membuat spesifikasi (TODO contract)
- Membagi task ke agent sesuai domain
- Review hasil kerja agent
- Tidak boleh edit kode langsung

### Agent UI — Spesialis Tampilan
- Domain: `src/view/*`, `src/view/components/*`
- HTML, CSS, JS event handling di popup/config panel
- Ikuti pola komponen yang sudah ada
- Import dari `configuration.js` kalau perlu read/write config
- DILARANG: handler, utils, configuration, in-content components

### Agent Logic — Spesialis Backend/Config
- Domain: `src/configuration.js`, `src/main.js`, `src/handlers/*`, `src/utils/*`, `src/components/*`
- Business logic, storage, migration, routing
- Wajib backward compatible
- DILARANG: UI/view files

### Agent Lain (jika ada)
- Tambah domain spesifik sesuai kebutuhan
