# Instalasi Cepat

Jalur ini memasang Dandelion lewat **kebijakan browser** (enterprise) — tanpa drag-and-drop, dan pembaruan berjalan otomatis. Kebijakan mengunci ekstensi: pengguna tidak bisa menonaktifkan atau menghapusnya dari halaman ekstensi sampai kebijakannya dicabut.

> Membutuhkan hak administrator: UAC di Windows, `sudo` di macOS/Linux. Untuk pemasangan manual tanpa script, lihat halaman [Instalasi](/doc/v1/installation).

Browser Chromium yang didukung: **Chrome**, **Edge**, dan **Brave**. Firefox punya jalur tersendiri di bawah.

## Windows

Script PowerShell meminta elevasi admin sendiri (UAC), lalu menulis `ExtensionInstallSources` dan `ExtensionInstallForcelist` ke registry. Jalankan perintah berikut dari sesi PowerShell.

### Chrome

```powershell
irm https://dandelion.web.id/install/chrome.ps1 | iex
```

### Edge

```powershell
irm https://dandelion.web.id/install/edge.ps1 | iex
```

### Brave

```powershell
irm https://dandelion.web.id/install/brave.ps1 | iex
```

### Mencopot (Windows)

Ada dua cara. **Via script** (disarankan) — jalankan dari sesi PowerShell, ganti `chrome` dengan `edge` atau `brave`:

```powershell
irm https://dandelion.web.id/uninstall/chrome.ps1 | iex
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

## macOS

Script yang sama mendeteksi macOS otomatis dan menulis kebijakan ke `/Library/Preferences` (menggunakan `sudo`).

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

### Mencopot (macOS)

**Via script** (jalankan dari Terminal, ganti `chrome` dengan `edge` atau `brave`):

```bash
curl -fsSL https://dandelion.web.id/uninstall/chrome.sh | sh
```

Script menghapus seluruh key `ExtensionInstallForcelist` dan `ExtensionInstallSources` pada domain browser tersebut (termasuk entri kebijakan lain bila ada). Buka ulang browser setelah selesai.

**Manual**: domain kebijakan `com.google.Chrome`, `com.microsoft.Edge`, `com.brave.Browser`. Contoh untuk Chrome (sesuaikan domain untuk Edge/Brave):

```bash
sudo defaults delete "/Library/Preferences/com.google.Chrome" ExtensionInstallForcelist
sudo defaults delete "/Library/Preferences/com.google.Chrome" ExtensionInstallSources
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
