# Instalasi Cepat

Jalur ini memasang Dandelion lewat **kebijakan browser** (enterprise) — tanpa drag-and-drop, dan pembaruan berjalan otomatis. Kebijakan mengunci ekstensi: pengguna tidak bisa menonaktifkan atau menghapusnya dari halaman ekstensi sampai kebijakannya dicabut.

> Membutuhkan hak administrator: UAC di Windows, `sudo` di Linux. Untuk pemasangan manual tanpa script, lihat halaman [Instalasi](/doc/v1/installation).

> **Prasyarat perangkat terkelola (Windows).** Chrome/Edge/Brave hanya memasang paksa ekstensi dari luar Web Store pada perangkat Windows yang dikelola: domain AD/Entra ID atau terdaftar Chrome Enterprise Core. Menulis nilai kebijakan lewat script registry tidak dengan sendirinya membuat perangkat menjadi "managed". Untuk perangkat tanpa manajemen, gunakan [pemasangan manual](/doc/v1/installation).

Browser Chromium yang didukung: **Chrome**, **Edge**, dan **Brave**. Firefox punya jalur tersendiri di bawah.

## Windows

Script PowerShell meminta elevasi admin sendiri (UAC), lalu menulis `ExtensionInstallSources` dan `ExtensionInstallForcelist` ke registry. Jalankan perintah berikut dari sesi PowerShell.

### Chrome

```powershell
& ([scriptblock]::Create((irm https://dandelion.web.id/install/chrome.ps1)))
```

### Edge

```powershell
& ([scriptblock]::Create((irm https://dandelion.web.id/install/edge.ps1)))
```

### Brave

```powershell
& ([scriptblock]::Create((irm https://dandelion.web.id/install/brave.ps1)))
```

### Mencopot (Windows)

Ada dua cara. **Via script** (disarankan) — jalankan dari sesi PowerShell, ganti `chrome` dengan `edge` atau `brave`:

```powershell
& ([scriptblock]::Create((irm https://dandelion.web.id/uninstall/chrome.ps1)))
```

Script hanya menghapus entri milik Dandelion; kebijakan lain di registry tidak diubah. Buka ulang browser setelah selesai.

**Manual**: hapus subkey `ExtensionInstallForcelist` dan `ExtensionInstallSources` pada registry key berikut, lalu buka ulang browser:

| Browser | Registry key                                  |
| ------- | --------------------------------------------- |
| Chrome  | `HKLM:\SOFTWARE\Policies\Google\Chrome`       |
| Edge    | `HKLM:\SOFTWARE\Policies\Microsoft\Edge`      |
| Brave   | `HKLM:\SOFTWARE\Policies\BraveSoftware\Brave` |

Contoh untuk Chrome (sesuaikan key untuk Edge/Brave):

```powershell
Remove-Item -Recurse -Force "HKLM:\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist"
Remove-Item -Recurse -Force "HKLM:\SOFTWARE\Policies\Google\Chrome\ExtensionInstallSources"
```

## Linux

Script mendeteksi Linux otomatis dan menulis berkas kebijakan JSON di direktori policies browser (menggunakan `sudo`).

### Chrome

```bash
curl -fsSL https://dandelion.web.id/install/chrome.sh | sh
```

### Edge

```bash
curl -fsSL https://dandelion.web.id/install/edge.sh | sh
```

### Brave

```bash
curl -fsSL https://dandelion.web.id/install/brave.sh | sh
```

### Mencopot (Linux)

**Via script** (ganti `chrome` dengan `edge` atau `brave`):

```bash
curl -fsSL https://dandelion.web.id/uninstall/chrome.sh | sh
```

Script menghapus berkas kebijakan `dandelion.json` milik Dandelion. Buka ulang browser setelah selesai.

**Manual**: berkas kebijakan per browser:

| Browser | Lokasi berkas kebijakan                           |
| ------- | ------------------------------------------------- |
| Chrome  | `/etc/opt/chrome/policies/managed/dandelion.json` |
| Edge    | `/etc/opt/edge/policies/managed/dandelion.json`   |
| Brave   | `/etc/brave/policies/managed/dandelion.json`      |

```bash
sudo rm /etc/opt/chrome/policies/managed/dandelion.json
```

## Firefox

Firefox tidak memakai script kebijakan seperti Chromium. Cukup buka tautan berikut — Firefox menampilkan dialog pemasangan langsung:

**[Install Dandelion untuk Firefox](/install/firefox)**

- Berkas `.xpi` sudah ditandatangani (AMO, unlisted) dan diperbarui otomatis lewat `update.json`.
- Pemasangan manual dari berkas, termasuk Firefox Android, ada di halaman [Instalasi](/doc/v1/installation).
